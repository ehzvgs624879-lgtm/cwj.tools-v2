export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  let reply = "";

  if (!message) {
    reply = "请输入内容";
  } 
  else if (message.includes("你好")) {
    reply = "你好，我是 CWJ TOOLS 后端";
  } 
  else if (message.includes("工具")) {
    reply = "工具：AI / 天气 / 翻译 / 搜索";
  } 
  else {
    reply = "已收到：" + message;
  }

  res.status(200).json({ reply });
}
