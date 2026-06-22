const tools = [
  {id:'pwd',     cat:'util',   icon:'🔑', name:'密码生成',   desc:'安全随机密码',    grad:'linear-gradient(135deg,#f093fb,#f5576c)'},
  {id:'qr',      cat:'util',   icon:'⬛', name:'二维码生成',  desc:'文字转二维码',    grad:'linear-gradient(135deg,#4facfe,#00f2fe)'},
  {id:'color',   cat:'util',   icon:'🎨', name:'颜色转换',   desc:'HEX / RGB / HSL', grad:'linear-gradient(135deg,#f7971e,#ffd200)'},
  {id:'ts',      cat:'util',   icon:'🕐', name:'时间戳',     desc:'时间戳互转',      grad:'linear-gradient(135deg,#43e97b,#38f9d7)'},
  {id:'hash',    cat:'crypto', icon:'#',  name:'Hash计算',   desc:'SHA-1 / 256 / 512',grad:'linear-gradient(135deg,#11998e,#38ef7d)'},
  {id:'aes',     cat:'crypto', icon:'🔒', name:'AES加密',    desc:'加密解密文本',    grad:'linear-gradient(135deg,#fa709a,#fee140)'},
  {id:'b64',     cat:'crypto', icon:'B6', name:'Base64',    desc:'编码与解码',       grad:'linear-gradient(135deg,#a18cd1,#fbc2eb)'},
  {id:'json',    cat:'dev',    icon:'{}', name:'JSON格式化',  desc:'美化 / 压缩 JSON',grad:'linear-gradient(135deg,#0ba360,#3cba92)'},
  {id:'regex',   cat:'dev',    icon:'.*', name:'正则测试',   desc:'实时匹配测试',    grad:'linear-gradient(135deg,#f093fb,#f5576c)'},
  {id:'url',     cat:'dev',    icon:'🔗', name:'URL编解码',  desc:'编码 / 解码 URL', grad:'linear-gradient(135deg,#4481eb,#04befe)'},
  {id:'ai',      cat:'ai',     icon:'✦',  name:'AI对话',     desc:'云端大模型对话',  grad:'linear-gradient(135deg,#667eea,#764ba2)'},
  {id:'ip',      cat:'net',    icon:'🌐', name:'IP查询',     desc:'查询IP详细信息',  grad:'linear-gradient(135deg,#11998e,#38ef7d)'},
  {id:'httpcode',cat:'net',    icon:'📡', name:'HTTP状态码', desc:'状态码速查手册',  grad:'linear-gradient(135deg,#f7971e,#ffd200)'},
];

const CAT_LABELS = {
  util:   '实用工具',
  crypto: '加密安全',
  dev:    '开发工具',
  ai:     'AI 助手',
  net:    '网络工具',
};

let tsTimer = null;
let qrLoaded = false;
let isQrLoading = false;
let qrInstance = null;
let isAiLoading = false;
let aiAbortController = null;
let aiMessages = [];
let aiTypeTimer = null;
let regexWorker = null;
let isIpLoading = false;
let colorDebounceTimer = null;

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1500);
}

function copyText(id) {
  const el = document.getElementById(id);
  const txt = el ? (el.tagName==='INPUT'||el.tagName==='TEXTAREA' ? el.value : el.textContent) : '';
  if (!txt) { showToast('无可复制内容'); return; }
  navigator.clipboard.writeText(txt).then(() => showToast('已复制')).catch(() => showToast('复制失败'));
}

