import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

// 載入 .env.e2e（若存在）：包含 E2E_ADMIN_PASSWORD 等測試帳號設定
// process.loadEnvFile 是 Node.js 20.12+ 內建，不需安裝 dotenv
try {
  process.loadEnvFile(resolve(process.cwd(), '.env.e2e'));
} catch {
  // 檔案不存在時略過（CI 用環境變數直接注入）
}

/**
 * Playwright E2E 設定
 * 執行前確保 `pnpm dev` 已啟動（或設定 webServer 自動啟動）
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',  // 建立 E2E 測試帳號（player1）
  /* 每個 test 的最長執行時間 */
  timeout: 30_000,
  /* 全域斷言 timeout */
  expect: { timeout: 8_000 },
  /* 失敗時截圖 */
  reporter: [['html', { outputFolder: 'e2e-results' }], ['list']],
  use: {
    /* dev server URL */
    baseURL: 'http://localhost:5173',
    /* 失敗時保留 trace，方便 debug */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    /* 每個 test 開始前預設 localStorage，確保 UI 語系固定為繁體中文。
     * 這樣所有 getByRole / getByText 的中文 selector 都能穩定運作，
     * 不會因 browser 語系不同而找不到元素。*/
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:5173',
          localStorage: [{ name: 'app.locale', value: 'zh-TW' }],
        },
      ],
    },
  },

  /* 只測 Chromium（與 GitHub Pages 瀏覽器重疊最高），CI 可加 firefox */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* 自動啟動 dev server（只在本地開發用；CI 另外在 workflow 中 build + preview） */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
