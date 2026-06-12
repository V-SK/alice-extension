// Copyright 2019-2026 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { HexString } from '@polkadot/util/types';

import { useMemo } from 'react';

import chains from '../util/chains.js';

interface Option {
  text: string;
  value: HexString;
}

// Alice-only build: there is exactly one chain. We no longer offer
// "Allow use on any chain" or metadata-derived networks — every account is
// bound to the Alice genesis. The dropdown still renders for layout parity
// but only ever lists Alice.
export default function useGenesisHashOptions (): Option[] {
  const hashes = useMemo(() => chains.map(({ chain, genesisHash }) => ({
    text: chain,
    value: genesisHash as HexString
  })), []);

  return hashes;
}
