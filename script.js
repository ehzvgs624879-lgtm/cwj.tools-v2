const tools=[
{id:"pwd",cat:"util",icon:"🔑",name:"密码生成",desc:"安全随机密码"},
{id:"qr",cat:"util",icon:"◼",name:"二维码生成",desc:"文字转二维码"},
{id:"color",cat:"util",icon:"🎨",name:"颜色转换",desc:"HEX/RGB/HSL"},
{id:"ts",cat:"util",icon:"🕐",name:"时间戳",desc:"时间互转"},
{id:"hash",cat:"crypto",icon:"#",name:"Hash计算",desc:"SHA系列"},
{id:"aes",cat:"crypto",icon:"🔒",name:"AES加密",desc:"文本加密解密"},
{id:"b64",cat:"crypto",icon:"📦",name:"Base64",desc:"编码解码"},
{id:"json",cat:"dev",icon:"{}",name:"JSON格式化",desc:"美化压缩"},
{id:"regex",cat:"dev",icon:".*",name:"正则测试",desc:"匹配测试"},
{id:"url",cat:"dev",icon:"🔗",name:"URL工具",desc:"编码解码"},
{id:"ai",cat:"ai",icon:"✦",name:"AI助手",desc:"智能对话"}
];


let tsTimer=null;
let qrLoaded=false;
let qrInstance=null;
let isAiLoading=false;


let aiMessages=
JSON.parse(
localStorage.getItem("cwj_ai_history")||"[]"
);



function showToast(msg){

const t=document.getElementById("toast");

t.textContent=msg;

t.classList.add("show");


setTimeout(()=>{

t.classList.remove("show");

},1500);

}





function renderTools(cat="all"){


const grid=
document.getElementById("toolGrid");


grid.innerHTML="";



tools
.filter(t=>cat==="all"||t.cat===cat)
.forEach((t,i)=>{


const div=document.createElement("div");


div.className="card";


div.innerHTML=`

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



div.style.animationDelay=
`${i*60}ms`;



div.onclick=()=>openTool(t.id);



grid.appendChild(div);



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


const t=
tools.find(x=>x.id===id);



document.getElementById("panelTitle")
.textContent=
t.icon+" "+t.name;



document.getElementById("panelBody")
.innerHTML=
getPanelHTML(id);



document.getElementById("overlay")
.classList.add("show");



if(id==="ts")
initTs();


if(id==="ai")
loadAI();


}




function closePanel(e){


if(
!e ||
e.target===document.getElementById("overlay")
){


document
.getElementById("overlay")
.classList.remove("show");



if(tsTimer)
clearInterval(tsTimer);


}


}






function getPanelHTML(id){


if(id==="pwd")

return `

<div class="field">

<label>
长度
</label>

<input id="pwdLen"
type="range"
min="8"
max="32"
value="16">

</div>


<div class="result-box"
id="pwdResult">

点击生成

</div>


<button class="btn btn-primary"
onclick="genPwd()">

生成

</button>

`;





if(id==="qr")

return `

<textarea id="qrInput"
placeholder="输入文字或链接">

</textarea>


<div id="qrOut"></div>


<button class="btn btn-primary"
onclick="genQR()">

生成二维码

</button>

`;





if(id==="ai")

return `

<div id="chatBox"
class="chat-box">

</div>


<textarea
id="aiInput"
placeholder="输入问题">

</textarea>


<button class="btn btn-primary"
onclick="sendAI()">

发送

</button>

`;





return `

<div class="result-box">

工具加载中...

</div>

`;

}



async function sendAI(){


if(isAiLoading)return;


const input=
document.getElementById("aiInput");


const text=input.value.trim();


if(!text)return;



const box=
document.getElementById("chatBox");



aiMessages.push({

role:"user",

content:text

});



box.innerHTML+=`

<div class="msg user">

${text}

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

"Content-Type":

"application/json"

},


body:JSON.stringify({

messages:aiMessages,

max_tokens:1000

})


});



const data=
await res.json();



const reply=
data.choices?.[0]?.message?.content
||
"无回复";



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



}catch(e){


showToast("AI连接失败");


}


isAiLoading=false;


}
function loadAI(){

const box=document.getElementById("chatBox");

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





function genPwd(){


const len=
document.getElementById("pwdLen").value;


let chars=
"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";


let out="";


for(let i=0;i<len;i++){

out+=chars[
Math.floor(Math.random()*chars.length)
];

}



document.getElementById("pwdResult")
.textContent=out;


}





function genQR(){


const text=
document.getElementById("qrInput").value.trim();


if(!text)return;



const out=
document.getElementById("qrOut");


out.innerHTML="";



if(!qrLoaded){


const s=document.createElement("script");


s.src=
"https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";



s.onload=()=>{


qrLoaded=true;


new QRCode(
out,
{

text:text,

width:180,

height:180

}

);


};



document.head.appendChild(s);



}else{


new QRCode(
out,
{

text:text,

width:180,

height:180

}

);


}


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


const v=
document.getElementById("tsInput").value;



document.getElementById("tsResult")
.textContent=

new Date(
Number(v)*1000
)
.toLocaleString();



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


document.getElementById("b64Result")
.textContent=


btoa(

unescape(

encodeURIComponent(

document.getElementById("b64Input").value

)

)

);



}catch{

showToast("编码失败");

}


}




function b64Decode(){


try{


document.getElementById("b64Result")
.textContent=

decodeURIComponent(

escape(

atob(

document.getElementById("b64Input").value

)

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





function minJson(){


try{


document.getElementById("jsonResult")
.textContent=

JSON.stringify(

JSON.parse(

document.getElementById("jsonInput").value

)

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








// ===== 背景粒子 =====



const canvas=
document.getElementById("bg");


const ctx=
canvas.getContext("2d");



let particles=[];



function resize(){

canvas.width=innerWidth;

canvas.height=innerHeight;

}


resize();


window.addEventListener(
"resize",
resize
);





for(let i=0;i<80;i++){


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



renderTools();
