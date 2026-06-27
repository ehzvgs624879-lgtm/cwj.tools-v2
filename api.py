import requests

API_KEY = "YOUR_ZHIPU_API_KEY"
API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

def call_llm(messages):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "glm-4.5-air",
        "messages": messages
    }

    res = requests.post(API_URL, json=payload, headers=headers, timeout=30)
    data = res.json()

    try:
        return data["choices"][0]["message"]["content"]
    except:
        return str(data)
