const tools = [
  { id:"chat", name:"AI Chat",     desc:"智能对话助手",   icon:"🤖" },
  { id:"text", name:"文本工具",    desc:"总结 / 翻译 / 改写", icon:"📝" },
  { id:"json", name:"JSON 格式化", desc:"格式化与错误检查", icon:"🔧" },
  { id:"calc", name:"计算器",      desc:"数学表达式计算",  icon:"🧮" }
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
  const q    = document.getElementById("search").value.toLowerCase();
  const list = document.getElementById("list");
  list.innerHTML = "";

  const filtered = tools.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.desc.toLowerCase().includes(q)
  );

  if(filtered.length === 0){
    list.innerHTML = `
      <div class="empty-state">
        😶 未找到匹配工具<br>
        <span style="font-size:12px">换个关键词试试</span>
      </div>`;
    return;
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

renderHome();

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
  body.classList.remove("fade");
  void body.offsetWidth;
  body.classList.add("fade");

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
}

/* =========================
   CHAT
========================= */
async function sendMsg(){
  const msgInput = document.getElementById("msg");
  const box      = document.getElementById("chatBox");
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
    box.removeChild(thinkDiv);
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
  if(!v) return;
  out.innerText = "总结：" + v.slice(0,80) + (v.length>80?"…":"");
}

/* =========================
   JSON TOOL
========================= */
function formatJSON(){
  const out = document.getElementById("out");
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
  if(!expr) return;
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
  // 1. 功德数据+1，自动触发你写好的本地存储，关掉网页数字也不会丢
  state.muyuCount = (state.muyuCount || 0) + 1;
  saveState();
  
  // 2. 实时刷新屏幕上的数字
  document.getElementById("muyuCount").innerText = state.muyuCount;
  
  // 3. 敲击瞬间的缩放反馈，让大拇指点起来有肉眼可见的“Q弹”手感
  const muyu = document.getElementById("muyuNode");
  muyu.style.transform = "scale(0.85)";
  setTimeout(() => muyu.style.transform = "scale(1)", 60);
  
  // 4. 触觉反馈：如果用手机浏览器玩，敲击时会有微妙的物理震动，极其解压
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }

  // 5. 动态生成随机的积德文案
  const floatBox = document.getElementById("muyuFloat");
  const textNode = document.createElement("div");
  
  const words = ["功德 +1", "焦虑 -1", "好运 +1", "头发 +1", "Bug -1", "薪资 +1"];
  textNode.innerText = words[Math.floor(Math.random() * words.length)];
  
  // 漂浮文字的基础样式
  textNode.style.position = "absolute";
  textNode.style.color = "#4da3ff";
  textNode.style.fontSize = "20px";
  textNode.style.fontWeight = "bold";
  textNode.style.whiteSpace = "nowrap";
  textNode.style.transform = "translateX(-50%)";
  
  floatBox.appendChild(textNode);
  
  // 6. 用 Web Animations 让文字向上滑行并淡出
  textNode.animate([
    { transform: 'translate(-50%, 0px)', opacity: 1 },
    { transform: 'translate(-50%, -80px)', opacity: 0 }
  ], {
    duration: 600,
    easing: 'ease-out'
  });
  
  // 7. 动画播完自动清理垃圾节点，保证手机运行丝滑不卡顿
  setTimeout(() => textNode.remove(), 600);
}
