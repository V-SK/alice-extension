// Copyright 2025-2026 @alice-protocol authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Alice Protocol — the ONE chain this wallet talks to.
//
// This file is the single source of chain truth for the extension. The RPC
// endpoint and the genesis hash below are the ONLY chain configuration; the
// wallet fails closed if the live chain's genesis does not match
// ALICE_GENESIS_HASH (see alice/validateChain.ts).
//
// Keep this in sync with alice-chain runtime. specVersion is informational
// only — genesis is the hard gate.

import type { HexString } from '@polkadot/util/types';

/** Canonical Alice mainnet genesis hash (fail-closed gate). */
export const ALICE_GENESIS_HASH: HexString = '0x7746a1d14736a95e00a617a11094b6e86bbf91cd4e7e64c0e748e3c0d2ad54b0';

/** SS58 address prefix for Alice. */
export const ALICE_SS58_PREFIX = 300;

/** Token decimals. */
export const ALICE_DECIMALS = 12;

/** Token symbol. */
export const ALICE_TOKEN_SYMBOL = 'ALICE';

/** Human display name. */
export const ALICE_CHAIN_NAME = 'Alice';

/** Runtime spec name (informational; genesis is the gate). */
export const ALICE_SPEC_NAME = 'solochain-template-runtime';

/**
 * The single RPC endpoint. Must be wss:// (TLS). This is the ONLY network
 * host the extension is permitted to reach.
 */
export const ALICE_RPC_ENDPOINT = 'wss://rpc.aliceprotocol.org';

/**
 * Optional loopback fallback for users running a local Alice full node.
 * Not used by default; reserved for an opt-in setting in a later version.
 */
export const ALICE_LOCAL_RPC_ENDPOINT = 'ws://127.0.0.1:9955';

export interface AliceChainConfig {
  name: string;
  genesisHash: HexString;
  specName: string;
  ss58Prefix: number;
  decimals: number;
  tokenSymbol: string;
  rpcEndpoint: string;
}

export const ALICE_MAINNET: AliceChainConfig = {
  decimals: ALICE_DECIMALS,
  genesisHash: ALICE_GENESIS_HASH,
  name: ALICE_CHAIN_NAME,
  rpcEndpoint: ALICE_RPC_ENDPOINT,
  specName: ALICE_SPEC_NAME,
  ss58Prefix: ALICE_SS58_PREFIX,
  tokenSymbol: ALICE_TOKEN_SYMBOL
};
