# Chrome Web Store — listing draft (Alice Wallet)

> Draft for V to paste into the Web Store developer dashboard. Not submitted.
> Item ID: TBD (assigned on first upload).

---

## English

### Name
Alice Wallet

### Summary (132 char max)
Hot wallet for Alice Protocol. Sign in with Alice, view your balance, manage accounts. Your keys are encrypted and never leave your device.

### Description
Alice Wallet is an open-source **hot wallet** browser extension for Alice
Protocol. It is built on the audited polkadot-js/extension account engine — the
same keystore and signing architecture used by millions of Substrate users —
pinned to a single chain: Alice.

**What it does**
- **Sign in with Alice** — log in to aliceprotocol.org and Alice dapps with one
  click, using the standard message-signing flow. No passwords for sites.
- **Create or import accounts** — generate a new 12-word recovery phrase, or
  import an existing BIP39 mnemonic or raw seed. Addresses use the Alice format.
- **View balances** — see your ALICE balance, read directly from the Alice
  network over an encrypted connection.
- **Encrypted on-device storage** — your private keys are encrypted and stored
  only in your browser. They are never uploaded anywhere.

**Hot wallet — by design**
Alice Wallet is meant for logging in and small, everyday amounts. For serious
holdings, use the **Alice Desktop Wallet**, which runs an embedded full node and
verifies the chain itself. Sending ALICE is done from the desktop wallet; this
extension is for login, balances, and account management.

**Security**
- Keys never leave your device. No accounts, no analytics, no tracking.
- The extension talks to exactly one network endpoint and refuses to operate if
  the chain's identity (genesis hash) does not match Alice — it fails closed.
- Minimal permissions: local storage and tab awareness only. No broad website
  access; the sign-in script runs only on aliceprotocol.org.

Open source. Built on polkadot-js/extension.

### Category
Functional / Developer Tools (crypto wallet)

### Permission justifications (for the dashboard "Permissions" tab)
- **storage** — store your encrypted accounts and settings locally in the browser.
- **tabs** — show the count of pending sign requests on the toolbar icon and
  route a sign-in request back to the tab that asked for it. We do not read tab
  contents of arbitrary sites.
- **Host access** — none requested. The "Sign in with Alice" content script is
  declared only for `https://aliceprotocol.org/*`.

