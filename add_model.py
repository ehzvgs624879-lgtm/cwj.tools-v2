import json
config_file = 'config.json'
with open(config_file, 'r') as f:
    data = json.load(f)

print("=== 🤖 正在添加新模型配置 ===")
name = input("1. 请输入一个配置名称（例如 deepseek）: ")
model_name = input("2. 请输入在屏幕上显示的名字（例如 DeepSeek V3）: ")
provider = input("3. 请输入厂商名称（例如 deepseek）: ")
model = input("4. 请输入模型ID（例如 deepseek-chat）: ")
base_url = input("5. 请输入接口地址（URL）: ")
api_key = input("6. 请输入API Key: ")

data['profiles'][name] = {
    "name": name,
    "provider": provider,
    "model": model,
    "base_url": base_url,
    "api_key": api_key,
    "model_name": model_name
}

with open(config_file, 'w') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)
print(f"\n✅ 成功！已将 {name} 添加到配置中。")
print(f"下次你可以直接输入: python switch.py {name}")
