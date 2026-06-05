const tools = [
  { id:"chat", name:"AI Chat",     desc:"智能对话助手",   icon:"🤖" },
  { id:"text", name:"文本工具",    desc:"总结 / 翻译 / 改写", icon:"📝" },
  { id:"json", name:"JSON 格式化", desc:"格式化与错误检查", icon:"🔧" },
  { id:"calc", name:"计算器",      desc:"数学表达式计算",  icon:"🧮" },
  { id:"muyu", name:"赛博木鱼",    desc:"电子积德，焦虑消散",  icon:"✨" }
];

let current = null;

/* =========================
   STORAGE
========================= */
function saveState(){
  localStorage.setItem("cwjos", JSON.stringify(state));
}

function loadState(){
  return JSON.parse(localStorage.getItem("cwjos") || "null");
}

let state = loadState() || {
  chatHistory: [],
  recentTools: []
};
/* =========================
   HOME
========================= */
function renderHome(){
  const searchEl = document.getElementById("search");
  
  // 🔍 智能联动：原地无感激活搜索框事件
  if (searchEl && !searchEl.oninput) {
    searchEl.oninput = renderHome;
  }

  const q = searchEl ? searchEl.value.trim().toLowerCase() : "";
  const list = document.getElementById("list");
  if(!list) return;
  list.innerHTML = "";

  // 1. 核心高亮转化器
  const highlight = (text, keyword) => {
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword})`, "gi");
    return text.replace(regex, `<span style="color: #00ffa3; text-shadow: 0 0 8px rgba(0,255,163,0.4); font-weight: 600;">$1</span>`);
  };

  // ==========================================
  // 【状态一：纯净首页模式】当搜索框为空时
  // ==========================================
  if (q === "") {
    // 🌟 1.1 动态注入：最近常用工具（横向流动丝滑舱）
    if (state.recentTools && state.recentTools.length > 0) {
      const recentsWrapper = document.createElement("div");
      recentsWrapper.style.margin = "0 0 24px 0";
      
      let recentsHTML = `
        <div style="font-size: 12px; color: rgba(255,255,255,0.3); font-weight: 600; letter-spacing: 1px; margin-bottom: 12px; text-transform: uppercase;">⏱️ 最近常用</div>
        <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; -webkit-overflow-scrolling: touch;">
      `;
      
      // 只取最近使用的前 4 个，避免拥挤
      state.recentTools.slice(0, 4).forEach(id => {
        const t = tools.find(item => item.id === id);
        if (t) {
          recentsHTML += `
            <div onclick="renderTool('${t.id}')" style="flex: 0 0 calc(25% - 9px); background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 14px 8px; text-align: center; backdrop-filter: blur(10px); transition: transform 0.1s;">
              <div style="font-size: 24px; margin-bottom: 6px;">${t.icon}</div>
              <div style="font-size: 11px; color: rgba(255,255,255,0.8); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.name}</div>
            </div>
          `;
        }
      });
      
      recentsHTML += `</div>`;
      recentsWrapper.innerHTML = recentsHTML;
      list.appendChild(recentsWrapper);
    }

    // 🌟 1.2 动态注入：全部工具副标题
    const titleEl = document.createElement("div");
    titleEl.style.cssText = "font-size: 12px; color: rgba(255,255,255,0.3); font-weight: 600; letter-spacing: 1px; margin-bottom: 12px; text-transform: uppercase;";
    titleEl.innerText = "📱 全部应用";
    list.appendChild(titleEl);
  }

  // ==========================================
  // 【数据层】执行条件检索过滤
  // ==========================================
  const filtered = tools.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.desc.toLowerCase().includes(q)
  );

  // 🌟 2. 智能空状态（科幻流线画风）
  if(filtered.length === 0){
    list.innerHTML = `
      <div style="text-align:center; padding:45px 20px; background:rgba(255,255,255,0.01); border-radius:24px; border:1px dashed rgba(255,255,255,0.08); margin-top:10px;">
        <div style="font-size:32px; margin-bottom:12px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.1));">🛸</div>
        <div style="color:rgba(255,255,255,0.6); font-size:14px; font-weight:500;">未找到与 “${q}” 相关的工具</div>
        <div style="color:rgba(255,255,255,0.3); font-size:12px; margin-top:6px;">检查错别字或换个词搜索</div>
      </div>
    `;
    return;
  }

  // 🌟 3. 豪华卡片流式渲染（带贝塞尔物理交错动效）
  filtered.forEach((t, index) => {
    const card = document.createElement("div");
    card.className = "tool-card"; // 保持你原有的 CSS 类名
    
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:14px; width:100%;">
        <div style="font-size:24px; background:rgba(255,255,255,0.04); width:46px; height:46px; display:flex; align-items:center; justify-content:center; border-radius:14px; border:1px solid rgba(255,255,255,0.06); box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);">${t.icon}</div>
        <div style="flex:1; text-align:left;">
          <div style="font-size:15px; font-weight:600; color:#fff; margin-bottom:2px; letter-spacing:0.3px;">${highlight(t.name, q)}</div>
          <div style="font-size:12px; color:rgba(255,255,255,0.4); font-weight: 400;">${highlight(t.desc, q)}</div>
        </div>
        <div style="color:rgba(255,255,255,0.15); font-size:14px; margin-right:4px;">➔</div>
      </div>
    `;

    // 点击进入工具
    card.onclick = () => renderTool(t.id);

    // 🏎️ OS 线性动画：根据卡片顺序（index）计算微小的延迟时间差
    card.style.opacity = "0";
    card.style.transform = "translateY(12px) scale(0.98)";
    card.style.transition = `opacity 0.22s cubic-bezier(0.215, 0.610, 0.355, 1) ${index * 0.03}s, transform 0.22s cubic-bezier(0.215, 0.610, 0.355, 1) ${index * 0.03}s`;

    list.appendChild(card);

    // 释放入场缓动动画
    requestAnimationFrame(() => {
      card.style.opacity = "1";
      card.style.transform = "translateY(0) scale(1)";
    });
  });
}

  filtered.forEach(t => {
    const card = document.createElement("div");
    card.className = "card fade";
    card.setAttribute("data-id", t.id);
    card.innerHTML = `
      <div class="card-icon">${t.icon}</div>
      <div class="card-content">
        <div class="card-name">${t.name}</div>
        <div class="card-desc">${t.desc}</div>
      </div>
      <div class="card-arrow">›</div>
    `;
    card.onclick = () => openTool(t.id);
    list.appendChild(card);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderHome);
} else {
  renderHome();
}

