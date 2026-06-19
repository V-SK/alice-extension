// Copyright 2019-2026 @polkadot/extension authors & contributors
// Alice Protocol fork — native send pure-logic tests
// SPDX-License-Identifier: Apache-2.0

import type * as _ from '@polkadot/dev-test/globals.d.ts';

import { ALICE_DECIMALS } from '@polkadot/extension-base/alice';
import { cryptoWaitReady, encodeAddress } from '@polkadot/util-crypto';

import { evaluateHeadroom, isValidAliceAddress, parseAliceAmount } from './transfer.js';

// Stable public key → deterministic addresses at each prefix.
const PK = new Uint8Array(32).fill(7);

let aliceAddr: string;
let polkadotAddr: string;
let kusamaAddr: string;
let genericAddr: string;

describe('Alice address validation (ss58-300)', () => {
  beforeAll(async () => {
    await cryptoWaitReady();
    aliceAddr = encodeAddress(PK, 300);
    polkadotAddr = encodeAddress(PK, 0);
    kusamaAddr = encodeAddress(PK, 2);
    genericAddr = encodeAddress(PK, 42);
  });

  it('accepts a well-formed Alice (prefix 300) address', () => {
    expect(isValidAliceAddress(aliceAddr)).toBe(true);
  });

  it('accepts a leading/trailing-whitespace Alice address (trimmed)', () => {
    expect(isValidAliceAddress(`  ${aliceAddr}  `)).toBe(true);
  });

  it('REJECTS a Polkadot (prefix 0) address — wrong prefix', () => {
    expect(isValidAliceAddress(polkadotAddr)).toBe(false);
  });

  it('REJECTS a Kusama (prefix 2) address — wrong prefix', () => {
    expect(isValidAliceAddress(kusamaAddr)).toBe(false);
  });

  it('REJECTS a generic-substrate (prefix 42) address — wrong prefix', () => {
    expect(isValidAliceAddress(genericAddr)).toBe(false);
  });

  it('REJECTS garbage / empty / null', () => {
    expect(isValidAliceAddress('not-an-address')).toBe(false);
    expect(isValidAliceAddress('')).toBe(false);
    expect(isValidAliceAddress('   ')).toBe(false);
    expect(isValidAliceAddress(null)).toBe(false);
    expect(isValidAliceAddress(undefined)).toBe(false);
  });

  it('REJECTS a tampered Alice address (one char off the checksum)', () => {
    const tampered = aliceAddr.slice(0, -1) + (aliceAddr.endsWith('h') ? 'g' : 'h');

    expect(tampered).not.toEqual(aliceAddr);
    expect(isValidAliceAddress(tampered)).toBe(false);
  });
});

describe('Alice amount parsing (12 decimals → planck)', () => {
  it('parses whole + fractional amounts to planck', () => {
    expect(parseAliceAmount('1.25', ALICE_DECIMALS)).toBe(1_250_000_000_000n);
    expect(parseAliceAmount('1', ALICE_DECIMALS)).toBe(1_000_000_000_000n);
    expect(parseAliceAmount('0.000000000001', ALICE_DECIMALS)).toBe(1n);
    expect(parseAliceAmount('1_000.5', ALICE_DECIMALS)).toBe(1_000_500_000_000_000n);
  });

  it('rejects empty / zero / negative / non-numeric', () => {
    expect(() => parseAliceAmount('', ALICE_DECIMALS)).toThrow();
    expect(() => parseAliceAmount('0', ALICE_DECIMALS)).toThrow();
    expect(() => parseAliceAmount('0.0', ALICE_DECIMALS)).toThrow();
    expect(() => parseAliceAmount('-1', ALICE_DECIMALS)).toThrow();
    expect(() => parseAliceAmount('1e3', ALICE_DECIMALS)).toThrow();
    expect(() => parseAliceAmount('abc', ALICE_DECIMALS)).toThrow();
  });

  it('rejects more than 12 fractional digits and multiple decimal points', () => {
    expect(() => parseAliceAmount('1.0000000000001', ALICE_DECIMALS)).toThrow();
    expect(() => parseAliceAmount('1.2.3', ALICE_DECIMALS)).toThrow();
  });
});

describe('Send headroom gate (amount + fee + ED <= free)', () => {
  const ed = 1_000_000_000n; // 0.001 ALICE existential deposit (example)
  const fee = 125_000_000n; // example partialFee

  it('allows a send that fits within balance after fee + ED reserve', () => {
    const r = evaluateHeadroom({ amount: 1_000_000_000_000n, existentialDeposit: ed, fee, free: 5_000_000_000_000n });

    expect(r.ok).toBe(true);
    expect(r.reason).toBe('ok');
    expect(r.required).toBe(1_000_000_000_000n + fee + ed);
  });

  it('BLOCKS a send when amount + fee + ED exceeds balance (no "send max" that fails on-chain)', () => {
    // free exactly == amount: fee + ED push it over.
    const r = evaluateHeadroom({ amount: 1_000_000_000_000n, existentialDeposit: ed, fee, free: 1_000_000_000_000n });

    expect(r.ok).toBe(false);
    expect(r.reason).toBe('insufficient-funds');
  });

  it('BLOCKS exactly at the boundary + 1 planck over', () => {
    const amount = 1_000_000_000_000n;
    const free = amount + fee + ed; // exactly enough

    expect(evaluateHeadroom({ amount, existentialDeposit: ed, fee, free }).ok).toBe(true);
    expect(evaluateHeadroom({ amount, existentialDeposit: ed, fee, free: free - 1n }).ok).toBe(false);
  });

  it('FAILS CLOSED when the balance is unknown (node down)', () => {
    const r = evaluateHeadroom({ amount: 1n, existentialDeposit: ed, fee, free: null });

    expect(r.ok).toBe(false);
    expect(r.reason).toBe('balance-unknown');
  });
});
