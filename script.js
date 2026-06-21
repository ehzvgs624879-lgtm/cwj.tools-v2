// 工具配置解耦
const tools=[
  {id:'pwd',cat:'util',icon:'🔑',name:'密码生成',desc:'安全随机密码'},
  {id:'qr',cat:'util',icon:'◼',name:'二维码生成',desc:'文字转二维码'},
  {id:'color',cat:'util',icon:'🎨',name:'颜色转换',desc:'HEX/RGB/HSL'},
  {id:'ts',cat:'util',icon:'🕐',name:'时间戳',desc:'时间戳互转'},
  {id:'hash',cat:'crypto',icon:'#',name:'Hash计算',desc:'MD5/SHA系列'},
  {id:'aes',cat:'crypto',icon:'🔒',name:'AES加密',desc:'加密解密文本'},
  {id:'b64',cat:'crypto',icon:'📦',name:'Base64',desc:'编码与解码'},
  {id:'json',cat:'dev',icon:'{}',name:'JSON格式化',desc:'美化/压缩JSON'},
  {id:'regex',cat:'dev',icon:'.*',name:'正则测试',desc:'实时匹配测试'},
  {id:'url',cat:'dev',icon:'🔗',name:'URL编解码',desc:'编码/解码URL'},
  {id:'ai',cat:'ai',icon:'✦',name:'AI对话',desc:'云端大模型对话'},
];
let tsTimer=null;
let qrLoaded=false;
let qrInstance=null;
let isAiLoading=false;
let colorDebounceTimer=null;
let aiMessages=[];
let aiTypeTimer=null;
let bgAnimId=null;
// 标签拖拽变量
let dragStartX=0, dragScrollLeft=0,isDragging=false;
// 粒子鼠标坐标
let mouseX=null,mouseY=null;

// 本地存储封装
const Storage={
  get(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}},
  set(k,v){localStorage.setItem(k,JSON.stringify(v))},
  del(k){localStorage.removeItem(k)}
}
// 主题初始化
(function initTheme(){
  const savedTheme=Storage.get('cwj-theme')||'dark';
  document.documentElement.setAttribute('data-theme',savedTheme);
  const switchBtn=document.getElementById('themeSwitch');
  switchBtn.textContent=savedTheme==='dark'?'☀':'🌙';
  switchBtn.onclick=()=>{
    const now=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',now);
    switchBtn.textContent=now==='dark'?'☀':'🌙';
    Storage.set('cwj-theme',now);
  }
})();

function showToast(msg){
  const toast=document.getElementById('toast');
  toast.textContent=msg;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),1500);
}
function copyText(id){
  const txt=document.getElementById(id).textContent;
  navigator.clipboard.writeText(txt).then(()=>showToast('已复制')).catch(()=>showToast('复制失败'));
}
function debounce(fn,delay=150){
  return (...args)=>{
    clearTimeout(colorDebounceTimer);
    colorDebounceTimer=setTimeout(()=>fn(...args),delay);
  };
}

function renderTools(cat='all'){
  const grid=document.getElementById('toolGrid');
  grid.innerHTML='';
  tools.filter(t=>cat==='all'||t.cat===cat).forEach(t=>{
    const d=document.createElement('div');
    d.className='card card-fade';
    d.innerHTML='<div class="card-icon">'+t.icon+'</div><div class="card-name">'+t.name+'</div><div class="card-desc">'+t.desc+'</div>';
    d.style.animationDelay=`${grid.children.length*60}ms`;
    d.onclick=()=>openTool(t.id);
    grid.appendChild(d);
  });
}

// 标签点击+拖拽绑定
(function initTabDrag(){
  const tabWrap=document.getElementById('tabWrap');
  // 点击切换分类
  document.querySelectorAll('.tab').forEach(tab=>{
    tab.onclick=(e)=>{
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      e.target.classList.add('active');
      filterTools(e.target.dataset.key);
    }
  })
  // 鼠标拖拽
  tabWrap.addEventListener('mousedown',e=>{isDragging=true;dragStartX=e.pageX;dragScrollLeft=tabWrap.scrollLeft;tabWrap.style.cursor='grabbing'});
  tabWrap.addEventListener('mousemove',e=>{if(!isDragging)return;e.preventDefault();tabWrap.scrollLeft=dragScrollLeft-(e.pageX-dragStartX)});
  window.addEventListener('mouseup',()=>{isDragging=false;tabWrap.style.cursor='grab'});
  // 手机触摸滑动
  tabWrap.addEventListener('touchstart',e=>{dragStartX=e.touches[0].pageX;dragScrollLeft=tabWrap.scrollLeft});
  tabWrap.addEventListener('touchmove',e=>{tabWrap.scrollLeft=dragScrollLeft-(e.touches[0].pageX-dragStartX)});
})();

