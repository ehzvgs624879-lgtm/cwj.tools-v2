#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CWJ Agent V3.2 — 最终修复版"""
import sys, os, subprocess, json, time, shutil, threading, re
from datetime import datetime
from openai import OpenAI

CONFIG_PATH = "/data/data/com.termux/files/home/cwj.tools-v2/config.json"
with open(CONFIG_PATH) as f:
    cfg = json.load(f)
profile = cfg["profiles"][cfg["active_profile"]]
API_KEY = profile.get("api_key", "")
BASE_URL = profile.get("base_url", "https://ark.cn-beijing.volces.com/api/v3")
MODEL = profile["model"]
WORKDIR = "/data/data/com.termux/files/home/cwj.tools-v2"
BACKUP_DIR = os.path.join(os.path.expanduser("~"), ".agent_backups")
LOG_FILE = os.path.join(os.path.expanduser("~"), ".agent_log.txt")
PREFS_FILE = os.path.join(os.path.expanduser("~"), ".agent_prefs.json")
ACTION_STACK_FILE = os.path.join(os.path.expanduser("~"), ".agent_action_stack.json")
SESSION_DIR = os.path.join(os.path.expanduser("~"), ".agent_sessions")
SESSION_FILE = os.path.join(SESSION_DIR, "current_session.json")

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

C = {"reset":"\033[0m","red":"\033[91m","green":"\033[92m","yellow":"\033[93m",
     "blue":"\033[94m","cyan":"\033[96m","bold":"\033[1m","dim":"\033[2m",
     "magenta":"\033[95m","white":"\033[97m"}
def c(text, color): return f"{C.get(color,'')}{text}{C['reset']}"

SPINNER_FRAMES = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"]
SQUARE_FRAMES = ["🟦","🟪","🟫","🟥","🟧","🟨","🟩"]

total_tokens = 0

class Spinner:
    def __init__(self, msg=""):
        self.msg = msg
        self.running = False
        self.thread = None
        self.i = 0
        self.si = 0
    def _spin(self):
        while self.running:
            sq = SQUARE_FRAMES[self.si % len(SQUARE_FRAMES)]
            sp = SPINNER_FRAMES[self.i % len(SPINNER_FRAMES)]
            tok_info = f"  {c(f'📊 {total_tokens}t', 'dim')}" if total_tokens else ""
            sys.stdout.write(f"\r{sq} {c(sp, 'cyan')} {c(self.msg, 'dim')}{tok_info}   ")
            sys.stdout.flush()
            self.i += 1
            self.si += 1
            time.sleep(0.1)
    def start(self, msg=""):
        if msg: self.msg = msg
        self.running = True
        self.thread = threading.Thread(target=self._spin, daemon=True)
        self.thread.start()
    def stop(self):
        self.running = False
        if self.thread: self.thread.join(timeout=0.5)
        sys.stdout.write("\r" + " " * 70 + "\r")
        sys.stdout.flush()

spinner = Spinner()
BLACKLIST = ['rm -rf /','rm -rf ~','chmod 777 /','mkfs','dd if=',':(){ :|:& };:']
GIT_CMDS = ['git push','git commit','git add','git remote set','git config']
current_max_tokens = 400
complex_mode = False
disable_truncation = False
max_steps = 50
last_output_length = 0
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
            dest = os.path.join(BACKUP_DIR, f"{name}.{ts}.bak")
            shutil.copy2(filepath, dest)
            return dest
    except: pass
    return None

def push_action(original_path, backup_path):
    try:
        stack = []
        if os.path.exists(ACTION_STACK_FILE):
            with open(ACTION_STACK_FILE, 'r') as f: stack = json.load(f)
        stack.append({"time":datetime.now().isoformat(), "file":original_path, "backup":backup_path})
        with open(ACTION_STACK_FILE, 'w') as f: json.dump(stack, f, indent=2)
    except: pass

