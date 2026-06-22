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
  {id:'ip',cat:'net',icon:'🌐',name:'IP查询',desc:'查询IP详细信息'},
  {id:'httpcode',cat:'net',icon:'📡',name:'HTTP状态码',desc:'状态码速查手册'},
];

let tsTimer=null;
let qrLoaded=false;
let isQrLoading=false;
let qrInstance=null;
let isAiLoading=false;
let aiAbortController=null;
let colorDebounceTimer=null;
let aiMessages=[];
let aiTypeTimer=null;
let regexWorker=null;
let bgAnimId=null;
let isIpLoading=false;

function showToast(msg){
  const toast=document.getElementById('toast');
  if(!toast) return;
  toast.textContent=msg;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),1500);
}
function copyText(id){
  const el=document.getElementById(id);
  const txt=el? (el.tagName==='INPUT'||el.tagName==='TEXTAREA'? el.value : el.textContent) : '';
  if(!txt){showToast('无可复制内容'); return;}
  navigator.clipboard.writeText(txt).then(()=>showToast('已复制')).catch(()=>showToast('复制失败'));
}
function debounce(fn,delay=150){
  let timer=null;
  return (...args)=>{
    clearTimeout(timer);
    timer=setTimeout(()=>fn(...args),delay);
  };
}

function renderTools(cat='all'){
  const grid=document.getElementById('toolGrid');
  if(!grid) return;
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

function filterTools(cat,e){
  const grid=document.getElementById('toolGrid');
  if(!grid) return;
  grid.style.opacity=0;
  setTimeout(()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    if(e)e.target.classList.add('active');
    renderTools(cat);
    grid.style.opacity=1;
  },200);
}

function openTool(id){
  const t=tools.find(x=>x.id===id);
  if(!t) return;
  document.getElementById('panelTitle').textContent=t.icon+' '+t.name;
  document.getElementById('panelBody').innerHTML=getPanelHTML(id);
  document.getElementById('overlay').classList.add('show');
  if(id==='ts')initTs();
  if(id==='ai'){
    if(aiTypeTimer){clearInterval(aiTypeTimer);aiTypeTimer=null;}
    aiMessages=[];
    document.getElementById('chatBox').innerHTML='';
  }
}

function closePanel(e){
  if(!e||e.target===document.getElementById('overlay')){
    document.getElementById('overlay').classList.remove('show');
    if(tsTimer){clearInterval(tsTimer);tsTimer=null;}
    if(aiTypeTimer){clearInterval(aiTypeTimer);aiTypeTimer=null;}
    if(aiAbortController){aiAbortController.abort();aiAbortController=null;}
    isAiLoading=false;
    isIpLoading=false;
    aiMessages=[];
    if(regexWorker){regexWorker.terminate();regexWorker=null;}
    const chatBox=document.getElementById('chatBox');
    if(chatBox)chatBox.innerHTML='';
  }
}

