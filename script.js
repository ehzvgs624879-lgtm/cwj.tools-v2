/* ================================================================
   CWJ Tools V2 — Application Script
   Redesigned for Linear/Vercel/Raycast aesthetic
   All tool & AI logic preserved, DOM adapted to new structure
   ================================================================ */

// ── BRUTAL TRACE: write directly at script parse time ──────────
(function(){
  try {
    var ov = document.getElementById('debug-overlay');
    if (ov) {
      ov.innerHTML = '[PARSE] script.js line 1 executing<br>';
    }
  } catch(e) {
    // Last resort: write to body
    document.body.insertAdjacentHTML('beforeend', '<div style="position:fixed;top:0;left:0;z-index:999999;background:red;color:white;padding:4px;font:10px monospace">SCRIPT PARSE ERROR: '+e.message+'</div>');
  }
})();

// ── Debug Overlay ──────────────────────────────────────────────
var _debugCalls = 0;
function debugLog(msg) {
  _debugCalls++;
  try {
    console.log.apply(console, arguments);
  } catch(e) {}
  var msgStr;
  try {
    msgStr = Array.prototype.join.call(arguments, ' ');
  } catch(e) {
    msgStr = '[join error: ' + e.message + ']';
  }
  var ov = document.getElementById('debug-overlay');
  if (ov) {
    try {
      var time = new Date().toISOString().substring(11,23);
      ov.innerHTML += '[' + time + '] ' + msgStr + '<br>';
      ov.scrollTop = ov.scrollHeight;
    } catch(e) {
      ov.innerHTML += '[INNERHTML ERROR: ' + e.message + ']<br>';
    }
  } else {
    // Overlay not found — write to body as fallback
    try {
      document.body.insertAdjacentHTML('beforeend', '<div style="color:red;font:9px monospace">[NO-OV] ' + msgStr + '</div>');
    } catch(e2) {}
  }
}

// ── State ──────────────────────────────────────────────────────
let currentPage = 'home';
let currentTool = null;
let isTransitioning = false;
let toolDetailOpenTime = 0;

// ── WRITE helper — writes directly to overlay, no dependencies ──
function _w(msg) {
  var t = new Date().toISOString().substring(11,23);
  var line = '[' + t + '] ' + msg;
  // DOM overlay
  var ov = document.getElementById('debug-overlay');
  if (ov) {
    ov.innerHTML += line + '<br>';
    ov.scrollTop = ov.scrollHeight;
  }
  // Server-side log via POST
  try {
    fetch('/api/log', { method: 'POST', body: line, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(function(){});
  } catch(e) {}
}

// MutationObserver: detect any clear/set of debug-overlay innerHTML
(function(){
  var ov = document.getElementById('debug-overlay');
  if (ov) {
    var mo = new MutationObserver(function(muts) {
      muts.forEach(function(m) {
        if (m.type === 'childList') {
          _w(' MUTATION childList: removed=' + m.removedNodes.length + ' added=' + m.addedNodes.length);
        }
        if (m.type === 'characterData') {
          _w(' MUTATION characterData');
        }
      });
    });
    mo.observe(ov, { childList: true, characterData: true, subtree: true });
    _w('MUTATION_OBSERVER active on debug-overlay');
  }
})();

// ── Lucide Icons Init ──────────────────────────────────────────
function initLucide() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ── Toast ──────────────────────────────────────────────────────
let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ================================================================
// PAGE NAVIGATION
// ================================================================

function navigateTo(pageName) {
  _w('> navigateTo: ' + pageName + ' from=' + currentPage + ' isTrans=' + isTransitioning);
  debugLog(' navigateTo called:', pageName, 'from:', currentPage, 'isTransitioning:', isTransitioning);
  if (isTransitioning || pageName === currentPage) { _w('> navigateTo BLOCKED'); debugLog(' navigateTo blocked'); return; }
  isTransitioning = true;

  const oldPage = document.querySelector('.page.active');
  const newPage = document.getElementById('page-' + pageName);

  if (!newPage) { _w('> navigateTo newPage not found: ' + pageName); isTransitioning = false; return; }

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });

  if (oldPage) {
    oldPage.classList.add('page-exit');
    oldPage.addEventListener('animationend', function handler() {
      oldPage.removeEventListener('animationend', handler);
      debugLog(' animationend EXIT: removing active from', oldPage.id);
      oldPage.classList.remove('active', 'page-exit');
    }, { once: true });
  }

  _w('> navigateTo: setting active+page-enter on ' + newPage.id);
  newPage.classList.add('active', 'page-enter');
  newPage.addEventListener('animationend', function handler() {
    newPage.removeEventListener('animationend', handler);
    _w('> ANIM-ENTER done: ' + newPage.id + ' setting isTrans=false');
    debugLog(' animationend ENTER: transition complete for', newPage.id);
    newPage.classList.remove('page-enter');
    isTransitioning = false;
  }, { once: true });

  currentPage = pageName;
  _w('> navigateTo: currentPage=' + currentPage);

  if (pageName !== 'tools') { _w('> navigateTo calling hideToolDetail (page!==tools)'); hideToolDetail(); }
  if (pageName === 'home') renderRecentTools();
  if (pageName === 'tools') { renderToolGrid(); initLucide(); }
  if (pageName === 'chat') scrollChatToBottom();
  _w('< navigateTo DONE: ' + pageName);
}

document.addEventListener('click', (e) => {
  const navItem = e.target.closest('.nav-item');
  if (navItem) {
    _w('CLICK nav-item: ' + navItem.dataset.page + ' target=' + e.target.tagName + '.' + e.target.className);
    debugLog(' nav-item clicked:', navItem.dataset.page);
    navigateTo(navItem.dataset.page);
  }
});

// ================================================================
// TOOL DEFINITIONS
// ================================================================

const TOOLS = [
  { id: 'password',  name: '密码生成器',  desc: '生成随机安全密码，支持自定义长度与字符集', icon: 'key',       category: '安全', render() { renderPasswordTool(); } },
  { id: 'qrcode',    name: '二维码生成',  desc: '将文本或链接编码为 QR 二维码图片',        icon: 'qr-code',   category: '编码', render() { renderQRCodeTool(); } },
  { id: 'color',     name: '颜色转换',    desc: 'HEX / RGB / HSL 颜色格式互转与预览',       icon: 'palette',   category: '设计', render() { renderColorTool(); } },
  { id: 'timestamp', name: '时间戳转换',  desc: 'Unix 时间戳与日期字符串互相转换',           icon: 'clock',     category: '时间', render() { renderTimestampTool(); } },
  { id: 'hash',      name: 'Hash 计算',   desc: 'MD5 / SHA1 / SHA256 / SHA512 哈希值计算',   icon: 'fingerprint',category: '安全', render() { renderHashTool(); } },
  { id: 'aes',       name: 'AES 加解密',  desc: 'AES 对称加密，支持 CBC 模式',              icon: 'lock',      category: '安全', render() { renderAESTool(); } },
  { id: 'base64',    name: 'Base64 编解码',desc: 'Base64 编码与解码，支持 UTF-8 文本',       icon: 'binary',    category: '编码', render() { renderBase64Tool(); } },
  { id: 'json',      name: 'JSON 格式化', desc: 'JSON 美化、压缩与语法校验',                 icon: 'braces',    category: '格式', render() { renderJSONTool(); } },
  { id: 'url',       name: 'URL 编解码',  desc: 'URL 编码与解码 (encodeURIComponent)',       icon: 'link',      category: '编码', render() { renderURLTool(); } },
  { id: 'unicode',   name: 'Unicode 转换',desc: '字符与 Unicode 码点互相转换',               icon: 'type',      category: '编码', render() { renderUnicodeTool(); } },
  { id: 'case',      name: '大小写转换',  desc: '英文文本大小写 / 驼峰 / 下划线等格式转换',  icon: 'case-sensitive', category: '文本', render() { renderCaseTool(); } },
  { id: 'random',    name: '随机数生成',  desc: '生成指定范围内的随机整数或小数',            icon: 'dice-5',    category: '工具', render() { renderRandomTool(); } },
  { id: 'regex',     name: '正则测试',    desc: '正则表达式实时匹配测试',                  icon: 'regex',    category: '开发', render() { renderRegexTool(); } },
  { id: 'ip',        name: 'IP 查询',     desc: '查询 IP 地址详细信息',                        icon: 'globe',    category: '网络', render() { renderIPTool(); } },
  { id: 'httpcode',  name: 'HTTP 状态码', desc: 'HTTP 状态码速查手册',                          icon: 'list',     category: '网络', render() { renderHttpCodesTool(); } },
  { id: 'speedtest', name: '网速测试',    desc: '测试网络下载速度与延迟',                        icon: 'zap',      category: '网络', render() { renderSpeedTestTool(); } },
  { id: 'markdown',  name: 'Markdown 预览',desc: '实时 Markdown 编辑与 HTML 预览',          icon: 'file-text', category: '格式', render() { renderMarkdownTool(); } }
];

