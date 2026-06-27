# CWJ Tools 项目说明

## 文件结构
- index.html - 页面结构，工具面板入口
- style.css - 所有样式，610行
- script.js - 工具逻辑和数据
- search_agent.py - AI Agent脚本，不要修改

## 改样式 → 只改 style.css
## 改工具逻辑 → 只改 script.js
## 改页面结构 → 只改 index.html

## 重要CSS类
- .btn-primary - 主按钮
- .tool-row - 工具列表行
- .tool-row-icon - 工具图标
- .bottom-nav - 底部导航
- .panel - 弹出面板
- .top-bar - 顶部栏


## 🤖 Agent 运行强制规则
1. **工作目录锁定**：永远在 `/data/data/com.termux/files/home/cwj.tools-v2` 下操作，严禁自行猜测或省略 `com.` 前缀。
2. **工具降级**：如果调用自定义文件读取工具失败或警告，立即改用原生的 `cat` 或 `grep` 命令去读取文件。
