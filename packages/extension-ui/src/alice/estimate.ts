// Copyright 2019-2026 @polkadot/extension authors & contributors
// Alice Protocol fork — native send fee / balance estimation
// SPDX-License-Identifier: Apache-2.0

// Read the live, genesis-verified Alice api for the three numbers the review
// step needs: the sender's free balance, the existential deposit (kept-back
// reserve), and a network-fee estimate for THIS transferKeepAlive call
// (api.tx(...).paymentInfo — the on-chain fee oracle, mirroring the desktop
// wallet's intent in chain.rs S1). All returned as bigint planck.

import type { ApiPromise } from '@polkadot/api';
import type { AccountInfo, Balance } from '@polkadot/types/interfaces';

import { getAliceApi } from './api.js';
import { assertAliceGenesis, assertAliceSpecVersion } from './validateChain.js';

export interface TransferEstimate {
  /** Sender free balance, in planck. */
  free: bigint;
  /** Existential deposit reserve, in planck. */
  existentialDeposit: bigint;
  /** Estimated network fee for this transferKeepAlive, in planck. */
  fee: bigint;
}

/**
 * Estimate fee + read free balance + ED for a transferKeepAlive of
 * `amountPlanck` from `fromAddress` to `toAddress`. Re-verifies chain identity
 * first (fail-closed). Throws on a node error so the UI can block the review
 * with a clear "balance unknown" state rather than guessing.
 */
export async function estimateTransfer (
  fromAddress: string,
  toAddress: string,
  amountPlanck: bigint
): Promise<TransferEstimate> {
  const api: ApiPromise = await getAliceApi();

  assertAliceGenesis(api);
  assertAliceSpecVersion(api);

  const tx = api.tx['balances']['transferKeepAlive'](toAddress, amountPlanck);

  const [info, account] = await Promise.all([
    tx.paymentInfo(fromAddress),
    api.query['system']['account'](fromAddress) as Promise<AccountInfo>
  ]);

  const fee = info.partialFee.toBigInt();
  const free = account.data.free.toBigInt();
  const existentialDeposit = (api.consts['balances']['existentialDeposit'] as Balance).toBigInt();

  return { existentialDeposit, fee, free };
}
