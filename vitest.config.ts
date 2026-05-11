import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig({ mode: 'test', command: 'serve' }),
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        exclude: [
          'node_modules/',
          'dist/',
          'tests/',
          '**/*.config.*',
          '**/index.ts',
          'src/main.tsx',
          // UI 與頁面在 Phase 4 由 E2E 涵蓋；Phase 1–3 不納入單元覆蓋率
          'src/shared/components/**',
          'src/modules/**/pages/**',
          'src/modules/**/components/**',
          // 模組 API hooks 直接呼叫 Supabase；Phase 4 才會引入 MSW mock
          'src/modules/**/api/**',
          'src/core/router/AppRouter.tsx',
          'src/core/i18n/LocaleSwitcher.tsx',
        ],
        // 各 Phase ratchet 計畫：
        //   Phase 1：lines/functions/statements 20、branches 45（地基期）
        //   Phase 2：lines/functions/statements 35、branches 50
        //   Phase 3：lines/functions/statements 55、branches 60  ← 目前
        //   Phase 4：lines/functions/statements 70、branches 65（NFR 目標）
        thresholds: {
          lines: 55,
          functions: 55,
          branches: 60,
          statements: 55,
        },
      },
    },
  }),
);