/* =========================
   NAV
========================= */
function openTool(id){
  current = id;

  state.recentTools.unshift(id);
  state.recentTools = [...new Set(state.recentTools)].slice(0,5);
  saveState();

  document.getElementById("home").classList.remove("active");
  document.getElementById("tool").classList.add("active");
  document.getElementById("title").innerText = tools.find(t=>t.id===id).name;

  const body = document.getElementById("body");
  if(body) {
    body.classList.remove("fade");
    void body.offsetWidth;
    body.classList.add("fade");
  }

  renderTool(id);
}

function back(){
  document.getElementById("tool").classList.remove("active");
  document.getElementById("home").classList.add("active");
}
/* =========================
   TOOL RENDER
========================= */
function renderTool(id){
  const box = document.getElementById("body");
  if(!box) return;

  if(id==="chat"){
    box.innerHTML = `
      <div id="chatBox"></div>
      <input id="msg" placeholder="输入消息..."
             onkeydown="if(event.key==='Enter') sendMsg()">
      <button onclick="sendMsg()">发送</button>
    `;
    renderChatHistory();
    return;
  }

  if(id==="text"){
    box.innerHTML = `
      <textarea id="t" placeholder="输入文本..."></textarea>
      <button onclick="processText()">处理</button>
      <div id="out"
           style="margin-top:14px;line-height:1.65;font-size:14px;
                  color:rgba(255,255,255,0.8)"></div>
    `;
    return;
  }

  if(id==="json"){
    box.innerHTML = `
      <textarea id="j" placeholder="粘贴 JSON..."></textarea>
      <button onclick="formatJSON()">格式化</button>
      <pre id="out"></pre>
    `;
    return;
  }

  if(id==="calc"){
    box.innerHTML = `
      <input id="exp" placeholder="例：(1 + 2) * 3">
      <button onclick="runCalc()">计算</button>
      <div id="out" style="margin-top:16px;font-size:28px;font-weight:700;letter-spacing:-0.5px;text-align:center"></div>
    `;
    return;
  }

  if(id==="muyu"){
    state.muyuCount = state.muyuCount || 0; 
    box.innerHTML = `
      <div style="text-align:center; padding: 30px 0; position: relative;">
        <div style="font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 8px;">当前功德</div>
        <div id="muyuCount" style="font-size: 48px; font-weight: 800; color: #fff; margin-bottom: 40px; font-variant-numeric: tabular-nums;">${state.muyuCount}</div>
        <div id="muyuNode" onclick="tapMuyu()" style="font-size: 90px; cursor: pointer; user-select: none; display: inline-block; transition: transform 0.05s ease;">✨</div>
        <div id="muyuFloat" style="position: absolute; top: 40%; left: 50%; transform: translateX(-50%); pointer-events: none;"></div>
      </div>
    `;
    return;
  }
}
/* =========================
   CHAT
========================= */
async function sendMsg(){
  const msgInput = document.getElementById("msg");
  const box      = document.getElementById("chatBox");
  if(!msgInput || !box) return;
  const text     = msgInput.value.trim();

  if(!text) return;
  msgInput.value = "";

  const userDiv = document.createElement("div");
  userDiv.className = "chat-msg user fade";
  userDiv.textContent = text;
  box.appendChild(userDiv);

  state.chatHistory.push({role:"user", text});
  box.scrollTop = box.scrollHeight;

  const thinkDiv = document.createElement("div");
  thinkDiv.className = "chat-msg thinking";
  thinkDiv.textContent = "思考中...";
  box.appendChild(thinkDiv);
  box.scrollTop = box.scrollHeight;

  try{
    const res = await fakeAI(state.chatHistory);
    box.removeChild(thinkDiv);

    const aiDiv = document.createElement("div");
    aiDiv.className = "chat-msg ai fade";
    aiDiv.textContent = res;
    box.appendChild(aiDiv);

    state.chatHistory.push({role:"ai", text:res});
    saveState();

  }catch(e){
    if(box.contains(thinkDiv)) box.removeChild(thinkDiv);
    const errDiv = document.createElement("div");
    errDiv.className = "chat-msg ai";
    errDiv.style.color = "#ff6b6b";
    errDiv.textContent = "❌ 错误：" + e.message;
    box.appendChild(errDiv);
  }

  box.scrollTop = box.scrollHeight;
}

