from api import call_llm
import tools
import json


SYSTEM = """
你是一个AI编程助手。
你必须只输出JSON，不要任何解释。

格式：
{
  "action": "read|write|cmd",
  "input": "..."
}
"""


def parse(task):
    res = call_llm([
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": task}
    ])

    try:
        return json.loads(res)
    except:
        return {"action": "cmd", "input": "echo parse_error"}


def execute(plan):
    action = plan.get("action")
    inp = plan.get("input")

    if action == "read":
        return tools.read_file(inp)

    if action == "write":
        return tools.write_file(inp["path"], inp["content"])

    if action == "cmd":
        return tools.run_cmd(inp)

    return "no action"


def loop():
    print("=== STABLE AGENT START ===")

    while True:
        task = input("\n> ")

        if task in ["exit", "quit"]:
            break

        plan = parse(task)
        print("PLAN:", plan)

        result = execute(plan)
        print("RESULT:", result)


if __name__ == "__main__":
    loop()