// ================================================================
// TOOL GRID (Tools Page)
// ================================================================

function renderToolGrid(filter) {
  filter = filter || '';
  const grid = document.getElementById('tools-grid');
  const empty = document.getElementById('tools-empty');

  const filtered = TOOLS.filter(function(t) {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return t.name.toLowerCase().indexOf(q) !== -1 ||
           t.desc.toLowerCase().indexOf(q) !== -1 ||
           t.category.toLowerCase().indexOf(q) !== -1 ||
           t.id.toLowerCase().indexOf(q) !== -1;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = '';
    return;
  }

  empty.style.display = 'none';

  grid.innerHTML = filtered.map(function(tool, i) {
    return '<button class="tool-card" data-tool="' + tool.id + '" style="animation:pageIn 200ms ease-out ' + (i * 30) + 'ms both">' +
      '<i data-lucide="' + tool.icon + '" stroke-width="1.5" class="tool-card-icon"></i>' +
      '<div class="tool-card-info">' +
        '<div class="tool-card-name">' + tool.name + '</div>' +
        '<div class="tool-card-desc">' + tool.desc + '</div>' +
      '</div>' +
      '<i data-lucide="chevron-right" stroke-width="1.5" class="tool-card-arrow"></i>' +
    '</button>';
  }).join('');

  initLucide();

  const subtitle = document.querySelector('#page-tools .page-subtitle');
  if (subtitle) {
    subtitle.textContent = '搜索或浏览全部 ' + TOOLS.length + ' 个工具';
  }
}

document.addEventListener('click', function(e) {
  const card = e.target.closest('.tool-card');
  if (card) {
    _w('CLICK tool-card: ' + card.dataset.tool + ' target=' + e.target.tagName + '.' + e.target.className);
    e.stopPropagation();
    const tool = TOOLS.find(function(t) { return t.id === card.dataset.tool; });
    if (tool) { _w('> calling openToolDetail(' + tool.id + ')'); openToolDetail(tool); _w('< openToolDetail returned'); }
    else { _w('CLICK tool-card: tool NOT FOUND for ' + card.dataset.tool); }
  }
});

document.addEventListener('input', function(e) {
  if (e.target.id === 'tools-search') {
    renderToolGrid(e.target.value);
  }
});

// ================================================================
// TOOL DETAIL (active tool view)
// ================================================================

function openToolDetail(tool) {
  _w('> openToolDetail START: ' + tool.id + ' currentTool=' + (currentTool?currentTool.id:'null'));
  debugLog(' openToolDetail called:', tool.id, 'stack:', new Error().stack.split('\n')[2]);
  currentTool = tool;
  toolDetailOpenTime = Date.now();
  _w('> openToolDetail: toolDetailOpenTime=' + toolDetailOpenTime);
  recordToolUse(tool);

  document.getElementById('tools-grid').style.display = 'none';
  document.getElementById('tools-search-wrapper').style.display = 'none';
  document.getElementById('tools-empty').style.display = 'none';
  _w('> openToolDetail: hid grid+search+empty');

  const detail = document.getElementById('tool-detail');
  document.getElementById('tool-detail-title').textContent = tool.name;
  document.getElementById('tool-detail-desc').textContent = tool.desc;
  document.getElementById('tool-detail-body').innerHTML = '';
  detail.classList.add('active');
  detail.style.animation = 'pageIn 200ms cubic-bezier(0.16,1,0.3,1) forwards';
  _w('> openToolDetail: detail classList=' + detail.classList);

  tool.render();
  initLucide();
  _w('< openToolDetail DONE: currentTool=' + (currentTool?currentTool.id:'null') + ' detail.active=' + detail.classList.contains('active'));
}

function hideToolDetail() {
  var caller = (new Error().stack.split('\n')[2] || '').trim();
  _w('> hideToolDetail CALLED by: ' + caller + ' currentTool=' + (currentTool?currentTool.id:'null') + ' currentPage=' + currentPage);
  debugLog('hideToolDetail called — currentTool:', (currentTool ? currentTool.id : 'null'), 'currentPage:', currentPage, 'stack:', caller);
  const detail = document.getElementById('tool-detail');
  _w('> hideToolDetail: detail exists=' + !!detail + ' hasActive=' + (detail?detail.classList.contains('active'):'N/A'));
  detail.classList.remove('active');
  _w('> hideToolDetail: removed active, now hasActive=' + detail.classList.contains('active'));
  document.getElementById('tools-grid').style.display = '';
  document.getElementById('tools-search-wrapper').style.display = '';
  currentTool = null;
  _w('< hideToolDetail DONE: currentTool=null');
  debugLog('hideToolDetail DONE');
}

document.addEventListener('click', function(e) {
  const backBtn = e.target.closest('#tool-back');
  if (backBtn) {
    var age = Date.now() - toolDetailOpenTime;
    _w('CLICK #tool-back: age=' + age + 'ms target=' + e.target.tagName + '.' + e.target.className);
    debugLog(' #tool-back click detected, age:', age, 'ms, target:', e.target.tagName, e.target.className);
    if (age > 400) { _w('> #tool-back: passing guard, calling hideToolDetail'); hideToolDetail(); _w('< #tool-back: hideToolDetail returned'); }
    else { _w('> #tool-back BLOCKED (age=' + age + 'ms < 400ms)'); debugLog(' #tool-back click BLOCKED (within 400ms guard)'); }
  }
});

// ================================================================
// RECENT TOOLS
// ================================================================

function getRecentTools() {
  try {
    return JSON.parse(localStorage.getItem('cwj_recent_tools') || '[]');
  } catch(e) { return []; }
}

function recordToolUse(tool) {
  let recent = getRecentTools();
  recent = recent.filter(function(r) { return r.id !== tool.id; });
  recent.unshift({ id: tool.id, name: tool.name, icon: tool.icon, time: Date.now() });
  recent = recent.slice(0, 20);
  localStorage.setItem('cwj_recent_tools', JSON.stringify(recent));
}

function renderRecentTools() {
  const list = document.getElementById('recent-list');
  const empty = document.getElementById('recent-empty');
  const recent = getRecentTools();

  if (recent.length === 0) {
    list.innerHTML = '';
    empty.style.display = '';
    return;
  }

  empty.style.display = 'none';

  list.innerHTML = recent.slice(0, 8).map(function(r, i) {
    const relTime = formatRelativeTime(r.time);
    const tool = TOOLS.find(function(t) { return t.id === r.id; });
    const icon = tool ? tool.icon : 'tool';
    return '<li class="recent-item" data-tool="' + r.id + '" style="animation:pageIn 200ms ease-out ' + (i * 40) + 'ms both">' +
      '<i data-lucide="' + icon + '" stroke-width="1.5"></i>' +
      '<span class="recent-item-name">' + r.name + '</span>' +
      '<span class="recent-item-time">' + relTime + '</span>' +
    '</li>';
  }).join('');

  initLucide();
}

document.getElementById('recent-list').addEventListener('click', function(e) {
  const item = e.target.closest('.recent-item');
  if (item) {
    _w('CLICK recent-item: ' + item.dataset.tool + ' target=' + e.target.tagName + '.' + e.target.className);
    const tool = TOOLS.find(function(t) { return t.id === item.dataset.tool; });
    if (tool) {
      _w('> recent-item: calling navigateTo(tools) then setTimeout(openToolDetail, 250)');
      navigateTo('tools');
      setTimeout(function() { _w('> recent-item setTimeout: calling openToolDetail(' + tool.id + ')'); openToolDetail(tool); _w('< recent-item setTimeout: openToolDetail returned'); }, 250);
    }
  }
});

function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return mins + ' 分钟前';
  if (hrs < 24) return hrs + ' 小时前';
  return days + ' 天前';
}

// ================================================================
// QUICK ACTIONS (Home Page)
// ================================================================

