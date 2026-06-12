// Copyright 2025-2026 @alice-protocol authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ApiPromise } from '@polkadot/api';

import { ALICE_GENESIS_HASH } from '@polkadot/extension-base/alice';

export class GenesisMismatchError extends Error {
  public readonly expected: string;
  public readonly actual: string;

  constructor (expected: string, actual: string) {
    super(`Alice chain identity check failed: expected genesis ${expected}, got ${actual}. Refusing to use this RPC.`);
    this.name = 'GenesisMismatchError';
    this.expected = expected;
    this.actual = actual;
  }
}

/**
 * Fail-closed chain identity check. Compares the live chain's genesis hash
 * against the pinned Alice genesis. Throws GenesisMismatchError on any
 * mismatch — the caller MUST treat a throw as "do not trust this endpoint"
 * and disconnect.
 *
 * Genesis is the hard gate. A malicious or wrong-chain RPC cannot fake the
 * genesis hash without controlling the whole chain history.
 */
export function assertAliceGenesis (api: ApiPromise): void {
  const actual = api.genesisHash.toHex();

  if (actual !== ALICE_GENESIS_HASH) {
    throw new GenesisMismatchError(ALICE_GENESIS_HASH, actual);
  }
}

/**
 * Pure check used by unit tests and callers that already hold the hash.
 * Returns true only on an exact match with the pinned Alice genesis.
 */
export function isAliceGenesis (genesisHex: string): boolean {
  return genesisHex === ALICE_GENESIS_HASH;
}
