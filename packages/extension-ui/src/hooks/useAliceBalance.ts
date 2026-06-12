// Copyright 2025-2026 @alice-protocol authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountInfo } from '@polkadot/types/interfaces';

import { useEffect, useState } from 'react';

import { ALICE_DECIMALS, ALICE_TOKEN_SYMBOL } from '@polkadot/extension-base/alice';
import { BN, formatBalance } from '@polkadot/util';

import { getAliceApi } from '../alice/api.js';

export type BalanceStatus = 'loading' | 'ok' | 'error';

export interface AliceBalance {
  /** Free balance, already formatted for display (no SI suffix). */
  free: string;
  /** Token symbol, e.g. "ALICE". */
  token: string;
  status: BalanceStatus;
}

const INITIAL: AliceBalance = {
  free: '—',
  status: 'loading',
  token: ALICE_TOKEN_SYMBOL
};

/**
 * Reads System.Account(address).data.free over the pinned, genesis-verified
 * Alice RPC and subscribes to changes. Read-only — never signs, never writes.
 *
 * No address ⇒ idle. Connection / genesis failure ⇒ status 'error' (the UI
 * shows a node-down state rather than a fake zero balance).
 */
export default function useAliceBalance (address?: string | null): AliceBalance {
  const [balance, setBalance] = useState<AliceBalance>(INITIAL);

  useEffect(() => {
    if (!address) {
      setBalance(INITIAL);

      return;
    }

    let unsub: (() => void) | undefined;
    let cancelled = false;

    setBalance((prev) => ({ ...prev, status: 'loading' }));

    getAliceApi()
      .then(async (api) => {
        if (cancelled) {
          return;
        }

        unsub = await api.query['system']['account'](address, (info: AccountInfo) => {
          const free = formatBalance(new BN(info.data.free.toString()), {
            decimals: ALICE_DECIMALS,
            forceUnit: '-',
            withSi: false,
            withZero: true
          });

          setBalance({ free, status: 'ok', token: ALICE_TOKEN_SYMBOL });
        }) as unknown as () => void;
      })
      .catch((error) => {
        console.error('Alice balance query failed:', (error as Error).message);

        if (!cancelled) {
          setBalance({ free: '—', status: 'error', token: ALICE_TOKEN_SYMBOL });
        }
      });

    return () => {
      cancelled = true;
      unsub && unsub();
    };
  }, [address]);

  return balance;
}
