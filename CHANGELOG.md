# CHANGELOG

## v2.5 — Phase 2: 首页重构 (2026-07-07)

### 🎯 目标
重构首页为商业级 AI SaaS 风格，参考 ChatGPT / Claude / Linear / Vercel / Mineradio 的设计语言，保持原有工具功能完全不变。

### ✨ 新增功能

#### Hero 区域
- **渐变背景**：径向光晕 + 点阵网格背景，营造科技感纵深
- **浮动粒子动画**：6 个随机漂浮粒子，8s 循环动画，增加页面活力
- **品牌徽章**：顶部带绿色呼吸脉冲点的版本徽标（"v2.5 — 全新设计"）
- **标题**：超大响应式标题（`clamp(28px, 6.5vw, 52px)`），渐变品牌色强调词
- **副标题**：简洁描述工具集核心价值
- **CTA 双按钮**：
  - 主按钮「浏览全部工具」— 渐变背景 + 扫光动画 + hover 抬起
  - 次按钮「AI 对话」— 毛玻璃效果 + hover 边框变品牌色

#### 工具入口布局
- **网格卡片布局**：从列表式改为 2 列网格（桌面端自动扩展为 3/4 列）
- **分类分区**：按 5 大类别分区显示（实用工具/加密安全/开发工具/AI 助手/网络工具）
- **卡片入场动画**：逐张 fadeIn 上浮动画，`cardFadeIn 0.5s spring` 缓动
- **分类悬停效果**：每个类别 hover 时显示不同颜色的边框和背景光晕
- **底部工具计数**：显示 "14 个工具"

#### 最近使用栏
- **横向滚动**：保留原有水平滚动 + 新增 hover 上浮效果
- **清除按钮**：新增「清除记录」按钮，hover 变红色

#### 动画系统
- `floatParticle` — 粒子漂浮动画
- `pulseDot` — 徽章脉冲点
- `cardFadeIn` — 卡片入场动画
- `msgIn` — 消息气泡出现动画

### 🎨 设计系统升级

#### CSS 变量全面升级
| 旧变量 | 新变量 |
|---|---|
| `--bg` | `--bg-base` |
| `--surface` | `--bg-surface` |
| `--surface-2` | `--bg-elevated` |
| `--surface-3` | `--bg-elevated-2` |
| `--border` | `--border-subtle` |
| `--border-2` | `--border-default` |
| `--text-1/2/3` | `--text-primary/secondary/tertiary` |
| `--accent` | `--accent-primary` |

#### 新增变量体系
- **间距系统**：`--space-1` ~ `--space-12`
- **排版系统**：`--text-xs` ~ `--text-4xl` + `--font-display/body/mono`
- **阴影系统**：`--shadow-sm/md/lg/xl`
- **层级系统**：`--z-nav/panel/toast/modal`
- **圆角系统**：`--radius-sm/md/lg/xl/full`
- **品牌渐变**：`--accent-gradient` (indigo → purple → cyan)

#### Light 主题
- 完整新增 Light 主题变量，支持 `data-theme="light"`
- 明暗切换功能保留（localStorage + 按钮切换）

### 🔧 代码质量
- **移除所有 `!important`**：内联样式块全部迁移到 `style.css`
- **移除重复 CSS**：合并了 .hero-banner / .quick-grid / .recent-card 的重复定义
- **HTML 内联样式清理**：`<style>` 块已完全删除
- **桌面端响应式**：480px 以上 3 列网格，768px 以上 4 列网格 + 面板居中 + 底部导航隐藏

### ✅ 测试结果
- Playwright 自动化测试全部通过：12/12 项测试 ✓
- 移动端 (390x844)：无控制台错误，全部元素正常
- 桌面端 (1280x800)：无控制台错误，响应式布局正常
- CTA 按钮点击可正确跳转到工具页面

### 📁 变更文件
| 文件 | 变更类型 |
|---|---|
| `style.css` | 🔄 完全重写 — 797 行 → 全新 Design System |
| `index.html` | 🔄 完全重写 — 首页 Hero + 网格工具布局 |
| `script.js` | 🔄 更新 — renderHome/renderRecent 改用网格布局 |
| `CHANGELOG.md` | ✨ 新增 — 本文件 |

### ⚠️ 说明
- 工具面板 (Panel)、AI 全屏对话、Tools 页、Settings 页的功能和样式保持不变
- 所有 14 个工具的完整功能均被保留
- 尚未 git commit 和 push，等待确认后执行

