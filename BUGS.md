# CWJ Tools V2 — Bug 清单

> 生成时间：2026-07-12
> 来源：静态代码分析 + 线上站点对比 + Git 历史追溯

---

## 📌 根因总览

**罪魁祸首：提交 `043dc31` — `feat: Phase 5 - 全局视觉重设计`**（7月7日 14:29）

该提交将整个 `script.js` 从旧版 955 行完全重写为新版 ~1250 行。在这次重写中，大量交互逻辑被遗漏或改错，导致以下 **5 个高严重度问题** 和 **1 个中严重度问题** 同时产生：

| 问题 | 旧代码（Phase 4 及之前） | 新代码（Phase 5 及当前） |
|------|------------------------|------------------------|
| AI 聊天端点 | `fetch('https://api.cwj-tools.xyz/')` | `fetch('/api/chat')` |
| 工具卡片点击 | `if (tool) openToolDetail(tool);` | `const tool = ...; /* 无后续调用 */` |
| 返回按钮 | `if (e.target.closest('#tool-back')) hideToolDetail();` | 只计算了 `age`，未调用 `hideToolDetail()` |
| 页面初始化 | `renderHome()` 等 | `initApp()` 为空函数 |
| 快捷操作 | `openTool(t.id)` | `navigateTo('tools')` 后无 `openToolDetail()` |

后续的所有提交（`59f13fb` 修复闪现、`83a72ad` 调试叠加层、`a669240` 移除调试日志等）都是基于 Phase 5 的代码改的，**从未修正这些根本性缺口**。

---

### AI 聊天后端状态：✅ 完全正常

经测试，`api.cwj-tools.xyz`（CNAME → Cloudflare Worker `dawn-king-2fdc.ehzvgs624879.workers.dev`）正常工作：

| 测试目标 | 方法 | 结果 |
|---------|------|------|
| Worker 直连 | `POST https://dawn-king-2fdc.ehzvgs624879.workers.dev/` | HTTP 200，真实回复 ✅ |
| API 域名 | `POST https://api.cwj-tools.xyz/` | HTTP 200，真实回复 ✅ |

**问题是纯前端的：** Phase 5 将端点从 `https://api.cwj-tools.xyz/` 改成了 `/api/chat`，而后者在 Vercel 静态部署上没有任何路由处理。

---

## 🔴 安全

### S-1 config.json 中包含明文 API 密钥

| 字段 | 值 |
|------|-----|
| **文件** | `config.json` 第 9、17、25、33 行 |
| **严重程度** | **高** |
| **描述** | 仓库中存储了智谱（GLM）和 DeepSeek 的 API 密钥。智谱密钥是明文可见的，DeepSeek 密钥同样暴露。任何能访问该仓库的人员均可盗用这些密钥，可能导致盗刷和意外费用。 |
| **修复建议** | 使用 Vercel Environment Variables 或 `.env` 文件管理密钥，将 `config.json` 加入 `.gitignore`。 |

---

## 🔴 高

### H-1 工具卡片点击无响应

| 字段 | 值 |
|------|-----|
| **文件** | `script.js:147-153` |
| **根因提交** | `043dc31`（Phase 5 重写）— 新代码漏掉了 `openToolDetail(tool)` 调用 |
| **严重程度** | **高** |
| **描述** | 点击工具网格中的卡片（例如"密码生成器"）后，无任何反应。事件处理函数中找到了对应的工具对象，但从未调用 `openToolDetail(tool)`，执行流就此结束。 |
| **修复方案** | 在第 152 行 `const tool = TOOLS.find(...)` 之后添加：<br>`if (tool) openToolDetail(tool);` |

### H-2 快捷操作仅跳转不打开工具

| 字段 | 值 |
|------|-----|
| **文件** | `script.js:287-295` |
| **根因提交** | `043dc31`（Phase 5 重写）— 新代码漏掉了 `openToolDetail(tool)` 调用 |
| **严重程度** | **高** |
| **描述** | 首页的"快速操作"按钮（密码生成器、二维码生成、Base64、JSON）点击后仅跳转到工具页面，未打开对应的工具详情。 |
| **修复方案** | 在第 293 行 `if (tool)` 块中，`navigateTo('tools')` 之后添加：<br>`openToolDetail(tool);` |

