import os

def scan_project(path="."):
    info = {
        "files": [],
        "types": set()
    }

    for root, dirs, files in os.walk(path):
        for f in files:
            if f.startswith("."):
                continue

            full = os.path.join(root, f)

            info["files"].append(full)

            if f.endswith(".html"):
                info["types"].add("HTML")
            elif f.endswith(".css"):
                info["types"].add("CSS")
            elif f.endswith(".js"):
                info["types"].add("JavaScript")
            elif f.endswith(".py"):
                info["types"].add("Python")

    return info


if __name__ == "__main__":
    data = scan_project()

    print("📁 Project Scan")
    print("文件数量:", len(data["files"]))
    print("技术:", ", ".join(data["types"]))

    print("\n主要文件:")
    for f in data["files"][:10]:
        print("-", f)
