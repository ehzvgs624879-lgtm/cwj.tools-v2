function setMode(mode) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.getElementById(mode + "Box").classList.add("active");
}

function sleep(ms){
  return new Promise(res => setTimeout(res, ms));
}

async function typeText(element, text){
  element.innerHTML = "";
  for(let i=0;i<text.length;i++){
    element.innerHTML += text[i];
    await sleep(15);
  }
}

async function send() {
  const inputEl = document.getElementById("input");
  const output = document.getElementById("output");

  const input = inputEl.value;

  if (!input) {
    output.innerHTML = "请输入内容";
    return;
  }

  output.innerHTML = "AI 思考中...";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();

    await typeText(output, "👉 " + data.reply);

    inputEl.value = "";

  } catch (e) {
    output.innerHTML = "❌ 请求失败，请检查 API";
  }
}