## v2.6 — Phase 3: AI 对话页面重构 (2026-07-07)

### 🎯 目标
重构 AI 对话页面，达到现代 AI 产品体验标准（参考 ChatGPT / Claude / Gemini）。不改动首页或其他工具页面。

### ✨ 新增功能

#### AI 欢迎空状态
- **全新欢迎界面**：AI 品牌图标 + 标题 + 副标题，暗色高级视觉
- **推荐问题模块**：6 个卡片式推荐问题，点击自动填入输入框

#### 聊天体验优化
- **消息气泡优化**：用户消息和 AI 消息分组显示，带标签区分
- **AI 回复流式打字效果**：逐字累积 + Markdown 实时渲染
- **平滑滚动**：每条新消息自动滚到底部
- **加载状态**：AI 思考中动画（三个跳动圆点）
- **错误状态**：红色错误气泡 + Toast 提示

#### Markdown 渲染引擎
- **轻量级自研渲染器**：无需第三方库
- **标题**：H1 / H2 / H3
- **粗体 / 斜体**：`**` 和 `*` 支持
- **列表**：有序和无序列表
- **引用块**：`> ` 引用样式
- **行内代码**：`code` 高亮
- **代码块**：`` ``` `` 代码块，语法关键词高亮 + 一键复制按钮
- **链接**：`[text](url)` 格式，新窗口打开
- **表格**：Markdown 表格渲染
- **XSS 防护**：所有内容经过 `escapeHtml` 转义

#### 代码体验
- **代码块美化**：深色背景 + 圆角边框
- **语法关键词高亮**：函数名、字符串、数字、注释高亮
- **一键复制**：代码块顶部右侧复制按钮，复制后提示

#### 移动端优化
- **输入框自动伸缩**：随内容动态调整高度（最大 150px）
- **键盘弹起适配**：`env(safe-area-inset-bottom)` 支持
- **安全区适配**：`padding-bottom` 适配底部安全区
- **发送按钮**：SVG 图标发送按钮，loading 时禁用

#### localStorage 持久化
- **对话历史保存**：每条消息自动保存到 localStorage
- **页面刷新恢复**：重新打开 AI 页面自动恢复最近对话
- **清空对话**：「清空」按钮清空全部，恢复欢迎页

### 🎨 CSS 升级（AI 专属）

| 新增样式 | 用途 |
|---|---|
| `.ai-fullscreen-chat .msg-group` | 消息分组容器 |
| `.ai-msg-bubble` | Markdown 渲染消息体 |
| `.ai-thinking` / `.ai-thinking-dot` | 三跳点思考动画 |
| `.ai-header-icon` | 品牌图标 |
| `.ai-header-actions` / `.ai-header-btn` | 操作按钮区 |
| `.ai-send-btn` | SVG 发送按钮 |
| `.ai-suggestions` / `.ai-suggestion` | 推荐问题卡片 |
| `.ai-welcome` / `.ai-welcome-title` / `.ai-welcome-sub` | 欢迎状态 |
| `.ai-msg-bubble .hl-kw/str/num/com` | 代码语法高亮 |
| `.ai-msg-bubble .code-header/code-lang/code-copy-btn` | 代码块 UI |
| `.ai-msg-bubble table/th/td` | Markdown 表格样式 |
| `.ai-msg-bubble blockquote` | 引用块样式 |
| `.error-msg` | 错误消息样式 |

### 📁 变更文件
| 文件 | 变更类型 |
|---|---|
| `index.html` | 🔄 修改 — AI 页面 HTML 完全重写（新头部 + 输入区 + 欢迎模板） |
| `style.css` | 🔄 修改 — 新增 ~150 行 AI 专属样式（保留原有基础不变） |
| `script.js` | 🔄 修改 — 新增 Markdown 渲染器、消息渲染、推荐问题、流式输出 |
| `CHANGELOG.md` | ✏️ 更新 — 追加 Phase 3 记录 |

### ✅ 测试结果
- Playwright 自动化测试通过：11/12 项 ✓
- 所有 Markdown 特性测试通过（标题/粗体/列表/引用/代码/代码块/链接）
- 欢迎页面元素完整（图标、标题、6 个推荐问题）
- 输入框自动填充正常
- CSS 动画定义完整
- 唯一失败项：桌面端底部导航隐藏后的点击（属预期行为）
