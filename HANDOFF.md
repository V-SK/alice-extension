# Handoff — Alice Wallet extension (v1, scope-cut)

Status as built by the execution agent. **Nothing has been pushed or submitted.**

## What this is
A fork of `polkadot-js/extension` pinned to Alice, delivering the
minimum-lovable v1: account create/import, encrypted keystore (upstream),
Sign-in-with-Alice (`signRaw`), and balance display. No transfer in v1.

- Repo: `/Users/v/Alice/alice-extension` (local git, 5 commits, no remote)
- Upstream pin: `987784c81e04dea2d6f886895a3c9bb18e0adf6c` (v0.63.1, 2026-03-31)
  — also in `UPSTREAM_COMMIT.txt`
- Build artifact: `dist/alice-extension-v0.1.0.zip` (+ `.sha256`)

## Completed
- [x] Fork vendored; upstream commit recorded; git initialized.
- [x] Chain pinned to Alice (ss58=300, decimals=12, genesis fail-closed,
      `wss://rpc.aliceprotocol.org`) — single source `extension-base/src/alice.ts`.
- [x] Multi-chain network UI stripped (chains.ts → one entry; network dropdowns
      removed from create/import; genesis options collapsed to Alice).
- [x] Account create (BIP39 12-word) + import (mnemonic + raw seed), keystore
      and signing architecture UNCHANGED (zero custom crypto).
- [x] Sign-in-with-Alice: `window.injectedWeb3.alice`, standard `signRaw`.
- [x] Balance display (read-only System.Account over the pinned RPC).
- [x] Branding: Alice mark + icons, #F97316/#050505 theme, EN+中, no emoji,
      hot-wallet positioning copy.
- [x] Manifest: MV3, minimal perms `[storage, tabs]`, NO host_permissions,
      content script scoped to aliceprotocol.org, no remote code, CSP intact.
- [x] Tests: `yarn test` green (73/73) incl. genesis fail-closed + signRaw
      smoke tests. Kept keystore/signing core fully passing.
- [x] Packaging: `scripts/build-mv3.sh` → zip + checksum.
- [x] Docs: README, SECURITY, INSTALL, DEV, STORE_LISTING (all EN+中), this file.

## Remaining work before store submission (honest estimate)

| Task | Owner | Est. |
|---|---|---|
| Capture 5 screenshots (popup, create, import, sign, about) | needs a built install + a live/dev RPC | 0.5 day |
| Manual smoke on a real Chrome profile against a reachable Alice RPC (create → balance → sign-in round-trip) | — | 0.5 day |
| Confirm `specVersion` note vs live chain (v110 vs v111) — genesis is the gate, but update the comment in `alice.ts` | quick | 0.1 day |
| Web Store dev account + paste STORE_LISTING + upload zip (V only) | V | 0.5 day |
| Firefox AMO (post-Chrome) — `manifest_firefox.json` already exists upstream; needs an Alice pass | deferred | ~1 day |

**Net to "ready to submit Chrome": ~1.5 agent-days** (mostly screenshots +
one manual end-to-end on a reachable RPC), then V uploads. Comfortably inside
the 6/20 Web Store deadline.

## Web Store policy risk assessment

- **Low risk overall.** Minimal permissions (`storage`, `tabs`), no
  `host_permissions`, no remote code, CSP has no `unsafe-inline`, clear
  single-purpose (wallet/signer), explicit "no data collected" privacy
  disclosure, hot-wallet disclaimer in the listing.
- **`tabs` permission** — reviewers sometimes question it. Justification is in
  STORE_LISTING (badge count + routing a sign-in back to its tab). It does not
  grant arbitrary-site content access. If a reviewer pushes back, the badge
  logic can be reduced to drop `tabs`, but that is a follow-up, not a blocker.
- **Crypto-wallet category variance** — approval standards vary by reviewer.
  The "hot wallet" disclaimer + "no payment/exchange features" framing in the
  listing is there to preempt payout/trading-claim rejections.
- **Bilingual completeness** — ZH locale is at 100% key coverage (208/208), so
  CN users won't see English fallback (a known review trip-wire).

## Known limitations / notes
- Residual Polkadot/Kusama strings remain in the bundle from upstream's Ledger
  and phishing-list modules (`legerChains.ts`, `@polkadot/networks/defaults`).
  These are dead data, not active UI — the account flows show only Alice.
  Removing them is optional cleanup, out of v1 cut scope.
- Fonts: Inter/JetBrains Mono are set as preferred via CSS with system
  fallbacks; only Nunito is bundled (offline). Balances use the mono fallback.
  Bundling the brand fonts locally is a nice-to-have (avoid CDN = policy-clean).
- The enzyme `.spec.tsx` component tests don't load under Node 22 (pre-existing
  upstream react-18/enzyme-react-17 mismatch); excluded by upstream's own test
  target. Not a fork regression.

## Hard-rule compliance
- Zero custom key-handling code; keystore + signing are upstream, untouched.
- No key material logged/printed; no secrets committed (verify with
  `git log -p` if desired).
- RPC URL + genesis are the only chain config; fails closed on mismatch.
- `paid_acu` / payout: not touched — balance is a read-only chain query.
- No push, no store submission performed.
