// Copyright 2019-2026 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable jest/expect-expect */

import type * as _ from '@polkadot/dev-test/globals.d.ts';
import type { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';

import { buildHierarchy } from './buildHierarchy.js';

// Alice-only build: the network map now contains exactly one chain (Alice).
// ALICE resolves to the network name "Alice"; UNKNOWN resolves to '' and
// therefore sorts ahead of named networks. The two network-sort cases below
// exercise that single-chain ordering.
const genesisExample = {
  ALICE: '0x7746a1d14736a95e00a617a11094b6e86bbf91cd4e7e64c0e748e3c0d2ad54b0',
  UNKNOWN: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe'
} as const;

const testHierarchy = (accounts: AccountJson[], expected: AccountWithChildren[]): void => {
  expect(buildHierarchy(accounts)).toEqual(expected);
};

describe('Use Account Hierarchy', () => {
  const acc = (address: string, parentAddress?: string, whenCreated?: number, name?: string, suri?: string): {
    address: string;
    name?: string;
    parentAddress?: string;
    suri?: string;
    whenCreated?: number;
  } => ({ address, name, parentAddress, suri, whenCreated });

  it('for empty account list, returns empty list', () => {
    testHierarchy([], []);
  });

  it('returns one account', () => {
    testHierarchy([acc('a')], [acc('a')]);
  });

  it('puts child account into children field of parent: single child', () => {
    testHierarchy([acc('a'), acc('b', 'a')], [
      { address: 'a', children: [acc('b', 'a')], name: undefined, parentAddress: undefined, suri: undefined, whenCreated: undefined }
    ]);
  });

  it('puts child account into children field of parent: more children', () => {
    testHierarchy([acc('a'), acc('b', 'a'), acc('c', 'a')], [
      { address: 'a', children: [acc('b', 'a'), acc('c', 'a')], name: undefined, parentAddress: undefined, suri: undefined, whenCreated: undefined }
    ]);
  });

  it('puts child account into children field of parent: 2 roots', () => {
    testHierarchy([acc('a'), acc('b', 'a'), acc('c', 'a'), acc('d')], [
      { address: 'a', children: [acc('b', 'a'), acc('c', 'a')], name: undefined, parentAddress: undefined, suri: undefined, whenCreated: undefined },
      acc('d')
    ]);
  });

  it('handles grandchildren', () => {
    testHierarchy([acc('a'), acc('b', 'a'), acc('c', 'b')], [{
      address: 'a',
      children: [{
        ...acc('b', 'a'),
        children: [acc('c', 'b')]
      }],
      name: undefined,
      parentAddress: undefined,
      suri: undefined,
      whenCreated: undefined
    }]);
  });

  it('sorts accounts by network', () => {
    // UNKNOWN genesis -> network name '' sorts ahead of ALICE -> 'Alice'.
    testHierarchy(
      [{ address: 'b', genesisHash: genesisExample.UNKNOWN }, { address: 'a', genesisHash: genesisExample.ALICE }, { address: 'c', genesisHash: genesisExample.UNKNOWN }],
      [{ address: 'b', genesisHash: genesisExample.UNKNOWN }, { address: 'c', genesisHash: genesisExample.UNKNOWN }, { address: 'a', genesisHash: genesisExample.ALICE }]
    );
  });

  it('sorts accounts by network and name', () => {
    testHierarchy(
      [{ address: 'b', genesisHash: genesisExample.UNKNOWN, name: 'b-last-unknown' }, { address: 'a', genesisHash: genesisExample.ALICE }, { address: 'c', genesisHash: genesisExample.UNKNOWN, name: 'a-first-unknown' }],
      [{ address: 'c', genesisHash: genesisExample.UNKNOWN, name: 'a-first-unknown' }, { address: 'b', genesisHash: genesisExample.UNKNOWN, name: 'b-last-unknown' }, { address: 'a', genesisHash: genesisExample.ALICE }]
    );
  });

  it('sorts accounts by name and creation date', () => {
    testHierarchy(
      [acc('b', undefined, 2, 'b'), acc('z', undefined, 1, 'b'), acc('a', undefined, 4, 'a')],
      [{ address: 'a', name: 'a', parentAddress: undefined, suri: undefined, whenCreated: 4 }, { address: 'z', name: 'b', parentAddress: undefined, suri: undefined, whenCreated: 1 }, { address: 'b', name: 'b', parentAddress: undefined, suri: undefined, whenCreated: 2 }]
    );
  });

  it('sorts account children by name and path', () => {
    testHierarchy(
      [acc('a', undefined, 1, 'a'), acc('b', 'a', 1, 'b', '/2'), acc('b', 'a', 1, 'b', '/0')],
      [{ address: 'a', children: [acc('b', 'a', 1, 'b', '/0'), acc('b', 'a', 1, 'b', '/2')], name: 'a', parentAddress: undefined, suri: undefined, whenCreated: 1 }]
    );
  });

  it('sorts accounts with children by name and creation date', () => {
    testHierarchy(
      [acc('b', undefined, 2, 'b'), acc('z', undefined, 1, 'b'), acc('d', 'b', 2, 'd'), acc('c', 'b', 3, 'c'), acc('a', undefined, 4, 'a')],
      [{ address: 'a', name: 'a', parentAddress: undefined, suri: undefined, whenCreated: 4 }, { address: 'z', name: 'b', parentAddress: undefined, suri: undefined, whenCreated: 1 }, { address: 'b', children: [acc('c', 'b', 3, 'c'), acc('d', 'b', 2, 'd')], name: 'b', parentAddress: undefined, suri: undefined, whenCreated: 2 }]
    );
  });

  it('if creation time is missing, puts account at the back of a list', () => {
    testHierarchy(
      [acc('a'), acc('b', undefined, 2), acc('c', undefined, 1)],
      [acc('c', undefined, 1), acc('b', undefined, 2), acc('a')]
    );
  });
});
