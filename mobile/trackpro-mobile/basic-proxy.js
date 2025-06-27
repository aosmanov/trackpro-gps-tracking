// Basic HTTP proxy for mobile app
const http = require('http');
const https = require('https');
const url = require('url');

const TARGET_HOST = '172.22.183.62';
const TARGET_PORT = 3001;
const PROXY_PORT = 3003;

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Prepare proxy request options
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${TARGET_HOST}:${TARGET_PORT}`
    }
  };

  // Create proxy request
  const proxyReq = http.request(options, (proxyRes) => {
    console.log(`Response: ${proxyRes.statusCode}`);
    
    // Copy status and headers
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    
    // Pipe the response
    proxyRes.pipe(res);
  });

  // Handle errors
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy Error');
  });

  // Pipe request body
  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Basic proxy server running on http://0.0.0.0:${PROXY_PORT}`);
  console.log(`Your WiFi IP: http://172.20.10.3:${PROXY_PORT}`);
  console.log(`Forwarding to WSL: http://${TARGET_HOST}:${TARGET_PORT}`);
});