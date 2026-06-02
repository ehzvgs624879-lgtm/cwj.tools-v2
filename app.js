function setMode(mode) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.getElementById(mode + "Box").classList.add("active");
}

async function send() {
  const input = document.getElementById("input").value;
  const output = document.getElementById("output");

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
    output.innerHTML = "👉 " + data.reply;
  } catch (e) {
    output.innerHTML = "❌ 请求失败";
  }
}