function filterTools(cat){
  const grid=document.getElementById('toolGrid');
  grid.style.opacity=0;
  setTimeout(()=>{
    renderTools(cat);
    grid.style.opacity=1;
  },200);
}

function openTool(id){
  const t=tools.find(x=>x.id===id);
  document.getElementById('panelTitle').textContent=t.icon+' '+t.name;
  document.getElementById('panelBody').innerHTML=getPanelHTML(id);
  document.getElementById('overlay').classList.add('show');
  Storage.set('lastTool',id);
  if(id==='ts')initTs();
  if(id==='ai'){
    if(aiTypeTimer){clearInterval(aiTypeTimer);aiTypeTimer=null;}
    aiMessages=Storage.get('cwj-chat')||[];
    const box=document.getElementById('chatBox');
    box.innerHTML='';
    aiMessages.forEach(msg=>{
      const d=document.createElement('div');
      d.className=`msg ${msg.role}`;
      d.textContent=msg.content;
      box.appendChild(d);
    })
    box.scrollTop=box.scrollHeight;
  }
}

function closePanel(e){
  if(!e||e.target===document.getElementById('overlay')){
    document.getElementById('overlay').classList.remove('show');
    if(tsTimer){clearInterval(tsTimer);tsTimer=null;}
    if(aiTypeTimer){clearInterval(aiTypeTimer);aiTypeTimer=null;}
    isAiLoading=false;
    const chatBox=document.getElementById('chatBox');
    if(chatBox) chatBox.innerHTML='';
  }
}

// 全局快捷键ESC关闭弹窗、AI回车发送
window.addEventListener('keydown',e=>{
  if(e.key==='Escape')closePanel();
  const aiInput=document.getElementById('aiInput');
  if(document.activeElement===aiInput&&e.key==='Enter'&&!e.shiftKey){
    e.preventDefault();sendAI();
  }
})

