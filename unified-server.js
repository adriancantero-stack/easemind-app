/**
 * EaseMind Unified Server
 * Single entry point that proxies requests to:
 * - / (root) → Website (port 9000)
 * - /app → Frontend (port 3000)
 * - /api/* → Backend (port 8001)
 */

const http = require('http');
const httpProxy = require('http-proxy');

const PORT = process.env.PORT || 8080;

// Create proxy server
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: true, // WebSocket support for Expo HMR
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway: Service temporarily unavailable');
  }
});

// Create HTTP server
const server = http.createServer((req, res) => {
  const { url } = req;
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${url}`);
  
  // Route: /api/* → Backend (port 8001)
  if (url.startsWith('/api/')) {
    console.log(`→ Proxying to backend (8001): ${url}`);
    proxy.web(req, res, { target: 'http://127.0.0.1:8001' });
  }
  // Route: /app/* or /app → Frontend (port 3000)
  else if (url === '/app' || url.startsWith('/app/') || url.startsWith('/app?')) {
    // Remove /app prefix for frontend
    const newUrl = url.replace(/^\/app/, '') || '/';
    req.url = newUrl;
    console.log(`→ Proxying to frontend (3000): ${newUrl}`);
    proxy.web(req, res, { target: 'http://127.0.0.1:3000' });
  }
  // Route: Frontend assets (_expo, assets, static, etc.)
  else if (url.match(/^\/(\_expo|assets|static|node_modules|fonts)/)) {
    console.log(`→ Proxying frontend asset to 3000: ${url}`);
    proxy.web(req, res, { target: 'http://127.0.0.1:3000' });
  }
  // Route: Everything else → Website (port 9000)
  else {
    console.log(`→ Proxying to website (9000): ${url}`);
    proxy.web(req, res, { target: 'http://127.0.0.1:9000' });
  }
});

// Handle WebSocket upgrade for Expo HMR
server.on('upgrade', (req, socket, head) => {
  const { url } = req;
  
  // WebSocket for /app or Expo-related
  if (url === '/app' || url.startsWith('/app/') || url.includes('_expo')) {
    console.log(`[WS] Upgrading connection for frontend: ${url}`);
    proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:3000' });
  } else {
    console.log(`[WS] Unknown upgrade request: ${url}`);
    socket.destroy();
  }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   EaseMind Unified Server                 ║
║   Listening on: http://0.0.0.0:${PORT}       ║
╠═══════════════════════════════════════════╣
║   Routes:                                 ║
║   /            → Website (9000)           ║
║   /app         → Frontend (3000)          ║
║   /api/*       → Backend (8001)           ║
╚═══════════════════════════════════════════╝
  `);
  
  console.log('✅ Proxy server ready to route traffic');
  console.log('🌐 Public URL: https://zen-app.preview.emergentagent.com');
  console.log('🔒 Custom Domain: https://easemind.io (SSL pending)\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
