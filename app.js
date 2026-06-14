console.log("CWJ TOOLS V11 LOADED");

// ======================
// 页面切换
// ======================

document.querySelectorAll(".nav-btn").forEach(btn => {

    btn.addEventListener("click", () => {

        const page = btn.dataset.page;

        document.querySelectorAll(".nav-btn")
        .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        document.querySelectorAll(".page")
        .forEach(p => p.classList.remove("active"));

        const target = document.getElementById(page);

        if(target){
            target.classList.add("active");
        }

    });

});

// ======================
// 工具函数
// ======================

function genPassword(){
    const c="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let r="";
    for(let i=0;i<14;i++){
        r+=c[Math.floor(Math.random()*c.length)];
    }
    return r;
}

function genUUID(){
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{
        let r=Math.random()*16|0;
        return (c==="x"?r:(r&0x3|0x8)).toString(16);
    });
}

// ======================
// 工具系统
// ======================

let currentTool="password";
let lastResult="";

window.addEventListener("DOMContentLoaded",()=>{

const items=document.querySelectorAll(".tool-item");
const runBtn=document.getElementById("runTool");

const input=document.getElementById("toolInput");
const output=document.getElementById("toolResult");
const title=document.getElementById("toolTitle");

items.forEach(i=>{
    i.addEventListener("click",()=>{

        items.forEach(x=>x.classList.remove("active"));
        i.classList.add("active");

        currentTool=i.dataset.tool;
        title.innerText=i.innerText;

        input.value="";
        output.innerText="等待执行...";

    });
});

runBtn.addEventListener("click",()=>{

    let val=input.value;
    let res="";

    switch(currentTool){

        case "password":
            res=genPassword();
            break;

        case "uuid":
            res=genUUID();
            break;

        case "base64":
            res=btoa(val||"");
            break;

        case "json":
            try{
                res=JSON.stringify(JSON.parse(val),null,2);
            }catch(e){
                res="JSON错误";
            }
            break;

    }

    lastResult=res;
    output.innerText=res;

});

});

// ======================
// 复制
// ======================

function copyResult(){

    navigator.clipboard.writeText(lastResult)
    .catch(()=>{});

    alert("已复制");

}
