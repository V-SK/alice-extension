// Copyright 2019-2026 @polkadot/extension-base authors & contributors
// Alice Protocol fork — native send background-signing handler tests
// SPDX-License-Identifier: Apache-2.0

/* global chrome */

import '@polkadot/extension-mocks/chrome';

import type * as _ from '@polkadot/dev-test/globals.d.ts';
import type { SignerPayloadJSON } from '@polkadot/types/types';

import { ALICE_GENESIS_HASH } from '@polkadot/extension-base/alice';
import { TypeRegistry } from '@polkadot/types';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import { AccountsStore } from '../../stores/index.js';
import Extension from './Extension.js';
import State from './State.js';

describe('Alice transfer background signing (pri(alice.transfer.sign))', () => {
  let extension: Extension;
  let state: State;
  let address: string;
  const suri = 'seed sock milk update focus rotate barely fade car face mechanic mercy';
  const password = 'passw0rd';

  function alicePayload (over: Partial<SignerPayloadJSON> = {}): SignerPayloadJSON {
    return {
      address,
      blockHash: '0xe1b1dda72998846487e4d858909d4f9a6bbd6e338e4588e5d809de16b1317b80',
      blockNumber: '0x00000393',
      era: '0x3601',
      genesisHash: ALICE_GENESIS_HASH,
      method: '0x040105fa8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a4882380100',
      nonce: '0x0000000000000000',
      signedExtensions: ['CheckSpecVersion', 'CheckTxVersion', 'CheckGenesis', 'CheckMortality', 'CheckNonce', 'CheckWeight', 'ChargeTransactionPayment'],
      specVersion: '0x0000006e', // 110
      tip: '0x00000000000000000000000000000000',
      transactionVersion: '0x00000005',
      version: 4,
      ...over
    };
  }

  beforeAll(async () => {
    await cryptoWaitReady();
    keyring.loadAll({ store: new AccountsStore() });
    state = new State({}, 0);
    await state.init();
    extension = new Extension(state);

    const created = keyring.addUri(suri, password, { name: 'sender' });

    address = created.pair.address;
  });

  it('signs in the background and matches the audited direct-pair signature; pair is RE-LOCKED after', async () => {
    const payload = alicePayload();

    // Reference: sign the SAME payload directly with the unlocked pair — the
    // exact seam RequestExtrinsicSign.sign uses.
    const refPair = keyring.getPair(address);

    refPair.decodePkcs8(password);
    const registry = new TypeRegistry();

    registry.setSignedExtensions(payload.signedExtensions);
    const expected = registry.createType('ExtrinsicPayload', payload, { version: payload.version }).sign(refPair);

    refPair.lock();

    const res = await extension.handle('id', 'pri(alice.transfer.sign)', { address, password, payload }, {} as chrome.runtime.Port);

    expect(res.signature).toEqual(expected.signature);
    // Security invariant: a one-shot send signature must NOT leave the pair unlocked.
    expect(keyring.getPair(address).isLocked).toBe(true);
  });

  it('REFUSES to sign a payload whose genesis is not Alice (B1 defense-in-depth)', async () => {
    const polkadotGenesis = '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3';
    const payload = alicePayload({ genesisHash: polkadotGenesis });

    await expect(
      extension.handle('id', 'pri(alice.transfer.sign)', { address, password, payload }, {} as chrome.runtime.Port)
    ).rejects.toThrow(/not Alice mainnet/);
  });

  it('REFUSES when the payload address does not match the signing account', async () => {
    const other = keyring.addUri('//Alice', password, { name: 'other' }).pair.address;
    const payload = alicePayload({ address: other });

    await expect(
      extension.handle('id', 'pri(alice.transfer.sign)', { address, password, payload }, {} as chrome.runtime.Port)
    ).rejects.toThrow(/does not match/);
  });

  it('REFUSES with a wrong password (cannot decode the locked pair)', async () => {
    const payload = alicePayload();

    await expect(
      extension.handle('id', 'pri(alice.transfer.sign)', { address, password: 'wrong-password', payload }, {} as chrome.runtime.Port)
    ).rejects.toThrow();
    // Still locked after a failed attempt.
    expect(keyring.getPair(address).isLocked).toBe(true);
  });
});
