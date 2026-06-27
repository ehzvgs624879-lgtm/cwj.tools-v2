from api import call_llm
import tools
import json

SYSTEM = """
你是AI编程助手，只输出JSON：
{"action":"read|write|cmd","input":"..."}
"""

def parse(task):
    res = call_llm([
        {"role":"system","content":SYSTEM},
        {"role":"user","content":task}
    ])

    try:
        res = res.strip()
        start = res.find("{")
        end = res.rfind("}") + 1
        return json.loads(res[start:end])
    except:
        return {"action":"cmd","input":"echo parse_error"}

def execute(plan):
    if plan["action"] == "read":
        return tools.read_file(plan["input"])

    if plan["action"] == "write":
        return tools.write_file(plan["input"])

    if plan["action"] == "cmd":
        return tools.run_cmd(plan["input"])

    return "no action"

def loop():
    print("=== STABLE AGENT START ===")
    while True:
        task = input("> ")
        if task in ["exit","quit"]:
            break
        plan = parse(task)
        print("PLAN:", plan)
        print("RESULT:", execute(plan))

if __name__ == "__main__":
    loop()
