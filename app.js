document.addEventListener("DOMContentLoaded", () => {

    console.log("CWJ TOOLS V10.7 已启动");

    // ======================
    // 工具状态
    // ======================

    let currentTool = "password";
    let lastResult = "";

    // ======================
    // 工具函数（唯一版本）
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
    // DOM检查
    // ======================

    const items = document.querySelectorAll(".tool-item");
    const runBtn = document.getElementById("runTool");
    const inputBox = document.getElementById("toolInput");
    const resultBox = document.getElementById("toolResult");
    const titleBox = document.getElementById("toolTitle");

    if (!items.length || !runBtn || !inputBox || !resultBox) {
        console.error("❌ 工具面板未加载成功，请检查HTML结构");
        return;
    }

    // ======================
    // 工具切换
    // ======================

    items.forEach(item => {

        item.addEventListener("click", () => {

            items.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            currentTool = item.dataset.tool;

            titleBox.innerText = item.innerText;
            inputBox.value = "";
            resultBox.innerText = "等待执行...";

        });

    });

    // ======================
    // 执行工具
    // ======================

    runBtn.addEventListener("click", () => {

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

        toast("执行成功");

    });

    // ======================
    // 复制
    // ======================

    window.复制工具结果 = function () {
        navigator.clipboard.writeText(lastResult);
        toast("已复制结果");
    };

});