function renderQuickActions() {
  const container = document.getElementById('quick-actions');
  const quickIds = ['password', 'qrcode', 'base64', 'json'];

  container.innerHTML = quickIds.map(function(id) {
    const tool = TOOLS.find(function(t) { return t.id === id; });
    if (!tool) return '';
    return '<button class="quick-action" data-tool="' + tool.id + '">' +
      '<i data-lucide="' + tool.icon + '" stroke-width="1.5"></i>' +
      tool.name +
    '</button>';
  }).join('');

  initLucide();
}

document.addEventListener('click', function(e) {
  const action = e.target.closest('.quick-action');
  if (action) {
    _w('CLICK quick-action: ' + action.dataset.tool + ' target=' + e.target.tagName + '.' + e.target.className);
    debugLog('quick-action clicked:', action.dataset.tool);
    const tool = TOOLS.find(function(t) { return t.id === action.dataset.tool; });
    if (tool) {
      _w('> quick-action: calling navigateTo(tools) then setTimeout(openToolDetail, 250)');
      navigateTo('tools');
      setTimeout(function() { _w('> quick-action setTimeout: calling openToolDetail(' + tool.id + ')'); openToolDetail(tool); _w('< quick-action setTimeout: openToolDetail returned'); }, 250);
    }
  }
});

// ================================================================
// COMMAND PALETTE (Ctrl+K / Cmd+K)
// ================================================================

const paletteItems = TOOLS.map(function(t) {
  return { type: 'tool', name: t.name, desc: t.desc, icon: t.icon, category: t.category, toolId: t.id };
}).concat([
  { type: 'page', name: '首页', desc: '返回首页', icon: 'home', page: 'home' },
  { type: 'page', name: '工具列表', desc: '浏览全部工具', icon: 'wrench', page: 'tools' },
  { type: 'page', name: 'AI 对话', desc: '打开 AI 对话', icon: 'message-square', page: 'chat' },
  { type: 'page', name: '设置', desc: '应用设置与数据管理', icon: 'settings', page: 'settings' }
]);

let paletteSelectedIndex = 0;
let paletteFiltered = paletteItems.slice();

function openCommandPalette() {
  const overlay = document.getElementById('command-palette-overlay');
  const input = document.getElementById('command-palette-input');
  overlay.classList.add('active');
  input.value = '';
  paletteSelectedIndex = 0;
  paletteFiltered = paletteItems.slice();
  renderPaletteResults();
  setTimeout(function() { input.focus(); }, 100);
}

function closeCommandPalette() {
  document.getElementById('command-palette-overlay').classList.remove('active');
}

function renderPaletteResults() {
  const container = document.getElementById('command-palette-results');

  if (paletteFiltered.length === 0) {
    container.innerHTML = '<div class="palette-empty">无匹配结果</div>';
    return;
  }

  container.innerHTML = paletteFiltered.map(function(item, i) {
    const cls = 'palette-item' + (i === paletteSelectedIndex ? ' selected' : '');
    const sub = item.type === 'page' ? '页面' : (item.category || '');
    return '<div class="' + cls + '" data-index="' + i + '">' +
      '<i data-lucide="' + item.icon + '" stroke-width="1.5"></i>' +
      item.name +
      '<span class="palette-item-desc">' + sub + '</span>' +
    '</div>';
  }).join('');

  initLucide();

  const selected = container.querySelector('.palette-item.selected');
  if (selected) selected.scrollIntoView({ block: 'nearest' });
}

document.getElementById('command-palette-input').addEventListener('input', function() {
  const q = this.value.toLowerCase();
  paletteFiltered = paletteItems.filter(function(item) {
    return item.name.toLowerCase().indexOf(q) !== -1 ||
           item.desc.toLowerCase().indexOf(q) !== -1 ||
           (item.category || '').toLowerCase().indexOf(q) !== -1;
  });
  paletteSelectedIndex = 0;
  renderPaletteResults();
});

document.getElementById('command-palette-input').addEventListener('keydown', function(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    paletteSelectedIndex = Math.min(paletteSelectedIndex + 1, paletteFiltered.length - 1);
    renderPaletteResults();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    paletteSelectedIndex = Math.max(paletteSelectedIndex - 1, 0);
    renderPaletteResults();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    activatePaletteItem(paletteFiltered[paletteSelectedIndex]);
  } else if (e.key === 'Escape') {
    closeCommandPalette();
  }
});

document.getElementById('command-palette-results').addEventListener('click', function(e) {
  const item = e.target.closest('.palette-item');
  if (item) {
    const idx = parseInt(item.dataset.index);
    activatePaletteItem(paletteFiltered[idx]);
  }
});

function activatePaletteItem(item) {
  if (!item) return;
  closeCommandPalette();

  if (item.type === 'page') {
    navigateTo(item.page);
  } else if (item.type === 'tool') {
    const tool = TOOLS.find(function(t) { return t.id === item.toolId; });
    if (tool) {
      navigateTo('tools');
      setTimeout(function() { openToolDetail(tool); }, 250);
    }
  }
}

document.getElementById('command-palette-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeCommandPalette();
});

document.addEventListener('keydown', function(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openCommandPalette();
  }
});

// ================================================================
// SETTINGS
// ================================================================

document.getElementById('btn-clear-chat').addEventListener('click', function() {
  if (confirm('确定要清除所有聊天记录吗？')) {
    localStorage.removeItem('cwj_chat_messages');
    chatMessages = [];
    renderChatMessages();
    showToast('聊天记录已清除');
  }
});

document.getElementById('btn-clear-recent').addEventListener('click', function() {
  if (confirm('确定要清除最近使用记录吗？')) {
    localStorage.removeItem('cwj_recent_tools');
    renderRecentTools();
    showToast('最近使用记录已清除');
  }
});

document.getElementById('btn-clear-all').addEventListener('click', function() {
  if (confirm('确定要清除全部本地数据吗？此操作不可恢复。')) {
    localStorage.removeItem('cwj_chat_messages');
    localStorage.removeItem('cwj_recent_tools');
    localStorage.removeItem('cwj_chat_model');
    chatMessages = [];
    renderChatMessages();
    renderRecentTools();
    showToast('全部数据已清除');
  }
});

// ================================================================
// AI CHAT
// ================================================================

var CHAT_MODELS = {
  'deepseek': { name: 'DeepSeek Chat', endpoint: '/api/chat', provider: 'deepseek' },
  'zhipu': { name: 'GLM-4.5-Air', endpoint: '/api/chat', provider: 'zhipu' },
  'openai': { name: 'OpenAI GPT', endpoint: '/api/chat', provider: 'openai' }
};

var currentModel = localStorage.getItem('cwj_chat_model') || 'deepseek';
var chatMessages = [];

function loadChatHistory() {
  try {
    var saved = localStorage.getItem('cwj_chat_messages');
    if (saved) chatMessages = JSON.parse(saved);
  } catch(e) { chatMessages = []; }
}

function saveChatHistory() {
  try {
    localStorage.setItem('cwj_chat_messages', JSON.stringify(chatMessages));
  } catch(e) { /* quota exceeded */ }
}

function initModelSelector() {
  var select = document.getElementById('chat-model-select');
  select.innerHTML = Object.entries(CHAT_MODELS).map(function(entry) {
    var key = entry[0], m = entry[1];
    return '<option value="' + key + '"' + (key === currentModel ? ' selected' : '') + '>' + m.name + '</option>';
  }).join('');

  select.addEventListener('change', function() {
    currentModel = select.value;
    localStorage.setItem('cwj_chat_model', currentModel);
  });
}

function renderChatMessages() {
  var container = document.getElementById('chat-messages');
  if (chatMessages.length === 0) {
    container.innerHTML =
      '<div class="empty-state" style="flex:1;display:flex;align-items:center;justify-content:center">' +
        '<div>' +
          '<i data-lucide="message-square" stroke-width="1.5"></i>' +
          '<p>开始一段对话</p>' +
          '<p style="font-size:12px;color:var(--text-tertiary);margin-top:4px">支持 DeepSeek、GLM-4.5 等多模型</p>' +
        '</div>' +
      '</div>';
    initLucide();
    return;
  }

  container.innerHTML = chatMessages.map(function(msg) {
    var isUser = msg.role === 'user';
    var avatarIcon = isUser ? 'user' : 'bot';
    var content = escapeHtml(msg.content);
    content = content.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    content = content.replace(/\n/g, '<br>');

    return '<div class="chat-msg ' + (isUser ? 'user' : 'assistant') + '">' +
      '<div class="chat-msg-avatar">' +
        '<i data-lucide="' + avatarIcon + '" stroke-width="1.5"></i>' +
      '</div>' +
      '<div class="chat-msg-bubble">' + content + '</div>' +
    '</div>';
  }).join('');

  initLucide();
  scrollChatToBottom();
}

