# CWJ TOOLS V2 — 重构路线图

> 日期：2026-07-07
> 当前版本：v2.0
> 目标版本：v2.5
> 状态：Phase 1 ✅ 完成（分析阶段），等待确认进入 Phase 2

---

## 一、总体时间线

```
Phase 1 (分析)       ████████████████░░░░░░░░░░░░░░░░░░░░  已完工
Phase 2 (CSS清理)    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  待启动
Phase 3 (模块化)     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  待启动
Phase 4 (模板化)     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  待启动
Phase 5 (响应式)     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  待启动
Phase 6 (主题)       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  待启动
Phase 7 (后端)       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  待启动
Phase 8 (测试/性能)  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  待启动
```

---

## 二、Phase 详情

### Phase 1: 分析与规划（✅ 完成）

| 项目 | 说明 |
|---|---|
| **目标** | 完成全面代码审查，制定重构方案 |
| **状态** | ✅ 已完成 |
| **产出** | `PROJECT_REBUILD_PLAN.md`, `DESIGN_SYSTEM.md`, `ROADMAP.md` |
| **收益** | 清晰的改造路线图，风险提前识别 |

---

### Phase 2: CSS 清理与设计系统建立

| 项目 | 说明 |
|---|---|
| **目标** | 消除所有 `!important`，建立可维护的 CSS 架构 |
| **优先级** | 🔴 P0 — 必须立即执行 |
| **涉及文件** | `style.css`, `index.html` |
| **预估工作量** | 1-2 天 |
| **风险等级** | 🟢 低 |

**具体任务**：

1. **删除 `index.html` 内联样式块**（第 10-95 行）
   - 将所有样式合并到 `style.css`
   - 确保删除后视觉效果不变

2. **删除 `style.css` 中的重复定义**（第 470-548 行的二次声明）
   - 保留一份，删除重复项

3. **将当前 CSS 变量升级为设计系统变量**
   | 旧变量 | 新变量 |
   |---|---|
   | `--bg` | `--bg-base` |
   | `--surface` | `--bg-surface` |
   | `--surface-2` / `--surface-3` | `--bg-elevated-1` / `--bg-elevated-2` |
   | `--border` / `--border-2` | `--border-subtle` / `--border-default` |
   | `--text-1` / `--text-2` / `--text-3` | `--text-primary` / `--text-secondary` / `--text-tertiary` |
   | `--accent` | `--accent-primary` |

4. **新增 CSS 变量**（按 DESIGN_SYSTEM.md）
   - 间距变量 `--space-*`
   - 排版变量 `--text-*`
   - 阴影变量 `--shadow-*`
   - 层级变量 `--z-*`

5. **引入 `reset.css`** 部分
   - 将当前 `*{margin:0;padding:0;box-sizing:border-box;...}` 规范化

**验收标准**：
- ✅ `!important` 使用次数为 0
- ✅ 页面视觉效果与重构前完全一致
- ✅ `index.html` 不再包含 `<style>` 块
- ✅ CSS 变量名统一为设计系统规范

---

### Phase 3: JavaScript 模块化

| 项目 | 说明 |
|---|---|
| **目标** | 将单体 `script.js` 拆分为模块化代码 |
| **优先级** | 🔴 P0 — 必须立即执行 |
| **涉及文件** | `script.js` → `src/tools/*.js` + `src/components/*.js` |
| **预估工作量** | 3-5 天 |
| **风险等级** | 🟡 中 |

**具体任务**：

1. **创建目录结构**
   ```
   src/
   ├── app.js              # 应用入口（路由、初始化）
   ├── components/
   │   ├── Panel.js         # 面板组件
   │   ├── Toast.js         # Toast 提示
   │   ├── SearchBar.js     # 搜索组件
   │   └── BottomNav.js     # 底部导航
   ├── tools/
   │   ├── index.js         # 工具注册表
   │   ├── Password.js
   │   ├── QRCodeGen.js
   │   ├── ColorConvert.js
   │   ├── Timestamp.js
   │   ├── HashCalc.js
   │   ├── AES.js
   │   ├── Base64.js
   │   ├── JSONFormatter.js
   │   ├── RegexTester.js
   │   ├── URLCodec.js
   │   ├── AIChat.js
   │   ├── IPQuery.js
   │   ├── HttpCodes.js
   │   └── SpeedTest.js
   ├── services/
   │   ├── ai.js            # AI API 调用
   │   ├── storage.js       # localStorage 封装
   │   └── theme.js         # 主题管理
   └── utils/
       ├── dom.js           # DOM 辅助函数
       ├── clipboard.js     # 剪贴板操作
       └── helpers.js       # 通用工具函数
   ```

2. **拆分策略（无构建工具版本）**
   - 使用 IIFE 模式或全局命名空间（`window.CWJ = {}`）
   - 每个文件通过 `<script>` 按顺序加载
   - 或使用 ES Modules（需确保 `type="module"` 兼容性）

