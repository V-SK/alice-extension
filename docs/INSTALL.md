# Install Alice Wallet (direct download)

This is the website-fallback install path for when the Chrome Web Store listing
is not yet live (or for offline / beta use). The Web Store is the preferred path
once published.

EN below, 中文见下方。

---

## English — Chrome / Brave / Edge (Chromium)

1. Download **`alice-extension-v0.1.0.zip`** from the official Alice download
   page or GitHub Releases.
2. Verify the checksum (recommended). On macOS / Linux:
   ```
   shasum -a 256 alice-extension-v0.1.0.zip
   ```
   Compare the output against the published `.sha256` value. If it differs, do
   not install — re-download from the official source.
3. Unzip into a folder you will keep (e.g. `~/Applications/alice-extension`).
   Do not delete this folder afterwards — the browser loads the extension from
   it on every launch.
4. Open `chrome://extensions` (or `brave://extensions`, `edge://extensions`).
5. Turn on **Developer mode** (top-right toggle).
6. Click **Load unpacked** and select the unzipped folder.
7. The Alice Wallet icon (orange mark) appears in the toolbar. Pin it for easy
   access.

**Verify it works:** click the icon — you should see a prompt to create or
import an account.

> A "developer-mode extension" warning from Chrome is expected for unpacked
> installs and is not a problem. It disappears once you install from the Web
> Store.

---

## 中文 — Chrome / Brave / Edge (Chromium)

1. 从 Alice 官方下载页或 GitHub Releases 下载 **`alice-extension-v0.1.0.zip`**。
2. 校验哈希（推荐）。macOS / Linux：
   ```
   shasum -a 256 alice-extension-v0.1.0.zip
   ```
   将输出与官方公布的 `.sha256` 值比对。若不一致，请勿安装——请从官方来源重新下载。
3. 解压到一个长期保留的文件夹（例如 `~/Applications/alice-extension`）。解压后请勿删除该
   文件夹——浏览器每次启动都会从该文件夹加载扩展。
4. 打开 `chrome://extensions`（或 `brave://extensions`、`edge://extensions`）。
5. 打开右上角的 **开发者模式**。
6. 点击 **加载已解压的扩展程序**，选择刚才解压的文件夹。
7. 工具栏会出现 Alice 钱包图标（橙色标记）。可将其固定以便使用。

**确认可用：** 点击图标，应显示创建或导入账户的提示。

> 对于已解压安装，Chrome 会显示"开发者模式扩展"提示，这是正常现象，不影响使用。从 Web
> Store 安装后该提示会消失。

---

## Uninstall / 卸载
`chrome://extensions` → Alice Wallet → **Remove** / 移除。

Your encrypted accounts live in the browser profile. Make sure you have backed
up your recovery phrase before removing.
您的加密账户存储在浏览器配置文件中。移除前请确保已备份恢复短语。