function scrollChatToBottom() {
  var container = document.getElementById('chat-messages');
  requestAnimationFrame(function() {
    container.scrollTop = container.scrollHeight;
  });
}

async function sendChatMessage(text) {
  if (!text.trim()) return;

  chatMessages.push({ role: 'user', content: text });
  saveChatHistory();
  renderChatMessages();

  var input = document.getElementById('chat-input');
  input.value = '';

  var loading = document.getElementById('chat-loading');
  loading.classList.add('active');
  scrollChatToBottom();

  try {
    var model = CHAT_MODELS[currentModel];
    var response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatMessages,
        model: currentModel,
        provider: model.provider
      })
    });

    var data = await response.json();

    if (data.status === 'success' && data.reply) {
      chatMessages.push({ role: 'assistant', content: data.reply });
    } else if (data.message) {
      chatMessages.push({ role: 'assistant', content: '[服务器响应] ' + data.message });
    } else {
      chatMessages.push({ role: 'assistant', content: '[服务器未返回有效响应]' });
    }
  } catch (err) {
    console.error('Chat error:', err);
    chatMessages.push({
      role: 'assistant',
      content: '⚠️ 无法连接到 AI 服务。请确保服务器已启动 (`node server.js`)，且 AI 模型 API 已正确配置。'
    });
  }

  loading.classList.remove('active');
  saveChatHistory();
  renderChatMessages();
}

var chatInput = document.getElementById('chat-input');
chatInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage(chatInput.value);
  }
});

document.getElementById('chat-send-btn').addEventListener('click', function() {
  sendChatMessage(chatInput.value);
});

// ================================================================
// TOOL IMPLEMENTATIONS
// ================================================================

function buildToolUI(bodyHTML) {
  return bodyHTML +
    '<div class="tool-output" id="tool-output" style="display:none">' +
      '<div class="tool-output-label">结果</div>' +
      '<div class="tool-output-content" id="tool-output-content"></div>' +
      '<div class="tool-result-actions">' +
        '<button class="btn btn-secondary btn-sm" id="btn-copy-result">' +
          '<i data-lucide="copy" stroke-width="1.5"></i> 复制' +
        '</button>' +
        '<button class="btn btn-ghost btn-sm" id="btn-clear-result">' +
          '<i data-lucide="x" stroke-width="1.5"></i> 清除' +
        '</button>' +
      '</div>' +
    '</div>';
}

function showToolResult(content) {
  var output = document.getElementById('tool-output');
  var outputContent = document.getElementById('tool-output-content');
  if (output && outputContent) {
    outputContent.textContent = content;
    output.style.display = '';
  }
}

document.addEventListener('click', function(e) {
  var btnCopy = e.target.closest('#btn-copy-result');
  var btnClear = e.target.closest('#btn-clear-result');

  if (btnCopy) {
    var contentEl = document.getElementById('tool-output-content');
    if (contentEl && contentEl.textContent) {
      navigator.clipboard.writeText(contentEl.textContent).then(function() {
        showToast('已复制到剪贴板');
      }).catch(function() {
        showToast('复制失败');
      });
    }
  }

  if (btnClear) {
    var output = document.getElementById('tool-output');
    if (output) output.style.display = 'none';
  }
});

// ── Password Generator ─────────────────────────────────────────
function renderPasswordTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML = buildToolUI(
    '<label class="tool-form-label">密码长度</label>' +
    '<div style="display:flex;gap:8px;align-items:center;margin-bottom:16px">' +
      '<input type="range" id="pw-len" style="flex:1;height:4px;accent-color:var(--accent)" min="6" max="64" value="16">' +
      '<span id="pw-len-val" style="font-size:14px;font-weight:600;min-width:28px;text-align:right">16</span>' +
    '</div>' +
    '<label class="tool-form-label">字符选项</label>' +
    '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">' +
      '<label class="btn btn-secondary btn-sm" style="cursor:pointer"><input type="checkbox" id="pw-upper" checked> 大写字母</label>' +
      '<label class="btn btn-secondary btn-sm" style="cursor:pointer"><input type="checkbox" id="pw-lower" checked> 小写字母</label>' +
      '<label class="btn btn-secondary btn-sm" style="cursor:pointer"><input type="checkbox" id="pw-digits" checked> 数字</label>' +
      '<label class="btn btn-secondary btn-sm" style="cursor:pointer"><input type="checkbox" id="pw-symbols"> 符号</label>' +
    '</div>' +
    '<button class="btn btn-primary" id="btn-gen-pw">' +
      '<i data-lucide="refresh-cw" stroke-width="1.5"></i> 生成密码' +
    '</button>'
  );
  initLucide();

  var lenInput = document.getElementById('pw-len');
  var lenVal = document.getElementById('pw-len-val');
  lenInput.addEventListener('input', function() { lenVal.textContent = lenInput.value; });

  document.getElementById('btn-gen-pw').addEventListener('click', function() {
    var len = parseInt(lenInput.value);
    var upper = document.getElementById('pw-upper').checked;
    var lower = document.getElementById('pw-lower').checked;
    var digits = document.getElementById('pw-digits').checked;
    var symbols = document.getElementById('pw-symbols').checked;

    var charset = '';
    if (upper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (digits) charset += '0123456789';
    if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) { showToast('请至少选择一种字符集'); return; }

    var pw = '';
    var arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    for (var i = 0; i < len; i++) {
      pw += charset[arr[i] % charset.length];
    }
    showToolResult(pw);
  });
}

// ── QR Code Generator ──────────────────────────────────────────
function renderQRCodeTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML = buildToolUI(
    '<label class="tool-form-label">文本 / 链接</label>' +
    '<textarea class="input" id="qr-text" placeholder="输入要生成二维码的文本或链接…" rows="3"></textarea>' +
    '<div style="margin-top:12px">' +
      '<label class="tool-form-label">尺寸</label>' +
      '<select class="input" id="qr-size" style="width:auto">' +
        '<option value="150">150×150</option>' +
        '<option value="200" selected>200×200</option>' +
        '<option value="300">300×300</option>' +
        '<option value="400">400×400</option>' +
      '</select>' +
    '</div>' +
    '<button class="btn btn-primary" id="btn-gen-qr" style="margin-top:12px">' +
      '<i data-lucide="qr-code" stroke-width="1.5"></i> 生成二维码' +
    '</button>' +
    '<div id="qr-result" style="margin-top:16px;display:none">' +
      '<img id="qr-img" src="" alt="QR Code" style="border-radius:8px;background:#fff;padding:8px">' +
    '</div>'
  );
  initLucide();

  document.getElementById('btn-gen-qr').addEventListener('click', function() {
    var text = document.getElementById('qr-text').value.trim();
    if (!text) { showToast('请输入文本或链接'); return; }
    var size = document.getElementById('qr-size').value;
    var url = 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodeURIComponent(text);
    document.getElementById('qr-img').src = url;
    document.getElementById('qr-result').style.display = '';
  });
}

