// ======================
// UI系统
// ======================

let 当前结果 = "";

// Toast
function toast(msg){
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.style.opacity = 1;

    setTimeout(()=>{
        t.style.opacity = 0;
    },1500);
}

// 弹窗
function 打开弹窗(title, content){
    document.getElementById("modal").classList.remove("hidden");
    document.getElementById("modal-title").innerText = title;
    document.getElementById("modal-content").innerText = content;
    当前结果 = content;
}

function 关闭弹窗(){
    document.getElementById("modal").classList.add("hidden");
}

function 复制结果(){
    navigator.clipboard.writeText(当前结果);
    toast("已复制到剪贴板");
    关闭弹窗();
}


// ======================
// 工具函数
// ======================

// 密码
function 生成密码(len=16){
    const chars="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let r="";
    for(let i=0;i<len;i++){
        r+=chars[Math.floor(Math.random()*chars.length)];
    }
    return r;
}

// UUID
function 生成UUID(){
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{
        let r=Math.random()*16|0;
        return (c=="x"?r:(r&0x3|0x8)).toString(16);
    });
}

// Base64
function 编码(text){
    return btoa(unescape(encodeURIComponent(text)));
}

function 解码(text){
    return decodeURIComponent(escape(atob(text)));
}

// JSON
function 格式化(json){
    try{
        return JSON.stringify(JSON.parse(json),null,4);
    }catch(e){
        return "JSON格式错误";
    }
}


// ======================
// 工具点击系统
// ======================

document.querySelectorAll(".tool-card").forEach(card=>{

    card.onclick=()=>{

        const name=card.innerText;

        if(name.includes("密码")){
            打开弹窗("密码生成器",生成密码());
        }

        else if(name.includes("UUID")){
            打开弹窗("UUID生成器",生成UUID());
        }

        else if(name.includes("Base64")){
            let t=prompt("请输入文本");
            if(!t)return;
            打开弹窗("Base64编码",编码(t));
        }

        else if(name.includes("JSON")){
            let t=prompt("请输入JSON");
            if(!t)return;
            打开弹窗("JSON格式化",格式化(t));
        }

        else{
            toast("功能开发中");
        }
    };

});


// ======================
// AI聊天（优化版）
// ======================

const chatBox=document.getElementById("chatBox");
const input=document.getElementById("userInput");
const send=document.getElementById("sendBtn");

function add(text,type){
    let d=document.createElement("div");
    d.className="message "+type;
    d.innerText=text;
    chatBox.appendChild(d);
    chatBox.scrollTop=chatBox.scrollHeight;
}

function reply(){
    const arr=[
        "系统运行正常",
        "任务已执行",
        "CWJ工具箱在线",
        "处理完成"
    ];
    return arr[Math.floor(Math.random()*arr.length)];
}

function sendMsg(){
    let t=input.value.trim();
    if(!t)return;

    add(t,"user");
    input.value="";

    setTimeout(()=>{
        add(reply(),"bot");
    },500);
}

send.onclick=sendMsg;

input.addEventListener("keydown",e=>{
    if(e.key==="Enter")sendMsg();
});


// ======================
// 搜索
// ======================

document.querySelector(".search-center")?.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
        let q=e.target.value;
        window.open("https://www.google.com/search?q="+encodeURIComponent(q));
    }
});

console.log("CWJ TOOLS V10.6 已启动");