### Privacy disclosure (required for wallets)
- **Does this item collect user data?** No.
- Keys, recovery phrases, and account names are encrypted and stored only on the
  user's device (chrome.storage.local). Nothing is transmitted to us or any
  third party. There is no analytics, no telemetry, and no remote code. The only
  network connection is to the Alice RPC endpoint (wss://rpc.aliceprotocol.org)
  to read on-chain balances and submit user-authorized signatures.
- Single purpose: a wallet/signer for the Alice Protocol network.

### Screenshots (to capture, 1280x800 or 640x400)
1. Popup — account list with ALICE balance.
2. Create account — 12-word recovery phrase step.
3. Import account — mnemonic entry.
4. Sign request — "Sign in with Alice" approval.
5. Settings / about — hot-wallet positioning + link to desktop wallet.

---

## 中文 (简体)

### 名称
Alice 钱包

### 简介 (132 字符以内)
Alice Protocol 热钱包。一键登录 Alice、查看余额、管理账户。私钥在本地加密，永不离开您的设备。

### 描述
Alice 钱包是一款面向 Alice Protocol 的开源**热钱包**浏览器扩展。它构建在经过审计的
polkadot-js/extension 账户引擎之上——与数百万 Substrate 用户使用的密钥库与签名架构相同
——并锁定到单一链：Alice。

**功能**
- **使用 Alice 登录** — 通过标准消息签名流程，一键登录 aliceprotocol.org 及 Alice 应用，
  网站无需密码。
- **创建或导入账户** — 生成新的 12 字恢复短语，或导入已有的 BIP39 助记词或原始私钥。
  地址采用 Alice 格式。
- **查看余额** — 通过加密连接，直接从 Alice 网络读取并显示您的 ALICE 余额。
- **本地加密存储** — 您的私钥经加密后仅保存在您的浏览器中，绝不会上传到任何地方。

**热钱包定位**
Alice 钱包用于登录及小额日常使用。对于大额持有，请使用 **Alice 桌面钱包**——它内嵌完整
节点并自行验证链状态。发送 ALICE 请在桌面钱包中完成；本扩展用于登录、余额查看和账户管理。

**安全性**
- 私钥永不离开您的设备。无账户体系、无分析统计、无追踪。
- 扩展仅连接唯一一个网络端点，若链身份（创世哈希）与 Alice 不匹配则拒绝运行——失败即关闭。
- 最小权限：仅本地存储与标签页感知。不请求广泛的网站访问；登录脚本仅在 aliceprotocol.org
  上运行。

开源。基于 polkadot-js/extension 构建。

### 类别
功能 / 开发者工具（加密钱包）

### 权限说明
- **storage** — 在浏览器本地存储您加密后的账户与设置。
- **tabs** — 在工具栏图标上显示待处理签名请求的数量，并将登录请求路由回发起请求的标签页。
  我们不读取任意网站的标签页内容。
- **主机访问** — 不请求。"使用 Alice 登录"内容脚本仅声明用于 `https://aliceprotocol.org/*`。

### 隐私披露（钱包必填）
- **本扩展是否收集用户数据？** 否。
- 私钥、恢复短语和账户名称均加密后仅存储在用户设备上（chrome.storage.local）。不会向我们
  或任何第三方传输任何数据。无分析、无遥测、无远程代码。唯一的网络连接是连接 Alice RPC
  端点（wss://rpc.aliceprotocol.org），用于读取链上余额和提交用户授权的签名。
- 单一用途：Alice Protocol 网络的钱包/签名器。

---

## SUBMISSION RUNBOOK (for V — the account/terms/upload steps Claude can't do)

**Ready artifacts (Claude-prepared):**
- Chrome MV3 zip: `alice-extension/dist/alice-extension-v0.1.0.zip` (rebuilt from current source)
- Firefox AMO zip: `alice-extension/master-ff-build.zip` (run `yarn build` to refresh)
- Privacy policy (LIVE, required): https://aliceprotocol.org/privacy
- Public source repo: https://github.com/V-SK/alice-extension
- Listing copy: this file (English section above)

**Step 1 — Chrome Web Store developer account (one-time):**
- Go to https://chrome.google.com/webstore/devconsole — sign in with the Google account that will own the listing, pay the one-time **$5** registration fee.

**Step 2 — Screenshots (store requires ≥1; 1280×800 or 640×400):**
- `chrome://extensions` → toggle **Developer mode** (top-right) → **Load unpacked** → select
  `/Users/v/Alice/alice-extension/packages/extension/build`
- Click the Alice icon in the toolbar → screenshot the popup. Capture 2–3 views:
  the create/import onboarding, the accounts list, and a sign-in approval if easy.
  (Claude can guide this live via teach-mode on request.)

**Step 3 — Create the item + submit:**
- Dev console → **New item** → upload `alice-extension-v0.1.0.zip`.
- Paste Name / Summary / Description / Category from the English section above.
- Add the screenshots; set **Privacy policy URL** = https://aliceprotocol.org/privacy
- **Permissions justification** tab: paste the storage/tabs/host-access lines above.
- Data-use disclosure: "Does not collect user data" (keys are encrypted, stored locally, never uploaded).
- Accept the developer agreement → **Submit for review** (review typically 1–3 days).

**Step 4 — Firefox AMO (parallel, optional):**
- https://addons.mozilla.org/developers/ → submit `master-ff-build.zip`. Confirm the
  gecko id `wallet@aliceprotocol.org` is free before first submit.
