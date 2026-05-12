import { type Page } from '@playwright/test';

/**
 * 共用輔助函式
 *
 * 測試帳號設定：
 *   - admin/coach：  username=admin,  password 由環境變數 E2E_ADMIN_PASSWORD 提供
 *   - player 帳號：  username=player1, password 由環境變數 E2E_PLAYER_PASSWORD 提供
 *
 * 本機開發時在 .env.e2e 設定（不 commit），CI 用 GitHub Secrets 注入。
 */

const BASE = 'http://localhost:5173';

const ACCOUNTS = {
  admin: {
    username: process.env.E2E_ADMIN_USERNAME ?? 'admin',
    password: process.env.E2E_ADMIN_PASSWORD ?? 'changeme',
  },
  player: {
    username: process.env.E2E_PLAYER_USERNAME ?? 'player1',
    password: process.env.E2E_PLAYER_PASSWORD ?? 'changeme',
  },
} as const;

/** 填寫登入表單，並等待 profile 載入完成（TopBar 出現使用者名稱） */
export async function loginAs(page: Page, role: keyof typeof ACCOUNTS) {
  const { username, password } = ACCOUNTS[role];

  // 先 goto 到 login 頁，再清除 Supabase session（避免下次 goto /login 自動跳轉）
  // 同時保留 app.locale，避免清空後 UI 語系改變造成 selector 失效
  await page.goto(`${BASE}/login`);
  await page.evaluate(() => {
    const locale = localStorage.getItem('app.locale') ?? 'zh-TW';
    localStorage.clear();
    localStorage.setItem('app.locale', locale);
  });

  // 重新 goto 讓 app 以清空的 session 重新初始化
  await page.goto(`${BASE}/login`);

  // 使用 HTML id 而非 label 文字，完全不依賴語系
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  // submit button 使用 type=submit 而非文字
  await page.locator('button[type="submit"]').click();

  // 不強制等待特定的 URL 跳轉（因為可能會有不同的跳轉路徑），
  // 直接往下檢查 auth 完成後的 TopBar 是否出現即可。

  // 等待 profile 非同步載入完成：TopBar 會顯示 @username
  // 這確保 ProtectedRoute 的 loading 狀態已解除，任何後續 goto 都安全
  await page.waitForSelector(`text=@${username}`, { timeout: 15_000 });
}

/** 登出 */
export async function logout(page: Page) {
  await page.getByRole('button', { name: '登出' }).click();
  await page.waitForURL(`${BASE}/login`);
}

/**
 * 接受下一個 window.confirm 或 window.alert 對話框。
 * 需在觸發 confirm 的動作「之前」呼叫，因為 dialog 事件只會觸發一次。
 *
 * @example
 * acceptNextDialog(page);
 * await page.getByRole('button', { name: '停用' }).click();
 */
export function acceptNextDialog(page: Page) {
  page.once('dialog', (dialog) => void dialog.accept());
}