3. **核心模块设计**
   ```javascript
   // 工具注册表模式
   CWJ.registerTool({
     id: 'pwd',
     category: 'util',
     icon: '🔑',
     name: '密码生成',
     desc: '安全随机密码',
     render: () => { /* 返回 DOM 或 HTML */ },
     init: () => { /* 工具打开时的初始化 */ },
     destroy: () => { /* 工具关闭时的清理 */ }
   });
   ```

4. **每个工具模块的接口规范**
   ```javascript
   export default {
     meta: { id, name, icon, ... },  // 元数据
     render(container) {},           // 渲染到容器
     destroy() {},                   // 清理资源
     // 可选生命周期
     onShow() {},
     onHide() {},
   }
   ```

**验收标准**：
- ✅ 所有 14 个工具正常工作
- ✅ `script.js` 不再包含工具逻辑（仅保留入口加载）
- ✅ 每个工具模块 < 100 行
- ✅ 新增工具只需创建新文件 + 注册

---

### Phase 4: 工具 HTML 模板化

| 项目 | 说明 |
|---|---|
| **目标** | 将 `getPanelHTML()` 中的 HTML 字符串迁移为 HTML 模板 |
| **优先级** | 🔴 P0 — 与 Phase 3 并行或紧随其后 |
| **涉及文件** | `index.html` (新增 `<template>` 标签), `src/tools/*.js` |
| **预估工作量** | 2-3 天 |
| **风险等级** | 🟡 中 |

**具体任务**：

1. **在 `index.html` 中添加 `<template>` 标签**
   ```html
   <template id="tpl-pwd">
     <div class="field">
       <label>长度 <span id="pwdLenVal">16</span></label>
       <input type="range" id="pwdLen" min="8" max="32" value="16">
     </div>
     <div class="field">
       <label>
         <input type="checkbox" id="pwdUpper" checked> 大写
         <input type="checkbox" id="pwdNum" checked> 数字
         <input type="checkbox" id="pwdSym"> 符号
       </label>
     </div>
     <div class="result-box" id="pwdResult">点击生成</div>
     <div class="btn-row">
       <button class="btn btn-primary" data-action="generate">生成</button>
       <button class="btn btn-ghost" data-action="copy">复制</button>
     </div>
   </template>
   ```

2. **改用事件委托代替内联 onclick**
   ```html
   <!-- 当前 -->
   <button onclick="genPwd()">生成</button>
   
   <!-- 目标 -->
   <button data-action="generate">生成</button>
   ```

3. **工具模块绑定事件**
   ```javascript
   render(container) {
     const clone = document.getElementById('tpl-pwd').content.cloneNode(true);
     clone.querySelector('[data-action="generate"]').onclick = () => this.genPwd();
     container.appendChild(clone);
   }
   ```

**验收标准**：
- ✅ 所有工具 HTML 不再出现在 JS 字符串中
- ✅ 所有内联 `onclick` 改为 `addEventListener` 或数据属性委托
- ✅ HTML 模板可被编辑器语法高亮

---

### Phase 5: 响应式与桌面端适配

| 项目 | 说明 |
|---|---|
| **目标** | 在桌面端提供优化的布局体验 |
| **优先级** | 🟡 P1 — 重要但非阻塞 |
| **涉及文件** | `style.css`, `index.html` |
| **预估工作量** | 2 天 |
| **风险等级** | 🟢 低-中 |

**具体任务**：

1. **添加断点适配**
   ```css
   /* 桌面端 >= 768px */
   @media (min-width: 768px) {
     .bottom-nav { display: none; }
     .desktop-sidebar { display: flex; }
     .page { padding-bottom: 20px; } /* 去掉手机端底部 nav 预留空间 */
   }
   ```

2. **面板在桌面端居中显示**
   ```css
   @media (min-width: 768px) {
     .panel {
       max-width: 560px;
       border-radius: 22px;  /* 桌面端面板也有顶部圆角，但添加 margin */
       margin-top: 5vh;
       max-height: 85vh;
     }
     .panel-overlay {
       align-items: center;  /* 居中而不是底部弹出 */
     }
   }
   ```

3. **桌面端导航**
   - 左侧侧边栏（可选，或保持顶部导航）
   - 宽屏时工具列表可显示网格布局

**验收标准**：
- ✅ 桌面端面板居中显示，而非从底部弹出
- ✅ 768px 以上屏幕内容充分利用宽度
- ✅ 1024px 以上可考虑双栏布局
- ✅ 移动端体验完全不变

---

### Phase 6: 主题系统完善

| 项目 | 说明 |
|---|---|
| **目标** | 完成 Light 主题，支持明暗切换 |
| **优先级** | 🟡 P1 — 重要但非阻塞 |
| **涉及文件** | `style.css` → `styles/themes/dark.css`, `styles/themes/light.css` |
| **预估工作量** | 1 天 |
| **风险等级** | 🟢 低 |

**具体任务**：

1. **创建主题变量文件**
   - `styles/themes/dark.css`（从当前 CSS 变量迁移）
   - `styles/themes/light.css`（新增）

2. **修复切换逻辑**
   - 确保 `toggleTheme()` 后 CSS 变量生效
   - 确保 `localStorage` 持久化

