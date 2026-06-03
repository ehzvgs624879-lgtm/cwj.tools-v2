function setPage(page){

  document.querySelectorAll(".page")
    .forEach(p => p.classList.remove("active"));

  document.getElementById(page + "Page")
    .classList.add("active");
}

function sleep(ms){
  return new Promise(r => setTimeout(r, ms));
}

async function typeWriter(el, text){

  el.innerHTML = "";

  for(let i=0;i<text.length;i++){
    el.innerHTML += text[i];
    await sleep(10);
  }
}

async function send(){

  const input = document.getElementById("input");
  const chatOutput = document.getElementById("chatOutput");

  const msg = input.value.trim();

  if(!msg){
    chatOutput.innerHTML = "请输入内容";
    return;
  }

  // 用户消息显示
  chatOutput.innerHTML += `
    <div class="msg user">👤 ${msg}</div>
  `;

  input.value = "";

  // AI loading
  const loadingId = "loading_" + Date.now();

  chatOutput.innerHTML += `
    <div class="msg ai" id="${loadingId}">AI思考中...</div>
  `;

  chatOutput.scrollTop = chatOutput.scrollHeight;

  try{

    const res = await fetch("/api/chat",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ message: msg })
    });

    const data = await res.json();

    const el = document.getElementById(loadingId);

    await typeWriter(el, "🤖 " + data.reply);

  }catch(e){

    const el = document.getElementById(loadingId);
    el.innerHTML = "❌ 请求失败，请检查API";

  }
}
