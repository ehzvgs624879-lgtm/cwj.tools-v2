import json, sys
with open("config.json", "r") as f:
    data = json.load(f)
if len(sys.argv) > 1:
    profile = sys.argv[1]
    if profile in data["profiles"]:
        data["active_profile"] = profile
        with open("config.json", "w") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"✅ 已切换到: {profile}")
    else:
        print(f"❌ 找不到配置: {profile}")
else:
    print(f"当前使用配置: {data['active_profile']}")
