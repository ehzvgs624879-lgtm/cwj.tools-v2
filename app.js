// ======================
// CWJ TOOLS V10.5（中文版）
// ======================

// 页面切换
const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

navButtons.forEach(btn => {
    btn.onclick = () => {
        navButtons.forEach(b => b.classList.remove("active"));
        pages.forEach(p => p.classList.remove("active"));

        btn.classList.add("active");
        document.getElementById(btn.dataset.page).classList.add("active");
    };
});


// ======================
// 工具函数区
// ======================


// 密码生成器
function 生成密码(length = 16) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    let pass = "";
    for (let i = 0; i < length; i++) {
        pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
}


// UUID生成器
function 生成UUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


// Base64编码
function 编码Base64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}


// Base64解码
function 解码Base64(str) {
    return decodeURIComponent(escape(atob(str)));
}


// JSON格式化
function 格式化JSON(jsonStr) {
    try {
        return JSON.stringify(JSON.parse(jsonStr), null, 4);
    } catch (e) {
        return "❌ JSON格式错误，请检查输入";
    }
}


// ======================
// 工具点击事件
// ======================

document.querySelectorAll(".tool-card").forEach(card => {

    card.addEventListener("click", () => {

        const tool = card.innerText.trim();

        // 密码生成
        if (tool.includes("Password") || tool.includes("密码")) {
            const pass = 生成密码();
            alert("🔐 生成的密码：\n\n" + pass);
        }

        // UUID
        else if (tool.includes("UUID")) {
            const id = 生成UUID();
            alert("🆔 生成的UUID：\n\n" + id);
        }

        // Base64
        else if (tool.includes("Base64")) {
            const input = prompt("请输入要编码的内容：");
            if (!input) return;
            const encoded = 编码Base64(input);
            alert("🔤 Base64结果：\n\n" + encoded);
        }

        // JSON
        else if (tool.includes("JSON")) {
            const input = prompt("请输入JSON内容：");
            if (!input) return;
            alert("📦 格式化结果：\n\n" + 格式化JSON(input));
        }

        else {
            alert("⚙️ 功能开发中：" + tool);
        }

    });

});


// ======================
// AI聊天（离线版）
// ======================

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

function 添加消息(text, type) {
    const div = document.createElement("div");
    div.className = "message " + type;
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function AI回复() {
    const replies = [
        "系统运行正常。",
        "工具引擎已启动。",
        "请求已收到。",
        "操作已完成。",
        "CWJ系统在线运行中。",
        "当前状态：稳定"
    ];
    return replies[Math.floor(Math.random() * replies.length)];
}

function 发送消息() {
    const text = userInput.value.trim();
    if (!text) return;

    添加消息(text, "user");
    userInput.value = "";

    setTimeout(() => {
        添加消息(AI回复(), "bot");
    }, 600);
}

sendBtn.onclick = 发送消息;

userInput.addEventListener("keydown", e => {
    if (e.key === "Enter") 发送消息();
});


// ======================
// 搜索功能
// ======================

const searchInput = document.querySelector(".search-center");

if (searchInput) {
    searchInput.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            const q = searchInput.value.trim();
            if (!q) return;

            window.open(
                "https://www.google.com/search?q=" + encodeURIComponent(q),
                "_blank"
            );
        }
    });
}


// ======================
// 初始化
// ======================

console.log("🚀 CWJ TOOLS V10.5 中文版 已启动");
