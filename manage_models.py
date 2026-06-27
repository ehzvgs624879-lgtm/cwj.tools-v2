#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""模型管理脚本 —— 查看 / 删除已保存的模型配置"""

import json
import os
import sys

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

def load_config():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)

def save_config(cfg):
    with open(CONFIG_PATH, "w") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)

def list_models():
    cfg = load_config()
    active = cfg.get("active_profile", "")
    print("\n📋 当前所有模型配置：")
    for name, p in cfg["profiles"].items():
        marker = " ← 当前使用" if name == active else ""
        print(f"  • {name}: {p.get('model_name', p.get('model', '未知'))}{marker}")
    print()

def delete_model(name):
    cfg = load_config()
    active = cfg.get("active_profile", "")
    if name == active:
        print(f"❌ 不能删除当前正在使用的模型 \"{name}\"，请先切换到其他模型。")
        return
    if name not in cfg["profiles"]:
        print(f"❌ 模型配置 \"{name}\" 不存在。")
        return
    del cfg["profiles"][name]
    save_config(cfg)
    print(f"✅ 已删除模型配置 \"{name}\"。")

def main():
    if len(sys.argv) < 2:
        print("用法：")
        print("  python manage_models.py list        列出所有模型")
        print("  python manage_models.py delete <名称>  删除指定模型")
        return
    cmd = sys.argv[1].lower()
    if cmd == "list":
        list_models()
    elif cmd == "delete":
        if len(sys.argv) < 3:
            print("❌ 请指定要删除的模型名称")
        else:
            delete_model(sys.argv[2])
    else:
        print("❌ 未知命令，请使用 list 或 delete")

if __name__ == "__main__":
    main()
