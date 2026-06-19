// Copyright 2019-2026 @polkadot/extension authors & contributors
// Alice Protocol fork — added for the Alice-only wallet build
// SPDX-License-Identifier: Apache-2.0

import type { ApiPromise } from '@polkadot/api';

import { ALICE_GENESIS_HASH, ALICE_MIN_SPEC_VERSION } from '@polkadot/extension-base/alice';

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

export class SpecVersionError extends Error {
  public readonly minimum: number;
  public readonly actual: number;

  constructor (minimum: number, actual: number) {
    super(`Alice runtime too old: need specVersion >= ${minimum}, got ${actual}. Refusing to use this node.`);
    this.name = 'SpecVersionError';
    this.minimum = minimum;
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

/**
 * Secondary guard: accept any runtime specVersion >= ALICE_MIN_SPEC_VERSION
 * (currently 110). Genesis is the hard identity gate; this rejects a stale /
 * pre-launch Alice runtime on the right genesis. Throws SpecVersionError when
 * the live runtime is older than the minimum.
 */
export function assertAliceSpecVersion (api: ApiPromise): void {
  const actual = api.runtimeVersion.specVersion.toNumber();

  if (actual < ALICE_MIN_SPEC_VERSION) {
    throw new SpecVersionError(ALICE_MIN_SPEC_VERSION, actual);
  }
}

/** Pure check for unit tests / callers holding the number. */
export function isAcceptedAliceSpecVersion (specVersion: number): boolean {
  return specVersion >= ALICE_MIN_SPEC_VERSION;
}