function debounce(fn, delay=150) {
  let timer = null;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

function getRecent() {
  try { return JSON.parse(localStorage.getItem('cwj_recent') || '[]'); }
  catch { return []; }
}
function addRecent(id) {
  let r = getRecent();
  r = [id, ...r.filter(x => x !== id)].slice(0, 4);
  localStorage.setItem('cwj_recent', JSON.stringify(r));
}
function clearRecent() {
  localStorage.removeItem('cwj_recent');
  renderRecent();
  showToast('已清除记录');
}
function renderRecent() {
  const el = document.getElementById('recentList');
  if (!el) return;
  const recent = getRecent();
  if (!recent.length) {
    el.innerHTML = '<div class="recent-empty">暂无最近使用的工具</div>';
    return;
  }
  el.innerHTML = '';
  recent.forEach(id => {
    const t = tools.find(x => x.id === id);
    if (!t) return;
    const card = document.createElement('div');
    card.className = 'recent-card';
    card.style.background = t.grad;
    card.innerHTML = `<div class="recent-card-icon">${t.icon}</div><div class="recent-card-name">${t.name}</div>`;
    card.onclick = () => openTool(t.id);
    el.appendChild(card);
  });
}

function createToolRow(t) {
  const row = document.createElement('div');
  row.className = 'tool-row';
  row.innerHTML = `
    <div class="tool-row-icon" style="background:${t.grad}">${t.icon}</div>
    <div class="tool-row-info">
      <div class="tool-row-name">${t.name}</div>
      <div class="tool-row-desc">${t.desc}</div>
    </div>
    <svg class="tool-row-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="9,18 15,12 9,6"/>
    </svg>`;
  row.onclick = () => openTool(t.id);
  return row;
}

function renderHome() {
  renderRecent();
  const container = document.getElementById('homeSections');
  if (!container) return;
  container.innerHTML = '';
  Object.entries(CAT_LABELS).forEach(([cat, label]) => {
    const catTools = tools.filter(t => t.cat === cat);
    if (!catTools.length) return;
    const sec = document.createElement('div');
    sec.className = 'section';
    sec.innerHTML = `<div class="section-header"><span class="section-title">${label}</span></div>`;
    const list = document.createElement('div');
    list.className = 'tool-list';
    catTools.forEach(t => list.appendChild(createToolRow(t)));
    sec.appendChild(list);
    container.appendChild(sec);
  });
}

function renderAllTools() {
  const container = document.getElementById('allToolsList');
  if (!container) return;
  container.innerHTML = '';
  Object.entries(CAT_LABELS).forEach(([cat, label]) => {
    const catTools = tools.filter(t => t.cat === cat);
    if (!catTools.length) return;
    const sec = document.createElement('div');
    sec.className = 'section';
    sec.innerHTML = `<div class="section-header"><span class="section-title">${label}</span></div>`;
    const list = document.createElement('div');
    list.className = 'tool-list';
    catTools.forEach(t => list.appendChild(createToolRow(t)));
    sec.appendChild(list);
    container.appendChild(sec);
  });
}

function searchTools(query) {
  const q = query.trim().toLowerCase();
  const resultsEl = document.getElementById('searchResultsList');
  const allListEl = document.getElementById('allToolsList');
  const clearBtn = document.getElementById('searchClear');
  const resultsWrap = document.getElementById('searchResultsWrap');
  if (!resultsEl || !allListEl) return;
  if (!q) {
    resultsWrap.style.display = 'none';
    allListEl.style.display = '';
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }
  if (clearBtn) clearBtn.style.display = '';
  const filtered = tools.filter(t =>
    t.name.includes(q) || t.desc.toLowerCase().includes(q) || t.id.includes(q)
  );
  resultsWrap.style.display = '';
  allListEl.style.display = 'none';
  resultsEl.innerHTML = '';
  if (!filtered.length) {
    resultsEl.innerHTML = '<div class="search-empty">未找到相关工具</div>';
    return;
  }
  filtered.forEach(t => resultsEl.appendChild(createToolRow(t)));
}
function clearSearch() {
  const input = document.getElementById('searchInput');
  if (input) { input.value = ''; searchTools(''); }
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById(`page-${name}`);
  const nav = document.getElementById(`nav-${name}`);
  if (page) page.classList.add('active');
  if (nav) nav.classList.add('active');
  if (name === 'tools') renderAllTools();
  if (name === 'home') renderRecent();
}

function openTool(id) {
  addRecent(id);
  const t = tools.find(x => x.id === id);
  if (!t) return;
  document.getElementById('panelTitle').textContent = t.icon + ' ' + t.name;
  document.getElementById('panelBody').innerHTML = getPanelHTML(id);
  document.getElementById('overlay').classList.add('show');
  if (id === 'ts') initTs();
  if (id === 'ai') {
    if (aiTypeTimer) { clearInterval(aiTypeTimer); aiTypeTimer = null; }
    aiMessages = [];
    document.getElementById('chatBox').innerHTML = '';
  }
  if (id === 'httpcode') renderHttpCodes();
  setTimeout(() => {
    const first = document.querySelector('#panelBody input, #panelBody textarea');
    if (first) first.focus();
  }, 420);
}

function closePanel(e) {
  if (!e || e.target === document.getElementById('overlay')) {
    document.getElementById('overlay').classList.remove('show');
    if (tsTimer) { clearInterval(tsTimer); tsTimer = null; }
    if (aiTypeTimer) { clearInterval(aiTypeTimer); aiTypeTimer = null; }
    if (aiAbortController) { aiAbortController.abort(); aiAbortController = null; }
    isAiLoading = false;
    isIpLoading = false;
    aiMessages = [];
    if (regexWorker) { regexWorker.terminate(); regexWorker = null; }
    const chatBox = document.getElementById('chatBox');
    if (chatBox) chatBox.innerHTML = '';
  }
}

function getPanelHTML(id) {
  if (id==='pwd') return `<div class="field"><label>长度 <span id="pwdLenVal">16</span></label><input type="range" id="pwdLen" min="8" max="32" value="16" oninput="document.getElementById('pwdLenVal').textContent=this.value"></div><div class="field"><label><input type="checkbox" id="pwdUpper" checked> 大写 &nbsp;<input type="checkbox" id="pwdNum" checked> 数字 &nbsp;<input type="checkbox" id="pwdSym"> 符号</label></div><div class="result-box" id="pwdResult">点击生成</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="genPwd()">生成</button><button class="btn btn-ghost" onclick="copyText('pwdResult')">复制</button></div>`;
  if (id==='qr') return `<div class="field"><label>输入文字或链接</label><textarea id="qrInput" placeholder="https://..."></textarea></div><div id="qrOut" style="text-align:center;margin:10px 0"></div><div class="btn-row"><button class="btn btn-primary" onclick="genQR()">生成二维码</button></div>`;
  if (id==='color') return `<div class="field"><label>HEX</label><input id="hexIn" placeholder="#00b4ff" oninput="debouncedConvertColor('hex')"></div><div class="field"><label>RGB</label><input id="rgbIn" placeholder="0, 180, 255" oninput="debouncedConvertColor('rgb')"></div><div class="field"><label>HSL</label><input id="hslIn" placeholder="197, 100%, 50%" readonly></div><div id="colorPreview" style="height:48px;border-radius:10px;margin-top:8px;border:1px solid rgba(255,255,255,0.1)"></div>`;
  if (id==='ts') return `<div class="field"><label>当前时间戳</label><div class="result-box" id="tsNow">-</div></div><div class="field"><label>时间戳转日期</label><input id="tsInput" placeholder="1700000000" onkeydown="if(event.key==='Enter')convertTs()"></div><div class="result-box" id="tsResult">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="convertTs()">转换</button><button class="btn btn-ghost" onclick="copyText('tsResult')">复制</button></div>`;
  if (id==='hash') return `<div class="field"><label>输入文本</label><textarea id="hashInput" placeholder="输入内容..."></textarea></div><div class="field"><label>算法</label><select id="hashAlgo"><option value="SHA-1">SHA-1</option><option value="SHA-256" selected>SHA-256</option><option value="SHA-512">SHA-512</option></select></div><div class="result-box" id="hashResult">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="calcHash()">计算</button><button class="btn btn-ghost" onclick="copyText('hashResult')">复制</button></div>`;
  if (id==='aes') return `<div class="field"><label>文本</label><textarea id="aesInput" placeholder="输入内容..."></textarea></div><div class="field"><label>密钥</label><input id="aesKey" placeholder="输入任意密码（自动转为32位安全密钥）"></div><div class="result-box" id="aesResult">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="aesEncrypt()">加密</button><button class="btn btn-ghost" onclick="aesDecrypt()">解密</button><button class="btn btn-ghost" onclick="copyText('aesResult')">复制</button></div>`;
  if (id==='b64') return `<div class="field"><label>输入</label><textarea id="b64Input" placeholder="输入内容..."></textarea></div><div class="result-box" id="b64Result">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="b64Encode()">编码</button><button class="btn btn-ghost" onclick="b64Decode()">解码</button><button class="btn btn-ghost" onclick="copyText('b64Result')">复制</button></div>`;
  if (id==='json') return `<div class="field"><label>JSON内容</label><textarea id="jsonInput" placeholder='{"key":"value"}' style="min-height:120px"></textarea></div><div class="result-box" id="jsonResult" style="white-space:pre;min-height:80px">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="fmtJson()">格式化</button><button class="btn btn-ghost" onclick="minJson()">压缩</button><button class="btn btn-ghost" onclick="copyText('jsonResult')">复制</button></div>`;
  if (id==='regex') return `<div class="field"><label>正则表达式</label><input id="regexPat" placeholder="\\d+"></div><div class="field"><label>测试文本</label><textarea id="regexText" placeholder="输入测试内容..."></textarea></div><div class="result-box" id="regexResult">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="testRegex()">测试</button></div>`;
  if (id==='url') return `<div class="field"><label>输入</label><textarea id="urlInput" placeholder="输入内容..."></textarea></div><div class="result-box" id="urlResult">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="urlEncode()">编码</button><button class="btn btn-ghost" onclick="urlDecode()">解码</button><button class="btn btn-ghost" onclick="copyText('urlResult')">复制</button></div>`;
  if (id==='ai') return `<div class="chat-box" id="chatBox"></div><div class="field"><textarea id="aiInput" placeholder="输入问题..." style="min-height:60px"></textarea></div><div class="btn-row"><button class="btn btn-primary" onclick="sendAI()">发送</button></div>`;
  if (id==='ip') return `<div class="field"><label>IP 地址（留空查询本机）</label><input id="ipInput" placeholder="如：1.1.1.1（留空查本机）" onkeydown="if(event.key==='Enter')ipQuery()"></div><div class="btn-row" style="margin-bottom:14px"><button class="btn btn-primary" onclick="ipQuery()">查询</button><button class="btn btn-ghost" onclick="document.getElementById('ipInput').value='';ipQuery()">查本机</button></div><div id="ipResult" class="ip-result-box" style="display:none"></div>`;
  if (id==='httpcode') return `<div class="field"><input id="httpSearchInput" placeholder="输入状态码或关键词，如：404" oninput="filterHttpCodes(this.value)"></div><div id="httpCodeList" class="http-code-list"></div>`;
  return '<p style="color:rgba(255,255,255,.35);text-align:center;padding:30px">开发中...</p>';
}

const debouncedConvertColor = debounce(convertColor);function genPwd() {
  const len = parseInt(document.getElementById('pwdLen').value, 10);
  let chars = 'abcdefghijklmnopqrstuvwxyz';
  if (document.getElementById('pwdUpper').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (document.getElementById('pwdNum').checked) chars += '0123456789';
  if (document.getElementById('pwdSym').checked) chars += '!@#$%^&*';
  if (!chars.length) chars = 'abcdefghijklmnopqrstuvwxyz';
  const rv = new Uint32Array(len);
  crypto.getRandomValues(rv);
  let pwd = '';
  for (let i = 0; i < len; i++) pwd += chars[rv[i] % chars.length];
  document.getElementById('pwdResult').textContent = pwd;
}

function genQR() {
  const text = document.getElementById('qrInput').value.trim();
  if (!text) return;
  const out = document.getElementById('qrOut');
  if (qrInstance && typeof qrInstance.clear === 'function') { qrInstance.clear(); qrInstance = null; }
  out.innerHTML = '';
  if (!qrLoaded) {
    if (isQrLoading) return;
    isQrLoading = true;
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload = () => { qrLoaded = true; isQrLoading = false; qrInstance = new QRCode(out, {text, width:180, height:180, colorDark:'#00d4e8', colorLight:'#1e1e2a'}); };
    s.onerror = () => { isQrLoading = false; showToast('库加载失败，请重试'); };
    document.head.appendChild(s);
  } else {
    qrInstance = new QRCode(out, {text, width:180, height:180, colorDark:'#00d4e8', colorLight:'#1e1e2a'});
  }
}

function convertColor(from) {
  try {
    let r, g, b;
    if (from === 'hex') {
      const h = document.getElementById('hexIn').value.replace('#', '');
      if (!/^[0-9a-fA-F]{6}$/.test(h)) return;
      r = parseInt(h.slice(0,2),16); g = parseInt(h.slice(2,4),16); b = parseInt(h.slice(4,6),16);
    } else {
      const val = document.getElementById('rgbIn').value;
      if (!/^\d{1,3},\s*\d{1,3},\s*\d{1,3}$/.test(val)) return;
      const p = val.split(',').map(x => parseInt(x.trim(),10));
      if (p.some(n => n>255||n<0)) return;
      r=p[0]; g=p[1]; b=p[2];
    }
    document.getElementById('hexIn').value = '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
    document.getElementById('rgbIn').value = r+', '+g+', '+b;
    const rn=r/255,gn=g/255,bn=b/255,max=Math.max(rn,gn,bn),min=Math.min(rn,gn,bn);
    let h=0,s=0,l=(max+min)/2;
    if (max!==min) {
      const d=max-min;
      s=l>.5?d/(2-max-min):d/(max+min);
      h=max===rn?(gn-bn)/d+(gn<bn?6:0):max===gn?(bn-rn)/d+2:(rn-gn)/d+4;
      h=Math.round(h*60);
    }
    document.getElementById('hslIn').value=h+', '+Math.round(s*100)+'%, '+Math.round(l*100)+'%';
    document.getElementById('colorPreview').style.background=document.getElementById('hexIn').value;
  } catch(e) {}
}

function initTs() {
  if (tsTimer) clearInterval(tsTimer);
  tsTimer = setInterval(() => { const el=document.getElementById('tsNow'); if(el) el.textContent=Math.floor(Date.now()/1000); }, 1000);
}

function convertTs() {
  try {
    const num = parseInt(document.getElementById('tsInput').value.trim(), 10);
    if (isNaN(num)) { showToast('请输入有效的时间戳'); return; }
    const d = new Date(num<10000000000?num*1000:num);
    document.getElementById('tsResult').textContent = isNaN(d.getTime())?'无效时间戳':d.toLocaleString('zh-CN');
  } catch(e) { showToast('时间戳格式错误'); }
}

async function calcHash() {
  try {
    const buf = await crypto.subtle.digest(
      document.getElementById('hashAlgo').value,
      new TextEncoder().encode(document.getElementById('hashInput').value)
    );
    document.getElementById('hashResult').textContent = Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  } catch(e) { showToast('哈希计算失败'); }
}

async function getKey(k) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(k));
  return crypto.subtle.importKey('raw', buf, {name:'AES-GCM'}, false, ['encrypt','decrypt']);
}

async function aesEncrypt() {
  try {
    const keyStr = document.getElementById('aesKey').value;
    if (!keyStr) { showToast('请输入密钥'); return; }
    const key = await getKey(keyStr);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = await crypto.subtle.encrypt({name:'AES-GCM',iv}, key, new TextEncoder().encode(document.getElementById('aesInput').value));
    const combined = new Uint8Array(iv.length+enc.byteLength);
    combined.set(iv); combined.set(new Uint8Array(enc),iv.length);
    document.getElementById('aesResult').textContent = btoa(String.fromCharCode(...combined));
  } catch(e) { showToast('加密失败：'+e.message); }
}

async function aesDecrypt() {
  try {
    const keyStr = document.getElementById('aesKey').value;
    if (!keyStr) { showToast('请输入密钥'); return; }
    const key = await getKey(keyStr);
    const raw = document.getElementById('aesInput').value.trim();
    if (!raw) throw new Error('内容为空');
    const combined = Uint8Array.from(atob(raw), c=>c.charCodeAt(0));
    if (combined.length<28) throw new 
