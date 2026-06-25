import os
import subprocess
import json
import time
import shutil
from datetime import datetime
from openai import OpenAI

API_KEY = "ark-6aaae18f-0350-4822-bbee-42e2d0655215-c73ec"
BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"
MODEL = "ep-20260625142103-msthn"
WORKDIR = "/data/data/com.termux/files/home/cwj.tools-v2"
BACKUP_DIR = "/data/data/com.termux/files/home/.agent_backups"
LOG_FILE = "/data/data/com.termux/files/home/.agent_log.txt"

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

C = {
    "reset":"\033[0m","red":"\033[91m","green":"\033[92m",
    "yellow":"\033[93m","blue":"\033[94m","cyan":"\033[96m",
    "bold":"\033[1m","dim":"\033[2m","magenta":"\033[95m"
}
def c(text, color): return f"{C.get(color,'')}{text}{C['reset']}"

BLACKLIST = ['rm -rf /','rm -rf ~','chmod 777 /','mkfs','dd if=',':(){ :|:& };:']
GIT_CMDS = ['git push','git commit','git add','git remote set','git config']

def is_dangerous(cmd):
    return any(b in cmd.lower() for b in BLACKLIST)

def needs_confirm(cmd):
    return any(g in cmd.lower() for g in GIT_CMDS)

def get_timeout(cmd):
    if any(x in cmd for x in ['git push','git pull','git clone']): return 60
    if any(x in cmd for x in ['pip install','pkg install','npm install']): return 120
    return 20

def backup(filepath):
    try:
        if os.path.exists(filepath):
            os.makedirs(BACKUP_DIR, exist_ok=True)
            ts = datetime.now().strftime("%m%d_%H%M%S")
            name = os.path.basename(filepath)
            dest = f"{BACKUP_DIR}/{name}.{ts}.bak"
            shutil.copy2(filepath, dest)
            return dest
    except: pass
    return None

def log(msg):
    try:
        with open(LOG_FILE, 'a') as f:
            f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] {msg}\n")
    except: pass

def run_command(command):
    print(c(f"⚙️  {command}", "yellow"))
    if is_dangerous(command):
        return "❌ 危险命令已拒绝"
    if needs_confirm(command):
        confirm = input(c("⚠️  Git操作，确认执行? (y/n): ", "red"))
        if confirm.strip().lower() != 'y':
            return "用户取消"
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=get_timeout(command), cwd=WORKDIR)
        out = (result.stdout + result.stderr)[:3000]
        log(f"CMD: {command[:80]} => {out[:100]}")
        return out
    except subprocess.TimeoutExpired:
        return "命令超时"
    except Exception as e:
        return f"执行失败: {e}"

def read_file(filepath):
    print(c(f"📖 {filepath}", "blue"))
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        if len(content) > 5000:
            return content[:5000] + f"\n...[已截断，共{len(content)}字符]"
        return content
    except Exception as e: return f"读取失败: {e}"

def write_file(filepath, content):
    print(c(f"✏️  {filepath}", "blue"))
    try:
        bak = backup(filepath)
        with open(filepath, 'w') as f: f.write(content)
        log(f"WRITE: {filepath}")
        return f"写入成功{' (已备份)' if bak else ''}: {filepath}"
    except Exception as e: return f"写入失败: {e}"

def append_file(filepath, content):
    print(c(f"➕ {filepath}", "blue"))
    try:
        with open(filepath, 'a') as f: f.write(content)
        log(f"APPEND: {filepath}")
        return f"追加成功: {filepath}"
    except Exception as e: return f"追加失败: {e}"

def replace_in_file(filepath, old_text, new_text):
    print(c(f"🔄 {filepath}", "blue"))
    try:
        bak = backup(filepath)
        with open(filepath, 'r') as f: content = f.read()
        if old_text not in content:
            return "未找到目标文本，替换失败，请用search_file确认内容"
        new_content = content.replace(old_text, new_text, 1)
        with open(filepath, 'w') as f: f.write(new_content)
        log(f"REPLACE: {filepath}")
        return f"替换成功{' (已备份)' if bak else ''}: {filepath}"
    except Exception as e: return f"替换失败: {e}"

def patch_file(filepath, patches):
    print(c(f"🩹 批量替换: {filepath}", "blue"))
    try:
        bak = backup(filepath)
        with open(filepath, 'r') as f: content = f.read()
        count = 0
        for patch in patches:
            old = patch.get('old','')
            new = patch.get('new','')
            if old and old in content:
                content = content.replace(old, new, 1)
                count += 1
        with open(filepath, 'w') as f: f.write(content)
        log(f"PATCH: {filepath} x{count}")
        return f"批量替换完成，成功{count}/{len(patches)}处{' (已备份)' if bak else ''}"
    except Exception as e: return f"批量替换失败: {e}"

def search_file(filepath, keyword):
    print(c(f"🔍 '{keyword}' in {filepath}", "blue"))
    try:
        with open(filepath, 'r') as f: lines = f.readlines()
        results = []
        for i, line in enumerate(lines, 1):
            if keyword.lower() in line.lower():
                start = max(0, i-3)
                end = min(len(lines), i+3)
                ctx = ''.join(f"{j+1}: {lines[j]}" for j in range(start, end))
                results.append(f"第{i}行:\n{ctx}")
        if not results: return "未找到关键词"
        return '\n---\n'.join(results[:5]) + (f"\n(共{len(results)}处匹配)" if len(results)>5 else "")
    except Exception as e: return f"搜索失败: {e}"

def list_dir(path="."):
    print(c(f"📁 {path}", "blue"))
    try:
        full = path if path.startswith('/') else os.path.join(WORKDIR, path)
        result = subprocess.run(f"ls -la {full}", shell=True, capture_output=True, text=True)
        return result.stdout[:2000]
    except Exception as e: return f"失败: {e}"

