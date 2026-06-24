import os, subprocess, json
from openai import OpenAI

# 自动读取你在第一步里设置的钥匙，不需要手动填了！
API_KEY = os.environ.get("GROQ_API_KEY")
BASE_URL = "https://api.groq.com/openai/v1" 

if not API_KEY:
    print("❌ 错误：没找到你的 API Key！请先运行第一步设置 export GROQ_API_KEY='你的Key'")
    exit()

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

def run_command(command):
    """执行 Termux 终端命令"""
    print(f"⚙️ [Agent正在执行命令]: {command}")
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    return result.stdout + result.stderr

def read_file(filepath):
    """读取本地文件"""
    print(f"📖 [Agent正在读取文件]: {filepath}")
    try:
        with open(filepath, 'r') as f: return f.read()
    except Exception as e: return f"读取失败: {e}"

def write_file(filepath, content):
    """写入或修改本地文件"""
    print(f"✍️ [Agent正在修改文件]: {filepath}")
    try:
        with open(filepath, 'w') as f: f.write(content)
        return f"成功写入 {filepath}"
    except Exception as e: return f"写入失败: {e}"

# 将工具注册给大模型
tools = [
    {"type": "function", "function": {"name": "run_command", "description": "在终端执行Linux命令（如ls, git等）", "parameters": {"type": "object", "properties": {"command": {"type": "string"}}, "required": ["command"]}}},
    {"type": "function", "function": {"name": "read_file", "description": "读取本地文件内容", "parameters": {"type": "object", "properties": {"filepath": {"type": "string"}}, "required": ["filepath"]}}},
    {"type": "function", "function": {"name": "write_file", "description": "写入或覆盖本地文件", "parameters": {"type": "object", "properties": {"filepath": {"type": "string"}, "content": {"type": "string"}}, "required": ["filepath", "content"]}}}
]

messages = [{"role": "system", "content": "你是一个运行在Android Termux里的全自动资深程序员Agent。你可以使用工具读取文件、修改文件、执行系统命令（如 git 提交等）。接到任务后，请自主思考并调用工具完成任务。"}]

print("🚀 掌上全自动 Groq Agent 已启动！输入 'quit' 退出。")
while True:
    user_input = input("\n🧑 老板请吩咐任务：")
    if user_input.lower() in ['quit', 'exit']: break
    messages.append({"role": "user", "content": user_input})

    try:
        response = client.chat.completions.create(model="llama-3.3-70b-versatile", messages=messages, tools=tools)
        msg = response.choices[0].message
        messages.append(msg)

        if msg.tool_calls:
            for tool in msg.tool_calls:
                args = json.loads(tool.function.arguments)
                if tool.function.name == "run_command": res = run_command(args["command"])
                elif tool.function.name == "read_file": res = read_file(args["filepath"])
                elif tool.function.name == "write_file": res = write_file(args["filepath"], args["content"])
                
                messages.append({"role": "tool", "tool_call_id": tool.id, "content": res})
            
            response = client.chat.completions.create(model="llama-3.3-70b-versatile", messages=messages)
            msg = response.choices[0].message
            messages.append(msg)

        print(f"\n🤖 [Agent汇报]:\n{msg.content}")
    except Exception as e:
        print(f"\n❌ 报错了: {e}")
