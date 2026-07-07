const tools = [
  {id:'pwd',     cat:'util',   icon:'🔑', name:'密码生成',   desc:'安全随机密码',    grad:'linear-gradient(145deg,#2d3436,#636e72)'},
  {id:'qr',      cat:'util',   icon:'⬛', name:'二维码生成',  desc:'文字转二维码',    grad:'linear-gradient(145deg,#2c3e50,#4a6572)'},
  {id:'color',   cat:'util',   icon:'🎨', name:'颜色转换',   desc:'HEX / RGB / HSL', grad:'linear-gradient(145deg,#5d4e60,#9b89a6)'},
  {id:'ts',      cat:'util',   icon:'🕐', name:'时间戳',     desc:'时间戳互转',      grad:'linear-gradient(145deg,#34495e,#5d7a8a)'},
  {id:'hash',    cat:'crypto', icon:'#',  name:'Hash计算',   desc:'SHA-1 / 256 / 512',grad:'linear-gradient(145deg,#0f3443,#34e89e)'},
  {id:'aes',     cat:'crypto', icon:'🔒', name:'AES加密',    desc:'加密解密文本',    grad:'linear-gradient(145deg,#1a2980,#26d0ce)'},
  {id:'b64',     cat:'crypto', icon:'B6', name:'Base64',    desc:'编码与解码',       grad:'linear-gradient(145deg,#3a6186,#89253e)'},
  {id:'json',    cat:'dev',    icon:'{}', name:'JSON格式化',  desc:'美化 / 压缩 JSON',grad:'linear-gradient(145deg,#134e5e,#71b280)'},
  {id:'regex',   cat:'dev',    icon:'.*', name:'正则测试',   desc:'实时匹配测试',    grad:'linear-gradient(145deg,#4b6cb7,#182848)'},
  {id:'url',     cat:'dev',    icon:'🔗', name:'URL编解码',  desc:'编码 / 解码 URL', grad:'linear-gradient(145deg,#2c5364,#203a43,#0f2027)'},
  {id:'ai',      cat:'ai',     icon:'✦',  name:'AI对话',     desc:'云端大模型对话',  grad:'linear-gradient(145deg,#5f2c82,#49a09d)'},
  {id:'ip',      cat:'net',    icon:'🌐', name:'IP查询',     desc:'查询IP详细信息',  grad:'linear-gradient(145deg,#1e3c72,#2a5298)'},
  {id:'httpcode',cat:'net',    icon:'📡', name:'HTTP状态码', desc:'状态码速查手册',  grad:'linear-gradient(145deg,#485563,#29323c)'},
  {id:'speedtest',cat:'net',   icon:'⚡', name:'网速测试',   desc:'测试网络下载速度', grad:'linear-gradient(145deg,#0f2027,#2c5364)'},
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
let isSpeedTesting = false;
let speedAbortController = null;

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
    card.style.border = '1px solid rgba(255,255,255,0.08)';
    card.innerHTML = `<div class="recent-card-icon">${t.icon}</div><div class="recent-card-name">${t.name}</div>`;
    card.onclick = () => openTool(t.id);
    el.appendChild(card);
  });
}