// ── Color Converter ────────────────────────────────────────────
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h = 0, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function renderColorTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML =
    '<label class="tool-form-label">输入颜色值</label>' +
    '<div style="display:flex;gap:8px">' +
      '<input type="text" class="input" id="color-input" placeholder="#ff6600 / rgb(255,102,0) / hsl(24,100%,50%)">' +
      '<input type="color" id="color-picker" style="width:38px;height:38px;border:none;cursor:pointer;border-radius:6px;background:transparent">' +
    '</div>' +
    '<button class="btn btn-primary" id="btn-convert-color" style="margin-top:12px">' +
      '<i data-lucide="arrow-right-left" stroke-width="1.5"></i> 转换' +
    '</button>' +
    '<div id="color-preview" style="width:100%;height:40px;border-radius:6px;margin-top:12px;display:none;border:1px solid var(--border-default)"></div>' +
    '<div id="color-results" style="margin-top:16px;display:none">' +
      '<div class="tool-output-label">转换结果</div>' +
      '<div id="color-hex" style="font-family:var(--font-mono);font-size:13px;padding:4px 0"></div>' +
      '<div id="color-rgb" style="font-family:var(--font-mono);font-size:13px;padding:4px 0"></div>' +
      '<div id="color-hsl" style="font-family:var(--font-mono);font-size:13px;padding:4px 0"></div>' +
    '</div>';
  initLucide();

  document.getElementById('color-picker').addEventListener('input', function(e) {
    document.getElementById('color-input').value = e.target.value;
  });

  document.getElementById('btn-convert-color').addEventListener('click', function() {
    var input = document.getElementById('color-input').value.trim();
    if (!input) { showToast('请输入颜色值'); return; }

    var r, g, b;
    try {
      if (input.charAt(0) === '#') {
        var hex = input.replace('#', '');
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      } else if (input.indexOf('rgb') === 0) {
        var m = input.match(/\d+/g);
        r = Number(m[0]); g = Number(m[1]); b = Number(m[2]);
      } else if (input.indexOf('hsl') === 0) {
        var m2 = input.match(/[\d.]+/g);
        var h = parseFloat(m2[0]), s = parseFloat(m2[1]) / 100, l = parseFloat(m2[2]) / 100;
        var a = s * Math.min(l, 1 - l);
        var f = function(n) {
          var k = (n + h / 30) % 12;
          return Math.round((l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)) * 255);
        };
        r = f(0); g = f(8); b = f(4);
      } else {
        showToast('无法识别的颜色格式'); return;
      }

      if (isNaN(r)) { showToast('无法解析颜色值'); return; }

      var hexOut = '#' + [r, g, b].map(function(c) { return c.toString(16).padStart(2, '0'); }).join('');
      var hsl = rgbToHsl(r, g, b);

      document.getElementById('color-preview').style.display = '';
      document.getElementById('color-preview').style.background = 'rgb(' + r + ',' + g + ',' + b + ')';
      document.getElementById('color-results').style.display = '';
      document.getElementById('color-hex').textContent = 'HEX: ' + hexOut;
      document.getElementById('color-rgb').textContent = 'RGB: rgb(' + r + ', ' + g + ', ' + b + ')';
      document.getElementById('color-hsl').textContent = 'HSL: hsl(' + hsl[0] + '°, ' + hsl[1] + '%, ' + hsl[2] + '%)';
    } catch (err) {
      showToast('转换失败，请检查输入格式');
    }
  });
}

// ── Timestamp Converter ────────────────────────────────────────
function renderTimestampTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML = buildToolUI(
    '<label class="tool-form-label">当前时间戳</label>' +
    '<div style="display:flex;gap:8px;align-items:center;margin-bottom:16px">' +
      '<span id="ts-now" style="font-family:var(--font-mono);font-size:14px;color:var(--accent)">-</span>' +
      '<button class="btn btn-secondary btn-sm" id="btn-ts-now">' +
        '<i data-lucide="refresh-cw" stroke-width="1.5"></i> 刷新' +
      '</button>' +
    '</div>' +
    '<hr class="divider">' +
    '<label class="tool-form-label">时间戳 → 日期</label>' +
    '<div style="display:flex;gap:8px">' +
      '<input type="number" class="input" id="ts-input" placeholder="输入 Unix 时间戳 (秒)">' +
      '<button class="btn btn-primary btn-sm" id="btn-ts-to-date">转换</button>' +
    '</div>' +
    '<label class="tool-form-label" style="margin-top:16px">日期 → 时间戳</label>' +
    '<div style="display:flex;gap:8px">' +
      '<input type="datetime-local" class="input" id="ts-date-input">' +
      '<button class="btn btn-primary btn-sm" id="btn-date-to-ts">转换</button>' +
    '</div>'
  );
  initLucide();

  function updateNow() {
    document.getElementById('ts-now').textContent = Math.floor(Date.now() / 1000);
  }
  updateNow();
  document.getElementById('btn-ts-now').addEventListener('click', updateNow);

  document.getElementById('btn-ts-to-date').addEventListener('click', function() {
    var ts = parseInt(document.getElementById('ts-input').value);
    if (!ts) { showToast('请输入有效的时间戳'); return; }
    var date = new Date(ts * 1000);
    showToolResult(date.toLocaleString('zh-CN', { hour12: false }));
  });

  document.getElementById('btn-date-to-ts').addEventListener('click', function() {
    var val = document.getElementById('ts-date-input').value;
    if (!val) { showToast('请选择日期时间'); return; }
    var ts = Math.floor(new Date(val).getTime() / 1000);
    showToolResult(ts.toString());
  });
}

// ── Hash Calculator ────────────────────────────────────────────
function renderHashTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML = buildToolUI(
    '<label class="tool-form-label">输入文本</label>' +
    '<textarea class="input" id="hash-text" placeholder="输入要计算哈希值的文本…" rows="3"></textarea>' +
    '<label class="tool-form-label" style="margin-top:12px">算法</label>' +
    '<select class="input" id="hash-algo" style="width:auto">' +
      '<option value="SHA-1">SHA-1</option>' +
      '<option value="SHA-256" selected>SHA-256</option>' +
      '<option value="SHA-512">SHA-512</option>' +
    '</select>' +
    '<button class="btn btn-primary" id="btn-hash" style="margin-top:12px">' +
      '<i data-lucide="fingerprint" stroke-width="1.5"></i> 计算 Hash' +
    '</button>'
  );
  initLucide();

  document.getElementById('btn-hash').addEventListener('click', async function() {
    var text = document.getElementById('hash-text').value;
    if (!text) { showToast('请输入文本'); return; }
    var algo = document.getElementById('hash-algo').value;
    var encoder = new TextEncoder();
    var data = encoder.encode(text);

    try {
      var buf = await crypto.subtle.digest(algo, data);
      var hash = Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
      showToolResult(hash);
    } catch (err) {
      showToast('计算失败: ' + err.message);
    }
  });
}

// ── AES Encrypt/Decrypt ────────────────────────────────────────
function renderAESTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML = buildToolUI(
    '<label class="tool-form-label">密钥 (Key)</label>' +
    '<input type="text" class="input" id="aes-key" placeholder="输入加密密钥 (16/24/32 字符)">' +
    '<label class="tool-form-label" style="margin-top:12px">文本</label>' +
    '<textarea class="input" id="aes-text" placeholder="输入要加密/解密的文本…" rows="4"></textarea>' +
    '<div style="display:flex;gap:8px;margin-top:12px">' +
      '<button class="btn btn-primary" id="btn-aes-encrypt">' +
        '<i data-lucide="lock" stroke-width="1.5"></i> AES 加密' +
      '</button>' +
      '<button class="btn btn-secondary" id="btn-aes-decrypt">' +
        '<i data-lucide="unlock" stroke-width="1.5"></i> AES 解密' +
      '</button>' +
    '</div>'
  );
  initLucide();

  async function aesCrypto(isEncrypt) {
    var keyStr = document.getElementById('aes-key').value;
    var text = document.getElementById('aes-text').value;
    if (!keyStr || !text) { showToast('请输入密钥和文本'); return; }

    try {
      var encoder = new TextEncoder();
      var keyData = encoder.encode(keyStr.padEnd(32, '\0').slice(0, 32));
      var key = await crypto.subtle.importKey('raw', keyData, { name: 'AES-CBC' }, false,
        isEncrypt ? ['encrypt'] : ['decrypt']);

      if (isEncrypt) {
        var iv = crypto.getRandomValues(new Uint8Array(16));
        var data = encoder.encode(text);
        var encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: iv }, key, data);
        var combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);
        var base64 = btoa(String.fromCharCode.apply(null, combined));
        showToolResult(base64);
      } else {
        var combined2 = Uint8Array.from(atob(text), function(c) { return c.charCodeAt(0); });
        var iv2 = combined2.slice(0, 16);
        var data2 = combined2.slice(16);
        var decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: iv2 }, key, data2);
        var result = new TextDecoder().decode(decrypted);
        showToolResult(result);
      }
    } catch (err) {
      showToast('操作失败: ' + err.message);
    }
  }

  document.getElementById('btn-aes-encrypt').addEventListener('click', function() { aesCrypto(true); });
  document.getElementById('btn-aes-decrypt').addEventListener('click', function() { aesCrypto(false); });
}

