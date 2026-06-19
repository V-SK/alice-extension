// Copyright 2019-2026 @polkadot/extension authors & contributors
// Alice Protocol fork — native send (transfer) submit path
// SPDX-License-Identifier: Apache-2.0

// The chain-touching half of the Send flow. Mirrors the desktop wallet's
// `submit_transfer` (alice-wallet/gui/src/chain.rs):
//   - re-verify genesis == Alice AND specVersion >= 110 IMMEDIATELY before
//     signing (assertAliceGenesis / assertAliceSpecVersion — B1),
//   - use Balances.transferKeepAlive (NEVER plain transfer) so a send can
//     never reap the sender below the existential deposit,
//   - sign IN THE BACKGROUND (the Signer below routes the payload to the
//     keyring pair via `signAliceTransfer`; the seed never enters the popup),
//   - report the resulting tx hash on inclusion,
//   - distinguish a clean PRECHECK failure (nothing broadcast → safe) from a
//     PENDING broadcast-but-unconfirmed outcome (do NOT auto-retry).

import type { ApiPromise } from '@polkadot/api';
import type { Signer, SignerResult } from '@polkadot/api/types';
import type { ISubmittableResult, SignerPayloadJSON } from '@polkadot/types/types';

import { ALICE_TOKEN_SYMBOL } from '@polkadot/extension-base/alice';

import { signAliceTransfer } from '../messaging.js';
import { getAliceApi } from './api.js';
import { isValidAliceAddress } from './transfer.js';
import { assertAliceGenesis, assertAliceSpecVersion } from './validateChain.js';

export type TransferOutcomeKind = 'precheck-error' | 'pending' | 'success';

export interface TransferResult {
  kind: TransferOutcomeKind;
  /** Extrinsic hash (0x…) once the tx is signed/broadcast; undefined on a precheck error. */
  txHash?: string;
  /** Human-readable message. */
  message: string;
}

export class TransferPrecheckError extends Error {
  constructor (message: string) {
    super(message);
    this.name = 'TransferPrecheckError';
  }
}

/**
 * Background-backed Signer. polkadot-js calls `signPayload(payload)` during
 * `tx.signAsync(...)`; we forward the SignerPayloadJSON to the background, which
 * unlocks the keyring pair, signs, re-locks, and returns ONLY the signature.
 * The seed/secret never crosses into the popup or any page context.
 */
function backgroundSigner (address: string, password: string): Signer {
  let nextId = 0;

  return {
    signPayload: async (payload: SignerPayloadJSON): Promise<SignerResult> => {
      const signature = await signAliceTransfer(address, payload, password);

      return { id: ++nextId, signature };
    }
  };
}

/**
 * Build, sign (in the background), and submit a `Balances.transferKeepAlive`,
 * resolving once the tx is in a block (or finalized) with its hash, or
 * surfacing a PENDING outcome if the broadcast cannot be confirmed.
 *
 * `amountPlanck` is the integer base-unit amount (the UI parses the human value
 * via `parseAliceAmount` and gates the review with `evaluateHeadroom` before
 * calling this). A precheck failure (bad address, wrong chain, tx-build error)
 * throws `TransferPrecheckError` → nothing was broadcast, safe to fix & retry.
 */
export async function submitAliceTransfer (
  fromAddress: string,
  toAddress: string,
  amountPlanck: bigint,
  password: string
): Promise<TransferResult> {
  // --- PRECHECK: any throw here means NOTHING was broadcast → safe to retry.
  if (!isValidAliceAddress(toAddress)) {
    throw new TransferPrecheckError('Invalid recipient address (must be a valid Alice ss58-300 address)');
  }

  if (amountPlanck <= 0n) {
    throw new TransferPrecheckError('Amount must be greater than zero');
  }

  const api: ApiPromise = await getAliceApi();

  // B1 defense-in-depth: re-verify chain identity at submit time, NOT just at
  // connect. A stale/wrong/malicious endpoint is refused before we sign.
  assertAliceGenesis(api);
  assertAliceSpecVersion(api);

  const tx = api.tx['balances']['transferKeepAlive'](toAddress, amountPlanck);
  const signer = backgroundSigner(fromAddress, password);

  // Sign in the background. signAsync builds the payload and calls our Signer;
  // a failure here (e.g. wrong password) is still PRECHECK — nothing is on the
  // wire until we submit the signed tx below.
  try {
    await tx.signAsync(fromAddress, { signer });
  } catch (error) {
    throw new TransferPrecheckError((error as Error).message || 'Failed to sign the transfer');
  }

  // --- BROADCAST: from here the extrinsic may be on the wire. A failure is
  // PENDING (it might still be included), NOT a clean retry — avoid double-spend.
  return new Promise<TransferResult>((resolve, reject) => {
    let settled = false;
    let unsub: (() => void) | undefined;

    tx.send((result: ISubmittableResult) => {
      const { dispatchError, status, txHash } = result;
      const hash = txHash.toHex();

      if (status.isInBlock || status.isFinalized) {
        if (settled) {
          return;
        }

        settled = true;
        unsub && unsub();

        if (dispatchError) {
          let reason = dispatchError.toString();

          if (dispatchError.isModule) {
            try {
              const decoded = api.registry.findMetaError(dispatchError.asModule);

              reason = `${decoded.section}.${decoded.name}`;
            } catch {
              // keep the raw reason
            }
          }

          // Included but the call failed on-chain — report with the hash so the
          // user can inspect Activity; treat as PENDING (do not auto-retry).
          resolve({ kind: 'pending', message: `Transfer included but failed on-chain: ${reason}`, txHash: hash });

          return;
        }

        resolve({ kind: 'success', message: `Sent ${ALICE_TOKEN_SYMBOL}. Transaction ${hash} included in a block.`, txHash: hash });
      } else if (status.isInvalid || status.isDropped || status.isUsurped) {
        if (settled) {
          return;
        }

        settled = true;
        unsub && unsub();
        // Broadcast may have occurred; the node rejected/dropped this view of it.
        // Uncertain — the user must check Activity before retrying.
        resolve({ kind: 'pending', message: `Broadcast but not confirmed (${status.type}). Check Activity before retrying.`, txHash: hash });
      }
    })
      .then((u) => {
        unsub = u as unknown as () => void;
      })
      .catch((error: Error) => {
        if (settled) {
          return;
        }

        settled = true;
        // The send promise rejected — the extrinsic may already be broadcast.
        // PENDING, never a silent failure.
        reject(new Error(`PENDING: broadcast may have occurred, unconfirmed: ${error.message}`));
      });
  });
}
