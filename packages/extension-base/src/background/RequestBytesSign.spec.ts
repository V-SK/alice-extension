// Copyright 2019-2026 @polkadot/extension authors & contributors
// Alice Protocol fork — added for the Alice-only wallet build
// SPDX-License-Identifier: Apache-2.0

import type * as _ from '@polkadot/dev-test/globals.d.ts';
import type { SignerPayloadRaw } from '@polkadot/types/types';

import { Keyring } from '@polkadot/keyring';
import { TypeRegistry } from '@polkadot/types';
import { hexToU8a, stringToHex, u8aToHex, u8aWrapBytes } from '@polkadot/util';
import { cryptoWaitReady, signatureVerify } from '@polkadot/util-crypto';

import RequestBytesSign from './RequestBytesSign.js';

// Smoke test for the strategic Sign-in-with-Alice path: the standard
// injectedWeb3 signRaw -> RequestBytesSign. We assert the payload shape the
// page passes in, and that the produced signature is the standard
// <Bytes>-wrapped, off-chain-verifiable signature a login flow checks.
describe('signRaw payload shape + signature (Sign-in-with-Alice)', () => {
  const registry = new TypeRegistry();

  it('payload carries the SignerPayloadRaw fields a dapp sends', () => {
    const payload: SignerPayloadRaw = {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      data: stringToHex('Sign in to aliceprotocol.org\nnonce: 42'),
      type: 'bytes'
    };

    const req = new RequestBytesSign(payload);

    expect(req.payload.type).toEqual('bytes');
    expect(req.payload.data).toEqual(payload.data);
    expect(req.payload.address).toEqual(payload.address);
  });

  it('signs with the standard <Bytes> wrapping and verifies for sr25519', async () => {
    await cryptoWaitReady();

    const keyring = new Keyring({ ss58Format: 300, type: 'sr25519' });
    const pair = keyring.addFromUri('//Alice');
    const message = 'Sign in to aliceprotocol.org\nnonce: deadbeef';
    const payload: SignerPayloadRaw = {
      address: pair.address,
      data: stringToHex(message),
      type: 'bytes'
    };

    const { signature } = new RequestBytesSign(payload).sign(registry, pair);

    // signature must be 0x-hex
    expect(signature.startsWith('0x')).toEqual(true);

    // a verifier re-wraps the raw bytes exactly as the extension did, then
    // checks the signature against the claimed address — this is what
    // Sign-in-with-Alice does server-side.
    const wrapped = u8aWrapBytes(payload.data);
    const { isValid } = signatureVerify(wrapped, hexToU8a(signature), pair.address);

    expect(isValid).toEqual(true);
  });

  it('signs and verifies for ed25519', async () => {
    await cryptoWaitReady();

    const keyring = new Keyring({ ss58Format: 300, type: 'ed25519' });
    const pair = keyring.addFromUri('//Alice//login');
    const payload: SignerPayloadRaw = {
      address: pair.address,
      data: stringToHex('hello alice'),
      type: 'bytes'
    };

    const { signature } = new RequestBytesSign(payload).sign(registry, pair);
    const { isValid } = signatureVerify(u8aWrapBytes(payload.data), hexToU8a(signature), pair.address);

    expect(isValid).toEqual(true);
  });

  it('signs the <Bytes>-wrapped data, never the raw data (anti-forgery guard)', async () => {
    await cryptoWaitReady();

    // ed25519 is deterministic, so we can byte-compare the produced signature
    // against a manual sign of the wrapped vs unwrapped data. This asserts
    // RequestBytesSign's own behavior (it signs u8aWrapBytes(data)) without
    // depending on signatureVerify's wrap auto-detection.
    const keyring = new Keyring({ ss58Format: 300, type: 'ed25519' });
    const pair = keyring.addFromUri('//Bob//login');
    const raw = hexToU8a(stringToHex('wrap-enforced'));
    const payload: SignerPayloadRaw = { address: pair.address, data: u8aToHex(raw), type: 'bytes' };

    const { signature } = new RequestBytesSign(payload).sign(registry, pair);

    const expectedWrapped = u8aToHex(pair.sign(u8aWrapBytes(raw)));
    const ifUnwrapped = u8aToHex(pair.sign(raw));

    expect(signature).toEqual(expectedWrapped);
    expect(signature).not.toEqual(ifUnwrapped);
  });
});