function getPanelHTML(id){
  if(id==='pwd')return '<div class="field"><label>长度 <span id="pwdLenVal">16</span></label><input type="range" id="pwdLen" min="8" max="32" value="16" oninput="document.getElementById(\'pwdLenVal\').textContent=this.value"></div><div class="field"><label><input type="checkbox" id="pwdUpper" checked> 大写 &nbsp;<input type="checkbox" id="pwdNum" checked> 数字 &nbsp;<input type="checkbox" id="pwdSym"> 符号</label></div><div class="result-box" id="pwdResult">点击生成</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="genPwd()">生成</button><button class="btn btn-ghost" onclick="copyText(\'pwdResult\')">复制</button></div>';
  if(id==='qr')return '<div class="field"><label>输入文字或链接</label><textarea id="qrInput" placeholder="https://..."></textarea></div><div id="qrOut" style="text-align:center;margin:10px 0"></div><div class="btn-row"><button class="btn btn-primary" onclick="genQR()">生成二维码</button></div>';
  if(id==='color')return '<div class="field"><label>HEX</label><input id="hexIn" placeholder="#00b4ff" oninput="debouncedConvertColor(\'hex\')"></div><div class="field"><label>RGB</label><input id="rgbIn" placeholder="0, 180, 255" oninput="debouncedConvertColor(\'rgb\')"></div><div class="field"><label>HSL</label><input id="hslIn" placeholder="197, 100%, 50%" readonly></div><div id="colorPreview" style="height:50px;border-radius:10px;margin-top:8px;border:1px solid rgba(0,180,255,0.2)"></div>';
  if(id==='ts')return '<div class="field"><label>当前时间戳</label><div class="result-box" id="tsNow">-</div></div><div class="field"><label>时间戳转日期</label><input id="tsInput" placeholder="1700000000"></div><div class="result-box" id="tsResult">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="convertTs()">转换</button><button class="btn btn-ghost" onclick="copyText(\'tsResult\')">复制</button></div>';
  if(id==='hash')return '<div class="field"><label>输入文本</label><textarea id="hashInput" placeholder="输入内容..."></textarea></div><div class="field"><label>算法</label><select id="hashAlgo"><option value="SHA-1">SHA-1</option><option value="SHA-256" selected>SHA-256</option><option value="SHA-512">SHA-512</option></select></div><div class="result-box" id="hashResult">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="calcHash()">计算</button><button class="btn btn-ghost" onclick="copyText(\'hashResult\')">复制</button></div>';
  if(id==='aes')return '<div class="field"><label>文本</label><textarea id="aesInput" placeholder="输入内容..."></textarea></div><div class="field"><label>密钥</label><input id="aesKey" placeholder="输入任意密码 (自动Hash转为32位安全密钥)"></div><div class="result-box" id="aesResult">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="aesEncrypt()">加密</button><button class="btn btn-ghost" onclick="aesDecrypt()">解密</button><button class="btn btn-ghost" onclick="copyText(\'aesResult\')">复制</button></div>';
  if(id==='b64')return '<div class="field"><label>输入</label><textarea id="b64Input" placeholder="输入内容..."></textarea></div><div class="result-box" id="b64Result">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="b64Encode()">编码</button><button class="btn btn-ghost" onclick="b64Decode()">解码</button><button class="btn btn-ghost" onclick="copyText(\'b64Result\')">复制</button></div>';
  if(id==='json')return '<div class="field"><label>JSON内容</label><textarea id="jsonInput" placeholder=\'{"key":"value"}\' style="min-height:120px"></textarea></div><div class="result-box" id="jsonResult" style="white-space:pre;min-height:80px">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="fmtJson()">格式化</button><button class="btn btn-ghost" onclick="minJson()">压缩</button><button class="btn btn-ghost" onclick="copyText(\'jsonResult\')">复制</button></div>';
  if(id==='regex')return '<div class="field"><label>正则表达式</label><input id="regexPat" placeholder="\\\\d+"></div><div class="field"><label>测试文本</label><textarea id="regexText" placeholder="输入测试内容..."></textarea></div><div class="result-box" id="regexResult">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="testRegex()">测试</button></div>';
  if(id==='url')return '<div class="field"><label>输入</label><textarea id="urlInput" placeholder="输入内容..."></textarea></div><div class="result-box" id="urlResult">-</div><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" onclick="urlEncode()">编码</button><button class="btn btn-ghost" onclick="urlDecode()">解码</button><button class="btn btn-ghost" onclick="copyText(\'urlResult\')">复制</button></div>';
  if(id==='ai')return '<div class="chat-box" id="chatBox"></div><div class="field"><textarea id="aiInput" placeholder="输入问题..." style="min-height:60px"></textarea></div><div class="btn-row"><button class="btn btn-primary" onclick="sendAI()">发送</button></div>';

  if(id==='ip')return `
    <div class="field">
      <label>IP 地址（留空查询本机）</label>
      <input id="ipInput" placeholder="如：1.1.1.1（留空查本机IP）">
    </div>
    <div class="btn-row" style="margin-bottom:14px">
      <button class="btn btn-primary" onclick="ipQuery()">查询</button>
      <button class="btn btn-ghost" onclick="document.getElementById('ipInput').value='';ipQuery()">查本机IP</button>
    </div>
    <div id="ipResult" class="ip-result-box" style="display:none"></div>
  `;

  if(id==='httpcode')return `
    <div class="field">
      <input id="httpSearchInput" placeholder="输入状态码或关键词，如：404 或 找不到" oninput="filterHttpCodes(this.value)">
    </div>
    <div id="httpCodeList" class="http-code-list"></div>
  ` + '<script>renderHttpCodes();<\/script>';

  return '<p>开发中...</p>';
}

