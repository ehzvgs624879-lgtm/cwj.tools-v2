// ======================
// CWJ TOOLS V10
// APP.JS
// ======================

// Navigation

const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

navButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        navButtons.forEach(b => b.classList.remove("active"));
        pages.forEach(p => p.classList.remove("active"));

        btn.classList.add("active");

        const pageId = btn.dataset.page;
        document.getElementById(pageId).classList.add("active");

    });

});

// ======================
// AI CHAT
// ======================

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const STORAGE_KEY = "cwj_chat_history_v10";

// Load History

window.addEventListener("load", () => {

    loadChatHistory();

    showWelcome();

});

// Send

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {
        sendMessage();
    }

});

// Main

function sendMessage() {

    const text = userInput.value.trim();

    if (!text) return;

    addMessage(text, "user");

    userInput.value = "";

    fakeTyping();

}

// Add Message

function addMessage(text, type) {

    const div = document.createElement("div");

    div.className = `message ${type}`;

    div.textContent = text;

    chatBox.appendChild(div);

    saveChatHistory();

    scrollBottom();

}

// Fake AI

function fakeTyping() {

    const loading = document.createElement("div");

    loading.className = "message bot";

    loading.textContent = "Thinking...";

    chatBox.appendChild(loading);

    scrollBottom();

    setTimeout(() => {

        loading.remove();

        const reply = generateReply();

        addMessage(reply, "bot");

    }, 1200);

}

// Simple AI Demo

function generateReply() {

    const responses = [

        "CWJ AI Assistant is online.",
        "Your request has been received.",
        "Processing completed successfully.",
        "System status: Stable.",
        "AI response generated.",
        "Tool execution finished.",
        "CWJ Platform operational.",
        "Search completed.",
        "Analysis completed.",
        "Task executed successfully."

    ];

    return responses[
        Math.floor(Math.random() * responses.length)
    ];

}

// ======================
// Storage
// ======================

function saveChatHistory() {

    localStorage.setItem(
        STORAGE_KEY,
        chatBox.innerHTML
    );

}

function loadChatHistory() {

    const data =
        localStorage.getItem(STORAGE_KEY);

    if (data) {

        chatBox.innerHTML = data;

    }

}

// ======================
// Scroll
// ======================

function scrollBottom() {

    chatBox.scrollTop =
        chatBox.scrollHeight;

}

// ======================
// Welcome
// ======================

function showWelcome() {

    if (
        localStorage.getItem(
            "cwj_welcome_done"
        )
    ) {
        return;
    }

    setTimeout(() => {

        addMessage(
            "Welcome to CWJ TOOLS V10",
            "bot"
        );

        setTimeout(() => {

            addMessage(
                "AI Workspace Ready",
                "bot"
            );

        }, 800);

        setTimeout(() => {

            addMessage(
                "System Status: Online",
                "bot"
            );

        }, 1500);

    }, 500);

    localStorage.setItem(
        "cwj_welcome_done",
        "true"
    );

}

// ======================
// Online Status
// ======================

function updateStatus() {

    const status =
        document.querySelector(".status");

    if (navigator.onLine) {

        status.innerHTML =
            `<span class="online"></span> System Online`;

    } else {

        status.innerHTML =
            `<span class="online"></span> Offline`;

    }

}

window.addEventListener(
    "online",
    updateStatus
);

window.addEventListener(
    "offline",
    updateStatus
);

updateStatus();

// ======================
// Search Center
// ======================

const searchInput =
document.querySelector(".search-center");

if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        function(e){

            if(e.key === "Enter"){

                const q =
                searchInput.value.trim();

                if(!q) return;

                window.open(
                    "https://www.google.com/search?q="
                    + encodeURIComponent(q),
                    "_blank"
                );

            }

        }
    );

}

// ======================
// Tool Cards
// ======================

document
.querySelectorAll(".tool-card")
.forEach(card=>{

    card.addEventListener(
        "click",
        ()=>{

            alert(
                card.innerText +
                " Coming Soon"
            );

        }
    );

});

// ======================
// Dashboard Animation
// ======================

const cards =
document.querySelectorAll(".card");

cards.forEach((card,index)=>{

    card.style.opacity = "0";
    card.style.transform =
    "translateY(30px)";

    setTimeout(()=>{

        card.style.transition =
        ".5s";

        card.style.opacity = "1";
        card.style.transform =
        "translateY(0)";

    },index*100);

});

// ======================
// Version
// ======================

console.log(
    "CWJ TOOLS V10 Loaded"
);