def undo_last_action():
    if not os.path.exists(ACTION_STACK_FILE): return "没有可回滚的操作。"
    try:
        with open(ACTION_STACK_FILE, 'r') as f: stack = json.load(f)
        if not stack: return "操作栈为空。"
        last = stack.pop()
        if os.path.exists(last["backup"]):
            shutil.copy2(last["backup"], last["file"])
            os.remove(last["backup"])
        else:
            return f"备份文件 {last['backup']} 不存在，无法回滚。"
        with open(ACTION_STACK_FILE, 'w') as f: json.dump(stack, f, indent=2)
        return f"已回滚对 {last['file']} 的修改。"
    except Exception as e: return f"回滚失败: {e}"

def load_preferences():
    defaults = {"language":"python","code_style":"pep8","logging":"logging","comments":"english","indent":4,"extra_notes":""}
    if os.path.exists(PREFS_FILE):
        try:
            with open(PREFS_FILE, 'r') as f: prefs = json.load(f)
            for k,v in defaults.items():
                if k not in prefs: prefs[k] = v
            return prefs
        except: return defaults
    return defaults

def save_preferences(prefs):
    try:
        with open(PREFS_FILE, 'w') as f: json.dump(prefs, f, indent=2)
    except: pass

def log(msg):
    try:
        with open(LOG_FILE, 'a') as f: f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] {msg}\n")
    except: pass

def save_session(history, conversation_messages, metadata=None):
    try:
        os.makedirs(SESSION_DIR, exist_ok=True)
        data = {"history":history, "conversation_messages":conversation_messages, "metadata":metadata or {}, "saved_at":datetime.now().isoformat()}
        with open(SESSION_FILE, 'w') as f: json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e: print(f"  ⚠️  会话保存失败: {e}")

def load_session():
    if os.path.exists(SESSION_FILE):
        try:
            with open(SESSION_FILE, 'r') as f: data = json.load(f)
            return data.get("history",[]), data.get("conversation_messages",[]), data.get("metadata",{})
        except: pass
    return [], [], {}

def clear_session():
    if os.path.exists(SESSION_FILE):
        os.remove(SESSION_FILE)
        return "会话已清除。"
    return "没有已保存的会话。"
_last_tool = ""
_read_count = {}
def print_tool(icon, name, detail="", color="cyan"):
    print(f"  {c('✓', 'green')} {c(icon + ' ' + name, color)} {c(detail, 'dim')}")

def run_command(command):
    print(f"  {c('⚙', 'yellow')}  {c(command, 'yellow')}")
    if is_dangerous(command):
        print(f"  {c('✗', 'red')} 危险命令已拒绝")
        return "❌ 危险命令已拒绝"
    if needs_confirm(command):
        confirm = input(f"  {c('⚠', 'red')}  Git操作，确认执行? {c('(y/n)', 'dim')}: ")
        if confirm.strip().lower() != 'y': return "用户取消"
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True,
                                timeout=get_timeout(command), cwd=WORKDIR)
        out = (result.stdout + result.stderr)[:3000]
        log(f"CMD: {command[:80]} => {out[:100]}")
        return out
    except subprocess.TimeoutExpired: return "命令超时"
    except Exception as e: return f"执行失败: {e}"

def read_file(filepath):
    global _last_tool
    skip_check = any(x in filepath for x in ["config.json","project_scan.py","agent_history",".agent_prefs.json"])
    if not skip_check and _last_tool != "search_file":
        return "[警告] 请先用search_file定位目标内容再read_file"
    _last_tool = "read_file"
    _read_count[filepath] = _read_count.get(filepath,0)+1
    print_tool("📖", "ReadFile", filepath, "blue")
    try:
        with open(filepath, 'r') as f: content = f.read()
        if len(content) > 5000: return content[:5000] + f"\n...[已截断，共{len(content)}字符]"
        return content
    except Exception as e: return f"读取失败: {e}"

def write_file(filepath, content):
    print_tool("✏️", "WriteFile", filepath, "blue")
    try:
        bak = backup(filepath)
        with open(filepath, 'w') as f: f.write(content)
        log(f"WRITE: {filepath}")
        if bak: push_action(filepath, bak)
        return f"写入成功{' (已备份)' if bak else ''}: {filepath}"
    except Exception as e: return f"写入失败: {e}"

