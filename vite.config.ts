import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Swiggy's MCP endpoints don't send CORS headers, so browser fetches are
          // blocked outright. Proxying through the (Node-side) dev server sidesteps
          // that entirely since server-to-server requests aren't subject to CORS.
          // Their WAF also 403s /auth/register specifically when it sees a browser
          // Origin/Referer header (presumably to stop arbitrary web pages from
          // self-registering OAuth clients) — strip those so the proxied request
          // looks like the server-to-server call it actually is.
          '/swiggy-api': {
            target: 'https://mcp.swiggy.com',
            changeOrigin: true,
            rewrite: (p: string) => p.replace(/^\/swiggy-api/, ''),
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq: any) => {
                proxyReq.removeHeader('origin');
                proxyReq.removeHeader('referer');
              });
            },
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