function getPanelHTML(id){
  if(id==='pwd')return '<div class="field"><label>长度 <span id="pwdLenVal">16</span></label><input type="range" id="pwdLen" min="8" max="32" value="16" oninput="document.getElementById(\'pwdLenVal\').textContent=this.value"></div><div class="field"><label><input type="checkbox" id="pwdUpper" checked> 大写 &nbsp;<input type="checkbox" id="pwdNum" checked> 数字 &nbsp;<input type="checkbox" id="pwdSym"> 符号</label></div><div class="result-box" id="pwdResult">点击生成</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="genPwd()">生成</button><button class="btn btn-ghost" onclick="copyText(\'pwdResult\')">复制</button></div>';
  if(id==='qr')return '<div class="field"><label>输入文字或链接</label><textarea id="qrInput" placeholder="https://..."></textarea></div><div id="qrOut" style="text-align:center;margin:10px 0"></div><div class="btn-row"><button class="btn btn-primary" onclick="genQR()">生成二维码</button></div>';
  if(id==='color')return '<div class="field"><label>HEX</label><input id="hexIn" placeholder="#00b4ff" oninput="debouncedConvertColor(\'hex\')"></div><div class="field"><label>RGB</label><input id="rgbIn" placeholder="0, 180, 255" oninput="debouncedConvertColor(\'rgb\')"></div><div class="field"><label>HSL</label><input id="hslIn" placeholder="197, 100%, 50%" readonly></div><div id="colorPreview" style="height:50px;border-radius:var(--radius-sm);margin-top:8px;border:1px solid var(--border-thin)"></div>';
  if(id==='ts')return '<div class="field"><label>当前时间戳</label><div class="result-box" id="tsNow">-</div></div><div class="field"><label>时间戳转日期</label><input id="tsInput" placeholder="1700000000"></div><div class="result-box" id="tsResult">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="convertTs()">转换</button><button class="btn btn-ghost" onclick="copyText(\'tsResult\')">复制</button></div>';
  if(id==='hash')return '<div class="field"><label>输入文本</label><textarea id="hashInput" placeholder="输入内容..."></textarea></div><div class="field"><label>算法</label><select id="hashAlgo"><option value="SHA-1">SHA-1</option><option value="SHA-256" selected>SHA-256</option><option value="SHA-512">SHA-512</option></select></div><div class="result-box" id="hashResult">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="calcHash()">计算</button><button class="btn btn-ghost" onclick="copyText(\'hashResult\')">复制</button></div>';
  if(id==='aes')return '<div class="field"><label>文本</label><textarea id="aesInput" placeholder="输入内容..."></textarea></div><div class="field"><label>密钥</label><input id="aesKey" placeholder="输入密钥，自动补齐32位"></div><div class="result-box" id="aesResult">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="aesEncrypt()">加密</button><button class="btn btn-ghost" onclick="aesDecrypt()">解密</button><button class="btn btn-ghost" onclick="copyText(\'aesResult\')">复制</button></div>';
  if(id==='b64')return '<div class="field"><label>输入</label><textarea id="b64Input" placeholder="输入内容..."></textarea></div><div class="result-box" id="b64Result">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="b64Encode()">编码</button><button class="btn btn-ghost" onclick="b64Decode()">解码</button><button class="btn btn-ghost" onclick="copyText(\'b64Result\')">复制</button></div>';
  if(id==='json')return '<div class="field"><label>JSON内容</label><textarea id="jsonInput" placeholder=\'{"key":"value"}\' style="min-height:120px"></textarea></div><div class="result-box" id="jsonResult" style="white-space:pre;min-height:80px">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="fmtJson()">格式化</button><button class="btn btn-ghost" onclick="minJson()">压缩</button><button class="btn btn-ghost" onclick="copyText(\'jsonResult\')">复制</button></div>';
  if(id==='regex')return '<div class="field"><label>正则表达式</label><input id="regexPat" placeholder="\\d+"></div><div class="field"><label>测试文本</label><textarea id="regexText" placeholder="输入测试内容..."></textarea></div><div class="result-box" id="regexResult">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="testRegex()">测试</button></div>';
  if(id==='url')return '<div class="field"><label>输入</label><textarea id="urlInput" placeholder="输入内容..."></textarea></div><div class="result-box" id="urlResult">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="urlEncode()">编码</button><button class="btn btn-ghost" onclick="urlDecode()">解码</button><button class="btn btn-ghost" onclick="copyText(\'urlResult\')">复制</button></div>';
  if(id==='ai')return '<div class="chat-box" id="chatBox"></div><div class="field"><textarea id="aiInput" placeholder="Enter发送 | Shift+Enter换行" style="min-height:60px"></textarea></div><div class="btn-row"><button class="btn btn-primary" onclick="sendAI()">发送</button></div>';
  return '<p>开发中...</p>';
}
const debouncedConvertColor=debounce(convertColor);

function genPwd(){
  const len=document.getElementById('pwdLen').value;
  let chars='abcdefghijklmnopqrstuvwxyz';
  if(document.getElementById('pwdUpper').checked)chars+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if(document.getElementById('pwdNum').checked)chars+='0123456789';
  if(document.getElementById('pwdSym').checked)chars+='!@#$%^&*';
  if(chars.length===0)chars='abcdefghijklmnopqrstuvwxyz';
  let pwd='';
  for(let i=0;i<len;i++)pwd+=chars[Math.floor(Math.random()*chars.length)];
  document.getElementById('pwdResult').textContent=pwd;
}

function genQR(){
  const text=document.getElementById('qrInput').value.trim();
  if(!text)return;
  const out=document.getElementById('qrOut');
  if(qrInstance&&typeof qrInstance.clear==='function'){qrInstance.clear();qrInstance=null;}
  out.innerHTML='';
  if(!qrLoaded){
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload=()=>{qrLoaded=true;qrInstance=new QRCode(out,{text,width:180,height:180,colorDark:'#00b4ff',colorLight:'#020b18'});};
    document.head.appendChild(s);
  }else{
    qrInstance=new QRCode(out,{text,width:180,height:180,colorDark:'#00b4ff',colorLight:'#020b18'});
  }
}

