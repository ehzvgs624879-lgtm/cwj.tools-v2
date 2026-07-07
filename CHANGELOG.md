# CHANGELOG

## v2.5 — Phase 2: 首页重构 (2026-07-07)

### 🎯 目标
重构首页为商业级 AI SaaS 风格，参考 ChatGPT / Claude / Linear / Vercel / Mineradio 的设计语言，保持原有工具功能完全不变。

### ✨ 新增功能

#### Hero 区域
- **渐变背景**：径向光晕 + 点阵网格背景
- **浮动粒子动画**：6 个随机漂浮粒子，8s 循环动画
- **品牌徽章**：顶部带绿色呼吸脉冲点的版本徽标
- **标题**：超大响应式标题，渐变品牌色强调词
- **CTA 双按钮**：主按钮「浏览全部工具」+ 次按钮「AI 对话」

#### 工具入口布局
- **网格卡片布局**：从列表式改为 2 列网格（桌面端自动扩展为 3/4 列）
- **分类分区**：按 5 大类别分区
- **卡片入场动画**：逐张 fadeIn 上浮动画
- **分类悬停效果**：各类别不同颜色的边框和背景光晕

#### 最近使用栏
- **横向滚动** + hover 上浮 + 清除按钮

#### 动画系统
- `floatParticle`、`pulseDot`、`cardFadeIn`、`msgIn`

### 🎨 设计系统升级
- CSS 变量全面升级（`--bg-base`、`--text-primary`、`--accent-primary` 等）
- 新增间距、排版、阴影、圆角、层级系统
- Light 主题支持
- 移除所有 `!important`

### ✅ 测试结果
- 12/12 项测试 ✓，无控制台错误

---

## v2.6 — Phase 3: AI 对话页面重构 (2026-07-07)

### 🎯 目标
重构 AI 对话页面，达到现代 AI 产品体验标准（参考 ChatGPT / Claude / Gemini）。不改动首页或其他工具页面。

### ✨ 新增功能

#### AI 欢迎空状态
- 品牌图标 + 标题 + 副标题
- 6 个推荐问题卡片，点击自动填入输入框

#### 聊天体验
- 消息分组渲染（用户/AI 标签分离）
- AI 回复流式打字效果 + Markdown 实时渲染
- 三跳圆点思考动画 + 错误状态气泡 + Toast
- 平滑自动滚动

#### Markdown 渲染引擎
- 自研轻量级渲染器（零第三方库）
- 标题 H1/H2/H3、粗体/斜体、有序/无序列表、引用块、表格
- 行内代码 + 代码块语法高亮（关键词/字符串/数字/注释）
- 代码块一键复制按钮
- 链接新窗口打开、XSS 防护

#### 移动端优化
- 输入框自动伸缩、键盘弹起适配、安全区兼容
- SVG 发送按钮（loading 时禁用）

#### localStorage 持久化
- 对话历史自动保存，刷新恢复
- 清空对话恢复欢迎页

### ✅ 测试结果
- 11/12 项 ✓（桌面端 nav 隐藏属预期行为）
- 所有 Markdown 特性测试通过

---

## v2.7 — Phase 4: 工具页面视觉与交互统一 (2026-07-07)

### 🎯 目标
全面提升所有非 AI 工具页面质感，隔离保护 Phase 2/3 成果。

### ✨ 改进内容

#### 工具面板 HTML 重构
- **移除所有 `style="..."` 内联样式**：13 个工具面板全面改为纯 CSS 类驱动
- **新增结构类**：`.panel-section`、`.panel-body`、`.btn-row`、`.btn-row-center`
- **新增语义类**：`.result-box`、`.result-mono`、`.textarea-mono`、`.qr-out`、`.color-preview`
- **新增控件类**：`.checkbox-group`、`.ip-result-box`（hidden 属性）

#### CSS 增强（仅追加，0 覆写）
| 样式 | 用途 |
|---|---|
| `.panel .result-box` | 统一的结果展示盒子 |
| `.panel .field input/textarea/select:focus` | 聚焦时 box-shadow 环 |
| `.panel input[type="range"]` | 美化滑块轨道 + 渐变手柄 |
| `.panel .field select` | 自定义下拉箭头 |
| `.color-preview` | 颜色预览块 |
| `.qr-out` | 二维码输出居中容器（替代 inline style） |
| `.skeleton` / `.skeleton-line` | 骨架屏加载动画 |
| `.result-box.copied` | 复制成功反馈（绿色边框） |
| `.panel-placeholder` | 面板空状态 |

#### 响应式微调
- IP 查询面板：480px 以下 label/value 堆叠
- HTTP 状态码：480px 以下更紧凑
- 网速测试：480px 以下 meta 纵向排列

### ✅ 测试结果
- **16/16 项测试 ✓**
- 所有 13 个工具面板逐个打开 → 全部正常加载
- 首页 14 卡片 → 正确渲染
- 工具列表 14 行 → 正确
- 设置页 5 行 → 正确
- 无内联样式残留、无控制台错误

### 📁 变更文件
| 文件 | 变更类型 |
|---|---|
| `style.css` | 🔄 追加 ~100 行工具面板样式（0 覆写） |
| `script.js` | 🔄 修改 — `getPanelHTML` 全面改用 CSS 类 |
| `CHANGELOG.md` | ✏️ 追加 Phase 4 记录 |

### ⚠️ 说明
- Phase 2 首页和 Phase 3 AI 对话页面未被修改
- 所有 14 个工具功能完好
- 本次仅做视觉统一和代码净化
