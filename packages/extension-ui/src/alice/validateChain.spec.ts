// Copyright 2019-2026 @polkadot/extension authors & contributors
// Alice Protocol fork — added for the Alice-only wallet build
// SPDX-License-Identifier: Apache-2.0

import type * as _ from '@polkadot/dev-test/globals.d.ts';
import type { ApiPromise } from '@polkadot/api';

import { ALICE_GENESIS_HASH } from '@polkadot/extension-base/alice';

import { assertAliceGenesis, GenesisMismatchError, isAliceGenesis } from './validateChain.js';

// Minimal stand-in for the only ApiPromise surface assertAliceGenesis touches.
function mockApi (genesisHex: string): ApiPromise {
  return { genesisHash: { toHex: () => genesisHex } } as unknown as ApiPromise;
}

// Returns the thrown error, or fails if nothing was thrown.
function captureThrow (fn: () => void): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }

  throw new Error('expected the call to throw, but it did not');
}

describe('Alice fail-closed genesis check', () => {
  it('accepts the pinned Alice genesis', () => {
    expect(() => assertAliceGenesis(mockApi(ALICE_GENESIS_HASH))).not.toThrow();
  });

  it('rejects a wrong-chain genesis (Polkadot mainnet)', () => {
    const polkadot = '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3';

    expect(captureThrow(() => assertAliceGenesis(mockApi(polkadot)))).toBeInstanceOf(GenesisMismatchError);
  });

  it('rejects an empty / missing genesis', () => {
    expect(captureThrow(() => assertAliceGenesis(mockApi('0x')))).toBeInstanceOf(GenesisMismatchError);
  });

  it('rejects a one-nibble-off genesis (tamper)', () => {
    // flip the last hex digit of the real Alice genesis
    const tampered = ALICE_GENESIS_HASH.slice(0, -1) + '1';

    expect(tampered).not.toEqual(ALICE_GENESIS_HASH);
    expect(captureThrow(() => assertAliceGenesis(mockApi(tampered)))).toBeInstanceOf(GenesisMismatchError);
  });

  it('exposes expected vs actual on the error for diagnostics', () => {
    const wrong = '0xdeadbeef';
    const error = captureThrow(() => assertAliceGenesis(mockApi(wrong)));

    expect(error).toBeInstanceOf(GenesisMismatchError);
    expect((error as GenesisMismatchError).expected).toEqual(ALICE_GENESIS_HASH);
    expect((error as GenesisMismatchError).actual).toEqual(wrong);
  });

  it('isAliceGenesis is an exact-match predicate', () => {
    expect(isAliceGenesis(ALICE_GENESIS_HASH)).toEqual(true);
    expect(isAliceGenesis(ALICE_GENESIS_HASH.toUpperCase())).toEqual(false);
    expect(isAliceGenesis('0x00')).toEqual(false);
  });
});
