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
          'src/core/router/AppRouter.tsx',
          'src/core/i18n/LocaleSwitcher.tsx',
        ],
        // Phase 1 = 地基為主，僅核心邏輯與工具函式有單元測試。
        // 之後每個 Phase 結束時請手動 ratchet 上去：
        //   Phase 2：lines/functions/statements 35、branches 50
        //   Phase 3：lines/functions/statements 55、branches 60
        //   Phase 4：lines/functions/statements 70、branches 65（NFR 目標）
        thresholds: {
          lines: 20,
          functions: 25,
          branches: 45,
          statements: 20,
        },
      },
    },
  }),
);
