// Copyright 2019-2026 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataDefBase } from '@polkadot/extension-inject/types';

import { ALICE_CHAIN_NAME, ALICE_GENESIS_HASH, ALICE_SS58_PREFIX } from '@polkadot/extension-base/alice';

// Alice-only build: the multi-chain network list from @polkadot/networks is
// intentionally removed. This wallet talks to exactly one chain (Alice), so
// every network map / genesis-option dropdown in the UI collapses to a single
// entry. See packages/extension-base/src/alice.ts for the canonical config.
const hashes: MetadataDefBase[] = [
  {
    chain: ALICE_CHAIN_NAME,
    genesisHash: ALICE_GENESIS_HASH,
    icon: 'substrate',
    ss58Format: ALICE_SS58_PREFIX
  }
];

export default hashes;
