const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy for Reddit API
  app.use(
    ['/r', '*.json'],
    createProxyMiddleware({
      target: 'https://www.reddit.com',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        // Add headers that Reddit might expect
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 Reddit Meme Gallery');
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: 'Proxy Error', message: err.message }));
      }
    })
  );
  
  // Proxy for RedGifs API
  app.use(
    '/redgifs-proxy',
    createProxyMiddleware({
      target: 'https://api.redgifs.com',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/redgifs-proxy': '/v2/gifs', // rewrite path
      },
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('Accept', 'application/json');
      },
      onError: (err, req, res) => {
        console.error('RedGifs proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: 'RedGifs Proxy Error', message: err.message }));
      }
    })
  );
};