async function fakeAI(history){
  await new Promise(r=>setTimeout(r,900));
  const last = history[history.length-1].text;
  return "（模拟回复）收到：" + last;
}

function renderChatHistory(){
  const box = document.getElementById("chatBox");
  if(!box) return;
  box.innerHTML = "";
  state.chatHistory.forEach(m=>{
    const div = document.createElement("div");
    div.className = `chat-msg ${m.role==="user"?"user":"ai"}`;
    div.textContent = m.text;
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}
/* =========================
   TEXT TOOL
========================= */
function processText(){
  const v   = document.getElementById("t").value.trim();
  const out = document.getElementById("out");
  if(!v || !out) return;
  out.innerText = "总结：" + v.slice(0,80) + (v.length>80?"…":"");
}

/* =========================
   JSON TOOL
========================= */
function formatJSON(){
  const out = document.getElementById("out");
  if(!out) return;
  try{
    const parsed = JSON.parse(document.getElementById("j").value);
    out.style.color = "";
    out.innerText = JSON.stringify(parsed,null,2);
  }catch(e){
    out.style.color = "#ff6b6b";
    out.innerText = "❌ JSON 错误：" + e.message;
  }
}

/* =========================
   CALC TOOL
========================= */
function runCalc(){
  const out  = document.getElementById("out");
  const expr = document.getElementById("exp").value.trim();
  if(!expr || !out) return;
  try{
    const result = eval(expr);
    out.style.color = "#4da3ff";
    out.innerText = "= " + result;
  }catch{
    out.style.color = "#ff6b6b";
    out.innerText = "计算错误，请检查表达式";
  }
}

/* =========================
   MUYU TOOL LOGIC
========================= */
function tapMuyu(){
  state.muyuCount = (state.muyuCount || 0) + 1;
  saveState();
  
  const countEl = document.getElementById("muyuCount");
  if(countEl) countEl.innerText = state.muyuCount;
  
  const muyu = document.getElementById("muyuNode");
  if(muyu) {
    muyu.style.transform = "scale(0.85)";
    setTimeout(() => muyu.style.transform = "scale(1)", 60);
  }
  
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }

  const floatBox = document.getElementById("muyuFloat");
  if(!floatBox) return;
  const textNode = document.createElement("div");
  
  const words = ["功德 +1", "焦虑 -1", "好运 +1", "头发 +1", "Bug -1", "薪资 +1"];
  textNode.innerText = words[Math.floor(Math.random() * words.length)];
  
  textNode.style.position = "absolute";
  textNode.style.color = "#4da3ff";
  textNode.style.fontSize = "20px";
  textNode.style.fontWeight = "bold";
  textNode.style.whiteSpace = "nowrap";
  textNode.style.transform = "translateX(-50%)";
  
  floatBox.appendChild(textNode);
  
  textNode.animate([
    { transform: 'translate(-50%, 0px)', opacity: 1 },
    { transform: 'translate(-50%, -80px)', opacity: 0 }
  ], {
    duration: 600,
    easing: 'ease-out'
  });
  
  setTimeout(() => textNode.remove(), 600);
}
/* =========================
   MUYU TOOL LOGIC
========================= */
// 🎵 在外层只建一个“喇叭”，所有点击共用它，绝对不会断音
let audioCtx = null;

function playCyberSound() {
  try {
    // 第一次点击时才买喇叭（应对浏览器的自动播放拦截机制）
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioCtx = new AudioContext();
    }
    
    // 如果喇叭处于休眠状态，就唤醒它
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    // 模拟木鱼由高到低的清脆撞击频率
    osc.type = 'sine';
    osc.frequency.setValueAtTime(550, audioCtx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.08); 
    
    // 音量在一瞬间快速衰减
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.08);
  } catch (e) {
    console.log("音频播放失败:", e);
  }
}