function convertColor(from){
  try{
    let r,g,b;
    if(from==='hex'){
      const h=document.getElementById('hexIn').value.replace('#','');
      if(!/^[0-9a-fA-F]{6}$/.test(h))return;
      r=parseInt(h.slice(0,2),16);g=parseInt(h.slice(2,4),16);b=parseInt(h.slice(4,6),16);
    }else{
      const val=document.getElementById('rgbIn').value;
      if(!/^\d{1,3},\s*\d{1,3},\s*\d{1,3}$/.test(val))return;
      const p=val.split(',').map(x=>parseInt(x.trim()));
      if(p.some(n=>n>255||n<0))return;
      r=p[0];g=p[1];b=p[2];
    }
    document.getElementById('hexIn').value='#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
    document.getElementById('rgbIn').value=r+', '+g+', '+b;
    const rn=r/255,gn=g/255,bn=b/255;
    const max=Math.max(rn,gn,bn),min=Math.min(rn,gn,bn);
    let h=0,s=0,l=(max+min)/2;
    if(max!==min){const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);h=max===rn?(gn-bn)/d+(gn<bn?6:0):max===gn?(bn-rn)/d+2:(rn-gn)/d+4;h=Math.round(h*60);}
    document.getElementById('hslIn').value=h+', '+Math.round(s*100)+'%, '+Math.round(l*100)+'%';
    document.getElementById('colorPreview').style.background=document.getElementById('hexIn').value;
  }catch(e){}
}

function initTs(){
  if(tsTimer)clearInterval(tsTimer);
  tsTimer=setInterval(()=>{const el=document.getElementById('tsNow');if(el)el.textContent=Math.floor(Date.now()/1000);},1000);
}
function convertTs(){
  try{
    const v=document.getElementById('tsInput').value.trim();
    const d=new Date(v.length<=10?v*1000:parseInt(v));
    document.getElementById('tsResult').textContent=isNaN(d)?'无效时间戳':d.toLocaleString('zh-CN');
  }catch(e){showToast('时间戳格式错误');}
}

async function calcHash(){
  try{
    const text=document.getElementById('hashInput').value;
    const algo=document.getElementById('hashAlgo').value;
    const buf=await crypto.subtle.digest(algo,new TextEncoder().encode(text));
    document.getElementById('hashResult').textContent=Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }catch(e){showToast('哈希计算失败');}
}

async function getKey(k){
  const keyBuf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(k));
  return crypto.subtle.importKey('raw',keyBuf,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function aesEncrypt(){
  try{
    const key=await getKey(document.getElementById('aesKey').value);
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const enc=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(document.getElementById('aesInput').value));
    const combined=new Uint8Array(iv.length+enc.byteLength);
    combined.set(iv);combined.set(new Uint8Array(enc),iv.length);
    document.getElementById('aesResult').textContent=btoa(String.fromCharCode(...combined));
  }catch(e){showToast('加密失败：'+e.message);}
}
async function aesDecrypt(){
  try{
    const key=await getKey(document.getElementById('aesKey').value);
    const raw=document.getElementById('aesInput').value.trim();
    if(!raw)throw new Error('empty');
    const combined=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));
    if(combined.length<28)throw new Error('cipher too short');
    const dec=await crypto.subtle.decrypt({name:'AES-GCM',iv:combined.slice(0,12)},key,combined.slice(12));
    document.getElementById('aesResult').textContent=new TextDecoder().decode(dec);
  }catch(e){showToast('解密失败，密钥或密文错误');}
}

