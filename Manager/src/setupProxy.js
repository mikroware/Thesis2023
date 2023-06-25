const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    const apiHost = process.env.PROXY_API_URL || 'http://localhost:2345';

    console.log(`Setting up development proxy to ${apiHost}`);

    app.use(createProxyMiddleware('/api', {
        target: `${apiHost}/`,
        pathRewrite: { "^/api": "" },
        secure: false,
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
    }));
};