3. **在设置页面添加主题切换开关**
   - 当前有 `themeToggle` 按钮的 JS 代码但 HTML 中无对应元素
   - 在设置页面增加主题切换行

**验收标准**：
- ✅ 切换明暗主题后所有元素颜色正确
- ✅ 切换状态持久化（刷新后保留）
- ✅ 设置页有主题切换入口

---

### Phase 7: 后端增强

| 项目 | 说明 |
|---|---|
| **目标** | 增强后端能力，提升安全性和可用性 |
| **优先级** | 🟡 P1 — 重要但非阻塞 |
| **涉及文件** | `server.js`, `config.json` |
| **预估工作量** | 2 天 |
| **风险等级** | 🟡 中 |

**具体任务**：

1. **AI API 代理**
   - 后端接收客户端请求，转发到 AI API
   - API key 仅存储在服务端
   - 添加请求验证和速率限制

2. **静态文件优化**
   - 添加 Cache-Control 头
   - 文件压缩支持（gzip）
   - 目录结构优化

3. **健康检查 / 监控**
   - `/api/health` 端点
   - 请求日志
   - 错误追踪

**验收标准**：
- ✅ AI 请求通过后端代理，客户端不暴露 API key
- ✅ 静态文件使用缓存头
- ✅ 添加请求日志

---

### Phase 8: 测试与性能优化

| 项目 | 说明 |
|---|---|
| **目标** | 建立测试体系，优化加载性能 |
| **优先级** | 🟢 P2 — 优化项 |
| **涉及文件** | 新增 `test/` 目录，构建脚本 |
| **预估工作量** | 2-3 天 |
| **风险等级** | 🟢 低 |

**具体任务**：

1. **测试**
   - 核心工具函数单元测试（Password、Hash、Base64、JSON、URL）
   - UI 组件测试（可选）
   - 手动回归测试清单

2. **性能优化**
   - AI 打字效果改为批量追加（每 50ms 追加 3-5 个字符）
   - 延迟加载非首屏工具
   - 使用 `requestIdleCallback` 进行非关键渲染
   - 移除未使用的 CSS 样式

3. **构建流程（可选）**
   - 添加简单的构建脚本（如 `build.sh`）
   - 压缩 CSS/JS
   - 版本号管理

**验收标准**：
- ✅ 核心功能测试覆盖
- ✅ AI 打字效果性能优化
- ✅ 首屏加载时间无明显瓶颈

---

## 三、依赖关系图

```
Phase 1 (分析)
   │
   ▼
Phase 2 (CSS清理) ─────────────────────────────┐
   │                                            │
   ▼                                            │
Phase 3 (JS模块化) ─── Phase 4 (HTML模板化) ────┤
   │                                            │
   ▼                                            ▼
Phase 5 (响应式) ──── Phase 6 (主题完善) ──── 合并验证
   │
   ▼
Phase 7 (后端增强)
   │
   ▼
Phase 8 (测试/性能)
```

- Phase 2 → Phase 3：可顺序执行（推荐）
- Phase 3 ↔ Phase 4：可并行或交叉执行
- Phase 5 ← 依赖 Phase 2 完成
- Phase 6 ← 依赖 Phase 2 完成
- Phase 7：与前端重构并行执行
- Phase 8：收尾阶段

---

## 四、交付标准

### 每个 Phase 完成后需满足

1. **功能完备**：所有现有功能正常
2. **视觉一致**：所有页面视觉效果与重构前一致
3. **无回归**：核心交互无退化
4. **代码清洁**：无死代码、无控制台警告

### 最终交付检查清单

- [ ] 所有 `!important` 已消除
- [ ] `index.html` 无内联样式
- [ ] `script.js` 已拆分为模块
- [ ] 所有工具 HTML 为真实 HTML（非 JS 字符串）
- [ ] 明暗主题均可正常工作
- [ ] 桌面端 768px+ 有适配布局
- [ ] AI 打字效果性能优化
- [ ] 后端代理 AI 请求
- [ ] 核心工具有测试覆盖
- [ ] 构建流程自动化

---

## 五、附录：速查表

| Phase | 名称 | 优先级 | 风险 | 时间 | 主要文件 |
|---|---|---|---|---|---|
| 1 | 分析与规划 | - | 🟢 | 1-2d | 文档 |
| 2 | CSS 清理 | 🔴 P0 | 🟢 | 1-2d | style.css, index.html |
| 3 | JS 模块化 | 🔴 P0 | 🟡 | 3-5d | script.js → src/* |
| 4 | HTML 模板化 | 🔴 P0 | 🟡 | 2-3d | src/tools/* |
| 5 | 响应式 | 🟡 P1 | 🟢 | 2d | style.css |
| 6 | 主题完善 | 🟡 P1 | 🟢 | 1d | themes/ |
| 7 | 后端增强 | 🟡 P1 | 🟡 | 2d | server.js |
| 8 | 测试/性能 | 🟢 P2 | 🟢 | 2-3d | test/, build tool |

---

*等待确认 Phase 1 分析结果，确认后从 Phase 2 开始逐阶段实施。*