function createToolRow(t) {
  const row = document.createElement('div');
  row.className = 'tool-row';
  row.innerHTML = `
    <div class="tool-row-icon" style="background: ${t.grad}; color: white;">${t.icon}</div>
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

function createToolCard(t) {
  const card = document.createElement('div');
  card.className = 'tool-grid-card';
  card.setAttribute('data-cat', t.cat);
  card.style.animationDelay = (tools.indexOf(t) * 0.05) + 's';
  card.innerHTML = `
    <div class="tool-grid-card-icon" style="background: ${t.grad};">${t.icon}</div>
    <div class="tool-grid-card-name">${t.name}</div>
  `;
  card.onclick = () => openTool(t.id);
  return card;
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
    sec.className = 'tool-grid-section';
    sec.innerHTML = `<div class="tool-grid-header"><span class="tool-grid-title">${label}</span></div>`;
    const grid = document.createElement('div');
    grid.className = 'tool-grid';
    catTools.forEach(t => grid.appendChild(createToolCard(t)));
    sec.appendChild(grid);
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
    openAiFullScreen();
    return;
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
    if (speedAbortController) { speedAbortController.abort(); speedAbortController = null; }
    isAiLoading = false;
    isIpLoading = false;
    isSpeedTesting = false;
    if (regexWorker) { regexWorker.terminate(); regexWorker = null; }
    const chatBox = document.getElementById('chatBox');
    if (chatBox) chatBox.innerHTML = '';
  }
}

function getPanelHTML(id) {
  // Password generator
  if (id==='pwd') return `<div class="panel-section">
    <div class="field"><label>长度 <span id="pwdLenVal">16</span></label><input type="range" id="pwdLen" min="8" max="32" value="16" oninput="document.getElementById('pwdLenVal').textContent=this.value"></div>
    <div class="field"><label class="checkbox-group"><input type="checkbox" id="pwdUpper" checked> 大写 <input type="checkbox" id="pwdNum" checked> 数字 <input type="checkbox" id="pwdSym"> 符号</label></div>
    <div class="result-box" id="pwdResult">点击生成</div>
    <div class="btn-row"><button class="btn btn-primary" onclick="genPwd()">生成</button><button class="btn btn-ghost" onclick="copyText('pwdResult')">复制</button></div>
  </div>`;
  // QR Code
  if (id==='qr') return `<div class="panel-section">
    <div class="field"><label>输入文字或链接</label><textarea id="qrInput" placeholder="https://..."></textarea></div>
    <div id="qrOut" class="qr-out"></div>
    <div class="btn-row"><button class="btn btn-primary" onclick="genQR()">生成二维码</button></div>
  </div>`;
  // Color Converter
  if (id==='color') return `<div class="panel-section">
    <div class="field"><label>HEX</label><input id="hexIn" placeholder="#00b4ff" oninput="debouncedConvertColor('hex')"></div>
    <div class="field"><label>RGB</label><input id="rgbIn" placeholder="0, 180, 255" oninput="debouncedConvertColor('rgb')"></div>
    <div class="field"><label>HSL</label><input id="hslIn" placeholder="197, 100%, 50%" readonly></div>
    <div class="color-preview" id="colorPreview"></div>
  </div>`;
  // Timestamp
  if (id==='ts') return `<div class="panel-section">
    <div class="field"><label>当前时间戳</label><div class="result-box" id="tsNow">-</div></div>
    <div class="field"><label>时间戳转日期</label><input id="tsInput" placeholder="1700000000" onkeydown="if(event.key==='Enter')convertTs()"></div>
    <div class="result-box" id="tsResult">-</div>
    <div class="btn-row"><button class="btn btn-primary" onclick="convertTs()">转换</button><button class="btn btn-ghost" onclick="copyText('tsResult')">复制</button></div>
  </div>`;
  // Hash Calculator
  if (id==='hash') return `<div class="panel-section">
    <div class="field"><label>输入文本</label><textarea id="hashInput" placeholder="输入内容..."></textarea></div>
    <div class="field"><label>算法</label><select id="hashAlgo"><option value="SHA-1">SHA-1</option><option value="SHA-256" selected>SHA-256</option><option value="SHA-512">SHA-512</option></select></div>
    <div class="result-box" id="hashResult">-</div>
    <div class="btn-row"><button class="btn btn-primary" onclick="calcHash()">计算</button><button class="btn btn-ghost" onclick="copyText('hashResult')">复制</button></div>
  </div>`;
  // AES Encryption
  if (id==='aes') return `<div class="panel-section">
    <div class="field"><label>文本</label><textarea id="aesInput" placeholder="输入内容..."></textarea></div>
    <div class="field"><label>密钥</label><input id="aesKey" placeholder="输入任意密码（自动转为32位安全密钥）"></div>
    <div class="result-box" id="aesResult">-</div>
    <div class="btn-row"><button class="btn btn-primary" onclick="aesEncrypt()">加密</button><button class="btn btn-ghost" onclick="aesDecrypt()">解密</button><button class="btn btn-ghost" onclick="copyText('aesResult')">复制</button></div>
  </div>`;
  // Base64
  if (id==='b64') return `<div class="panel-section">
    <div class="field"><label>输入</label><textarea id="b64Input" placeholder="输入内容..."></textarea></div>
    <div class="result-box" id="b64Result">-</div>
    <div class="btn-row"><button class="btn btn-primary" onclick="b64Encode()">编码</button><button class="btn btn-ghost" onclick="b64Decode()">解码</button><button class="btn btn-ghost" onclick="copyText('b64Result')">复制</button></div>
  </div>`;
  // JSON Formatter
  if (id==='json') return `<div class="panel-section">
    <div class="field"><label>JSON内容</label><textarea id="jsonInput" placeholder='{"key":"value"}' class="textarea-mono"></textarea></div>
    <div class="result-box result-mono" id="jsonResult">-</div>
    <div class="btn-row"><button class="btn btn-primary" onclick="fmtJson()">格式化</button><button class="btn btn-ghost" onclick="minJson()">压缩</button><button class="btn btn-ghost" onclick="copyText('jsonResult')">复制</button></div>
  </div>`;
  // Regex Tester
  if (id==='regex') return `<div class="panel-section">
    <div class="field"><label>正则表达式</label><input id="regexPat" placeholder="\\d+"></div>
    <div class="field"><label>测试文本</label><textarea id="regexText" placeholder="输入测试内容..."></textarea></div>
    <div class="result-box" id="regexResult">-</div>
    <div class="btn-row"><button class="btn btn-primary" onclick="testRegex()">测试</button></div>
  </div>`;
  // URL Codec
  if (id==='url') return `<div class="panel-section">
    <div class="field"><label>输入</label><textarea id="urlInput" placeholder="输入内容..."></textarea></div>
    <div class="result-box" id="urlResult">-</div>
    <div class="btn-row"><button class="btn btn-primary" onclick="urlEncode()">编码</button><button class="btn btn-ghost" onclick="urlDecode()">解码</button><button class="btn btn-ghost" onclick="copyText('urlResult')">复制</button></div>
  </div>`;
  // IP Query
  if (id==='ip') return `<div class="panel-section">
    <div class="field"><label>IP 地址（留空查询本机）</label><input id="ipInput" placeholder="如：1.1.1.1（留空查本机）" onkeydown="if(event.key==='Enter')ipQuery()"></div>
    <div class="btn-row"><button class="btn btn-primary" onclick="ipQuery()">查询</button><button class="btn btn-ghost" onclick="document.getElementById('ipInput').value='';ipQuery()">查本机</button></div>
    <div id="ipResult" class="ip-result-box" hidden></div>
  </div>`;
  // HTTP Status Codes
  if (id==='httpcode') return `<div class="panel-section">
    <div class="field"><input id="httpSearchInput" placeholder="输入状态码或关键词，如：404" oninput="filterHttpCodes(this.value)"></div>
    <div id="httpCodeList" class="http-code-list"></div>
  </div>`;
  // Speed Test
  if (id==='speedtest') return `<div class="panel-section">
    <div class="speedtest-container">
      <div class="speedtest-gauge">
        <div class="speedtest-speed" id="speedVal">0.0</div>
        <div class="speedtest-unit">Mbps</div>
      </div>
      <div class="speedtest-progress-bar">
        <div class="speedtest-progress-fill" id="speedProgress"></div>
      </div>
      <div class="speedtest-meta">
        <div class="speedtest-meta-item"><span class="label">延迟 (Ping)</span><span class="val" id="speedPing">-</span></div>
        <div class="speedtest-meta-item"><span class="label">已下载</span><span class="val" id="speedLoaded">0.0 MB</span></div>
      </div>
      <div class="speedtest-status" id="speedStatus">点击“开始测试”开始</div>
      <div class="btn-row btn-row-center"><button class="btn btn-primary" id="speedBtn" onclick="runSpeedTest()">开始测试</button></div>
    </div>
  </div>`;
  return '<div class="panel-section"><p class="panel-placeholder">开发中...</p></div>';
}

const debouncedConvertColor = debounce(convertColor);
function genPwd() {
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
    if (combined.length<28) throw new Error('密文过短');
    const dec = await crypto.subtle.decrypt({name:'AES-GCM',iv:combined.slice(0,12)}, key, combined.slice(12));
    document.getElementById('aesResult').textContent = new TextDecoder().decode(dec);
  } catch(e) { showToast('解密失败，密钥或密文错误'); }
}

function b64Encode() {
  try {
    const utf8 = new TextEncoder().encode(document.getElementById('b64Input').value);
    let binary = '';
    for (let i=0; i<utf8.length; i+=8192) binary += String.fromCharCode(...utf8.subarray(i,i+8192));
    document.getElementById('b64Result').textContent = btoa(binary);
  } catch(e) { showToast('编码错误'); }
}

function b64Decode() {
  try {
    const bytes = Uint8Array.from([...atob(document.getElementById('b64Input').value.trim())].map(c=>c.charCodeAt(0)));
    document.getElementById('b64Result').textContent = new TextDecoder().decode(bytes);
  } catch(e) { showToast('解码错误'); }
}

function fmtJson() {
  try { document.getElementById('jsonResult').textContent = JSON.stringify(JSON.parse(document.getElementById('jsonInput').value),null,2); }
  catch(e) { showToast('JSON格式错误'); }
}

function minJson() {
  try { document.getElementById('jsonResult').textContent = JSON.stringify(JSON.parse(document.getElementById('jsonInput').value)); }
  catch(e) { showToast('JSON格式错误'); }
}

function testRegex() {
  try {
    const pattern = document.getElementById('regexPat').value;
    const testStr = document.getElementById('regexText').value;
    const box = document.getElementById('regexResult');
    if (!pattern) { showToast('请输入正则表达式'); return; }
    if (regexWorker) { regexWorker.terminate(); regexWorker = null; }
    box.textContent = '计算中...';
    const code = `self.onmessage=function(e){try{const{pattern,testStr}=e.data;const reg=new RegExp(pattern,'g');const results=[];let match;while((match=reg.exec(testStr))!==null){results.push(match[0]);if(reg.lastIndex===match.index)reg.lastIndex++;if(results.length>3000){self.postMessage({success:true,results,truncated:true});return;}}self.postMessage({success:true,results});}catch(err){self.postMessage({success:false,error:err.message});}};`;
    regexWorker = new Worker(URL.createObjectURL(new Blob([code],{type:'application/javascript'})));
    const tid = setTimeout(() => {
      if (regexWorker) { regexWorker.terminate(); regexWorker=null; showToast('计算超时'); box.textContent='执行超时（可能存在灾难性回溯，已强行终止）'; }
    }, 300);
    regexWorker.onmessage = e => {
      clearTimeout(tid);
      if (e.data.success) {
        let msg = e.data.results.length ? '匹配'+e.data.results.length+'处：'+e.data.results.join(', ') : '无匹配';
        if (e.data.truncated) msg += '（仅展示前3000处）';
        box.textContent = msg;
      } else { showToast('正则语法错误'); box.textContent='语法错误：'+e.data.error; }
      regexWorker.terminate(); regexWorker=null;
    };
    regexWorker.postMessage({pattern, testStr});
  } catch(e) { showToast('初始化失败'); }
}

function urlEncode() {
  try { document.getElementById('urlResult').textContent = encodeURIComponent(document.getElementById('urlInput').value); }
  catch(e) { showToast('编码失败'); }
}
function urlDecode() {
  try { document.getElementById('urlResult').textContent = decodeURIComponent(document.getElementById('urlInput').value); }
  catch(e) { showToast('解码错误'); }
}

/* ===== AI 全屏对话 + localStorage 持久化 ===== */
const AI_STORAGE_KEY = 'cwj_ai_messages';

// ===== Lightweight Markdown Renderer =====
function renderMarkdown(text) {
  // Escape HTML first
  const esc = escapeHtml(text);
  // Code blocks (``` ... ```) — must come before inline code
  let html = esc.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const lines = code.split('\n');
    // Trim leading empty line if present
    if (lines[0].trim() === '') lines.shift();
    const trimmed = lines.join('\n');
    // Basic syntax highlight (keywords, strings, numbers, comments)
    const highlighted = escapeHtml(trimmed)
      .replace(/\b(function|const|let|var|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof|in|of|def|print|import|true|false|null|undefined)\b/g, '<span class="hl-kw">$1</span>')
      .replace(/("[^"]*")|('[^']*')|(`[^`]*`)/g, '<span class="hl-str">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-num">$1</span>')
      .replace(/\/\/.*$/gm, '<span class="hl-com">$&</span>');
    const langLabel = lang ? `<div class="code-lang">${escapeHtml(lang)}</div>` : '';
    return `<pre><div class="code-header">${langLabel}<button class="code-copy-btn" onclick="copyCodeBlock(this)" title="复制代码">✔ 复制</button></div><code>${highlighted}</code></pre>`;
  });
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Images (before links)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:8px 0;">');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  // Blockquotes
  html = html.replace(/^\s*&gt;\s(.+)$/gm, '<blockquote>$1</blockquote>');
  // Horizontal rules
  html = html.replace(/^\s*[-*_]{3,}\s*$/gm, '<hr>');
  // Tables
  html = html.replace(/\n([^\n]+)\|([^\n]+)\n([-:|\s]+)\|([-:|\s]+)\n(([^\n]+\|[^\n]+\n?)*)/g, (match) => {
    const lines = match.trim().split('\n');
    if (lines.length < 2) return match;
    const headers = lines[0].split('|').map(c => c.trim()).filter(Boolean);
    const rows = lines.slice(2).filter(l => l.includes('|') && !/^[-:|\s]+$/.test(l));
    let table = '<table><thead><tr>';
    headers.forEach(h => { table += `<th>${h}</th>`; });
    table += '</tr></thead><tbody>';
    rows.forEach(row => {
      const cols = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length) {
        table += '<tr>';
        cols.forEach(c => { table += `<td>${c}</td>`; });
        table += '</tr>';
      }
    });
    table += '</tbody></table>';
    return '\n' + table;
  });
  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Unordered lists
  html = html.replace(/^\s*[-*+]\s(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  // Ordered lists
  html = html.replace(/^\s*\d+\.\s(.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> in <ol> if preceded by a number pattern
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => {
    if (m.match(/<\/li>\n<li>/)) return '<ol>' + m + '</ol>';
    return '<ul>' + m + '</ul>';
  });
  // Bold / italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Paragraphs — wrap remaining text blocks
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  // Clean up nested/empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>([\s\S]*?)<\/(?:ul|ol|table|pre|blockquote|h[1-4]|hr)>/g, '$1</$2>');
  html = html.replace(/<(?:ul|ol|table|pre|blockquote|h[1-4]|hr)>\s*<\/p>/g, '');
  return html;
}

function copyCodeBlock(btn) {
  const pre = btn.closest('pre');
  if (!pre) return;
  const code = pre.querySelector('code');
  if (!code) return;
  const text = code.textContent;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✔ 已复制';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '✔ 复制'; btn.classList.remove('copied'); }, 2000);
  }).catch(() => {});
}

