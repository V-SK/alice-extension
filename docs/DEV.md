# Development

## Prerequisites
- Node.js >= 18 (built and tested on Node 22)
- Yarn 4 via Corepack (the repo pins `yarn@4.9.2`)

```bash
corepack enable
corepack prepare yarn@4.9.2 --activate
```

## Install
```bash
yarn install
```

## Build (Chrome MV3)
```bash
bash scripts/build-mv3.sh
```
Outputs:
- `packages/extension/build/` — unpacked extension (load this via
  `chrome://extensions` → Developer mode → Load unpacked)
- `dist/alice-extension-v<version>.zip` — Web Store upload artifact
- `dist/alice-extension-v<version>.zip.sha256`

The build also runs upstream's header lint and TS compile; a clean run means
the bundle, manifest, icons, and locales are all in `build/`.

## Test
```bash
yarn test
```
Runs the kept-core `.spec.ts` suite plus the Alice smoke tests
(`validateChain.spec.ts`, `RequestBytesSign.spec.ts`). All green.

> The enzyme `.spec.tsx` component tests fail to load under Node 22 (upstream's
> react-18 / enzyme-react-17 adapter mismatch). They are excluded by upstream's
> own default `yarn test` target and are a pre-existing upstream issue, not a
> fork regression.

## Where Alice lives in the tree
- `packages/extension-base/src/alice.ts` — single source of chain truth
  (genesis, ss58=300, decimals=12, token, RPC). **Update `specVersion`/comments
  here when alice-chain ships a new runtime.**
- `packages/extension-ui/src/alice/validateChain.ts` — fail-closed genesis check.
- `packages/extension-ui/src/alice/api.ts` — single genesis-verified WsProvider.
- `packages/extension-ui/src/hooks/useAliceBalance.ts` + `Popup/Accounts/Balance.tsx`
  — read-only balance display.
- `packages/extension-ui/src/util/chains.ts` — pinned to one ALICE entry.
- `packages/extension/manifest_chrome.json` — Alice MV3 manifest.
- `packages/extension/public/theme.css` — Alice brand colors.
- `packages/extension/public/locales/{en,zh}/translation.json` — i18n.
- `packages/extension/src/page.ts` — injects `window.injectedWeb3.alice`.

## Upstream
Forked from `polkadot-js/extension` — see `UPSTREAM_COMMIT.txt`. The account
engine, keystore, and signing architecture are kept unchanged (zero custom
crypto). To pull upstream fixes, rebase the Alice commits on a newer upstream
tag and re-run build + test.

## v2 seam (transfer)
v1 has no transfer. The clean place to add an in-popup "Send" is
`Popup/Accounts/Balance.tsx` (currently shows the "use desktop wallet" hint).
Transfer would reuse the existing `api.ts` connection + the upstream
`signPayload` (extrinsic) path, which is already present and tested.
