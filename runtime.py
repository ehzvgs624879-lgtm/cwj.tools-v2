#!/usr/bin/env python3
"""CLD Runtime Agent"""
import json, os, sys, time, subprocess, re
from openai import OpenAI

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
with open(CONFIG_PATH) as f:
    cfg = json.load(f)
profile = cfg["profiles"][cfg["active_profile"]]
client = OpenAI(api_key=profile.get("api_key",""), base_url=profile.get("base_url",""))
MODEL = profile["model"]
WORKDIR = os.path.dirname(os.path.abspath(__file__))

MAX_FIX_ROUNDS = 5
COMMAND_TIMEOUT = 30

def read_file(path):
    try:
        with open(path, 'r') as f:
            return f.read()
    except Exception as e:
        return f"[ERROR] 读取失败: {e}"

def write_file(path, content):
    try:
        with open(path, 'w') as f:
            f.write(content)
        return "写入成功"
    except Exception as e:
        return f"[ERROR] 写入失败: {e}"

def run_cmd(cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True,
                                timeout=COMMAND_TIMEOUT, cwd=WORKDIR)
        out = (result.stdout + result.stderr).strip()
        return out if out else "(无输出)"
    except subprocess.TimeoutExpired:
        return "[ERROR] 命令超时"
    except Exception as e:
        return f"[ERROR] 执行失败: {e}"

def apply_patch(path, old, new):
    try:
        content = read_file(path)
        if content.startswith("[ERROR]"):
            return content
        if old not in content:
            return f"[ERROR] 未找到目标代码: {old[:50]}..."
        new_content = content.replace(old, new, 1)
        return write_file(path, new_content)
    except Exception as e:
        return f"[ERROR] 修补失败: {e}"

SYSTEM_PROMPT = '''你是 CLD Runtime Agent，运行在 Termux 手机上。
你必须严格返回 JSON 格式，不要返回任何其他文字。
重要：不要返回 {"action": null}，必须返回有效的工具名称。
当你需要创建文件时，返回：
{"action": "write_file", "args": {"path": "文件名", "content": "文件内容"}}
当你需要执行命令时，返回：
{"action": "run_cmd", "args": {"cmd": "终端命令"}}
当你需要修复文件时，返回：
{"action": "apply_patch", "args": {"path": "文件名", "old": "要替换的代码", "new": "替换后的代码"}}
当任务最终完成时，返回：
{"action": "done", "reply": "完成信息"}
你可以使用以下工具完成任务：
- read_file(path) → 读取文件内容
- write_file(path, content) → 写入文件（覆盖）
- run_cmd(cmd) → 执行终端命令
- apply_patch(path, old, new) → 精准替换文件中的代码片段

当工具执行失败时，你会收到类似 "[ERROR] ..." 的反馈。
请分析错误原因，然后使用 apply_patch 或其他工具修复问题。
如果无法修复，请向用户解释原因。

你必须返回 JSON 格式的响应：
{"action": "工具名", "args": {"参数": "值"}}
或者任务完成时返回：
{"action": "done", "reply": "最终回复"}'''

def call_llm(messages):
    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[{"role":"system","content":SYSTEM_PROMPT}] + messages,
            temperature=0.2)
        text = resp.choices[0].message.content.strip()
        # 尝试匹配完整的 JSON 对象
        match = re.search(r'\{[^{}]*\}', text)
        if match:
            try:
                return json.loads(match.group())
            except:
                pass
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end])
            except:
                pass
        return {"action":"done","reply":text}
    except Exception as e:
        return {"action":"done","reply":f"LLM 调用失败: {e}"}

def execute_action(action):
    name = action.get("action")
    args = action.get("args", {})
    if name == "read_file":
        return read_file(args.get("path",""))
    elif name == "write_file":
        return write_file(args.get("path",""), args.get("content",""))
    elif name == "run_cmd":
        return run_cmd(args.get("cmd",""))
    elif name == "apply_patch":
        return apply_patch(args.get("path",""), args.get("old",""), args.get("new",""))
    else:
        return f"[ERROR] 未知工具: {name}"

def run_task(user_task):
    messages = [{"role":"user","content":user_task}]
    last_error = ""
    for round_num in range(1, MAX_FIX_ROUNDS + 1):
        print(f"\n{'='*50}\n🔧 第 {round_num}/{MAX_FIX_ROUNDS} 轮")
        action = call_llm(messages)
        name = action.get("action")
        if name == "done":
            print(f"✅ 完成：{action.get('reply','')}")
            return True
        print(f"⚙️  调用工具：{name}")
        result = execute_action(action)
        if isinstance(result, str) and result.startswith("[ERROR]"):
            if result == last_error:
                print(f"❌ 相同错误重复，停止修复：{result}")
                return False
            last_error = result
            print(f"⚠️  错误：{result}")
            messages.append({"role":"tool","content":result})
            messages.append({"role":"user","content":f"上一步失败：{result}。请修复。"})
            continue
        else:
            print(f"✅ 成功：{result[:200]}")
            messages.append({"role":"tool","content":result})
            messages.append({"role":"user","content":"上一步已成功，请继续。"})
            continue
    print("❌ 超过最大修复轮次")
    return False

def main():
    print("=" * 50)
    print("🚀 CLD Runtime Agent 启动")
    print(f"📁 工作目录：{WORKDIR}")
    print(f"🧠 模型：{MODEL}")
    print("输入 quit 退出，输入 clear 清屏")
    print("=" * 50)
    while True:
        try:
            task = input("\n📋 请输入任务：")
        except KeyboardInterrupt:
            print("\n👋 再见！")
            break
        if task.lower() == 'quit':
            print("👋 再见！")
            break
        if task.lower() == 'clear':
            os.system('clear')
            continue
        if not task.strip():
            continue
        run_task(task)

if __name__ == "__main__":
    main()