const debouncedConvertColor=debounce(convertColor);

// ========== 原有工具函数 ==========

function genPwd(){
  const len=parseInt(document.getElementById('pwdLen').value, 10);
  let chars='abcdefghijklmnopqrstuvwxyz';
  if(document.getElementById('pwdUpper').checked)chars+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if(document.getElementById('pwdNum').checked)chars+='0123456789';
  if(document.getElementById('pwdSym').checked)chars+='!@#$%^&*';
  if(chars.length===0)chars='abcdefghijklmnopqrstuvwxyz';
  let pwd='';
  const randomValues = new Uint32Array(len);
  crypto.getRandomValues(randomValues);
  for(let i=0;i<len;i++)pwd+=chars[randomValues[i]%chars.length];
  document.getElementById('pwdResult').textContent=pwd;
}

function genQR(){
  const text=document.getElementById('qrInput').value.trim();
  if(!text)return;
  const out=document.getElementById('qrOut');
  if(qrInstance&&typeof qrInstance.clear==='function'){qrInstance.clear();qrInstance=null;}
  out.innerHTML='';
  if(!qrLoaded){
    if(isQrLoading) return;
    isQrLoading=true;
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload=()=>{
      qrLoaded=true;
      isQrLoading=false;
      qrInstance=new QRCode(out,{text,width:180,height:180,colorDark:'#00b4ff',colorLight:'#020b18'});
    };
    s.onerror=()=>{
      isQrLoading=false;
      showToast('静态库加载失败，请重试');
    };
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
      const p=val.split(',').map(x=>parseInt(x.trim(), 10));
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
    const num=parseInt(v, 10);
    if(isNaN(num)){showToast('请输入有效的时间戳'); return;}
    const d=new Date(num<10000000000?num*1000:num);
    document.getElementById('tsResult').textContent=isNaN(d.getTime())?'无效时间戳':d.toLocaleString('zh-CN');
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
    const keyStr=document.getElementById('aesKey').value;
    if(!keyStr){showToast('请输入密钥'); return;}
    const key=await getKey(keyStr);
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const enc=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(document.getElementById('aesInput').value));
    const combined=new Uint8Array(iv.length+enc.byteLength);
    combined.set(iv);combined.set(new Uint8Array(enc),iv.length);
    document.getElementById('aesResult').textContent=btoa(String.fromCharCode(...combined));
  }catch(e){showToast('加密失败：'+e.message);}
}
async function aesDecrypt(){
  try{
    const keyStr=document.getElementById('aesKey').value;
    if(!keyStr){showToast('请输入密钥'); return;}
    const key=await getKey(keyStr);
    const raw=document.getElementById('aesInput').value.trim();
    if(!raw)throw new Error('内容为空');
    const combined=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));
    if(combined.length<28)throw new Error('密文过短');
    const dec=await crypto.subtle.decrypt({name:'AES-GCM',iv:combined.slice(0,12)},key,combined.slice(12));
    document.getElementById('aesResult').textContent=new TextDecoder().decode(dec);
  }catch(e){showToast('解密失败，密钥或密文错误');}
}

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
    const binary=atob(document.getElementById('b64Input').value.trim());
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

