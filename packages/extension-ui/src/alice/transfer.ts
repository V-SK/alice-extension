// Copyright 2019-2026 @polkadot/extension authors & contributors
// Alice Protocol fork — native send (transfer) flow
// SPDX-License-Identifier: Apache-2.0

// Pure, side-effect-free helpers backing the in-popup "Send" flow. Everything
// here is unit-testable WITHOUT a live chain or React: ss58-300 address
// validation, human↔planck amount parsing, and the fee/ED headroom math that
// gates the review step. The chain-touching submit lives in submitTransfer.ts.
//
// Mirrors the desktop wallet's proven semantics (alice-wallet/gui/src/chain.rs):
//  - reject a wrong-prefix / malformed recipient (validate_address),
//  - parse a 12-decimal human amount to integer planck (parse_token_amount),
//  - require amount + fee + an existential-deposit reserve <= free balance
//    (audit S1/S2 — never let a "send max" pass local review then fail on-chain
//    after the fee is consumed).

import { ALICE_DECIMALS, ALICE_SS58_PREFIX } from '@polkadot/extension-base/alice';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

/**
 * True only for a well-formed address that re-encodes to the Alice ss58 prefix
 * (300). A Polkadot/Kusama/generic-prefixed address, garbage, or empty string
 * returns false. We decode (validates the checksum + length) then re-encode at
 * the Alice prefix and require an EXACT round-trip match — this rejects an
 * address that decodes fine but was minted under a different prefix.
 */
export function isValidAliceAddress (address?: string | null): boolean {
  if (!address) {
    return false;
  }

  const trimmed = address.trim();

  if (!trimmed) {
    return false;
  }

  try {
    // decodeAddress with ss58Format pinned: a wrong-prefix address throws here.
    const publicKey = decodeAddress(trimmed, false, ALICE_SS58_PREFIX);
    const reencoded = encodeAddress(publicKey, ALICE_SS58_PREFIX);

    return reencoded === trimmed;
  } catch {
    return false;
  }
}

/**
 * Parse a human 12-decimal ALICE amount string to integer base units (planck)
 * as a bigint. Mirrors chain.rs `parse_token_amount`: rejects empty, negative,
 * non-numeric, too-many-decimal-points, more-than-12 fractional digits, and a
 * zero result. Underscores are allowed as digit separators. Returns the planck
 * bigint on success, or throws an Error with a human message on any rejection.
 */
export function parseAliceAmount (input: string, decimals: number = ALICE_DECIMALS): bigint {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error('Amount is required');
  }

  if (trimmed.startsWith('-')) {
    throw new Error('Amount must be positive');
  }

  const normalized = trimmed.replace(/_/g, '');
  const parts = normalized.split('.');

  if (parts.length > 2) {
    throw new Error('Amount has too many decimal points');
  }

  const whole = parts[0];
  const fractional = parts[1] ?? '';

  if (whole === '' && fractional === '') {
    throw new Error('Amount is required');
  }

  const isDigits = (s: string): boolean => s === '' || /^[0-9]+$/.test(s);

  if (!isDigits(whole) || !isDigits(fractional)) {
    throw new Error('Amount must be a decimal number');
  }

  if (fractional.length > decimals) {
    throw new Error(`Amount supports at most ${decimals} decimal places`);
  }

  const multiplier = 10n ** BigInt(decimals);
  const wholeUnits = whole === '' ? 0n : BigInt(whole);
  const fractionalUnits = fractional === ''
    ? 0n
    : BigInt(fractional.padEnd(decimals, '0'));
  const amount = wholeUnits * multiplier + fractionalUnits;

  if (amount === 0n) {
    throw new Error('Amount must be greater than zero');
  }

  return amount;
}

export interface HeadroomInput {
  /** Amount to send, in planck. */
  amount: bigint;
  /** Estimated network fee, in planck (from api.tx(...).paymentInfo). */
  fee: bigint;
  /** Sender free balance, in planck. `null` ⇒ balance unknown. */
  free: bigint | null;
  /** Existential-deposit reserve to keep back, in planck. */
  existentialDeposit: bigint;
}

export type HeadroomReason =
  | 'ok'
  | 'balance-unknown'
  | 'insufficient-funds';

export interface HeadroomResult {
  ok: boolean;
  reason: HeadroomReason;
  /** amount + fee + existentialDeposit (the total that must be <= free). */
  required: bigint;
}

/**
 * The review-gate math (audit S1/S2). A send is allowed ONLY when the balance
 * is known AND `amount + fee + existentialDeposit <= free`. The existential
 * deposit is reserved (not spent) so a keep-alive transfer can never reap the
 * sender. An unknown balance fails closed — the UI must block the review when
 * the node is down rather than guess.
 */
export function evaluateHeadroom ({ amount, existentialDeposit, fee, free }: HeadroomInput): HeadroomResult {
  const required = amount + fee + existentialDeposit;

  if (free === null) {
    return { ok: false, reason: 'balance-unknown', required };
  }

  if (required > free) {
    return { ok: false, reason: 'insufficient-funds', required };
  }

  return { ok: true, reason: 'ok', required };
}