### H-3 工具详情页的"返回"按钮不返回

| 字段 | 值 |
|------|-----|
| **文件** | `script.js:194-199` |
| **根因提交** | `043dc31`（Phase 5 重写）— 新代码计算了 `age` 但未调用 `hideToolDetail()` |
| **严重程度** | **高** |
| **描述** | 点击"返回工具列表"按钮后计算了 `age` 变量，但从未调用 `hideToolDetail()`，UI 无任何变化。 |
| **修复方案** | 在第 197 行 `var age = Date.now() - toolDetailOpenTime;` 之后添加：<br>`if (age > 400) hideToolDetail();`<br>（400ms 防误触保护，保留 `toolDetailOpenTime` 变量用于判断） |

### H-4 `initApp()` 为空——页面初始化缺失

| 字段 | 值 |
|------|-----|
| **文件** | `script.js:1545-1546` |
| **根因提交** | `043dc31`（Phase 5 重写）— `initApp()` 被定义为空函数 |
| **严重程度** | **高** |
| **描述** | `DOMContentLoaded` 触发时调用的是空函数，导致：<br>1. `renderQuickActions()` 未被调用 → 首页快速操作区永远为空。<br>2. `initModelSelector()` 未被调用 → 聊天页模型下拉框无选项。<br>3. `loadChatHistory()` 未被调用 → 聊天历史未从 localStorage 加载。 |
| **修复方案** | 在 `initApp()` 函数体内添加：<br>```js<br>renderQuickActions();<br>initModelSelector();<br>loadChatHistory();<br>renderChatMessages();<br>``` |

### H-5 AI 聊天 API 在 Vercel 上不可用

| 字段 | 值 |
|------|-----|
| **文件** | `script.js:544` — `sendChatMessage()` 中的 `fetch('/api/chat', ...)` 调用 |
| **根因提交** | `043dc31`（Phase 5 重写）— 端点从 `https://api.cwj-tools.xyz/` 改为 `/api/chat` |
| **严重程度** | **高** |
| **描述** | `script.js` 向 `/api/chat` 发 POST 请求，但该路径是本地相对路径。线上 Vercel 纯静态部署无路由处理 `/api/chat`，所有聊天请求均失败。真实的 API 服务器在 `https://api.cwj-tools.xyz/`（CNAME → Cloudflare Worker），经测试正常工作。 |
| **修复方案** | **方案 A（推荐）**：在 `sendChatMessage()` 中将端点改回外部 API：<br>```js<br>var response = await fetch('https://api.cwj-tools.xyz/', {<br>  method: 'POST',<br>  headers: { 'Content-Type': 'application/json' },<br>  body: JSON.stringify({ messages: chatMessages, max_tokens: 1000 })<br>});<br>// 注意：外部 API 返回格式是 data.choices[0].message.content，<br>// 而非当前代码期望的 data.reply，响应解析也需要适配。<br>```<br><br>**方案 B**：在 Vercel 上部署 serverless function（`/api/chat.js`），将请求转发到 `api.cwj-tools.xyz`。<br><br>**方案 C**：保留 `/api/chat` 路径，在 `server.js` 中添加代理逻辑（仅本地有效）。 |

---

## 🟡 中

### M-1 `renderQuickActions()` 定义后从未被调用

| 字段 | 值 |
|------|-----|
| **文件** | `script.js:271`（函数定义），全局搜索无调用方 |
| **根因提交** | `043dc31`（Phase 5 重写）— 遗漏了 `initApp()` 中的调用 |
| **严重程度** | **中** |
| **描述** | `renderQuickActions()` 函数已实现，但页面任何位置都未调用它，导致首页快速操作区域永远是空的 `<div>`。与 H-4 同一根因。 |
| **修复方案** | 与 H-4 一并修复：在 `initApp()` 中添加 `renderQuickActions()` 调用。 |

### M-2 `{{toolCount}}` 占位符未被替换

| 字段 | 值 |
|------|-----|
| **文件** | `index.html:79` / `script.js:141-144` |
| **严重程度** | **中** |
| **描述** | HTML 中有硬编码模板变量 `{{toolCount}}`。JS 端 `renderToolGrid()` 会替换为 `17`（工具总数），但仅在用户导航到工具页面时才执行。用户首次访问或 JS 尚未执行时，占位符以字面量形式显示。 |
| **修复建议** | 方案 A：HTML 中直接写入 `17`。方案 B：在 `initApp()` 中提前替换。 |