function testRegex(){
  try{
    const pattern=document.getElementById('regexPat').value;
    const testStr=document.getElementById('regexText').value;
    const resultBox=document.getElementById('regexResult');
    if(!pattern){showToast('请输入正则表达式'); return;}
    if(regexWorker){regexWorker.terminate(); regexWorker=null;}
    resultBox.textContent='计算中...';
    const workerBlobCode=`
      self.onmessage=function(e){
        try{
          const {pattern, testStr}=e.data;
          const reg=new RegExp(pattern,'g');
          const results=[];
          let match;
          while((match=reg.exec(testStr))!==null){
            results.push(match[0]);
            if(reg.lastIndex===match.index) reg.lastIndex++;
            if(results.length > 3000) {
              self.postMessage({success:true, results, truncated:true});
              return;
            }
          }
          self.postMessage({success:true, results});
        }catch(err){
          self.postMessage({success:false, error:err.message});
        }
      };
    `;
    const blob=new Blob([workerBlobCode], {type:'application/javascript'});
    regexWorker=new Worker(URL.createObjectURL(blob));
    const timeoutId=setTimeout(()=>{
      if(regexWorker){
        regexWorker.terminate();
        regexWorker=null;
        showToast('计算超时！已强行拦截灾难性正则回溯风险');
        resultBox.textContent='执行超时（检测到可能导致主线程崩溃的正则灾难性回溯风险，已强行终止进程）';
      }
    }, 300);
    regexWorker.onmessage=function(e){
      clearTimeout(timeoutId);
      const data=e.data;
      if(data.success){
        let msg=data.results.length? '匹配'+data.results.length+'处：'+data.results.join(', '):'无匹配';
        if(data.truncated) msg += '（仅展示前3000处匹配）';
        resultBox.textContent=msg;
      }else{
        showToast('正则表达式非法');
        resultBox.textContent='语法错误：'+data.error;
      }
      regexWorker.terminate();
      regexWorker=null;
    };
    regexWorker.postMessage({pattern, testStr});
  }catch(e){
    showToast('正则测试初始化失败');
  }
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
  box.innerHTML+='<div class="msg user">'+text+'</div><div class="msg thinking" id="thinking">AI思考中...</div>';
  input.value='';box.scrollTop=box.scrollHeight;
  isAiLoading=true;
  if(aiTypeTimer){clearInterval(aiTypeTimer);aiTypeTimer=null;}
  aiAbortController = new AbortController();
  try{
    const res=await fetch('https://api.cwj-tools.xyz/',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:aiMessages,max_tokens:1000}),
      signal: aiAbortController.signal
    });
    const data=await res.json();
    document.getElementById('thinking')?.remove();
    if(!document.getElementById('overlay').classList.contains('show')) return;
    const fullReply=data.choices?.[0]?.message?.content||'无响应';
    const aiMsgDom=document.createElement('div');
    aiMsgDom.className='msg ai';
    box.appendChild(aiMsgDom);
    let charIndex=0;
    aiTypeTimer=setInterval(()=>{
      if(charIndex>=fullReply.length){
        clearInterval(aiTypeTimer);aiTypeTimer=null;
        aiMessages.push({role:'assistant',content:fullReply});
        return;
      }
      aiMsgDom.textContent+=fullReply[charIndex];
      box.scrollTop=box.scrollHeight;
      charIndex++;
    },25);
  }catch(e){
    if(e.name === 'AbortError') return;
    document.getElementById('thinking')?.remove();
    const targetBox = document.getElementById('chatBox');
    if(targetBox) targetBox.innerHTML+='<div class="msg ai">请求失败：'+e.message+'</div>';
    if(aiTypeTimer){clearInterval(aiTypeTimer);aiTypeTimer=null;}
  }finally{
    isAiLoading=false;
    aiAbortController=null;
  }
}