// ── Base64 Encode/Decode ───────────────────────────────────────
function renderBase64Tool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML = buildToolUI(
    '<label class="tool-form-label">输入文本</label>' +
    '<textarea class="input" id="b64-text" placeholder="输入要编码/解码的文本…" rows="4"></textarea>' +
    '<div style="display:flex;gap:8px;margin-top:12px">' +
      '<button class="btn btn-primary" id="btn-b64-encode">' +
        '<i data-lucide="arrow-right" stroke-width="1.5"></i> Base64 编码' +
      '</button>' +
      '<button class="btn btn-secondary" id="btn-b64-decode">' +
        '<i data-lucide="arrow-left" stroke-width="1.5"></i> Base64 解码' +
      '</button>' +
    '</div>'
  );
  initLucide();

  document.getElementById('btn-b64-encode').addEventListener('click', function() {
    var text = document.getElementById('b64-text').value;
    if (!text) { showToast('请输入文本'); return; }
    try {
      var encoded = btoa(unescape(encodeURIComponent(text)));
      showToolResult(encoded);
    } catch (err) {
      showToast('编码失败: ' + err.message);
    }
  });

  document.getElementById('btn-b64-decode').addEventListener('click', function() {
    var text = document.getElementById('b64-text').value.trim();
    if (!text) { showToast('请输入 Base64 文本'); return; }
    try {
      var decoded = decodeURIComponent(escape(atob(text)));
      showToolResult(decoded);
    } catch (err) {
      showToast('解码失败，请检查输入是否为有效的 Base64');
    }
  });
}

// ── JSON Formatter ─────────────────────────────────────────────
function renderJSONTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML = buildToolUI(
    '<label class="tool-form-label">输入 JSON</label>' +
    '<textarea class="input" id="json-text" placeholder="粘贴 JSON 字符串…" rows="6" style="font-family:var(--font-mono);font-size:12px"></textarea>' +
    '<div style="display:flex;gap:8px;margin-top:12px">' +
      '<button class="btn btn-primary" id="btn-json-format">' +
        '<i data-lucide="align-left" stroke-width="1.5"></i> 格式化' +
      '</button>' +
      '<button class="btn btn-secondary" id="btn-json-compress">' +
        '<i data-lucide="minimize-2" stroke-width="1.5"></i> 压缩' +
      '</button>' +
      '<button class="btn btn-ghost btn-sm" id="btn-json-validate">' +
        '<i data-lucide="check-circle" stroke-width="1.5"></i> 校验' +
      '</button>' +
    '</div>'
  );
  initLucide();

  function getJSONText() {
    return document.getElementById('json-text').value.trim();
  }

  document.getElementById('btn-json-format').addEventListener('click', function() {
    var text = getJSONText();
    if (!text) { showToast('请输入 JSON 文本'); return; }
    try {
      var parsed = JSON.parse(text);
      showToolResult(JSON.stringify(parsed, null, 2));
    } catch (err) {
      showToast('JSON 解析失败: ' + err.message);
    }
  });

  document.getElementById('btn-json-compress').addEventListener('click', function() {
    var text = getJSONText();
    if (!text) { showToast('请输入 JSON 文本'); return; }
    try {
      var parsed = JSON.parse(text);
      showToolResult(JSON.stringify(parsed));
    } catch (err) {
      showToast('JSON 解析失败: ' + err.message);
    }
  });

  document.getElementById('btn-json-validate').addEventListener('click', function() {
    var text = getJSONText();
    if (!text) { showToast('请输入 JSON 文本'); return; }
    try {
      JSON.parse(text);
      showToast('✓ JSON 格式正确');
    } catch (err) {
      showToast('✗ JSON 格式错误: ' + err.message);
    }
  });
}

// ── URL Encode/Decode ──────────────────────────────────────────
function renderURLTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML = buildToolUI(
    '<label class="tool-form-label">输入文本</label>' +
    '<textarea class="input" id="url-text" placeholder="输入要编码/解码的 URL 或文本…" rows="4"></textarea>' +
    '<div style="display:flex;gap:8px;margin-top:12px">' +
      '<button class="btn btn-primary" id="btn-url-encode">' +
        '<i data-lucide="arrow-right" stroke-width="1.5"></i> URL 编码' +
      '</button>' +
      '<button class="btn btn-secondary" id="btn-url-decode">' +
        '<i data-lucide="arrow-left" stroke-width="1.5"></i> URL 解码' +
      '</button>' +
    '</div>'
  );
  initLucide();

  document.getElementById('btn-url-encode').addEventListener('click', function() {
    var text = document.getElementById('url-text').value;
    if (!text) { showToast('请输入文本'); return; }
    showToolResult(encodeURIComponent(text));
  });

  document.getElementById('btn-url-decode').addEventListener('click', function() {
    var text = document.getElementById('url-text').value.trim();
    if (!text) { showToast('请输入 URL 编码文本'); return; }
    try {
      showToolResult(decodeURIComponent(text));
    } catch(e) {
      showToast('解码失败，请检查输入是否为有效的 URL 编码');
    }
  });
}

// ── Unicode Converter ──────────────────────────────────────────
function renderUnicodeTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML = buildToolUI(
    '<label class="tool-form-label">字符 → Unicode</label>' +
    '<div style="display:flex;gap:8px">' +
      '<input type="text" class="input" id="uni-char" placeholder="输入字符">' +
      '<button class="btn btn-primary btn-sm" id="btn-char-to-uni">转换</button>' +
    '</div>' +
    '<label class="tool-form-label" style="margin-top:16px">Unicode → 字符</label>' +
    '<div style="display:flex;gap:8px">' +
      '<input type="text" class="input" id="uni-code" placeholder="U+4E2D 或 &#20013;">' +
      '<button class="btn btn-primary btn-sm" id="btn-uni-to-char">转换</button>' +
    '</div>'
  );
  initLucide();

  document.getElementById('btn-char-to-uni').addEventListener('click', function() {
    var ch = document.getElementById('uni-char').value;
    if (!ch) { showToast('请输入字符'); return; }
    var cp = ch.codePointAt(0);
    showToolResult('U+' + cp.toString(16).toUpperCase().padStart(4, '0') + '  |  &#' + cp + ';  |  \\u' + cp.toString(16).padStart(4, '0'));
  });

  document.getElementById('btn-uni-to-char').addEventListener('click', function() {
    var code = document.getElementById('uni-code').value.trim();
    if (!code) { showToast('请输入 Unicode 码点'); return; }
    try {
      var cp;
      if (code.indexOf('U+') === 0 || code.indexOf('u+') === 0) {
        cp = parseInt(code.substring(2), 16);
      } else if (code.indexOf('&#') === 0) {
        cp = parseInt(code.replace(/[^0-9]/g, ''));
      } else if (code.indexOf('\\u') === 0) {
        cp = parseInt(code.substring(2), 16);
      } else {
        cp = parseInt(code, 16);
      }
      if (isNaN(cp)) { showToast('无法解析码点'); return; }
      showToolResult(String.fromCodePoint(cp));
    } catch (err) {
      showToast('转换失败: ' + err.message);
    }
  });
}

// ── Text Case Converter ────────────────────────────────────────
function renderCaseTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML = buildToolUI(
    '<label class="tool-form-label">输入文本</label>' +
    '<textarea class="input" id="case-text" placeholder="输入英文文本…" rows="3"></textarea>' +
    '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px">' +
      '<button class="btn btn-secondary btn-sm case-btn" data-case="upper">全部大写</button>' +
      '<button class="btn btn-secondary btn-sm case-btn" data-case="lower">全部小写</button>' +
      '<button class="btn btn-secondary btn-sm case-btn" data-case="title">首字母大写</button>' +
      '<button class="btn btn-secondary btn-sm case-btn" data-case="camel">驼峰命名</button>' +
      '<button class="btn btn-secondary btn-sm case-btn" data-case="snake">下划线命名</button>' +
      '<button class="btn btn-secondary btn-sm case-btn" data-case="kebab">连字符命名</button>' +
    '</div>'
  );
  initLucide();

  var textarea = document.getElementById('case-text');
  document.querySelectorAll('.case-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var text = textarea.value;
      if (!text) { showToast('请输入文本'); return; }
      var c = btn.dataset.case;
      var result;
      switch (c) {
        case 'upper': result = text.toUpperCase(); break;
        case 'lower': result = text.toLowerCase(); break;
        case 'title':
          result = text.toLowerCase().replace(/\b\w/g, function(c) { return c.toUpperCase(); });
          break;
        case 'camel':
          result = text.toLowerCase().replace(/[^a-z0-9]+(.)/g, function(_, c) { return c.toUpperCase(); });
          break;
        case 'snake':
          result = text.toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
          break;
        case 'kebab':
          result = text.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
          break;
      }
      showToolResult(result);
    });
  });
}

