import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  // For GitHub Pages: set base to repo name (update if different)
  // If deploying to https://<user>.github.io/<repo>/, set base: '/<repo>/'
  // If deploying to custom domain or root, use base: '/'
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