// 分块Base64防栈溢出
function b64Encode(){
  try{
    const utf8=new TextEncoder().encode(document.getElementById('b64Input').value);
    let binary='';
    const chunkSize=8192;
    for(let i=0;i<utf8.length;i+=chunkSize){
      binary+=String.fromCharCode(...utf8.subarray(i,i+chunkSize));
    }
    document.getElementById('b64Result').textContent=btoa(binary);
  }catch(e){showToast('编码错误');}
}
function b64Decode(){
  try{
    const binary=atob(document.getElementById('b64Input').value);
    const bytes=Uint8Array.from([...binary].map(c=>c.charCodeAt(0)));
    document.getElementById('b64Result').textContent=new TextDecoder().decode(bytes);
  }catch(e){showToast('解码错误');}
}
function fmtJson(){
  try{document.getElementById('jsonResult').textContent=JSON.stringify(JSON.parse(document.getElementById('jsonInput').value),null,2);}catch(e){showToast('JSON格式错误');}
}
function minJson(){
  try{document.getElementById('jsonResult').textContent=JSON.stringify(JSON.parse(document.getElementById('jsonInput').value));}catch(e){showToast('JSON格式错误');}
}

// 正则超时防DoS
function testRegex(){
  try{
    const pattern=document.getElementById('regexPat').value;
    const testStr=document.getElementById('regexText').value;
    const reg=new RegExp(pattern,'g');
    const start=Date.now();
    const results=[];
    let match;
    while((match=reg.exec(testStr))!==null){
      if(Date.now()-start>200){showToast('正则超时，可能存在灾难性回溯');return;}
      results.push(match[0]);
      if(reg.lastIndex===match.index)reg.lastIndex++;
    }
    document.getElementById('regexResult').textContent=results.length?'匹配'+results.length+'处：'+results.join(', '):'无匹配';
  }catch(e){showToast('正则表达式非法');}
}
function urlEncode(){
  try{document.getElementById('urlResult').textContent=encodeURIComponent(document.getElementById('urlInput').value);}catch(e){showToast('编码失败');}
}
function urlDecode(){
  try{document.getElementById('urlResult').textContent=decodeURIComponent(document.getElementById('urlInput').value);}catch(e){showToast('解码错误');}
}

async function sendAI(){
  if(isAiLoading)return;
  const input=document.getElementById('aiInput');
  const text=input.value.trim();
  if(!text)return;
  const box=document.getElementById('chatBox');
  aiMessages.push({role:'user',content:text});
  Storage.set('cwj-chat',aiMessages);
  box.innerHTML+='<div class="msg user">'+text+'</div><div class="msg thinking" id="thinking">AI思考中...</div>';
  input.value='';box.scrollTop=box.scrollHeight;
  isAiLoading=true;
  if(aiTypeTimer){clearInterval(aiTypeTimer);aiTypeTimer=null;}
  try{
    const res=await fetch('https://api.cwj-tools.xyz/',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:aiMessages,max_tokens:1000})
    });
    const data=await res.json();
    document.getElementById('thinking')?.remove();
    const fullReply=data.choices?.[0]?.message?.content||'无响应';
    const aiMsgDom=document.createElement('div');
    aiMsgDom.className='msg ai';
    box.appendChild(aiMsgDom);
    let charIndex=0;
    aiTypeTimer=setInterval(()=>{
      if(charIndex>=fullReply.length){
        clearInterval(aiTypeTimer);aiTypeTimer=null;
        aiMessages.push({role:'assistant',content:fullReply});
        Storage.set('cwj-chat',aiMessages);
        return;
      }
      aiMsgDom.textContent+=fullReply[charIndex];
      box.scrollTop=box.scrollHeight;
      charIndex++;
    },25);
  }catch(e){
    document.getElementById('thinking')?.remove();
    box.innerHTML+='<div class="msg ai">请求失败：'+e.message+'</div>';
    if(aiTypeTimer){clearInterval(aiTypeTimer);aiTypeTimer=null;}
  }finally{
    isAiLoading=false;
  }
}

// 粒子：网格分桶+鼠标引力场
const canvas=document.getElementById('bg');
const ctx=canvas.getContext('2d');
let particles=[];
const PARTICLE_COUNT=80;
const CONNECT_DIST=120;
const CELL_SIZE=CONNECT_DIST;
const ATTRACT_RADIUS=180;

function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
resize();
window.addEventListener('resize',resize);
// 鼠标位置监听
canvas.addEventListener('mousemove',e=>{
  const rect=canvas.getBoundingClientRect();
  mouseX=e.clientX-rect.left;mouseY=e.clientY-rect.top
})
canvas.addEventListener('mouseleave',()=>{mouseX=null;mouseY=null})