// ── Random Number Generator ────────────────────────────────────
function renderRandomTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML = buildToolUI(
    '<label class="tool-form-label">范围</label>' +
    '<div style="display:flex;gap:8px;align-items:center">' +
      '<input type="number" class="input" id="rand-min" value="0" placeholder="最小值" style="width:120px">' +
      '<span style="color:var(--text-tertiary)">—</span>' +
      '<input type="number" class="input" id="rand-max" value="100" placeholder="最大值" style="width:120px">' +
    '</div>' +
    '<label class="tool-form-label" style="margin-top:12px">类型</label>' +
    '<select class="input" id="rand-type" style="width:auto">' +
      '<option value="integer">整数</option>' +
      '<option value="decimal">小数 (2位)</option>' +
    '</select>' +
    '<button class="btn btn-primary" id="btn-rand" style="margin-top:12px">' +
      '<i data-lucide="dice-5" stroke-width="1.5"></i> 生成随机数' +
    '</button>'
  );
  initLucide();

  document.getElementById('btn-rand').addEventListener('click', function() {
    var min = parseFloat(document.getElementById('rand-min').value) || 0;
    var max = parseFloat(document.getElementById('rand-max').value) || 100;
    var type = document.getElementById('rand-type').value;
    if (min >= max) { showToast('最小值必须小于最大值'); return; }

    var result;
    if (type === 'integer') {
      result = Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
      result = (Math.random() * (max - min) + min).toFixed(2);
    }
    showToolResult(result.toString());
  });
}

// ── Markdown Preview ───────────────────────────────────────────
function renderMarkdownTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML =
    '<label class="tool-form-label">Markdown 输入</label>' +
    '<textarea class="input" id="md-input" placeholder="输入 Markdown 文本…" rows="8" style="font-family:var(--font-mono);font-size:12px"></textarea>' +
    '<button class="btn btn-primary" id="btn-md-preview" style="margin-top:12px">' +
      '<i data-lucide="eye" stroke-width="1.5"></i> 预览' +
    '</button>' +
    '<div id="md-preview" style="display:none;margin-top:16px;padding:16px;background:var(--bg-raised);border:1px solid var(--border-default);border-radius:8px;line-height:1.7">' +
      '<div class="tool-output-label" style="margin-bottom:8px">预览</div>' +
      '<div id="md-preview-content"></div>' +
    '</div>';
  initLucide();

  document.getElementById('btn-md-preview').addEventListener('click', function() {
    var md = document.getElementById('md-input').value;
    if (!md) { showToast('请输入 Markdown 文本'); return; }
    var preview = document.getElementById('md-preview');
    var content = document.getElementById('md-preview-content');

    var html = escapeHtml(md);
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/\n/g, '<br>');

    content.innerHTML = html;
    preview.style.display = '';
  });
}

// ── Utilities ──────────────────────────────────────────────────
function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ── HTTP Status Codes Data ─────────────────────────────────────
var HTTP_CODES = [
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
  {code:504,name:'Gateway Timeout',desc:'网关等待上游响应超时'}
];

function getCodeColor(code) {
  if (code < 200) return '#6366f1';
  if (code < 300) return '#22c55e';
  if (code < 400) return '#f59e0b';
  if (code < 500) return '#ef4444';
  return '#a855f7';
}

// ── Regex Tester ───────────────────────────────────────────────
function renderRegexTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML = buildToolUI(
    '<label class="tool-form-label">正则表达式</label>' +
    '<input type="text" class="input" id="regex-pat" placeholder="\\d+">' +
    '<label class="tool-form-label" style="margin-top:12px">测试文本</label>' +
    '<textarea class="input" id="regex-text" placeholder="输入测试内容…" rows="4"></textarea>' +
    '<button class="btn btn-primary" id="btn-regex-test" style="margin-top:12px">' +
      '<i data-lucide="regex" stroke-width="1.5"></i> 测试' +
    '</button>'
  );
  initLucide();

  document.getElementById('btn-regex-test').addEventListener('click', function() {
    var pat = document.getElementById('regex-pat').value;
    var text = document.getElementById('regex-text').value;
    if (!pat) { showToast('请输入正则表达式'); return; }
    try {
      var re = new RegExp(pat, 'gm');
      var results = [];
      var m;
      while ((m = re.exec(text)) !== null) {
        results.push(m[0]);
        if (results.length > 100) { results.push('...(超过100条匹配，已截断)'); break; }
        if (!re.lastIndex) break;
      }
      if (results.length === 0) {
        showToolResult('无匹配');
      } else {
        showToolResult(results.length + ' 个匹配:\n' + results.map(function(r, i) {
          return '  ' + (i + 1) + '. ' + r;
        }).join('\n'));
      }
    } catch (err) {
      showToast('正则表达式错误: ' + err.message);
    }
  });
}

// ── IP Query ───────────────────────────────────────────────────
function renderIPTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML = buildToolUI(
    '<label class="tool-form-label">IP 地址（留空查询本机）</label>' +
    '<input type="text" class="input" id="ip-input" placeholder="如：1.1.1.1（留空查本机）">' +
    '<div style="display:flex;gap:8px;margin-top:12px">' +
      '<button class="btn btn-primary" id="btn-ip-query">' +
        '<i data-lucide="globe" stroke-width="1.5"></i> 查询' +
      '</button>' +
      '<button class="btn btn-secondary" id="btn-ip-self">' +
        '<i data-lucide="monitor" stroke-width="1.5"></i> 查本机' +
      '</button>' +
    '</div>' +
    '<div id="ip-result-info" style="display:none;margin-top:16px">' +
      '<div class="tool-output-label">查询结果</div>' +
      '<div id="ip-result-content" style="font-size:13px;line-height:1.6"></div>' +
    '</div>'
  );
  initLucide();

  function doIPQuery(ip) {
    var resultDiv = document.getElementById('ip-result-info');
    var resultContent = document.getElementById('ip-result-content');
    resultDiv.style.display = '';
    resultContent.innerHTML = '<span style="color:var(--text-secondary)">查询中…</span>';

    fetch('https://ipapi.co/' + ip + '/json/')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.error) {
          resultContent.innerHTML = '<span style="color:#e5484d">查询失败: ' + (d.reason || d.error || '未知错误') + '</span>';
          return;
        }
        resultContent.innerHTML =
          '<div><strong>IP:</strong> ' + (d.ip || '-') + '</div>' +
          '<div><strong>国家:</strong> ' + (d.country_name || '-') + ' (' + (d.country_code || '-') + ')</div>' +
          '<div><strong>城市:</strong> ' + (d.city || '-') + '</div>' +
          '<div><strong>运营商:</strong> ' + (d.org || '-') + '</div>' +
          '<div><strong>时区:</strong> ' + (d.timezone || '-') + '</div>';
      })
      .catch(function(err) {
        resultContent.innerHTML = '<span style="color:#e5484d">查询失败: ' + err.message + '</span>';
      });
  }

  document.getElementById('btn-ip-query').addEventListener('click', function() {
    var ip = document.getElementById('ip-input').value.trim();
    if (!ip) { showToast('请输入 IP 地址'); return; }
    doIPQuery(ip);
  });

  document.getElementById('btn-ip-self').addEventListener('click', function() {
    document.getElementById('ip-input').value = '';
    doIPQuery('');
  });
}

