console.log("CWJ TOOLS V10.7 已启动");

// ======================
// 页面切换（基础功能）
// ======================

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.onclick = () => {

        document.querySelectorAll(".nav-btn")
        .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        const page = btn.dataset.page;

        document.querySelectorAll(".page")
        .forEach(p => p.classList.remove("active"));

        document.getElementById(page).classList.add("active");
    };
});

// ======================
// 工具状态
// ======================

let currentTool = "password";
let lastResult = "";

// ======================
// 工具函数
// ======================

function generatePassword(len = 16) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let r = "";
    for (let i = 0; i < len; i++) {
        r += chars[Math.floor(Math.random() * chars.length)];
    }
    return r;
}

function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        let r = Math.random() * 16 | 0;
        return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// ======================
// 工具系统初始化
// ======================

window.addEventListener("DOMContentLoaded", () => {

    const items = document.querySelectorAll(".tool-item");
    const runBtn = document.getElementById("runTool");

    const inputBox = document.getElementById("toolInput");
    const resultBox = document.getElementById("toolResult");
    const titleBox = document.getElementById("toolTitle");

    if (!items.length || !runBtn) {
        console.error("❌ 工具未加载成功，请检查HTML");
        return;
    }

    // 工具切换
    items.forEach(item => {
        item.onclick = () => {

            items.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            currentTool = item.dataset.tool;

            titleBox.innerText = item.innerText;
            inputBox.value = "";
            resultBox.innerText = "等待执行...";

        };
    });

    // 执行工具
    runBtn.onclick = () => {

        const input = inputBox.value;

        let result = "";

        switch (currentTool) {

            case "password":
                result = generatePassword();
                break;

            case "uuid":
                result = generateUUID();
                break;

            case "base64":
                result = btoa(unescape(encodeURIComponent(input || "")));
                break;

            case "json":
                try {
                    result = JSON.stringify(JSON.parse(input), null, 4);
                } catch (e) {
                    result = "JSON格式错误";
                }
                break;

            default:
                result = "未知工具";
        }

        lastResult = result;
        resultBox.innerText = result;

    };

});

// ======================
// 复制功能（全局）
// ======================

function 复制工具结果() {
    navigator.clipboard.writeText(lastResult);
    alert("已复制");
}
