# 使用示例

## 基础文件操作

### 1. 读取文件
```bash
# 读取配置文件
read_file config.json

# 读取项目总结
read_file PROJECT_SUMMARY.md
```

### 2. 写入文件
```bash
# 创建新文件
write_file new_file.txt "这是新文件的内容"

# 覆盖写入
write_file existing_file.txt "新的内容"
```

### 3. 追加内容
```bash
# 向文件末尾添加内容
append_file log.txt "新的日志条目"
```

### 4. 搜索文件
```bash
# 在文件中搜索关键词
search_file search_agent.py "class"
```

### 5. 替换内容
```bash
# 精准替换一处内容
replace_in_file config.json "old_value" "new_value"

# 批量替换多处内容
patch_file config.json [
    {"old": "old1", "new": "new1"}    {"old": "old2", "new": "new2"}
]
```

## 命令执行

### 1. 基本命令
```bash
# 列出目录内容
run_command "ls -la"

# 创建目录
run_command "mkdir -p new_directory"

# 查看系统信息
run_command "uname -a"
```

### 2. 复杂命令
```bash
# 管道操作
run_command "ls -la | grep 'py'"

# 重定向输出
run_command "echo 'Hello World' > hello.txt"
```

## 会话保存功能

### 1. 保存会话
```bash
# 基本保存
save

# 带备注保存
save -m "完成项目初始化"

# 查看帮助
save -h
```

### 2. 管理会话
```bash
# 查看所有保存的会话
saves

# 查看特定会话内容
cat sessions/session_20260627_060754.json

# 使用便捷命令查看会话
loadsave session_20260627_060754.json
```

### 3. 安装和配置
```bash
# 运行安装脚本
./install_save.sh

# 手动添加别名到bashrc
echo 'alias save="python save_session.py"' >> ~/.bashrc
source ~/.bashrc
```

## 实际工作流程

### 开发工作流
```bash
# 1. 开始新工作
cd /path/to/project
save -m "开始新项目开发"

# 2. 进行一些操作
# ... 编写代码、运行测试等 ...

# 3. 保存进度
save -m "完成核心功能实现"

# 4. 查看保存的会话
saves

# 5. 恢复工作
# 从保存的会话中查看之前的工作状态
```

### 调试工作流
```bash
# 1. 开始调试
save -m "开始调试问题X"

# 2. 尝试不同的解决方案
# ... 修改代码、测试等 ...

# 3. 保存调试结果
save -m "找到解决方案，问题已修复"

# 4. 清理临时文件
rm -f temp_*.log
```

## 高级技巧

### 1. 批量文件操作
```bash
# 批量读取多个文件
for file in config.json settings.json; do
    echo "=== $file ==="
    read_file "$file"
done
```

### 2. 条件执行
```bash
# 根据文件是否存在执行不同操作
if [ -f "config.json" ]; then
    echo "配置文件存在"
    read_file config.json
else
    echo "配置文件不存在，创建默认配置"
    write_file config.json '{"default": true}'
fi
```

### 3. 错误处理
```bash
# 尝试执行命令，处理可能的错误
if run_command "python script.py"; then
    echo "命令执行成功"
else
    echo "命令执行失败"
fi
```

## 常见问题解决

### 1. 权限问题
```bash
# 给脚本添加执行权限
chmod +x save_session.py
chmod +x save
```

### 2. 路径问题
```bash
# 使用绝对路径
python /full/path/to/save_session.py

# 或者使用相对路径