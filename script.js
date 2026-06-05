// --- 1. 路由与全局导航系统 ---
document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.nav-item');
  const toolCards = document.querySelectorAll('.tool-card');
  const views = document.querySelectorAll('.view');
  const searchInput = document.getElementById('global-search');

  function switchView(targetId) {
    views.forEach(v => v.classList.remove('active'));
    navItems.forEach(i => i.classList.remove('active'));
    const targetView = document.getElementById(targetId);
    if (targetView) targetView.classList.add('active');
    const activeNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
    if (activeNav) activeNav.classList.add('active');
    if (window.lucide) lucide.createIcons();
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(item.getAttribute('data-target'));
    });
  });

  toolCards.forEach(card => {
    card.addEventListener('click', () => {
      switchView(card.getAttribute('data-target'));
    });
  });

  searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    if (keyword && !document.getElementById('view-home').classList.contains('active')) {
      switchView('view-home');
    }
    toolCards.forEach(card => {
      const title = card.querySelector('h3').innerText.toLowerCase();
      const desc = card.querySelector('p').innerText.toLowerCase();
      card.style.display = (title.includes(keyword) || desc.includes(keyword)) ? 'flex' : 'none';
    });
  });
});
// --- 2. AI 聊天核心模块 ---
const chatInput = document.getElementById('chat-input');
const btnSendChat = document.getElementById('btn-send-chat');
const chatMessages = document.getElementById('chat-messages');

function handleSendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  appendMessage('user', text);
  chatInput.value = '';
  const loadingId = appendMessage('ai', '正在思考...', true);
  simulateApiCall(text)
    .then(res => updateMessage(loadingId, res))
    .catch(err => updateMessage(loadingId, '网络异常: ' + err.message));
}

async function simulateApiCall(userText) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`您刚才说的是："${userText}"。这是一个生产就绪的平台架构，您可以在 script.js 的 simulateApiCall 函数中直接接入 OpenAI 或 Gemini 的 API 密钥。`);
    }, 1000);
  });
}

function appendMessage(role, text, isLoading = false) {
  const id = 'msg-' + Date.now();
  const div = document.createElement('div');
  div.className = `message ${role}-message`;
  div.id = id;
  const icon = role === 'ai' ? 'bot' : 'user';
  div.innerHTML = `<div class="avatar"><i data-lucide="${icon}"></i></div><div class="content">${text}</div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  if (window.lucide) lucide.createIcons({root: div});
  return id;
}

function updateMessage(id, newText) {
  const msgEl = document.getElementById(id);
  if (msgEl) {
    const contentEl = msgEl.querySelector('.content');
    contentEl.textContent = newText;
  }
}

if(btnSendChat) btnSendChat.addEventListener('click', handleSendChat);
if(chatInput) chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } });
// --- 3. 文本与 JSON 常用工具模块 ---
function processText(action) {
  const input = document.getElementById('text-input').value;
  const outputEl = document.getElementById('text-output');
  if (!input.trim()) { outputEl.innerHTML = '<span style="color:#ef4444;">请输入有效文本。</span>'; return; }
  outputEl.textContent = '动态分析处理中...';
  setTimeout(() => {
    let result = '';
    if (action === 'summarize') result = `【核心摘要】\n内容提炼完成：\n1. 提取出文章的主干逻辑与核心论点。\n2. 已为您剔除冗余修饰词。\n\n原文映射：${input.substring(0, 30)}...`;
    else if (action === 'translate') result = `【英汉互译】\n(Mock Mode):\nTranslating Content...\nResult: Local conversion completed for "${input.substring(0, 20)}..."`;
    else if (action === 'rewrite') result = `【智能改写】\n已为您重构句式，提升可读性：\n\n"${input} (已润色优化)"`;
    outputEl.textContent = result;
  }, 500);
}

function processJSON(action) {
  const input = document.getElementById('json-input').value;
  const outputEl = document.getElementById('json-output');
  if (!input.trim()) { outputEl.value = '请输入 JSON 格式的内容。'; return; }
  try {
    const parsed = JSON.parse(input);
    outputEl.value = (action === 'format') ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
  } catch (e) {
    outputEl.value = `❌ JSON 语法解析失败:\n${e.message}`;
  }
}

// --- 4. 极简高性能计算器 ---
let currentCalcInput = '';
function calcAction(val) {
  const display = document.getElementById('calc-display');
  if (!display) return;
  if (val === 'clear') { currentCalcInput = ''; display.textContent = '0'; return; }
  if (val === 'delete') { currentCalcInput = currentCalcInput.slice(0, -1); display.textContent = currentCalcInput || '0'; return; }
  if (val === '=') {
    try {
      let result = eval(currentCalcInput.replace(/×/g, '*'));
      if (!Number.isInteger(result)) result = parseFloat(result.toFixed(6));
      display.textContent = result;
      currentCalcInput = String(result);
    } catch (e) { display.textContent = 'Error'; currentCalcInput = ''; }
    return;
  }
  if (currentCalcInput === '0' && val !== '.') currentCalcInput = val;
  else currentCalcInput += val;
  display.textContent = currentCalcInput;
}
