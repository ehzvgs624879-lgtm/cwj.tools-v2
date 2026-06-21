const tools=[
{id:'pwd',cat:'util',icon:'🔑',name:'密码生成',desc:'安全随机密码'},
{id:'qr',cat:'util',icon:'▣',name:'二维码生成',desc:'文字转二维码'},
{id:'color',cat:'util',icon:'🎨',name:'颜色转换',desc:'HEX/RGB/HSL'},
{id:'ts',cat:'util',icon:'🕒',name:'时间戳',desc:'时间互转'},
{id:'hash',cat:'crypto',icon:'#',name:'Hash计算',desc:'SHA系列'},
{id:'aes',cat:'crypto',icon:'🔒',name:'AES加密',desc:'安全加密'},
{id:'b64',cat:'crypto',icon:'📦',name:'Base64',desc:'编码解码'},
{id:'json',cat:'dev',icon:'{}',name:'JSON工具',desc:'格式化压缩'},
{id:'regex',cat:'dev',icon:'.*',name:'正则测试',desc:'实时匹配'},
{id:'url',cat:'dev',icon:'🔗',name:'URL工具',desc:'编码解码'},
{id:'ai',cat:'ai',icon:'✦',name:'AI助手',desc:'智能对话'}
];


let aiMessages=
JSON.parse(localStorage.getItem("cwj_ai_history")||"[]");


let isAiLoading=false;

let tsTimer=null;



function showToast(msg){

const t=document.getElementById("toast");

t.textContent=msg;

t.classList.add("show");

setTimeout(()=>{

t.classList.remove("show");

},1500);

}





function renderTools(cat="all"){


const grid=document.getElementById("toolGrid");


grid.innerHTML="";


tools
.filter(t=>cat==="all"||t.cat===cat)
.forEach((t,i)=>{


const card=document.createElement("div");


card.className="card";


card.style.animationDelay=
`${i*50}ms`;


card.innerHTML=`

<div class="card-icon">
${t.icon}
</div>

<div class="card-name">
${t.name}
</div>

<div class="card-desc">
${t.desc}
</div>

`;


card.onclick=()=>openTool(t.id);


grid.appendChild(card);



});


}




function filterTools(cat,e){


document
.querySelectorAll(".tab")
.forEach(x=>
x.classList.remove("active")
);


if(e)
e.target.classList.add("active");


renderTools(cat);


}





function openTool(id){


const tool=
tools.find(t=>t.id===id);



document.getElementById("panelTitle")
.textContent=
tool.icon+" "+tool.name;



document.getElementById("panelBody")
.innerHTML=
getPanelHTML(id);



document
.getElementById("overlay")
.classList.add("show");



if(id==="ts")
initTs();



if(id==="ai")
loadAIHistory();



}




function closePanel(e){


if(!e ||
e.target===document.getElementById("overlay")){


document
.getElementById("overlay")
.classList.remove("show");


if(tsTimer)
clearInterval(tsTimer);


}


}






function getPanelHTML(id){



if(id==="ai")

return `


<div class="chat-box" id="chatBox"></div>


<textarea
id="aiInput"
placeholder="输入问题..."
></textarea>


<div class="btn-row">

<button
class="btn btn-primary"
onclick="sendAI()">

发送

</button>


</div>

`;



return `

<div class="result-box">

功能加载中...

</div>

`;



}





function loadAIHistory(){


const box=
document.getElementById("chatBox");


if(!box)return;


box.innerHTML="";


aiMessages.forEach(m=>{


box.innerHTML+=`

<div class="msg ${m.role}">

${m.content}

</div>

`;


});


}