// ===== AI State =====
function loadAiMessages() {
  try {
    const saved = localStorage.getItem(AI_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveAiMessages(msgs) {
  try { localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(msgs)); } catch {}
}

function renderAiMessages(msgs, box) {
  if (!box) return;
  if (!msgs.length) {
    box.innerHTML = renderAiWelcome();
    return;
  }
  box.innerHTML = msgs.map((m, i) => renderAiMessageBlock(m, i === msgs.length - 1)).join('');
  box.scrollTop = box.scrollHeight;
}

const AI_SUGGESTIONS = [
  '用中文写一首关于夏天的诗',
  '解释量子计算的基本原理',
  '帮我优化这段 JavaScript 代码',
  'Python 和 JavaScript 的主要区别',
  '写一个简单的 REST API 设计示例',
  '如何学习机器学习？给一个路线图',
];

function renderAiWelcome() {
  return `
    <div class="ai-welcome">
      <div class="ai-welcome-icon">✦</div>
      <div class="ai-welcome-title">开始 AI 对话</div>
      <div class="ai-welcome-sub">
        有任何问题都可以问我 — 编程、写作、分析、创意，无所不答
      </div>
      <div class="ai-suggestions">
        ${AI_SUGGESTIONS.map(s => `<div class="ai-suggestion" onclick="fillAiInput('${escapeHtml(s).replace(/'/g, "\\'")}')">${escapeHtml(s)}</div>`).join('')}
      </div>
    </div>
  `;
}

function renderAiMessageBlock(m, isLast) {
  const role = m.role === 'user' ? 'user' : 'ai';
  const label = m.role === 'user' ? '你' : 'AI';
  const content = m.role === 'user'
    ? `<div class="ai-msg-bubble user-msg">${escapeHtml(m.content)}</div>`
    : `<div class="ai-msg-bubble">${renderMarkdown(m.content)}</div>`;
  return `
    <div class="ai-msg-group">
      <div class="ai-msg-inner">
        <div class="ai-msg-label ${role}">${label}</div>
        ${content}
      </div>
    </div>
  `;
}

function fillAiInput(text) {
  const input = document.getElementById('aiFullInput');
  if (!input) return;
  input.value = text;
  input.focus();
  // Trigger auto-resize
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 150) + 'px';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function openAiFullScreen() {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const aiNav = document.getElementById('nav-ai');
  const aiPage = document.getElementById('page-ai');
  if (aiNav) aiNav.classList.add('active');
  if (aiPage) aiPage.classList.add('active');

  if (aiTypeTimer) { clearInterval(aiTypeTimer); aiTypeTimer = null; }

  aiMessages = loadAiMessages();
  const box = document.getElementById('aiChatBox');
  if (box) renderAiMessages(aiMessages, box);

  setupAiInput();

  setTimeout(() => {
    const input = document.getElementById('aiFullInput');
    if (input) input.focus();
  }, 300);
}

// Auto-resize input on mobile
function setupAiInput() {
  const input = document.getElementById('aiFullInput');
  if (!input) return;
  // Remove old keydown handler, add new one
  input.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAiFull();
    }
  };
  input.oninput = () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 150) + 'px';
  };
}

async function sendAiFull() {
  if (isAiLoading) return;
  const input = document.getElementById('aiFullInput');
  const text = input.value.trim();
  if (!text) return;

  const box = document.getElementById('aiChatBox');

  aiMessages.push({role: 'user', content: text});
  saveAiMessages(aiMessages);

  // Remove welcome if present
  const welcome = box.querySelector('.ai-welcome');
  if (welcome) box.innerHTML = '';

  // Re-render all messages + add thinking state
  box.innerHTML = aiMessages.map((m, i) => renderAiMessageBlock(m, i === aiMessages.length - 1)).join('');
  // Add thinking indicator
  box.innerHTML += `
    <div class="ai-msg-group" id="aiThinking">
      <div class="ai-msg-inner" style="border:none">
        <div class="ai-msg-label ai">AI</div>
        <div class="ai-thinking">
          <div class="ai-thinking-dot"></div>
          <div class="ai-thinking-dot"></div>
          <div class="ai-thinking-dot"></div>
        </div>
      </div>
    </div>
  `;
  input.value = '';
  input.style.height = 'auto';
  box.scrollTop = box.scrollHeight;

  isAiLoading = true;
  const sendBtn = document.getElementById('aiSendBtn');
  if (sendBtn) sendBtn.disabled = true;
  if (aiTypeTimer) { clearInterval(aiTypeTimer); aiTypeTimer = null; }
  aiAbortController = new AbortController();

  try {
    const res = await fetch('https://api.cwj-tools.xyz/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: aiMessages, max_tokens: 1000 }),
      signal: aiAbortController.signal
    });
    const data = await res.json();
    document.getElementById('aiThinking')?.remove();

    // Check we're still on the AI page
    if (!document.getElementById('page-ai').classList.contains('active')) return;

    const fullReply = data.choices?.[0]?.message?.content || '无响应';

    // Create the AI message container with rendered markdown
    const aiGroup = document.createElement('div');
    aiGroup.className = 'ai-msg-group';
    aiGroup.innerHTML = `
      <div class="ai-msg-inner" style="border:none">
        <div class="ai-msg-label ai">AI</div>
        <div class="ai-msg-bubble" id="aiReplyBubble"></div>
      </div>
    `;
    box.appendChild(aiGroup);

    const aiBubble = document.getElementById('aiReplyBubble');

    // Streaming typewriter — render markdown progressively
    let idx = 0;
    let accumulated = '';
    aiTypeTimer = setInterval(() => {
      if (idx >= fullReply.length) {
        clearInterval(aiTypeTimer);
        aiTypeTimer = null;
        // Final render with markdown
        aiBubble.innerHTML = renderMarkdown(fullReply);
        aiMessages.push({ role: 'assistant', content: fullReply });
        saveAiMessages(aiMessages);
        aiBubble.id = '';
        if (sendBtn) sendBtn.disabled = false;
        box.scrollTop = box.scrollHeight;
        return;
      }
      accumulated += fullReply[idx];
      // Batch every 3-4 chars for performance
      aiBubble.innerHTML = renderMarkdown(accumulated);
      box.scrollTop = box.scrollHeight;
      idx++;
    }, 20);
  } catch (e) {
    if (e.name === 'AbortError') { if (sendBtn) sendBtn.disabled = false; return; }
    document.getElementById('aiThinking')?.remove();
    if (!document.getElementById('page-ai').classList.contains('active')) { if (sendBtn) sendBtn.disabled = false; return; }
    // Show error inline
    const errGroup = document.createElement('div');
    errGroup.className = 'ai-msg-group';
    errGroup.innerHTML = `
      <div class="ai-msg-inner" style="border:none">
        <div class="ai-msg-label ai">AI</div>
        <div class="ai-msg-bubble error-msg">
          请求失败：${escapeHtml(e.message)}
        </div>
      </div>
    `;
    document.getElementById('aiChatBox')?.appendChild(errGroup);
    showToast('请求失败，请检查网络或重试');
    if (aiTypeTimer) { clearInterval(aiTypeTimer); aiTypeTimer = null; }
    if (sendBtn) sendBtn.disabled = false;
  } finally {
    isAiLoading = false;
    aiAbortController = null;
  }
}

function clearAiHistory() {
  if (aiMessages.length === 0) {
    showToast('暂无对话记录');
    return;
  }
  if (!confirm('确定清空所有对话记录？')) return;
  aiMessages = [];
  localStorage.removeItem(AI_STORAGE_KEY);
  const box = document.getElementById('aiChatBox');
  if (box) renderAiMessages([], box);
  showToast('已清空对话');
}

// Also wire the in-panel AI if it's ever opened via the tool list
async function sendAI() {
  if (isAiLoading) return;
  const input = document.getElementById('aiInput');
  const text = input.value.trim();
  if (!text) return;
  const box = document.getElementById('chatBox');
  aiMessages.push({role:'user', content:text});
  box.innerHTML += '<div class="msg user">'+escapeHtml(text)+'</div><div class="msg thinking" id="thinking">AI思考中...</div>';
  input.value = ''; box.scrollTop = box.scrollHeight;
  isAiLoading = true;
  if (aiTypeTimer) { clearInterval(aiTypeTimer); aiTypeTimer=null; }
  aiAbortController = new AbortController();
  try {
    const res = await fetch('https://api.cwj-tools.xyz/', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:aiMessages, max_tokens:1000}),
      signal:aiAbortController.signal
    });
    const data = await res.json();
    document.getElementById('thinking')?.remove();
    if (!document.getElementById('overlay')?.classList.contains('show')) { isAiLoading=false; return; }
    const fullReply = data.choices?.[0]?.message?.content || '无响应';
    const aiMsgDom = document.createElement('div');
    aiMsgDom.className = 'msg ai';
    box.appendChild(aiMsgDom);
    let idx = 0;
    let accumulated = '';
    aiTypeTimer = setInterval(() => {
      if (idx >= fullReply.length) {
        clearInterval(aiTypeTimer); aiTypeTimer=null;
        aiMessages.push({role:'assistant',content:fullReply});
        saveAiMessages(aiMessages);
        return;
      }
      accumulated += fullReply[idx];
      aiMsgDom.innerHTML = renderMarkdown(accumulated);
      box.scrollTop = box.scrollHeight;
      idx++;
    }, 25);
  } catch(e) {
    if (e.name==='AbortError') return;
    document.getElementById('thinking')?.remove();
    const b = document.getElementById('chatBox');
    if (b) b.innerHTML += '<div class="msg ai">请求失败：'+escapeHtml(e.message)+'</div>';
    if (aiTypeTimer) { clearInterval(aiTypeTimer); aiTypeTimer=null; }
  } finally {
    isAiLoading = false;
    aiAbortController = null;
  }
}

async function ipQuery() {
  if (isIpLoading) return;
  const input = document.getElementById('ipInput');
  const resultBox = document.getElementById('ipResult');
  if (!input||!resultBox) return;
  const ip = input.value.trim();
  if (ip && !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) { showToast('IP格式不正确'); return; }
  isIpLoading = true;
  resultBox.hidden = false;
  resultBox.innerHTML = '<div class="ip-loading">查询中...</div>';
  try {
    const url = ip ? `https://ipapi.co/${ip}/json/` : `https://ipapi.co/json/`;
    const res = await fetch(url, {headers:{'Accept':'application/json'}});
    const d = await res.json();
    if (d.error) { resultBox.innerHTML='<div class="ip-error">查询失败：'+(d.reason||'未知错误')+'</div>'; return; }
    const orgLower = (d.org||'').toLowerCase();
    const idcKw = ['amazon','alibaba','google','microsoft','digitalocean','linode','vultr','hetzner','cloudflare','tencent','huawei','oracle'];
    let ipType='普通IP', ipClass='ip-tag-normal';
    if (idcKw.some(k=>orgLower.includes(k))) { ipType='IDC机房 IP'; ipClass='ip-tag-idc'; }
    const rows = [
      {label:'IP 地址', value:d.ip||'-'},
      {label:'IP 类型', value:`<span class="ip-tag ${ipClass}">${ipType}</span>`},
      {label:'国家',    value:(d.country_name||'-')+(d.country?` (${d.country})`:'' )},
      {label:'地区',    value:d.region||'-'},
      {label:'城市',    value:d.city||'-'},
      {label:'ISP',     value:d.org||'-'},
      {label:'ASN',     value:d.asn||'-'},
      {label:'时区',    value:d.timezone||'-'},
      {label:'经度',    value:d.longitude??'-'},
      {label:'纬度',    value:d.latitude??'-'},
    ];
    resultBox.innerHTML = `<div class="ip-table">${rows.map(r=>`<div class="ip-row"><div class="ip-label">${r.label}</div><div class="ip-value">${r.value}</div></div>`).join('')}</div>`;
  } catch(e) {
    resultBox.innerHTML = '<div class="ip-error">请求失败：'+e.message+'</div>';
  } finally {
    isIpLoading = false;
  }
}