tools = [
    {"type":"function","function":{"name":"run_command","description":"执行终端命令","parameters":{"type":"object","properties":{"command":{"type":"string"}},"required":["command"]}}},
    {"type":"function","function":{"name":"read_file","description":"读取文件内容","parameters":{"type":"object","properties":{"filepath":{"type":"string"}},"required":["filepath"]}}},
    {"type":"function","function":{"name":"write_file","description":"覆盖写入整个文件","parameters":{"type":"object","properties":{"filepath":{"type":"string"},"content":{"type":"string"}},"required":["filepath","content"]}}},
    {"type":"function","function":{"name":"append_file","description":"追加内容到文件末尾","parameters":{"type":"object","properties":{"filepath":{"type":"string"},"content":{"type":"string"}},"required":["filepath","content"]}}},
    {"type":"function","function":{"name":"replace_in_file","description":"精准替换文件中一处内容，省token首选","parameters":{"type":"object","properties":{"filepath":{"type":"string"},"old_text":{"type":"string"},"new_text":{"type":"string"}},"required":["filepath","old_text","new_text"]}}},
    {"type":"function","function":{"name":"patch_file","description":"批量替换文件多处内容","parameters":{"type":"object","properties":{"filepath":{"type":"string"},"patches":{"type":"array","items":{"type":"object","properties":{"old":{"type":"string"},"new":{"type":"string"}}}}},"required":["filepath","patches"]}}},
    {"type":"function","function":{"name":"search_file","description":"搜索文件中的关键词及上下文","parameters":{"type":"object","properties":{"filepath":{"type":"string"},"keyword":{"type":"string"}},"required":["filepath","keyword"]}}},
    {"type":"function","function":{"name":"list_dir","description":"查看目录文件列表","parameters":{"type":"object","properties":{"path":{"type":"string"}},"required":[]}}}
]

SYSTEM = f"你是Termux程序员Agent。工作目录:{WORKDIR}。改文件优先用replace_in_file或patch_file省token，多处修改用patch_file一次完成。直接执行不询问。"

history = []
total_tokens = 0

def call_model(retry=0):
    try:
        msgs = [{"role":"system","content":SYSTEM}] + history[-8:]
        resp = client.chat.completions.create(model=MODEL, messages=msgs, tools=tools, tool_choice="auto")
        return resp
    except Exception as e:
        if retry < 3:
            print(c(f"⚠️  重试({retry+1}/3)...", "yellow"))
            time.sleep(3)
            return call_model(retry+1)
        raise e

def show_files():
    result = subprocess.run("ls", shell=True, capture_output=True, text=True, cwd=WORKDIR)
    files = result.stdout.strip().split('\n')
    print(c("📁 " + "  ".join(files), "dim"))

print(c("╔══════════════════════════════════════╗", "cyan"))
print(c("║    🚀 豆包 Agent 终极版  quit退出    ║", "bold"))
print(c("╚══════════════════════════════════════╝", "cyan"))
show_files()
print(c("─" * 40, "dim"))

while True:
    try:
        user_input = input(c("\n🧑 ", "cyan") + "吩咐: ")
    except KeyboardInterrupt:
        print(c("\n\n👋 再见！", "cyan")); break
    if user_input.lower() in ['quit','exit','q']: print(c("👋 再见！","cyan")); break
    if not user_input.strip(): continue

    log(f"USER: {user_input[:100]}")
    history.append({"role":"user","content":user_input})
    step = 0
    round_tokens = 0
    start_time = time.time()

    try:
        while True:
            step += 1
            resp = call_model()
            msg = resp.choices[0].message

            if hasattr(resp,'usage') and resp.usage:
                round_tokens += resp.usage.total_tokens
                total_tokens += resp.usage.total_tokens

            if not msg.tool_calls:
                history.append({"role":"assistant","content":msg.content or ""})
                elapsed = round(time.time()-start_time, 1)
                print(c(f"\n🤖 Agent:\n","green") + (msg.content or ""))
                print(c(f"✅ 完成 | ⏱{elapsed}s | 🔢本轮{round_tokens}tok | 📊累计{total_tokens}tok","green"))
                log(f"DONE: {elapsed}s {round_tokens}tok")
                break

            history.append(msg)
            tool_results = []

            for tool in msg.tool_calls:
                args = json.loads(tool.function.arguments)
                name = tool.function.name
                t0 = time.time()
                print(c(f"\n[{step}] {name}","cyan"), end=" ")

                if name == "run_command": res = run_command(args["command"])
                elif name == "read_file": res = read_file(args["filepath"])
                elif name == "write_file": res = write_file(args["filepath"],args["content"])
                elif name == "append_file": res = append_file(args["filepath"],args["content"])
                elif name == "replace_in_file": res = replace_in_file(args["filepath"],args["old_text"],args["new_text"])
                elif name == "patch_file": res = patch_file(args["filepath"],args["patches"])
                elif name == "search_file": res = search_file(args["filepath"],args["keyword"])
                elif name == "list_dir": res = list_dir(args.get("path","."))
                else: res = "未知工具"

                print(c(f"({round(time.time()-t0,1)}s)","dim"))
                print(c(f"↩ {res[:150]}{'...' if len(res)>150 else ''}","dim"))
                tool_results.append({"role":"tool","tool_call_id":tool.id,"content":res})

            history.extend(tool_results)

            if step > 25:
                print(c("⚠️ 步骤过多自动停止","red")); break

    except Exception as e:
        print(c(f"\n❌ 报错: {e}","red"))
        if history and history[-1]["role"] == "user":
            history.pop()