def append_file(filepath, content):
    print_tool("➕", "AppendFile", filepath, "blue")
    try:
        bak = backup(filepath)
        with open(filepath, 'a') as f: f.write(content)
        log(f"APPEND: {filepath}")
        if bak: push_action(filepath, bak)
        return f"追加成功: {filepath}"
    except Exception as e: return f"追加失败: {e}"

def replace_in_file(filepath, old_text, new_text):
    print_tool("🔄", "ReplaceInFile", filepath, "blue")
    try:
        bak = backup(filepath)
        with open(filepath, 'r') as f: content = f.read()
        if old_text not in content: return "未找到目标文本，替换失败"
        new_content = content.replace(old_text, new_text, 1)
        with open(filepath, 'w') as f: f.write(new_content)
        log(f"REPLACE: {filepath}")
        if bak: push_action(filepath, bak)
        return f"替换成功{' (已备份)' if bak else ''}: {filepath}"
    except Exception as e: return f"替换失败: {e}"

def patch_file(filepath, patches):
    print_tool("🩹", "PatchFile", filepath, "blue")
    try:
        bak = backup(filepath)
        with open(filepath, 'r') as f: content = f.read()
        count = 0
        for p in patches:
            old = p.get('old','')
            new = p.get('new','')
            if old and old in content:
                content = content.replace(old, new, 1)
                count += 1
        with open(filepath, 'w') as f: f.write(content)
        log(f"PATCH: {filepath} x{count}")
        if bak: push_action(filepath, bak)
        return f"批量替换完成 {count}/{len(patches)}处{' (已备份)' if bak else ''}"
    except Exception as e: return f"批量替换失败: {e}"

def search_file(filepath, keyword):
    global _last_tool
    _last_tool = "search_file"
    print_tool("🔍", "SearchFile", f"'{keyword}' in {filepath}", "blue")
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
        return '\n---\n'.join(results[:5]) + (f"\n(共{len(results)}处)" if len(results)>5 else "")
    except Exception as e: return f"搜索失败: {e}"

_list_dir_cache = {}
def list_dir(path="."):
    global _list_dir_cache
    try:
        full = path if path.startswith("/") else os.path.join(WORKDIR, path)
        if full in _list_dir_cache:
            print_tool("📂", "ListDir", path+" [缓存]", "blue")
            return _list_dir_cache[full]
        print_tool("📂", "ListDir", path, "blue")
        result = subprocess.run(f"ls -la {full}", shell=True, capture_output=True, text=True)
        _list_dir_cache[full] = result.stdout[:2000]
        return result.stdout[:2000]
    except Exception as e: return f"失败: {e}"

def preview_command(cmd):
    if is_dangerous(cmd): return "🚫 危险命令，已被阻止执行。"
    if cmd.strip().startswith("rm"): return "⚠️ 此命令将删除文件或目录。"
    if cmd.strip().startswith("git push"): return "📤 将本地提交推送到远程仓库。"
    if cmd.strip().startswith("git commit"): return "💾 创建一个新提交，包含暂存区的更改。"
    return f"💡 将执行命令: {cmd}"
def generate_dynamic_system_prompt():
    base = (
        f"你是Termux全能编程助手，工作目录：{WORKDIR}。\n"
        "核心规则：\n"
        "1. 直接使用合适的工具完成任务。\n"
        "2. 如果某步失败，尝试另一种方式，不要反复重试。\n"
        "3. 修改后自动备份，可回滚。\n"
        "4. 安全第一：危险命令需确认。\n"
    )
    return base.strip()

def summarize_context(messages, max_summary_tokens=150):
    text_parts = []
    for m in messages:
        if isinstance(m, dict) and m.get("content"):
            text_parts.append(f"{m['role']}: {m['content']}")
    if not text_parts: return None
    conversation = "\n".join(text_parts[-10:])
    prompt = f"请将以下对话压缩为一段简洁的摘要，保留任务目标、当前进度、关键文件列表。最多{max_summary_tokens}字：\n\n{conversation}"
    try:
        resp = client.chat.completions.create(
            model=MODEL, messages=[{"role":"user","content":prompt}],
            max_tokens=max_summary_tokens, temperature=0.3)
        summary = resp.choices[0].message.content.strip()
        return summary if summary and len(summary) >= 5 else None
    except: return None