// ── HTTP Status Codes ──────────────────────────────────────────
function renderHttpCodesTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML =
    '<div class="tool-form-group">' +
      '<label class="tool-form-label">搜索状态码</label>' +
      '<input type="text" class="input" id="httpcode-search" placeholder="输入状态码或关键词，如：404、Not Found…">' +
    '</div>' +
    '<div id="httpcode-list" style="margin-top:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:6px"></div>';
  initLucide();

  window.copyHttpCode = function(code) {
    var item = HTTP_CODES.find(function(c) { return c.code === code; });
    if (!item) return;
    navigator.clipboard.writeText(item.code + ' ' + item.name).then(function() {
      showToast('已复制 ' + item.code);
    });
  };

  function renderHttpCodeList(val) {
    val = val || '';
    var kw = val.trim().toLowerCase();
    var filtered = HTTP_CODES.filter(function(c) {
      return !kw || String(c.code).indexOf(kw) !== -1 || c.name.toLowerCase().indexOf(kw) !== -1 || c.desc.indexOf(kw) !== -1;
    });
    var list = document.getElementById('httpcode-list');
    if (!filtered.length) {
      list.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><p>未找到匹配的状态码</p></div>';
      return;
    }
    list.innerHTML = filtered.map(function(c) {
      return '<div class="tool-card" style="padding:10px 12px;cursor:pointer" onclick="copyHttpCode(' + c.code + ')">' +
        '<span style="font-weight:700;font-size:24px;color:' + getCodeColor(c.code) + ';min-width:50px">' + c.code + '</span>' +
        '<div class="tool-card-info">' +
          '<div class="tool-card-name">' + c.name + '</div>' +
          '<div class="tool-card-desc">' + c.desc + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  document.getElementById('httpcode-search').addEventListener('input', function() {
    renderHttpCodeList(this.value);
  });

  renderHttpCodeList('');
}

// ── Speed Test ─────────────────────────────────────────────────
var speedAbortController = null;

function renderSpeedTestTool() {
  var body = document.getElementById('tool-detail-body');
  body.innerHTML =
    '<div style="text-align:center;padding:24px 0">' +
      '<div style="font-family:var(--font-mono);font-size:48px;font-weight:700;letter-spacing:-0.03em;color:var(--accent);margin-bottom:4px" id="speed-val">0.0</div>' +
      '<div style="font-size:14px;color:var(--text-secondary);margin-bottom:20px">Mbps</div>' +
      '<div style="background:var(--bg-hover);height:4px;border-radius:2px;margin-bottom:20px;overflow:hidden">' +
        '<div id="speed-progress" style="height:100%;width:0%;background:var(--accent);border-radius:2px;transition:width 200ms ease-out"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:center;gap:24px;margin-bottom:16px">' +
        '<div><span style="color:var(--text-tertiary);font-size:12px">延迟</span><br><span id="speed-ping" style="font-weight:600;font-size:14px">-</span></div>' +
        '<div><span style="color:var(--text-tertiary);font-size:12px">已下载</span><br><span id="speed-loaded" style="font-weight:600;font-size:14px">0.0 MB</span></div>' +
      '</div>' +
      '<div id="speed-status" style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">点击按钮开始测试</div>' +
      '<button class="btn btn-primary" id="btn-speed-test">' +
        '<i data-lucide="zap" stroke-width="1.5"></i> 开始测试' +
      '</button>' +
    '</div>';
  initLucide();

  document.getElementById('btn-speed-test').addEventListener('click', function() {
    runSpeedTest();
  });
}

async function runSpeedTest() {
  if (speedAbortController) speedAbortController.abort();
  speedAbortController = new AbortController();
  var isAborted = false;

  var btn = document.getElementById('btn-speed-test');
  if (btn) btn.disabled = true;
  document.getElementById('speed-status').textContent = '正在测速…';
  document.getElementById('speed-val').textContent = '0.0';
  document.getElementById('speed-progress').style.width = '0%';
  document.getElementById('speed-ping').textContent = '-';
  document.getElementById('speed-loaded').textContent = '0.0 MB';

  // Ping test
  var pingStart = performance.now();
  try {
    await fetch('./index.html?cb=' + Date.now(), { method: 'HEAD', cache: 'no-store', signal: speedAbortController.signal });
    var ping = Math.round(performance.now() - pingStart);
    document.getElementById('speed-ping').textContent = ping + ' ms';
  } catch(e) {
    if (speedAbortController && speedAbortController.signal && speedAbortController.signal.aborted) isAborted = true;
    else document.getElementById('speed-ping').textContent = '超时';
  }

  if (isAborted) { resetSpeedUI(); return; }

  // Download speed test
  var totalBytes = 0;
  var startTime = performance.now();
  var testFiles = [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/jquery@3.7.0/dist/jquery.min.js'
  ];

  for (var i = 0; i < testFiles.length; i++) {
    if (speedAbortController.signal.aborted) { isAborted = true; break; }
    try {
      var resp = await fetch(testFiles[i], { cache: 'no-store', signal: speedAbortController.signal });
      var reader = resp.body.getReader();
      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        totalBytes += chunk.value.length;
        var elapsed = (performance.now() - startTime) / 1000;
        if (elapsed >= 1) {
          var speedMbps = (totalBytes * 8 / 1000000) / elapsed;
          document.getElementById('speed-val').textContent = speedMbps.toFixed(1);
          document.getElementById('speed-loaded').textContent = (totalBytes / 1000000).toFixed(1) + ' MB';
          document.getElementById('speed-progress').style.width = Math.min(100, Math.round((elapsed / 10) * 100)) + '%';
        }
      }
    } catch(e) {
      if (speedAbortController && speedAbortController.signal && speedAbortController.signal.aborted) isAborted = true;
      break;
    }
    if (totalBytes > 3 * 1000000) break;
  }

  resetSpeedUI();
}

function resetSpeedUI() {
  var btn = document.getElementById('btn-speed-test');
  if (btn) btn.disabled = false;
  var status = document.getElementById('speed-status');
  if (status) {
    var val = parseFloat(document.getElementById('speed-val').textContent);
    if (isNaN(val)) val = 0;
    status.textContent = val > 0 ? '测试完成' : '测试失败或已取消';
  }
  speedAbortController = null;
}
// ================================================================
// INITIALIZATION
// ================================================================

function updateKbdHint() {
  var hint = document.getElementById('kbd-hint');
  var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  hint.textContent = isMac ? '⌘K' : 'Ctrl+K';
}

function initApp() {
  _w('INIT APP START — currentPage=' + currentPage + ' location=' + window.location.href);
  debugLog('initApp START');
  try { loadChatHistory(); } catch(e) { _w('INIT ERROR loadChatHistory: ' + e.message); }
  try { initModelSelector(); } catch(e) { _w('INIT ERROR initModelSelector: ' + e.message); }
  try { renderChatMessages(); } catch(e) { _w('INIT ERROR renderChatMessages: ' + e.message); }
  try { renderQuickActions(); } catch(e) { _w('INIT ERROR renderQuickActions: ' + e.message); }
  try { renderRecentTools(); } catch(e) { _w('INIT ERROR renderRecentTools: ' + e.message); }
  try { renderToolGrid(); } catch(e) { _w('INIT ERROR renderToolGrid: ' + e.message); }
  try { initLucide(); } catch(e) { _w('INIT ERROR initLucide: ' + e.message); }
  try { updateKbdHint(); } catch(e) { _w('INIT ERROR updateKbdHint: ' + e.message); }
  _w('INIT APP DONE — currentPage=' + currentPage + ' #debugLog calls=' + _debugCalls + ' currentTool=' + (currentTool?currentTool.id:'null') + ' tool-detail.active=' + (document.getElementById('tool-detail')?document.getElementById('tool-detail').classList.contains('active'):'N/A'));
  debugLog('initApp DONE — currentPage:', currentPage);
}

// ── BRUTAL: listen for ALL clicks on document to detect phantom clicks ──
document.addEventListener('click', function(e) {
  _w('*CLICK* tag=' + e.target.tagName + ' cls=' + e.target.className + ' id=' + e.target.id + ' closest-tool-card=' + !!e.target.closest('.tool-card') + ' closest-tool-back=' + !!e.target.closest('#tool-back') + ' closest-nav=' + !!e.target.closest('.nav-item'));
}, true); // CAPTURE phase — fires BEFORE any other handler

// ── BRUTAL: listen for ALL touch events ──
['touchstart','touchend','touchmove','touchcancel','pointerdown','pointerup'].forEach(function(evtName) {
  document.addEventListener(evtName, function(e) {
    _w('*TOUCH* ' + evtName + ' target=' + e.target.tagName + '.' + e.target.className + ' touches=' + (e.touches?e.touches.length:'N/A'));
  }, true);
});

// ── BRUTAL: listen for animationend bubbling to #page-tools ──
(function(){
  var pt = document.getElementById('page-tools');
  if (pt) {
    pt.addEventListener('animationend', function(e) {
      _w('*ANIMEND on page-tools* target=' + e.target.id + '.' + e.target.className + ' animName=' + e.animationName);
    });
    _w('ANIMEND listener active on page-tools');
  }
})();

// ── Polling watchdog: every 500ms log tool-detail state ──
var _watchDog = setInterval(function() {
  var detail = document.getElementById('tool-detail');
  var dActive = detail ? detail.classList.contains('active') : 'no-el';
  var dDisplay = detail ? detail.style.display : 'no-el';
  _w('WATCHDOG: tool-detail.active=' + dActive + ' display=' + dDisplay + ' currentTool=' + (currentTool?currentTool.id:'null') + ' currentPage=' + currentPage + ' isTrans=' + isTransitioning + ' ovLen=' + (document.getElementById('debug-overlay')?document.getElementById('debug-overlay').innerHTML.length:'no-ov'));
}, 500);

// ── Defense-in-depth: prevent multi-touch from suppressing clicks ──
document.addEventListener('touchstart', function(e) {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('DOMContentLoaded', initApp);
