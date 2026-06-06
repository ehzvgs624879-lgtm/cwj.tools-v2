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
  const q    = searchEl ? searchEl.value.toLowerCase() : "";
  const list = document.getElementById("list");
  if(!list) return;
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
// ── LineWaves 背景 ────────────────────────────────
(function () {
  const canvas = document.getElementById('canvas');
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
  if (!gl) return;

  const CFG = {
    speed:           0.7,
    innerLineCount:  30.0,
    outerLineCount:  36.0,
    warpIntensity:   1.0,
    rotation:        -45 * Math.PI / 180,
    edgeFadeWidth:   0.0,
    colorCycleSpeed: 1.5,
    brightness:      1.8,
    color1:          [0.918, 0.702, 0.031],
    color2:          [0.518, 0.800, 0.086],
    color3:          [0.925, 0.282, 0.600],
    mouseInfluence:  0.1,
    enableMouse:     true,
  };

  const vert = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  const frag = `
precision highp float;
uniform float uTime;
uniform vec2  uResolution;
uniform float uSpeed;
uniform float uInnerLines;
uniform float uOuterLines;
uniform float uWarpIntensity;
uniform float uRotation;
uniform float uEdgeFadeWidth;
uniform float uColorCycleSpeed;
uniform float uBrightness;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform vec2  uMouse;
uniform float uMouseInfluence;
uniform bool  uEnableMouse;
#define HALF_PI 1.5707963
float hashF(float n) { return fract(sin(n * 127.1) * 43758.5453123); }
float smoothNoise(float x) {
  float i = floor(x); float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hashF(i), hashF(i + 1.0), u);
}
float displaceA(float coord, float t) {
  float r = sin(coord * 2.123) * 0.2;
  r += sin(coord * 3.234 + t * 4.345) * 0.1;
  r += sin(coord * 0.589 + t * 0.934) * 0.5;
  return r;
}
float displaceB(float coord, float t) {
  float r = sin(coord * 1.345) * 0.3;
  r += sin(coord * 2.734 + t * 3.345) * 0.2;
  r += sin(coord * 0.189 + t * 0.934) * 0.3;
  return r;
}
vec2 rotate2D(vec2 p, float angle) {
  float c = cos(angle); float s = sin(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}
void main() {
  vec2 coords = gl_FragCoord.xy / uResolution;
  coords = coords * 2.0 - 1.0;
  coords = rotate2D(coords, uRotation);
  float halfT = uTime * uSpeed * 0.5;
  float fullT = uTime * uSpeed;
  float mouseWarp = 0.0;
  if (uEnableMouse) {
    vec2 mPos = rotate2D(uMouse * 2.0 - 1.0, uRotation);
    float mDist = length(coords - mPos);
    mouseWarp = uMouseInfluence * exp(-mDist * mDist * 4.0);
  }
  float warpAx = coords.x + displaceA(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpAy = coords.y - displaceA(coords.x * cos(fullT) * 1.235, halfT) * uWarpIntensity;
  float warpBx = coords.x + displaceB(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpBy = coords.y - displaceB(coords.x * sin(fullT) * 1.235, halfT) * uWarpIntensity;
  vec2 fieldA  = vec2(warpAx, warpAy);
  vec2 fieldB  = vec2(warpBx, warpBy);
  vec2 blended = mix(fieldA, fieldB, 0.5);
  float fadeTop    = smoothstep( uEdgeFadeWidth,  uEdgeFadeWidth + 0.4, blended.y);
  float fadeBottom = smoothstep(-uEdgeFadeWidth, -(uEdgeFadeWidth + 0.4), blended.y);
  float vMask = 1.0 - max(fadeTop, fadeBottom);
  float tileCount = mix(uOuterLines, uInnerLines, vMask);
  float scaledY   = blended.y * tileCount;
  float nY        = smoothNoise(abs(scaledY));
  float ridge = pow(step(abs(nY - blended.x) * 2.0, HALF_PI) * cos(2.0 * (nY - blended.x)), 5.0);
  float lines = 0.0;
  for (float i = 1.0; i < 3.0; i += 1.0) {
    lines += pow(max(fract(scaledY), fract(-scaledY)), i * 2.0);
  }
  float pattern = vMask * lines;
  float cycleT  = fullT * uColorCycleSpeed;
  float rChannel = (pattern + lines * ridge) * (cos(blended.y + cycleT * 0.234) * 0.5 + 1.0);
  float gChannel = (pattern + vMask  * ridge) * (sin(blended.x + cycleT * 1.745) * 0.5 + 1.0);
  float bChannel = (pattern + lines * ridge) * (cos(blended.x + cycleT * 0.534) * 0.5 + 1.0);
  vec3  col   = (rChannel * uColor1 + gChannel * uColor2 + bChannel * uColor3) * uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}`;function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vert));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(program);
  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  ['uTime','uResolution','uSpeed','uInnerLines','uOuterLines',
   'uWarpIntensity','uRotation','uEdgeFadeWidth','uColorCycleSpeed',
   'uBrightness','uColor1','uColor2','uColor3',
   'uMouse','uMouseInfluence','uEnableMouse'
  ].forEach(n => U[n] = gl.getUniformLocation(program, n));

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  let mouse = [0.5, 0.5];
  let target = [0.5, 0.5];

  window.addEventListener('mousemove', e => {
    target = [e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight];
  });
  window.addEventListener('touchmove', e => {
    const t = e.touches[0];
    target = [t.clientX / window.innerWidth, 1 - t.clientY / window.innerHeight];
  }, { passive: true });

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let start = null;
  function frame(ts) {
    if (!start) start = ts;
    const t = (ts - start) / 1000;

    mouse[0] += (target[0] - mouse[0]) * 0.06;
    mouse[1] += (target[1] - mouse[1]) * 0.06;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(U.uTime,            t);
    gl.uniform2f(U.uResolution,      canvas.width, canvas.height);
    gl.uniform1f(U.uSpeed,           CFG.speed);
    gl.uniform1f(U.uInnerLines,      CFG.innerLineCount);
    gl.uniform1f(U.uOuterLines,      CFG.outerLineCount);
    gl.uniform1f(U.uWarpIntensity,   CFG.warpIntensity);
    gl.uniform1f(U.uRotation,        CFG.rotation);
    gl.uniform1f(U.uEdgeFadeWidth,   CFG.edgeFadeWidth);
    gl.uniform1f(U.uColorCycleSpeed, CFG.colorCycleSpeed);
    gl.uniform1f(U.uBrightness,      CFG.brightness);
    gl.uniform3fv(U.uColor1,         CFG.color1);
    gl.uniform3fv(U.uColor2,         CFG.color2);
    gl.uniform3fv(U.uColor3,         CFG.color3);
    gl.uniform2fv(U.uMouse,          mouse);
    gl.uniform1f(U.uMouseInfluence,  CFG.mouseInfluence);
    gl.uniform1i(U.uEnableMouse,     CFG.enableMouse ? 1 : 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