def smart_truncate_tool_result(tool_name, raw_result):
    if disable_truncation: return raw_result[:10000] if len(raw_result) > 10000 else raw_result
    if complex_mode: return raw_result[:2000]
    if tool_name == "read_file":
        lines = raw_result.splitlines()
        if len(lines) <= 100: return raw_result
        head = "\n".join(lines[:50])
        tail = "\n".join(lines[-20:])
        return f"{head}\n... [中间省略，文件共 {len(lines)} 行] ...\n{tail}"
    elif tool_name == "run_command":
        if len(raw_result) > 500:
            head = raw_result[:300]
            tail = raw_result[-100:] if len(raw_result) > 100 else ""
            return f"{head}\n... [输出总长 {len(raw_result)} 字符，已截断] ...\n{tail}"
        else: return raw_result
    else: return raw_result

def call_model(messages):
    global current_max_tokens, last_output_length, total_tokens
    tools = [
        {"type":"function","function":{"name":"run_command","description":"执行终端命令","parameters":{"type":"object","properties":{"command":{"type":"string"}},"required":["command"]}}},
        {"type":"function","function":{"name":"read_file","description":"读取文件内容","parameters":{"type":"object","properties":{"filepath":{"type":"string"}},"required":["filepath"]}}},
        {"type":"function","function":{"name":"write_file","description":"覆盖写入整个文件","parameters":{"type":"object","properties":{"filepath":{"type":"string"},"content":{"type":"string"}},"required":["filepath","content"]}}},
        {"type":"function","function":{"name":"append_file","description":"追加内容到文件末尾","parameters":{"type":"object","properties":{"filepath":{"type":"string"},"content":{"type":"string"}},"required":["filepath","content"]}}},
        {"type":"function","function":{"name":"replace_in_file","description":"精准替换文件中一处内容","parameters":{"type":"object","properties":{"filepath":{"type":"string"},"old_text":{"type":"string"},"new_text":{"type":"string"}},"required":["filepath","old_text","new_text"]}}},
        {"type":"function","function":{"name":"patch_file","description":"批量替换文件多处内容","parameters":{"type":"object","properties":{"filepath":{"type":"string"},"patches":{"type":"array","items":{"type":"object","properties":{"old":{"type":"string"},"new":{"type":"string"}}}}},"required":["filepath","patches"]}}},
        {"type":"function","function":{"name":"search_file","description":"搜索文件中的关键词及上下文","parameters":{"type":"object","properties":{"filepath":{"type":"string"},"keyword":{"type":"string"}},"required":["filepath","keyword"]}}},
        {"type":"function","function":{"name":"list_dir","description":"查看目录文件列表","parameters":{"type":"object","properties":{"path":{"type":"string"}},"required":["path"]}}}
    ]
    try:
        resp = client.chat.completions.create(
            model=MODEL, messages=messages, tools=tools,
            tool_choice="auto", max_tokens=current_max_tokens, temperature=0.2)
    except Exception:
        time.sleep(1)
        resp = client.chat.completions.create(
            model=MODEL, messages=messages, tools=tools,
            tool_choice="auto", max_tokens=current_max_tokens, temperature=0.2)
    if hasattr(resp, 'usage'):
        last_output_length = resp.usage.completion_tokens
        total_tokens += resp.usage.total_tokens
    raw_msg = resp.choices[0].message
    tcs = raw_msg.tool_calls or []
    resp.msg_dict = {
        "role": "assistant",
        "content": raw_msg.content,
        "tool_calls": [{"id": t.id, "type": "function", "function": {"name": t.function.name, "arguments": t.function.arguments}} for t in tcs]
    }
    return resp

def adjust_dynamic_params(output_len):
    global current_max_tokens
    if output_len >= current_max_tokens - 20:
        if current_max_tokens < 800: current_max_tokens = 800
        elif current_max_tokens < 1200: current_max_tokens = 1200
    elif output_len < current_max_tokens * 0.6 and current_max_tokens > 400:
        if current_max_tokens == 800: current_max_tokens = 400
        elif current_max_tokens == 1200: current_max_tokens = 800
