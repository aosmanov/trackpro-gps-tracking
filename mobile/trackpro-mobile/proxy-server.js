// Simple proxy server to forward requests from Windows to WSL backend
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// Proxy all /api requests to WSL backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  logLevel: 'debug'
}));

const PORT = 3002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on http://0.0.0.0:${PORT}`);
  console.log('Forwarding /api requests to http://localhost:3001');
});