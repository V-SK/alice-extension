# Alice Wallet — browser extension

A **hot wallet** browser extension for [Alice Protocol](https://aliceprotocol.org).
Sign in with Alice, view your ALICE balance, and manage accounts — with your
keys encrypted on-device and never uploaded.

Built on [`polkadot-js/extension`](https://github.com/polkadot-js/extension)
(see `UPSTREAM_COMMIT.txt`), pinned to a single chain: Alice. The upstream
account engine, keystore, and signing architecture are kept **unchanged** —
this fork adds zero custom cryptography.

## Positioning

This is the **hot-wallet layer**: login and small, everyday amounts. For serious
holdings — and for **sending ALICE** — use the **Alice Desktop Wallet**
(`V-SK/alice-wallet`), which runs an embedded full node. See
[`docs/SECURITY.md`](docs/SECURITY.md).

## Features (v1)

- Create a new account (12-word BIP39 recovery phrase) or import a mnemonic /
  raw seed — addresses in the Alice format (ss58 = 300).
- Encrypted on-device keystore (upstream polkadot-js).
- **Sign in with Alice** — standard `signRaw` message signing, powering
  one-click login on aliceprotocol.org.
- **Balance display** — read-only `System.Account` over the pinned Alice RPC.
- Fail-closed chain validation: refuses to operate if the live genesis hash is
  not Alice.

No transfer in v1 (send from the desktop wallet). A clean seam for v2 transfer
is left in `Popup/Accounts/Balance.tsx`.

## Quick start

```bash
corepack enable && corepack prepare yarn@4.9.2 --activate
yarn install
bash scripts/build-mv3.sh          # -> packages/extension/build + dist/*.zip
yarn test                          # kept-core suite + Alice smoke tests
```

Load `packages/extension/build/` via `chrome://extensions` → Developer mode →
Load unpacked. Direct-install guide: [`docs/INSTALL.md`](docs/INSTALL.md).

## Docs
- [`docs/SECURITY.md`](docs/SECURITY.md) — hot-wallet positioning, key & chain security (EN+中)
- [`docs/INSTALL.md`](docs/INSTALL.md) — direct-download install (EN+中)
- [`docs/DEV.md`](docs/DEV.md) — build, test, where Alice lives in the tree
- [`docs/STORE_LISTING.md`](docs/STORE_LISTING.md) — Chrome Web Store listing draft (EN+中)
- [`HANDOFF.md`](HANDOFF.md) — status, remaining work, risks

## License
Apache-2.0 (inherited from polkadot-js/extension).