def show_files():
    try:
        r = subprocess.run("ls", shell=True, capture_output=True, text=True, cwd=WORKDIR)
        files = r.stdout.strip().split('\n')
        print(c("  workspace (" + WORKDIR + ")", "dim"))
        print(c("  " + "  ".join(files), "dim"))
    except: pass

def print_banner():
    now = datetime.now().strftime("%H:%M")
    print()
    print(c("  🟦","blue") + c("🟪","magenta") + c("🟩","green") + "  " + c("CWJ Agent V3.2","cyan"))
    print(c("  Authenticated with doubao-api-key","dim") + "  " + c("/help","cyan"))
    print()
    print(c("  命令:","dim"))
    print(c("  /detail /normal /complex /simple  |  切换模式","dim"))
    print(c("  /undo /prefs /save /resume /clear_session","dim"))
    print(c("  /models 查看模型 | /models delete 删除模型","dim"))
    print(c("  quit 退出  |  Ctrl+C 强制退出","dim"))
    try:
        import importlib.util as iu
        spec = iu.spec_from_file_location("project_scan", os.path.join(WORKDIR, "project_scan.py"))
        if spec and spec.loader:
            ps = iu.module_from_spec(spec)
            spec.loader.exec_module(ps)
            info = ps.scan_project(WORKDIR)
            print()
            print(c("  📁 " + os.path.basename(WORKDIR), "cyan") +
                  c("  " + " ".join(info.get("types", [])), "dim") +
                  c("  " + str(len(info.get("files", []))) + " 文件", "dim"))
    except: pass
    show_files()
    print()
    print(c("  " + "─" * 45, "dim"))

def typewriter(text, delay=0.01):
    for ch in text:
        sys.stdout.write(ch); sys.stdout.flush()
        time.sleep(delay)
    print()

def learn_from_feedback(user_input, assistant_reply):
    patterns = {"language": r"用(\w+)语言","code_style": r"使用(\w+)风格","comments": r"(英文|中文)注释","indent": r"缩进(\d)个空格"}
    prefs = load_preferences()
    updated = False
    for key, pat in patterns.items():
        m = re.search(pat, user_input)
        if m:
            val = m.group(1)
            if key == "indent": val = int(val)
            prefs[key] = val
            updated = True
    if updated:
        save_preferences(prefs)
        print(c("  🧠 偏好已更新", "green"))

def log_msg(msg):
    try:
        with open(os.path.join(os.path.expanduser("~"), ".agent_log.txt"), 'a') as f:
            f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] {msg}\n")
    except: pass