// ========== IP 查询 ==========
async function ipQuery(){
  if(isIpLoading) return;
  const input=document.getElementById('ipInput');
  const resultBox=document.getElementById('ipResult');
  if(!input||!resultBox) return;

  const ip=input.value.trim();
  // 简单格式校验（允许留空查本机）
  if(ip && !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)){
    showToast('IP格式不正确');
    return;
  }

  isIpLoading=true;
  resultBox.style.display='block';
  resultBox.innerHTML='<div class="ip-loading">查询中...</div>';

  try{
    const url=ip
      ? `http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,message,query,country,regionName,city,lat,lon,isp,org,as,asname,proxy,hosting`
      : `http://ip-api.com/json/?lang=zh-CN&fields=status,message,query,country,regionName,city,lat,lon,isp,org,as,asname,proxy,hosting`;

    const res=await fetch(url);
    const d=await res.json();

    if(d.status!=='success'){
      resultBox.innerHTML='<div class="ip-error">查询失败：'+(d.message||'未知错误')+'</div>';
      return;
    }

    // IP类型判断
    let ipType='普通IP';
    let ipTypeClass='ip-tag-normal';
    if(d.hosting){ipType='IDC机房 IP';ipTypeClass='ip-tag-idc';}
    else if(d.proxy){ipType='代理/VPN IP';ipTypeClass='ip-tag-proxy';}

    const rows=[
      {label:'IP 地址',value:d.query},
      {label:'IP 类型',value:`<span class="ip-tag ${ipTypeClass}">${ipType}</span>`},
      {label:'国家',value:d.country||'-'},
      {label:'省份',value:d.regionName||'-'},
      {label:'城市',value:d.city||'-'},
      {label:'ISP',value:d.isp||'-'},
      {label:'组织',value:d.org||'-'},
      {label:'ASN',value:d.as||'-'},
      {label:'ASN 名称',value:d.asname||'-'},
      {label:'经度',value:d.lon??'-'},
      {label:'纬度',value:d.lat??'-'},
      {label:'代理检测',value:d.proxy?'<span class="ip-tag ip-tag-proxy">是</span>':'<span class="ip-tag ip-tag-safe">否</span>'},
    ];

    resultBox.innerHTML=`
      <div class="ip-table">
        ${rows.map(r=>`
          <div class="ip-row">
            <div class="ip-label">${r.label}</div>
            <div class="ip-value">${r.value}</div>
          </div>
        `).join('')}
      </div>
    `;
  }catch(e){
    resultBox.innerHTML='<div class="ip-error">网络请求失败，请检查网络连接</div>';
  }finally{
    isIpLoading=false;
  }
}

// ========== HTTP 状态码 ==========
const HTTP_CODES=[
  // 1xx
  {code:100,name:'Continue',desc:'服务器已收到请求头，客户端应继续发送请求体'},
  {code:101,name:'Switching Protocols',desc:'服务器同意客户端切换协议（如 WebSocket）'},
  {code:102,name:'Processing',desc:'服务器已接收请求，正在处理中（WebDAV）'},
  // 2xx
  {code:200,name:'OK',desc:'请求成功，返回请求的数据'},
  {code:201,name:'Created',desc:'请求成功，并创建了新资源'},
  {code:202,name:'Accepted',desc:'请求已接受，但尚未处理完成'},
  {code:204,name:'No Content',desc:'请求成功，但无返回内容（如 DELETE 操作）'},
  {code:206,name:'Partial Content',desc:'返回部分内容，用于断点续传'},
  // 3xx
  {code:301,name:'Moved Permanently',desc:'资源永久重定向到新 URL'},
  {code:302,name:'Found',desc:'资源临时重定向到新 URL'},
  {code:304,name:'Not Modified',desc:'资源未修改，使用缓存版本'},
  {code:307,name:'Temporary Redirect',desc:'临时重定向，方法不变'},
  {code:308,name:'Permanent Redirect',desc:'永久重定向，方法不变'},
  // 4xx
  {code:400,name:'Bad Request',desc:'请求格式错误或参数无效'},
  {code:401,name:'Unauthorized',desc:'未认证，需要登录或提供凭据'},
  {code:403,name:'Forbidden',desc:'服务器拒绝访问，权限不足'},
  {code:404,name:'Not Found',desc:'请求的资源不存在'},
  {code:405,name:'Method Not Allowed',desc:'请求方法不被允许（如用 GET 代替 POST）'},
  {code:408,name:'Request Timeout',desc:'请求超时，服务器等待时间过长'},
  {code:409,name:'Conflict',desc:'请求冲突，如版本冲突或重复资源'},
  {code:410,name:'Gone',desc:'资源已永久删除'},
  {code:413,name:'Payload Too Large',desc:'请求体过大，服务器拒绝处理'},
  {code:414,name:'URI Too Long',desc:'请求的 URL 过长'},
  {code:415,name:'Unsupported Media Type',desc:'不支持的媒体类型'},
  {code:422,name:'Unprocessable Entity',desc:'请求格式正确但语义错误（常见于表单验证失败）'},
  {code:429,name:'Too Many Requests',desc:'请求频率超限，触发限流'},
  // 5xx
  {code:500,name:'Internal Server Error',desc:'服务器内部错误'},
  {code:501,name:'Not Implemented',desc:'服务器不支持该请求方法'},
  {code:502,name:'Bad Gateway',desc:'网关收到上游无效响应（常见于反向代理）'},
  {code:503,name:'Service Unavailable',desc:'服务不可用，服务器过载或维护中'},
  {code:504,name:'Gateway Timeout',desc:'网关等待上游响应超时'},
  {code:505,name:'HTTP Version Not Supported',desc:'不支持的 HTTP 版本'},
];