const HTTP_CODES = [
  {code:100,name:'Continue',desc:'服务器已收到请求头，客户端应继续发送请求体'},
  {code:101,name:'Switching Protocols',desc:'服务器同意切换协议（如WebSocket）'},
  {code:200,name:'OK',desc:'请求成功，返回请求的数据'},
  {code:201,name:'Created',desc:'请求成功，并创建了新资源'},
  {code:202,name:'Accepted',desc:'请求已接受，但尚未处理完成'},
  {code:204,name:'No Content',desc:'请求成功，但无返回内容（如DELETE操作）'},
  {code:206,name:'Partial Content',desc:'返回部分内容，用于断点续传'},
  {code:301,name:'Moved Permanently',desc:'资源永久重定向到新URL'},
  {code:302,name:'Found',desc:'资源临时重定向到新URL'},
  {code:304,name:'Not Modified',desc:'资源未修改，使用缓存版本'},
  {code:307,name:'Temporary Redirect',desc:'临时重定向，方法不变'},
  {code:308,name:'Permanent Redirect',desc:'永久重定向，方法不变'},
  {code:400,name:'Bad Request',desc:'请求格式错误或参数无效'},
  {code:401,name:'Unauthorized',desc:'未认证，需要登录或提供凭据'},
  {code:403,name:'Forbidden',desc:'服务器拒绝访问，权限不足'},
  {code:404,name:'Not Found',desc:'请求的资源不存在'},
  {code:405,name:'Method Not Allowed',desc:'请求方法不被允许'},
  {code:408,name:'Request Timeout',desc:'请求超时'},
  {code:409,name:'Conflict',desc:'请求冲突，如版本冲突或重复资源'},
  {code:410,name:'Gone',desc:'资源已永久删除'},
  {code:413,name:'Payload Too Large',desc:'请求体过大，服务器拒绝处理'},
  {code:422,name:'Unprocessable Entity',desc:'请求格式正确但语义错误（常见于表单验证失败）'},
  {code:429,name:'Too Many Requests',desc:'请求频率超限，触发限流'},
  {code:500,name:'Internal Server Error',desc:'服务器内部错误'},
  {code:501,name:'Not Implemented',desc:'服务器不支持该请求方法'},
  {code:502,name:'Bad Gateway',desc:'网关收到上游无效响应（常见于反向代理）'},
  {code:503,name:'Service Unavailable',desc:'服务不可用，服务器过载或维护中'},
  {code:504,name:'Gateway Timeout',desc:'网关等待上游响应超时'},
];

