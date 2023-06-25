import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiHost = process.env.PROXY_API_URL || 'http://localhost:2345';

export default defineConfig({
    plugins: [
        react(),
    ],
    define: {
        'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
    },
    server: {
        port: 3000,
        open: false,
        proxy: {
            '/api': {
                target: `${apiHost}/`,
                rewrite: (path) => path.replace(/^\/api/, ''),
                secure: false,
                changeOrigin: true,
                cookieDomainRewrite: 'localhost',
            },
        },
    },
    build: {
        outDir: 'build',
    },
});
