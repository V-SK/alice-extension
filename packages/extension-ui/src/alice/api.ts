// Copyright 2019-2026 @polkadot/extension authors & contributors
// Alice Protocol fork — added for the Alice-only wallet build
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise, WsProvider } from '@polkadot/api';

import { ALICE_RPC_ENDPOINT } from '@polkadot/extension-base/alice';

import { assertAliceGenesis, assertAliceSpecVersion } from './validateChain.js';

// Single, lazily-created connection to the pinned Alice RPC. The popup is
// short-lived, so we cache the ready promise for the lifetime of the page
// rather than reconnecting on every balance poll.
//
// The endpoint is the ONLY network host this code reaches. On connect we run
// a fail-closed genesis check; if the live chain is not Alice we disconnect
// and reject — no balance, no signing against a wrong chain.

let apiPromise: Promise<ApiPromise> | null = null;

async function connect (): Promise<ApiPromise> {
  const provider = new WsProvider(ALICE_RPC_ENDPOINT);

  let api: ApiPromise;

  try {
    api = await ApiPromise.create({ provider, throwOnConnect: true });
  } catch (error) {
    await provider.disconnect().catch(() => undefined);
    throw error;
  }

  try {
    // Fail closed: a wrong-chain / malicious RPC is rejected here (genesis is
    // the hard identity gate), then a stale / pre-launch runtime is rejected
    // (specVersion >= 110).
    assertAliceGenesis(api);
    assertAliceSpecVersion(api);
  } catch (error) {
    await api.disconnect().catch(() => undefined);
    throw error;
  }

  return api;
}

/**
 * Returns a ready, genesis-verified Alice API instance. Subsequent callers
 * share the same connection. If the connection dropped, the next call
 * re-establishes it.
 */
export async function getAliceApi (): Promise<ApiPromise> {
  if (apiPromise) {
    try {
      const api = await apiPromise;

      if (api.isConnected) {
        return api;
      }
    } catch {
      // fall through and reconnect below
    }
  }

  apiPromise = connect();

  return apiPromise;
}

/** Tear down the shared connection (e.g. on popup unmount in tests). */
export async function disconnectAliceApi (): Promise<void> {
  if (apiPromise) {
    const pending = apiPromise;

    apiPromise = null;

    try {
      const api = await pending;

      await api.disconnect();
    } catch {
      // already gone
    }
  }
}