function getCodeColor(code){
  if(code<200)return '#6366f1';
  if(code<300)return '#22c55e';
  if(code<400)return '#f59e0b';
  if(code<500)return '#ef4444';
  return '#a855f7';
}

function renderHttpCodes(filter=''){
  const list=document.getElementById('httpCodeList');
  if(!list) return;
  const kw=filter.trim().toLowerCase();
  const filtered=HTTP_CODES.filter(c=>
    !kw ||
    String(c.code).includes(kw) ||
    c.name.toLowerCase().includes(kw) ||
    c.desc.includes(kw)
  );
  if(!filtered.length){
    list.innerHTML='<div class="ip-error">未找到匹配的状态码</div>';
    return;
  }
  list.innerHTML=filtered.map(c=>`
    <div class="http-code-item" onclick="copyHttpCode(${c.code})">
      <div class="http-code-num" style="color:${getCodeColor(c.code)}">${c.code}</div>
      <div class="http-code-info">
        <div class="http-code-name">${c.name}</div>
        <div class="http-code-desc">${c.desc}</div>
      </div>
    </div>
  `).join('');
}

function filterHttpCodes(val){
  renderHttpCodes(val);
}

function copyHttpCode(code){
  const item=HTTP_CODES.find(c=>c.code===code);
  if(!item) return;
  navigator.clipboard.writeText(`${item.code} ${item.name}`).then(()=>showToast('已复制 '+item.code));
}

// ========== 粒子背景 ==========
const canvas=document.getElementById('bg');
const ctx=canvas?.getContext('2d');
let particles=[];
const PARTICLE_COUNT=100;
const CONNECT_DIST=130;
const CELL_SIZE=CONNECT_DIST;
let mouseX=-9999,mouseY=-9999;
let mouseActive=false;

function resize(){if(canvas){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}}
if(canvas){
  resize();
  window.addEventListener('resize',resize);
}

for(let i=0;i<PARTICLE_COUNT;i++){
  const type=Math.random()<0.6?'cyan':'purple';
  particles.push({
    x:Math.random()*window.innerWidth,
    y:Math.random()*window.innerHeight,
    vx:(Math.random()-.5)*.35,
    vy:(Math.random()-.5)*.35,
    r:type==='cyan'?Math.random()*1.8+.4:Math.random()*1.4+.3,
    a:type==='cyan'?Math.random()*.7+.2:Math.random()*.6+.15,
    type:type
  });
}

