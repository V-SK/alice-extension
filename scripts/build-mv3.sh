#!/usr/bin/env bash
# Build the Alice Wallet Chrome MV3 production zip.
#
# Output:
#   packages/extension/build/                 (unpacked, for "Load unpacked")
#   dist/alice-extension-v<version>.zip       (Chrome Web Store upload)
#   dist/alice-extension-v<version>.zip.sha256
#
# Requires: corepack-activated yarn 4 + a completed `yarn install`.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VERSION="$(node -p "require('./packages/extension/package.json').version")"
DIST="$ROOT/dist"
OUT="$DIST/alice-extension-v${VERSION}.zip"

echo "==> Alice Wallet MV3 build (v${VERSION})"

# 1. Chrome manifest is the active manifest for this build.
cp ./packages/extension/manifest_chrome.json ./packages/extension/manifest.json

# 2. Generate i18n + compile/bundle every package to packages/extension/build.
yarn build:i18n
yarn exec polkadot-dev-build-ts

BUILD="$ROOT/packages/extension/build"

# 3. Sanity: the loadable artifact must exist and be Alice-pinned.
for f in background.js content.js page.js index.html manifest.json; do
  [ -f "$BUILD/$f" ] || { echo "MISSING $BUILD/$f"; exit 1; }
done
grep -q "7746a1d14736a95e00a617a11094b6e86bbf91cd4e7e64c0e748e3c0d2ad54b0" "$BUILD/extension.js" \
  || { echo "Alice genesis missing from bundle"; exit 1; }

# 4. Zip the unpacked build dir (its contents at the zip root).
mkdir -p "$DIST"
rm -f "$OUT" "$OUT.sha256"
( cd "$BUILD" && zip -r -q -X "$OUT" . -x '*.d.ts' -x '*.LICENSE.txt' )

# 5. Checksum.
( cd "$DIST" && shasum -a 256 "$(basename "$OUT")" > "$(basename "$OUT").sha256" )

echo "==> Unpacked: $BUILD"
echo "==> Zip:      $OUT  ($(du -h "$OUT" | cut -f1))"
echo "==> SHA-256:  $(cut -d' ' -f1 "$OUT.sha256")"
