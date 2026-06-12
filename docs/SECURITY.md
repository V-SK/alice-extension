# Alice Wallet Extension — security positioning

EN below, 中文见下方。

## Hot wallet vs. desktop wallet

**Alice Wallet (this extension)** is a **hot wallet** — for small amounts, app
authorization, and login.

**Use it for**
- Everyday, small, frequent interactions
- DApp signing (Sign-in-with-Alice, on-chain authorizations)
- Logging in to aliceprotocol.org

**Do NOT use it for**
- Long-term storage
- Production-scale funds

**For serious holdings, use the Alice Desktop Wallet** (`V-SK/alice-wallet`):
- Embedded full node — verifies all chain state itself
- Same key encryption family (Argon2id + AES-256-GCM)
- Self-signed updates, offline-signing options
- This is also where you **send ALICE**. v1 of this extension is
  receive/login/balance only; transfer ships in a later version.

## Key security

- Keys are stored in `chrome.storage.local`, encrypted by the upstream
  polkadot-js keystore (the same engine used by millions of Substrate users).
  This fork adds **zero custom cryptography**.
- Keys are never uploaded — local only. No accounts, no analytics, no telemetry.
- Private-key / recovery-phrase export is gated behind password re-entry.
- The content script talks to the background service worker over a message
  channel — private keys never touch page (website) code.

## Chain validation (fail closed)

- On connect, the extension checks the live chain's **genesis hash** against the
  pinned Alice genesis
  (`0x7746a1d14736a95e00a617a11094b6e86bbf91cd4e7e64c0e748e3c0d2ad54b0`).
  On any mismatch it disconnects and refuses to operate — it **fails closed**.
- The RPC endpoint must be `wss://` (TLS). The only configured endpoint is
  `wss://rpc.aliceprotocol.org`.
- A malicious or wrong-chain RPC cannot present the correct genesis without
  controlling the entire chain history, so balance reads and signatures cannot
  be silently redirected to another chain.

## Message signing (Sign-in-with-Alice)

- Sign-in uses the standard `signRaw` flow. The bytes that get signed are always
  wrapped in the `<Bytes>…</Bytes>` envelope, so a login signature can never be
  replayed as a transaction. This is upstream behavior, kept unchanged.

## Permissions

- `storage` — local encrypted account storage.
- `tabs` — pending-request badge + routing a sign-in back to the requesting tab.
- No `host_permissions`. The injected sign-in script is declared only for
  `https://aliceprotocol.org/*`.
- MV3 CSP: `script-src 'self' 'wasm-unsafe-eval'` — no remote code, no
  `unsafe-inline`.

## Risks & disclaimer

- **Browser 0-day:** if the browser itself is compromised, keys could be at risk.
- **Other malicious extensions** could attempt to access browser storage.
- **Phishing:** a website can fake an "Alice login" prompt — always verify the
  URL before approving a signature.

**Backup:** export your recovery phrase (12 words) or private key and store it
offline, securely.

---

# Alice 钱包扩展 — 安全定位

## 热钱包 vs. 桌面钱包

**Alice 钱包（本扩展）** 是一款**热钱包**——用于小额、应用授权与登录。

**适用于**
- 日常、小额、频繁的交互
- DApp 签名（使用 Alice 登录、链上授权）
- 登录 aliceprotocol.org

**不适用于**
- 长期持有
- 生产规模资金

**大额持有请使用 Alice 桌面钱包**（`V-SK/alice-wallet`）：
- 内嵌完整节点——自行验证所有链状态
- 同一密钥加密体系（Argon2id + AES-256-GCM）
- 自签名更新、离线签名选项
- **发送 ALICE 也在桌面钱包中完成**。本扩展 v1 仅支持接收 / 登录 / 余额；转账将在后续版本提供。

## 密钥安全

- 私钥存储在 `chrome.storage.local`，由上游 polkadot-js 密钥库加密（数百万 Substrate 用户
  使用的同一引擎）。本分支**未添加任何自定义加密**。
- 私钥绝不上传——仅存本地。无账户体系、无分析、无遥测。
- 私钥 / 恢复短语导出需密码二次验证。
- 内容脚本通过消息通道与后台 service worker 通信——私钥绝不接触页面（网站）代码。

## 链验证（失败即关闭）

- 连接时，扩展会将实时链的**创世哈希**与锁定的 Alice 创世哈希
  （`0x7746a1d14736a95e00a617a11094b6e86bbf91cd4e7e64c0e748e3c0d2ad54b0`）比对。
  任何不匹配都会断开连接并拒绝运行——**失败即关闭**。
- RPC 端点必须为 `wss://`（TLS）。唯一配置的端点是 `wss://rpc.aliceprotocol.org`。
- 恶意或错误的 RPC 无法在不控制整条链历史的情况下伪造正确的创世哈希，因此余额读取与签名
  不会被悄悄重定向到另一条链。

## 消息签名（使用 Alice 登录）

- 登录使用标准 `signRaw` 流程。被签名的字节始终包裹在 `<Bytes>…</Bytes>` 信封中，因此登录
  签名永远不能被重放为交易。此为上游行为，保持不变。

## 权限

- `storage` — 本地加密账户存储。
- `tabs` — 待处理请求角标 + 将登录请求路由回发起的标签页。
- 无 `host_permissions`。注入的登录脚本仅声明用于 `https://aliceprotocol.org/*`。
- MV3 CSP：`script-src 'self' 'wasm-unsafe-eval'`——无远程代码，无 `unsafe-inline`。

## 风险与免责

- **浏览器 0day：** 若浏览器本身被攻陷，密钥可能面临风险。
- **其他恶意扩展** 可能尝试访问浏览器存储。
- **网络钓鱼：** 网站可伪造"Alice 登录"提示——批准签名前请务必核实 URL。

**备份：** 导出您的恢复短语（12 字）或私钥，并离线安全保存。