### M-3 AES 加密 `String.fromCharCode.apply` 可能栈溢出

| 字段 | 值 |
|------|-----|
| **文件** | `script.js:927` |
| **严重程度** | **中** |
| **描述** | `btoa(String.fromCharCode.apply(null, combined))` 将 Uint8Array 以独立参数形式传给 `apply()`，当数组元素超过约 125K 时，JS 引擎抛出"Maximum call stack size exceeded"。导致较大数据加解密静默失败。 |
| **修复建议** | 改用循环或 `Array.from(combined).map(b => String.fromCharCode(b)).join('')` 处理。 |

### M-4 IP 查询空字符串导致 URL 格式错误

| 字段 | 值 |
|------|-----|
| **文件** | `script.js:1356`（`doIPQuery('')` 调用） |
| **严重程度** | **中** |
| **描述** | 点击"查本机"时调用 `doIPQuery('')`，拼接出 `https://ipapi.co//json/`（双斜杠），该 URL 可能返回错误。正确的自查询 URL 应为 `https://ipapi.co/json/`。 |
| **修复建议** | 当 ip 为空时使用 `'https://ipapi.co/json/'`，否则使用带 ip 的 URL。 |

---

## 🟢 低

### L-1 测速进度条基于时间而非实际进度

| 字段 | 值 |
|------|-----|
| **文件** | `script.js:1511` |
| **严重程度** | **低** |
| **描述** | 进度条宽度按已用时间计算（`elapsed / 10 * 100`），1 秒显示 10%，5 秒显示 50%，与实际下载量无关。测试大文件时很快到 100% 但仍在下载，产生误导。 |
| **修复建议** | 改用 `totalBytes / targetBytes` 计算真实进度百分比。 |

### L-2 Lucide 图标加载时序问题

| 字段 | 值 |
|------|-----|
| **文件** | `index.html:14` / `script.js:17-22` |
| **严重程度** | **低** |
| **描述** | Lucide 以 `defer` 异步加载，`script.js` 为同步加载。`script.js` 执行时 `lucide` 全局变量可能尚未可用，导致首次 `initLucide()` 静默跳过（有 `typeof lucide` 防御检查），动态插入的图标可能偶发缺失。 |
| **修复建议** | 将 `script.js` 也改为 `defer` 加载，以保证 Lucide 先于应用脚本执行。 |

---

## 修复优先级建议

### 第一批：5 个高严重度（Phase 5 引入，交互断裂）

| 序号 | 问题 | 改动量 | 涉及文件 |
|------|------|--------|---------|
| ① | H-5 AI 聊天端点改回 `api.cwj-tools.xyz` | 2 行 + 响应解析适配 | `script.js:544-553` |
| ② | H-1 工具卡片点击加 `openToolDetail(tool)` | 1 行 | `script.js:152-153` |
| ③ | H-3 返回按钮加 `hideToolDetail()` | 1 行 | `script.js:197-198` |
| ④ | H-2 快捷操作加 `openToolDetail(tool)` | 1 行 | `script.js:292-293` |
| ⑤ | H-4 + M-1 `initApp()` 加初始化调用 | 4 行 | `script.js:1545-1546` |

### 第二批：中/低严重度

| 序号 | 问题 | 改动量 |
|------|------|--------|
| ⑥ | M-2 `{{toolCount}}` HTML 中直接写 `17` | 1 行 |
| ⑦ | M-3 AES `apply` 栈溢出修复 | 1 行 |
| ⑧ | M-4 IP 查询双斜杠修复 | 2 行 |
| ⑨ | L-1 测速进度条修复 | 1 行 |
| ⑩ | L-2 Lucide 加载时序修复 | 1 行（`index.html`） |

### 第三批：安全

| 序号 | 问题 |
|------|------|
| ⑪ | S-1 密钥移入环境变量，`config.json` 加入 `.gitignore` |

---

## 严重程度统计

| 等级 | 数量 |
|------|------|
| 🔴 安全 | 1 |
| 🔴 高 | 5 |
| 🟡 中 | 4 |
| 🟢 低 | 2 |
| **合计** | **12** |