function tapMuyu(){
  // 💥 触发自制音效
  playCyberSound();

  state.muyuCount = (state.muyuCount || 0) + 1;
  saveState();
  
  const countEl = document.getElementById("muyuCount");
  if(countEl) countEl.innerText = state.muyuCount;
  
  const muyu = document.getElementById("muyuNode");
  if(muyu) {
    muyu.style.transform = "scale(0.85)";
    setTimeout(() => muyu.style.transform = "scale(1)", 60);
  }
  
  if (navigator.vibrate) {
    navigator.vibrate(10); // 手机物理震动
  }

  const floatBox = document.getElementById("muyuFloat");
  if(!floatBox) return;
  const textNode = document.createElement("div");
  
  const words = ["功德 +1", "焦虑 -1", "好运 +1", "头发 +1", "Bug -1", "薪资 +1"];
  textNode.innerText = words[Math.floor(Math.random() * words.length)];
  
  textNode.style.position = "absolute";
  textNode.style.color = "#4da3ff";
  textNode.style.fontSize = "20px";
  textNode.style.fontWeight = "bold";
  textNode.style.whiteSpace = "nowrap";
  textNode.style.transform = "translateX(-50%)";
  
  floatBox.appendChild(textNode);
  
  textNode.animate([
    { transform: 'translate(-50%, 0px)', opacity: 1 },
    { transform: 'translate(-50%, -80px)', opacity: 0 }
  ], {
    duration: 600,
    easing: 'ease-out'
  });
  
  setTimeout(() => textNode.remove(), 600);
}

