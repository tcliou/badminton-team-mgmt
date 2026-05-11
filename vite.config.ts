import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // 部署到 GitHub Pages 時，base 必須是 /<repo-name>/
  // 在 GitHub Actions 中由 VITE_BASE_PATH 注入；本地開發為 '/'
  const base = env.VITE_BASE_PATH || '/';

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      // 個別頁面 bundle 普遍 < 100KB，但 react / supabase / i18n / form 這些
      // 共用 vendor 累計可能破門檻。把它們各自切出來，讓首屏只載最需要的。
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
            'react-query': ['@tanstack/react-query'],
            forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
            calendar: [
              '@fullcalendar/core',
              '@fullcalendar/react',
              '@fullcalendar/daygrid',
              '@fullcalendar/list',
              '@fullcalendar/interaction',
            ],
            markdown: ['react-markdown', 'remark-gfm'],
            xlsx: ['xlsx'],
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
