import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // 部署到 GitHub Pages 時，base 必須是 /<repo-name>/
  // 在 GitHub Actions 中由 VITE_BASE_PATH 注入；本地開發為 '/'
  const base = env.VITE_BASE_PATH || '/';

  return {
    base,
    plugins: [tailwindcss(), react()],
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
          manualChunks(id) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) return 'react';
            if (id.includes('node_modules/@supabase/supabase-js/')) return 'supabase';
            if (id.includes('node_modules/i18next/') || id.includes('node_modules/react-i18next/') || id.includes('node_modules/i18next-browser-languagedetector/')) return 'i18n';
            if (id.includes('node_modules/@tanstack/react-query/')) return 'react-query';
            if (id.includes('node_modules/react-hook-form/') || id.includes('node_modules/@hookform/resolvers/') || id.includes('node_modules/zod/')) return 'forms';
            if (id.includes('node_modules/@fullcalendar/')) return 'calendar';
            if (id.includes('node_modules/react-markdown/') || id.includes('node_modules/remark-gfm/')) return 'markdown';
            if (id.includes('node_modules/xlsx/')) return 'xlsx';
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