function getCodeColor(code) {
  if (code<200) return '#6366f1';
  if (code<300) return '#22c55e';
  if (code<400) return '#f59e0b';
  if (code<500) return '#ef4444';
  return '#a855f7';
}

function renderHttpCodes(filter='') {
  const list = document.getElementById('httpCodeList');
  if (!list) return;
  const kw = filter.trim().toLowerCase();
  const filtered = HTTP_CODES.filter(c =>
    !kw || String(c.code).includes(kw) || c.name.toLowerCase().includes(kw) || c.desc.includes(kw)
  );
  if (!filtered.length) { list.innerHTML='<div class="ip-error">未找到匹配的状态码</div>'; return; }
  list.innerHTML = filtered.map(c=>`
    <div class="http-code-item" onclick="copyHttpCode(${c.code})">
      <div class="http-code-num" style="color:${getCodeColor(c.code)}">${c.code}</div>
      <div class="http-code-info">
        <div class="http-code-name">${c.name}</div>
        <div class="http-code-desc">${c.desc}</div>
      </div>
    </div>`).join('');
}
function filterHttpCodes(val) { renderHttpCodes(val); }
function copyHttpCode(code) {
  const item = HTTP_CODES.find(c=>c.code===code);
  if (!item) return;
  navigator.clipboard.writeText(`${item.code} ${item.name}`).then(()=>showToast('已复制 '+item.code));
}