def main():
    global current_max_tokens, complex_mode, disable_truncation, max_steps, total_tokens
    print_banner()
    BASE_SYSTEM = generate_dynamic_system_prompt()
    history, conversation_messages, session_resumed = [], [], False
    spinner = Spinner()
    try:
        _cfg = json.load(open(CONFIG_PATH))
        _profile = _cfg["profiles"][_cfg["active_profile"]]
        _current_model = _profile.get("model_name", _profile.get("model", MODEL))
    except:
        _current_model = MODEL

    while True:
        try:
            user_input = input(c(f"\n{_current_model} > ", "bold"))
        except KeyboardInterrupt:
            print(c("\n\n  👋 再见！", "dim")); break
        if user_input.lower() in ['quit','exit','q']:
            print(c("  👋 再见！", "dim")); break
        if not user_input.strip(): continue

        if user_input.startswith("/"):
            cmd = user_input.strip().lower()
            if cmd == "/detail":
                complex_mode = True; disable_truncation = True; current_max_tokens = 1200; max_steps = 50
                print(c("  🔍 已切换至详细模式", "green")); continue
            elif cmd == "/normal":
                complex_mode = False; disable_truncation = False; current_max_tokens = 400; max_steps = 50
                print(c("  🕶️  已恢复普通模式", "green")); continue
            elif cmd == "/complex":
                complex_mode = True; disable_truncation = False; current_max_tokens = 1200; max_steps = 50
                print(c("  🧩 复杂模式", "green")); continue
            elif cmd == "/simple":
                complex_mode = False; disable_truncation = False; current_max_tokens = 400; max_steps = 50
                print(c("  🍃 简单模式", "green")); continue
            elif cmd == "/undo":
                print(c(undo_last_action(), "yellow")); continue
            elif cmd == "/prefs":
                prefs = load_preferences()
                print(c("  当前偏好：", "cyan"))
                for k,v in prefs.items(): print(c(f"    {k}: {v}", "dim"))
                continue
            elif cmd == "/save":
                save_session(history, conversation_messages, {"mode":"manual","total_tokens":total_tokens})
                print(c("  💾 会话已保存", "green")); continue
            elif cmd == "/resume":
                hist, conv, meta = load_session()
                if hist:
                    history, conversation_messages = hist, conv
                    total_tokens = meta.get("total_tokens", total_tokens)
                    session_resumed = True
                    print(c("  📂 会话已恢复，继续未完成任务", "cyan"))
                    BASE_SYSTEM = generate_dynamic_system_prompt()
                    if history and history[0]["role"] == "system": history[0]["content"] = BASE_SYSTEM
                    else: history.insert(0, {"role":"system","content":BASE_SYSTEM})
                    print(c(f"  ⏱️ 保存时间：{meta.get('saved_at','未知时间')}", "dim"))
                    print(c(f"  📊 当前累计 token: {total_tokens}", "dim"))
                else: print(c("  📭 没有可恢复的会话", "yellow"))
                continue
            elif cmd == "/clear_session":
                print(c("  " + clear_session(), "green")); continue
            elif cmd == "/models":
                print(c("\n📋 模型列表：", "cyan"))
                r = subprocess.run(["python", "manage_models.py", "list"], capture_output=True, text=True)
                print(r.stdout); continue
            elif cmd.startswith("/models delete "):
                name = cmd.split(" ", 2)[2]
                r = subprocess.run(["python", "manage_models.py", "delete", name], capture_output=True, text=True)
                print(c(r.stdout.strip(), "green")); continue
            elif cmd == "/help":
                print(c("  /detail /normal /complex /simple /undo /prefs /save /resume /clear_session /models /help", "cyan"))
                continue
            else:
                print(c("  未知命令，输入 /help 查看", "yellow")); continue
        log_msg(f"USER: {user_input[:100]}")
        learn_from_feedback(user_input, "")

        if session_resumed:
            session_resumed = False
            if history and history[0]["role"] == "system": history[0]["content"] = generate_dynamic_system_prompt()
            else: history.insert(0, {"role":"system","content":generate_dynamic_system_prompt()})
            history.append({"role":"user","content":user_input})
            conversation_messages.append({"role":"user","content":user_input})
        else:
            history.clear(); conversation_messages.clear()
            BASE_SYSTEM = generate_dynamic_system_prompt()
            history.append({"role":"system","content":BASE_SYSTEM})
            history.append({"role":"user","content":user_input})
            conversation_messages.append({"role":"user","content":user_input})

        if not session_resumed:
            complex_keywords = ["生成","创建脚本","重构","批量","扫描所有","复杂","完整","大改","全部替换",
                               "写一个","实现","开发","构建","部署"]
            simple_keywords = ["修复","修改一处","搜索","查看","小改","加一行","删除","简单","解释"]
            if any(k in user_input for k in complex_keywords):
                if not complex_mode:
                    complex_mode = True; current_max_tokens = 800; max_steps = 50
                    print(c("  🧠 检测到复杂任务，自动启用增强模式", "magenta"))
            elif any(k in user_input for k in simple_keywords):
                if complex_mode:
                    complex_mode = False; current_max_tokens = 400; max_steps = 50
                    print(c("  🍃 检测到简单任务，切换回普通模式", "magenta"))

        step, round_tokens, start_time = 0, 0, time.time()

        try:
            while True:
                step += 1
                spinner.start("Thinking...")
                resp = call_model(history)
                spinner.stop()
                msg = resp.msg_dict

                if hasattr(resp, 'usage'):
                    round_tokens += resp.usage.total_tokens
                print(c(f"  📊 本次+{resp.usage.total_tokens if hasattr(resp,'usage') else 0}t | 累积 {total_tokens}t", "dim"))

                total_chars = sum(len(m.get('content','')) for m in history if isinstance(m, dict))
                if total_chars > 4000 and step > 2:
                    summary = summarize_context(conversation_messages[-8:])
                    if summary:
                        new_history = [{"role":"system","content":BASE_SYSTEM}]
                        new_history.append({"role":"user","content":f"对话摘要: {summary}"})
                        new_history.extend(history[-4:])
                        history = new_history
                        print(c("  📄 上下文已压缩", "dim"))

                adjust_dynamic_params(last_output_length)
                text_content = msg.get("content") or ""

                if not msg.get("tool_calls"):
                    history.append({"role":"assistant","content":text_content})
                    conversation_messages.append({"role":"assistant","content":text_content})
                    elapsed = round(time.time() - start_time, 1)
                    print()
                    print(c("  ▌ ", "cyan"), end="")
                    typewriter(text_content, delay=0.008)
                    print()
                    print(c(f"  ✓ 完成", "green") + c(f"  ⏱{elapsed}s  🔢{round_tokens}tok  📊累积{total_tokens}tok 模式:{'详细' if complex_mode else '普通'}", "dim"))
                    log_msg(f"DONE: {elapsed}s {round_tokens}tok")
                    save_session(history, conversation_messages, {"total_tokens":total_tokens, "saved_at":datetime.now().isoformat()})
                    break

                history.append(msg)
                tool_results = []
                print()

                for tool in msg["tool_calls"]:
                    args = json.loads(tool["function"]["arguments"])
                    name = tool["function"]["name"]
                    t0 = time.time()

                    if name == "run_command":
                        cmd = args["command"]
                        preview = preview_command(cmd)
                        print(c(f"    🔎 {preview}", "dim"))
                        res = run_command(cmd)
                    elif name == "read_file": res = read_file(args["filepath"])
                    elif name == "write_file": res = write_file(args["filepath"], args["content"])
                    elif name == "append_file": res = append_file(args["filepath"], args["content"])
                    elif name == "replace_in_file": res = replace_in_file(args["filepath"], args["old_text"], args["new_text"])
                    elif name == "patch_file": res = patch_file(args["filepath"], args["patches"])
                    elif name == "search_file": res = search_file(args["filepath"], args["keyword"])
                    elif name == "list_dir": res = list_dir(args.get("path", "."))
                    else: res = "未知工具"

                    elapsed_tool = round(time.time() - t0, 1)
                    preview = res[:100] + ('...' if len(res) > 100 else '')
                    print(c(f"    ↩ {preview}", "dim") + c(f" ({elapsed_tool}s)", "dim"))
                    stored = smart_truncate_tool_result(name, res)
                    tool_results.append({"role":"tool", "type":"tool", "tool_call_id":tool["id"], "content":stored})

                history.extend(tool_results)
                conversation_messages.append({"role":"assistant","content":f"使用了工具 {name}"})
                save_session(history, conversation_messages, {"total_tokens":total_tokens, "saved_at":datetime.now().isoformat()})

                if step >= max_steps:
                    spinner.stop()
                    if max_steps < 50:
                        max_steps += 5
                        print(c(f"  ⚠️  步数达到上限，自动扩展至 {max_steps} 步", "yellow"))
                        continue
                    else:
                        print(c("  ⚠ 步骤过多自动停止", "red"))
                        history.append({"role":"user","content":"任务尚未完成，请总结当前进度并建议后续步骤。"})
                        try:
                            final_resp = call_model(history)
                            final_msg = final_resp.msg_dict["content"]
                            print(c("  ▌ ", "cyan"), end="")
                            typewriter(final_msg, delay=0.008)
                        except: pass
                        save_session(history, conversation_messages, {"total_tokens":total_tokens, "saved_at":datetime.now().isoformat()})
                        break

        except Exception as e:
            spinner.stop()
            print(c(f"\n  ✗ 报错: {e}", "red"))
            # 不清空history，把错误加入对话让LLM自己决策
            history.append({"role":"user","content":f"上一步出现错误：{e}\n请分析原因并决定如何继续或修复。"})

if __name__ == "__main__":
    main()
