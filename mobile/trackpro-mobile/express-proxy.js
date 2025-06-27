// Express proxy server for mobile app
const express = require('express');
const axios = require('axios');
const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Proxy all requests to WSL backend
app.all('*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `http://172.22.183.62:3001${req.url}`,
      data: req.body,
      headers: {
        ...req.headers,
        host: 'localhost:3001'
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Proxy error' });
    }
  }
});

const PORT = 3003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express proxy running on http://0.0.0.0:${PORT}`);
  console.log('Your WiFi IP: http://172.20.10.3:3003');
  console.log('Forwarding to WSL: http://172.22.183.62:3001');
});