const panel = document.getElementById('panel');
if (panel) {
  let startY=0, moveY=0;
  panel.addEventListener('touchstart', e=>{ startY=e.touches[0].clientY; }, {passive:true});
  panel.addEventListener('touchmove', e=>{
    moveY = e.touches[0].clientY - startY;
    if (moveY>0 && panel.scrollTop===0) panel.style.transform=`translateY(${moveY}px)`;
  }, {passive:true});
  panel.addEventListener('touchend', ()=>{
    if (moveY>80) closePanel();
    panel.style.transform=''; moveY=0;
  });
}

async function runSpeedTest() {
  if (isSpeedTesting) {
    if (speedAbortController) speedAbortController.abort();
    resetSpeedUI();
    return;
  }

  isSpeedTesting = true;
  const btn = document.getElementById('speedBtn');
  const gauge = document.querySelector('.speedtest-gauge');
  const status = document.getElementById('speedStatus');
  const speedVal = document.getElementById('speedVal');
  const progressFill = document.getElementById('speedProgress');
  const pingVal = document.getElementById('speedPing');
  const loadedVal = document.getElementById('speedLoaded');

  if (btn) {
    btn.textContent = '停止测试';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-ghost');
  }
  if (gauge) gauge.classList.add('running');
  if (status) status.textContent = '正在测试延迟 (Ping)...';

  speedAbortController = new AbortController();

  try {
    let pings = [];
    for (let i = 0; i < 3; i++) {
      if (speedAbortController.signal.aborted) throw new Error('Aborted');
      let pStart = Date.now();
      await fetch('./index.html?cb=' + pStart, { method: 'HEAD', signal: speedAbortController.signal });
      pings.push(Date.now() - pStart);
      if (pingVal) pingVal.textContent = Math.round(pings.reduce((a,b)=>a+b,0)/pings.length) + ' ms';
      await new Promise(r => setTimeout(r, 100));
    }

    if (status) status.textContent = '正在连接下载服务器...';

    const fileUrl = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    
    let totalBytesLoaded = 0;
    let startTime = Date.now();
    let speedSamples = [];

    const maxRuns = 3;
    for (let run = 0; run < maxRuns; run++) {
      if (speedAbortController.signal.aborted) throw new Error('Aborted');
      if (status) status.textContent = `正在测试下载速度 (第 ${run + 1}/${maxRuns} 轮)...`;

      const response = await fetch(fileUrl + '?cb=' + Date.now() + '_' + run, {
        signal: speedAbortController.signal
      });

      if (!response.ok) throw new Error('Fetch failed');

      const reader = response.body.getReader();
      const contentLength = +response.headers.get('Content-Length') || 590000;
      let runBytesLoaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        runBytesLoaded += value.length;
        totalBytesLoaded += value.length;

        let elapsed = (Date.now() - startTime) / 1000;
        if (elapsed > 0) {
          let currentSpeedMbps = (totalBytesLoaded * 8) / (elapsed * 1000 * 1000);
          speedSamples.push(currentSpeedMbps);
          
          let displaySpeed = currentSpeedMbps;
          if (speedSamples.length > 5) {
            const lastSamples = speedSamples.slice(-5);
            displaySpeed = lastSamples.reduce((a,b)=>a+b,0) / lastSamples.length;
          }

          if (speedVal) speedVal.textContent = displaySpeed.toFixed(1);
          if (loadedVal) loadedVal.textContent = (totalBytesLoaded / (1024 * 1024)).toFixed(2) + ' MB';
          
          let runProgress = (runBytesLoaded / contentLength) * 100;
          let overallProgress = ((run * 100) + runProgress) / maxRuns;
          if (progressFill) progressFill.style.width = Math.min(overallProgress, 100) + '%';
        }
      }
    }

    let elapsed = (Date.now() - startTime) / 1000;
    let finalSpeedMbps = (totalBytesLoaded * 8) / (elapsed * 1000 * 1000);
    if (speedVal) speedVal.textContent = finalSpeedMbps.toFixed(1);
    if (status) status.textContent = '测试完成！';
    if (progressFill) progressFill.style.width = '100%';
    showToast('网速测试完成');

  } catch (err) {
    if (err.name === 'AbortError' || err.message === 'Aborted') {
      if (status) status.textContent = '测试已停止';
      showToast('测试已停止');
    } else {
      if (status) status.textContent = '测试出错: ' + err.message;
      showToast('测试出错');
      console.error(err);
    }
  } finally {
    isSpeedTesting = false;
    speedAbortController = null;
    if (btn) {
      btn.textContent = '重新测试';
      btn.classList.add('btn-primary');
      btn.classList.remove('btn-ghost');
    }
    if (gauge) gauge.classList.remove('running');
  }
}

