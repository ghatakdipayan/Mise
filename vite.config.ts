import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server and production server are both server/index.ts, which also
// handles /api/ai (Gemini) and /swiggy-api (Swiggy MCP relay). No API keys are
// injected into the browser bundle.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