document.addEventListener('mousemove',e=>{mouseX=e.clientX;mouseY=e.clientY;mouseActive=true;});
document.addEventListener('mouseleave',()=>{mouseActive=false;});

function drawBg(){
  if(!canvas || !ctx) return;
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle='rgba(0,212,232,0.025)';
  ctx.lineWidth=.8;
  for(let x=0;x<W;x+=45){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=45){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  const len=particles.length;
  for(let i=0;i<len;i++){
    const p=particles[i];
    if(mouseActive){
      const dx=mouseX-p.x,dy=mouseY-p.y;
      const dist=Math.hypot(dx,dy);
      if(dist<200){const force=(200-dist)/200*.015;p.vx+=dx*force;p.vy+=dy*force;}
    }
    p.vx*=.995;p.vy*=.995;p.x+=p.vx;p.y+=p.vy;
    if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;
  }
  for(let i=0;i<len;i++){
    const p=particles[i];
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    if(p.type==='cyan'){ctx.fillStyle=`rgba(0,240,255,${p.a})`;ctx.shadowColor='rgba(0,240,255,0.4)';ctx.shadowBlur=6;}
    else{ctx.fillStyle=`rgba(168,85,247,${p.a})`;ctx.shadowColor='rgba(168,85,247,0.35)';ctx.shadowBlur=4;}
    ctx.fill();ctx.shadowBlur=0;
  }
  const cols=Math.ceil(W/CELL_SIZE)+1;
  const rows=Math.ceil(H/CELL_SIZE)+1;
  const grid=new Array(cols*rows).fill(null).map(()=>[]);
  for(let i=0;i<len;i++){
    const p=particles[i];
    const cx=Math.floor(p.x/CELL_SIZE);
    const cy=Math.floor(p.y/CELL_SIZE);
    if(cx>=0&&cx<cols&&cy>=0&&cy<rows)grid[cy*cols+cx].push(i);
  }
  ctx.lineWidth=.6;
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
                const alpha=.22*(1-dist/CONNECT_DIST);
                ctx.beginPath();ctx.moveTo(pi.x,pi.y);ctx.lineTo(pj.x,pj.y);
                if(pi.type===pj.type){ctx.strokeStyle=pi.type==='cyan'?`rgba(0,240,255,${alpha})`:`rgba(168,85,247,${alpha})`;}
                else{ctx.strokeStyle=`rgba(200,200,255,${alpha*.7})`;}
                ctx.stroke();
              }
            }
          }
        }
      }
      for(let a=0;a<cell.length;a++){
        for(let b=a+1;b<cell.length;b++){
          const pi=particles[cell[a]],pj=particles[cell[b]];
          const dist=Math.hypot(pi.x-pj.x,pi.y-pj.y);
          if(dist<CONNECT_DIST){
            const alpha=.22*(1-dist/CONNECT_DIST);
            ctx.beginPath();ctx.moveTo(pi.x,pi.y);ctx.lineTo(pj.x,pj.y);
            if(pi.type===pj.type){ctx.strokeStyle=pi.type==='cyan'?`rgba(0,240,255,${alpha})`:`rgba(168,85,247,${alpha})`;}
            else{ctx.strokeStyle=`rgba(200,200,255,${alpha*.7})`;}
            ctx.stroke();
          }
        }
      }
    }
  }
  bgAnimId=requestAnimationFrame(drawBg);
}

document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(bgAnimId){cancelAnimationFrame(bgAnimId);bgAnimId=null;}}
  else{if(!bgAnimId)drawBg();}
});

if(canvas) drawBg();
renderTools();

// ========== 导航栏滚动（统一用 .scrolled 类，不再直接操作 style）==========
const headerDom=document.querySelector('header');
if(headerDom){
  window.addEventListener('scroll',()=>{
    if(window.scrollY>15){
      headerDom.classList.add('scrolled');
    }else{
      headerDom.classList.remove('scrolled');
    }
  });
}

// ========== 移动端面板下拉手势关闭 ==========
const panel=d