function resetSpeedUI() {
  isSpeedTesting = false;
  if (speedAbortController) {
    speedAbortController.abort();
    speedAbortController = null;
  }
  const speedVal = document.getElementById('speedVal');
  const progressFill = document.getElementById('speedProgress');
  const pingVal = document.getElementById('speedPing');
  const loadedVal = document.getElementById('speedLoaded');
  const status = document.getElementById('speedStatus');
  const btn = document.getElementById('speedBtn');
  const gauge = document.querySelector('.speedtest-gauge');

  if (speedVal) speedVal.textContent = '0.0';
  if (progressFill) progressFill.style.width = '0%';
  if (pingVal) pingVal.textContent = '-';
  if (loadedVal) loadedVal.textContent = '0.0 MB';
  if (status) status.textContent = '点击“开始测试”开始';
  if (btn) {
    btn.textContent = '开始测试';
    btn.classList.add('btn-primary');
    btn.classList.remove('btn-ghost');
  }
  if (gauge) gauge.classList.remove('running');
}

// Set tool counts
['toolCount','settingsToolCount'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.textContent = tools.length + ' 个工具';
});
renderHome();


// ========== 主题切换 ==========
const THEME_KEY = 'cwj_tools_theme';
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = saved === 'light' ? '🌙' : '☀️';
}
function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem(THEME_KEY, mode);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = cur === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = next === 'light' ? '🌙' : '☀️';
}
initTheme();
