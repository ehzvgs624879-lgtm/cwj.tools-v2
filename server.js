const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;
const LOG_FILE = '/tmp/debug.log';

// Clear log file on server start
fs.writeFileSync(LOG_FILE, '=== CWJ Tools debug log started at ' + new Date().toISOString() + ' ===\n');

const server = http.createServer((req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let filePath = req.url === '/' ? '/index.html' : req.url;

  // 查找文件
  const fullPath = path.join(__dirname, filePath);

  // 处理 debug log POST endpoint
  if (filePath === '/api/log' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      fs.appendFileSync(LOG_FILE, body + '\n');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  // 处理 API 请求
  if (filePath.startsWith('/api/')) {
    handleAPIRequest(req, res, filePath);
    return;
  }

  // 检查文件是否存在
  if (fs.existsSync(fullPath)) {
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = getContentType(ext);

    fs.readFile(fullPath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error reading file');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
  } else {
    res.writeHead(404);
    res.end('File not found');
  }
});

function getContentType(ext) {
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  return types[ext] || 'application/octet-stream';
}

function handleAPIRequest(req, res, filePath) {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      // 简单的 API 响应 - 返回成功消息
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'success',
        message: 'API endpoint hit',
        timestamp: new Date().toISOString(),
        path: filePath
      }));
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      message: 'API endpoint available',
      methods: ['POST'],
      timestamp: new Date().toISOString()
    }));
  }
}

server.listen(port, () => {
  console.log(`🚀 CWJ Tools 开发服务器已启动！`);
  console.log(`📱 本地访问地址: http://localhost:${port}`);
  console.log(`🌐 网络访问地址: http://0.0.0.0:${port}`);
  console.log('');
  console.log(`💡 提示:`);
  console.log(`   - 按 Ctrl+C 停止服务器`);
  console.log(`   - API 请求会返回示例数据`);
  console.log(`   - 所有文件支持热重载`);
});