for(let i=0;i<PARTICLE_COUNT;i++){
  particles.push({
    x:Math.random()*window.innerWidth,
    y:Math.random()*window.innerHeight,
    vx:(Math.random()-.5)*.4,
    vy:(Math.random()-.5)*.4,
    r:Math.random()*1.5+.5,
    a:Math.random()*.6+.2,
    baseVx:(Math.random()-.5)*.4,
    baseVy:(Math.random()-.5)*.4
  });
}

function drawBg(){
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle='rgba(0,180,255,0.04)';ctx.lineWidth=1;
  for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  const len=particles.length;
  for(let i=0;i<len;i++){
    const p=particles[i];
    // 鼠标引力逻辑
    if(mouseX!==null&&mouseY!==null){
      const dx=mouseX-p.x, dy=mouseY-p.y;
      const dist=Math.hypot(dx,dy);
      if(dist<ATTRACT_RADIUS){
        const force=(ATTRACT_RADIUS-dist)/ATTRACT_RADIUS*0.015;
        p.vx+=dx/dist*force;
        p.vy+=dy/dist*force;
      }
    }
    // 速度阻尼回归原始速度
    p.vx += (p.baseVx - p.vx)*0.02;
    p.vy += (p.baseVy - p.vy)*0.02;
    p.x+=p.vx;p.y+=p.vy;
    if(p.x<0)p.x=W;if(p.x>W)p.x=0;
    if(p.y<0)p.y=H;if(p.y>H)p.y=0;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle='rgba(0,180,255,'+p.a+')';ctx.fill();
  }

  // 网格分桶连线
  const cols=Math.ceil(W/CELL_SIZE)+1;
  const rows=Math.ceil(H/CELL_SIZE)+1;
  const grid=new Array(cols*rows).fill(null).map(()=>[]);
  for(let i=0;i<len;i++){
    const p=particles[i];
    const cx=Math.floor(p.x/CELL_SIZE);
    const cy=Math.floor(p.y/CELL_SIZE);
    if(cx>=0&&cx<cols&&cy>=0&&cy<rows)grid[cy*cols+cx].push(i);
  }
  ctx.lineWidth=0.5;
  for(let cy=0;cy<rows;cy++){
    for(let cx=0;cx<cols;cx++){
      const cell=grid[cy*cols+cx];
      if(!cell.length)continue;
      for(let dy=-1;dy<=1;dy++){
        for(let dx=-1;dx<=1;dx++){
          if(dx===0&&dy===0)continue;
          const nx=cx+dx,ny=cy+dy;
          if(nx<0||nx>=cols||ny<0||ny>=rows)continue;
          const neighbor=grid[ny*cols+nx];
          for(let a=0;a<cell.length;a++){
            for(let b=0;b<neighbor.length;b++){
              if(cell[a]>=neighbor[b])continue;
              const pi=particles[cell[a]],pj=particles[neighbor[b]];
              const dist=Math.hypot(pi.x-pj.x,pi.y-pj.y);
              if(dist<CONNECT_DIST){
                ctx.beginPath();ctx.moveTo(pi.x,pi.y);ctx.lineTo(pj.x,pj.y);
                ctx.strokeStyle='rgba(0,180,255,'+(0.15*(1-dist/CONNECT_DIST))+')';
                ctx.stroke();
              }
            }
          }
        }
      }
      for(let a=0;a<cell.length;a++){
        for(let b=a+1;b<cell.length;b++){
          const pi=particles[cell[a]],pj=particles[cell[b]];
          const dist=Math.hypot(pi.x-pj.x,pj.y-pi.y);
          if(dist<CONNECT_DIST){
            ctx.beginPath();ctx.moveTo(pi.x,pi.y);ctx.lineTo(pj.x,pj.y);
            ctx.strokeStyle='rgba(0,180,255,'+(0.15*(1-dist/CONNECT_DIST))+')';
            ctx.stroke();
          }
        }
      }
    }
  }
  bgAnimId=requestAnimationFrame(drawBg);
}

// 切后台暂停动画
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(bgAnimId){cancelAnimationFrame(bgAnimId);bgAnimId=null;}}
  else{if(!bgAnimId)drawBg();}
});

drawBg();
renderTools();

// 导航滚动收缩逻辑
const headerDom=document.getElementById('mainHeader');