async function sendAI(){


if(isAiLoading)return;


const input=
document.getElementById("aiInput");


const text=
input.value.trim();


if(!text)return;


const box=
document.getElementById("chatBox");



aiMessages.push({

role:"user",

content:text

});


localStorage.setItem(

"cwj_ai_history",

JSON.stringify(aiMessages)

);



box.innerHTML+=`

<div class="msg user">

${text}

</div>


<div class="msg thinking">

AI 思考中...

</div>

`;



input.value="";


isAiLoading=true;


try{


const res=
await fetch(
"https://api.cwj-tools.xyz/",
{

method:"POST",

headers:{

"Content-Type":"application/json"

},


body:

JSON.stringify({

messages:aiMessages,

max_tokens:1000

})


});


const data=
await res.json();



document
.querySelector(".thinking")
?.remove();



const reply=
data.choices?.[0]?.message?.content
||
"暂无回复";



aiMessages.push({

role:"assistant",

content:reply

});



localStorage.setItem(

"cwj_ai_history",

JSON.stringify(aiMessages)

);



box.innerHTML+=`

<div class="msg ai">

${reply}

</div>

`;



box.scrollTop=
box.scrollHeight;



}catch(e){


box.innerHTML+=`

<div class="msg ai">

请求失败

</div>

`;


}


isAiLoading=false;


}
function genPwd(){

const len=
document.getElementById("pwdLen")?.value || 16;


let chars=
"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";


let result="";


for(let i=0;i<len;i++){

result+=
chars[Math.floor(Math.random()*chars.length)];

}


const box=
document.getElementById("pwdResult");


if(box)
box.textContent=result;


}





function initTs(){

if(tsTimer)
clearInterval(tsTimer);


tsTimer=setInterval(()=>{


const el=
document.getElementById("tsNow");


if(el)

el.textContent=
Math.floor(Date.now()/1000);


},1000);

}





function convertTs(){


const input=
document.getElementById("tsInput").value;


const date=
new Date(Number(input)*1000);



document.getElementById("tsResult")
.textContent=
date.toLocaleString();


}





async function calcHash(){


const text=
document.getElementById("hashInput").value;


const algo=
document.getElementById("hashAlgo").value;



const buf=
await crypto.subtle.digest(

algo,

new TextEncoder()
.encode(text)

);



document.getElementById("hashResult")
.textContent=


Array.from(
new Uint8Array(buf)
)

.map(
b=>b.toString(16).padStart(2,"0")
)

.join("");



}




function b64Encode(){


try{


const text=
document.getElementById("b64Input").value;


document.getElementById("b64Result")
.textContent=

btoa(
unescape(
encodeURIComponent(text)
)
);



}catch{

showToast("编码失败");

}


}




function b64Decode(){


try{


const text=
document.getElementById("b64Input").value;


document.getElementById("b64Result")
.textContent=

decodeURIComponent(
escape(
atob(text)
)
);



}catch{

showToast("解码失败");

}


}





function fmtJson(){


try{


const obj=
JSON.parse(
document.getElementById("jsonInput").value
);


document.getElementById("jsonResult")
.textContent=

JSON.stringify(
obj,
null,
2
);



}catch{

showToast("JSON错误");

}


}




function urlEncode(){


document.getElementById("urlResult")
.textContent=

encodeURIComponent(

document.getElementById("urlInput").value

);


}





function urlDecode(){


document.getElementById("urlResult")
.textContent=

decodeURIComponent(

document.getElementById("urlInput").value

);


}








// ===== 背景粒子系统 =====


const canvas=
document.getElementById("bg");


const ctx=
canvas.getContext("2d");


let particles=[];



function resize(){

canvas.width=
innerWidth;


canvas.height=
innerHeight;

}



resize();


window.onresize=resize;



for(let i=0;i<70;i++){


particles.push({

x:Math.random()*innerWidth,

y:Math.random()*innerHeight,

vx:(Math.random()-.5)*.5,

vy:(Math.random()-.5)*.5,

r:Math.random()*2+1

});


}





function drawBg(){


ctx.clearRect(

0,

0,

canvas.width,

canvas.height

);



particles.forEach(p=>{


p.x+=p.vx;

p.y+=p.vy;



if(
p.x<0||
p.x>canvas.width
)
p.vx*=-1;



if(
p.y<0||
p.y>canvas.height
)
p.vy*=-1;



ctx.beginPath();


ctx.arc(

p.x,

p.y,

p.r,

0,

Math.PI*2

);



ctx.fillStyle=
"rgba(0,180,255,.7)";


ctx.fill();



});





requestAnimationFrame(drawBg);


}



drawBg();





// 初始化


renderTools();





// 手机面板滑动关闭


let startY=0;


const panel=
document.getElementById("panel");


if(panel){


panel.addEventListener(

"touchstart",

e=>{

startY=
e.touches[0].clientY;

}

);



panel.addEventListener(

"touchend",

e=>{


let end=
e.changedTouches[0].clientY;


if(end-startY>100){

closePanel();

}


}

);


  }
