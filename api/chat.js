export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 这里会自动读取你在 Vercel 后台填写的 API Key
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();

    // 如果 API Key 没填对或者欠费，直接把具体的报错发给前台
    if (data.error) {
      return res.status(200).json({ reply: "大模型报错啦: " + data.error.message });
    }

    const reply = data?.choices?.[0]?.message?.content || "无回复";
    res.status(200).json({ reply });

  } catch (error) {
    res.status(500).json({ error: "服务器内部请求失败" });
  }
}
