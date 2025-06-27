// Simple HTTP proxy for mobile app to reach WSL backend
const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({
  target: 'http://172.22.183.62:3001',
  changeOrigin: true
});

const server = http.createServer((req, res) => {
  console.log(`Proxying ${req.method} ${req.url}`);
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  proxy.web(req, res, {}, (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy error');
  });
});

server.listen(3003, '0.0.0.0', () => {
  console.log('Proxy server running on http://0.0.0.0:3003');
  console.log('Forwarding to WSL backend at http://172.22.183.62:3001');
});