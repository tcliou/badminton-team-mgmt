import { test, expect } from '@playwright/test';
import { loginAs, acceptNextDialog } from './helpers';

// ── Flow 5: Admin 角色與權限管理 ─────────────────────────────────────────────
test.describe('Flow 5: Admin 角色與權限管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('http://localhost:5173/admin');
    await page.waitForSelector('h1', { timeout: 15_000 });
    // 預設 tab 是「使用者」，切換到「角色與權限」tab
    await page.getByRole('button', { name: '角色與權限' }).click();
    // 等待角色列表出現（系統角色 admin 必定存在）
    await page.waitForSelector('text=admin', { timeout: 8_000 });
  });

  test('Admin 頁面可正常顯示', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('看到角色列表 Tab 與使用者 Tab', async ({ page }) => {
    await expect(page.getByRole('button', { name: '使用者與角色指派' })).toBeVisible();
    await expect(page.getByRole('button', { name: '角色與權限' })).toBeVisible();
  });

  test('角色列表顯示系統角色（admin）', async ({ page }) => {
    // admin 是系統預設角色，必定存在
    await expect(page.getByText('admin')).toBeVisible();
    // 系統角色有「系統」badge
    await expect(page.getByText('系統')).toBeVisible();
  });

  test('系統角色 admin 不顯示刪除按鈕', async ({ page }) => {
    // 在 admin 角色那一行，不應該有刪除按鈕
    const adminRow = page.locator('li').filter({ hasText: 'admin' }).first();
    await expect(adminRow.getByRole('button', { name: '刪除' })).toHaveCount(0);
  });

  test('展開角色權限編輯器', async ({ page }) => {
    // 點第一個「權限」按鈕展開
    const permBtn = page.getByRole('button', { name: '權限' }).first();
    await permBtn.click();

    // 應該出現 checkbox 列表（各頁面權限）
    await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();
  });

  test('球員角色無法訪問 Admin 頁面', async ({ page }) => {
    // 清除 admin session，以 player 身份重新登入
    await page.goto('http://localhost:5173/login');
    await page.evaluate(() => {
      const locale = localStorage.getItem('app.locale') ?? 'zh-TW';
      localStorage.clear();
      localStorage.setItem('app.locale', locale);
    });
    await page.goto('http://localhost:5173/login');
    await page.locator('#username').fill(process.env.E2E_PLAYER_USERNAME ?? 'player1');
    await page.locator('#password').fill(process.env.E2E_PLAYER_PASSWORD ?? 'changeme');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('http://localhost:5173/');

    // 嘗試直接訪問 admin 頁面
    await page.goto('http://localhost:5173/admin');
    // 應被重導到 403 或首頁
    await expect(page).toHaveURL(/\/(403|$)/);
  });
});

// ── Flow 6: 使用者建立與停用 ─────────────────────────────────────────────────
// 注意：此 describe 依賴 Edge Functions 正在執行（本機需 supabase functions serve）
test.describe('Flow 6: 使用者建立與停用/啟用', () => {
  // 用時間戳確保每次測試的 username 唯一，避免重複建立衝突
  const testUsername = `e2etest${Date.now()}`;
  const testDisplayName = 'E2E 測試帳號';

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('http://localhost:5173/admin');
    await page.waitForSelector('h1', { timeout: 15_000 });
    // 等待 tab 列渲染完成
    await page.waitForSelector('button[aria-pressed]', { timeout: 8_000 });
    // 預設已在「使用者與角色指派」tab（tab 預設值是 'users'）
    // 確認「新增使用者」按鈕出現即代表 UsersTab 已載入
    await page.waitForSelector('button:has-text("新增使用者")', { timeout: 8_000 });
  });

  test('新增使用者：填寫表單並看到一次性密碼', async ({ page }) => {
    // 開啟對話框
    await page.getByRole('button', { name: '新增使用者' }).click();

    // 等待對話框出現
    await page.waitForSelector('#cu-username', { timeout: 8_000 });

    // 填寫表單
    await page.locator('#cu-username').fill(testUsername);
    await page.locator('#cu-display').fill(testDisplayName);

    // 選擇角色：用 player 系統角色的固定 UUID（定義於 migration 0002，不會變動）
    await page.locator('#cu-role').selectOption('44444444-4444-4444-4444-444444444444');

    // 送出
    await page.getByRole('button', { name: '建立帳號' }).click();

    // 等待成功畫面：顯示一次性密碼
    await expect(page.getByText('帳號建立成功')).toBeVisible({ timeout: 15_000 });

    // 一次性密碼應為 12 字元英數
    const pwCode = page.locator('code');
    await expect(pwCode).toBeVisible();
    const pw = await pwCode.textContent();
    expect(pw?.trim()).toMatch(/^[A-Za-z0-9]{12}$/);

    // 複製按鈕存在
    await expect(page.getByRole('button', { name: '複製密碼' })).toBeVisible();

    // 關閉對話框
    await page.getByRole('button', { name: '確認' }).click();

    // 確認使用者出現在列表中
    await expect(page.getByText(testDisplayName)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(`@${testUsername}`)).toBeVisible();
  });

  test('停用使用者：列表顯示「已停用」badge', async ({ page }) => {
    // 確認目標使用者在列表中（若 Flow 6-1 未跑，此測試可能找不到）
    const userRow = page.locator('li').filter({ hasText: testDisplayName });

    // 若找不到測試使用者（尚未建立），先建立
    const count = await userRow.count();
    if (count === 0) {
      test.skip(true, `測試使用者 ${testUsername} 尚未建立，請先執行「新增使用者」測試`);
      return;
    }

    // 點擊「停用」前先設定 dialog 處理（須在觸發前註冊）
    acceptNextDialog(page);
    await userRow.getByRole('button', { name: '停用' }).click();

    // 等待「已停用」badge 出現
    await expect(userRow.getByText('已停用')).toBeVisible({ timeout: 15_000 });

    // 整列應半透明（opacity class）
    await expect(userRow).toHaveClass(/opacity-60/);
  });

  test('啟用使用者：移除「已停用」badge', async ({ page }) => {
    const userRow = page.locator('li').filter({ hasText: testDisplayName });

    const count = await userRow.count();
    if (count === 0) {
      test.skip(true, `測試使用者 ${testUsername} 尚未建立，請先執行前置測試`);
      return;
    }

    // 若目前是「停用」狀態，先啟用；若已是 active，直接驗證
    const isSuspended = await userRow.locator('.text-destructive', { hasText: '已停用' }).isVisible();

    if (isSuspended) {
      acceptNextDialog(page);
      await userRow.getByRole('button', { name: '啟用' }).click();
      // badge 應消失
      await expect(userRow.getByText('已停用')).not.toBeVisible({ timeout: 15_000 });
      // opacity 恢復
      await expect(userRow).not.toHaveClass(/opacity-60/);
    } else {
      // 已是 active，只驗證停用按鈕存在（代表狀態正確）
      await expect(userRow.getByRole('button', { name: '停用' })).toBeVisible();
    }
  });

  test('新增自訂角色，並在角色列表出現', async ({ page }) => {
    // 切換到角色 Tab（使用精確文字避免語系問題）
    await page.getByRole('button', { name: '角色與權限' }).click();
    await page.waitForSelector('input[placeholder*="角色名稱"]', { timeout: 8_000 });
    const roleName = `e2erole${Date.now()}`;

    // 填寫新角色
    await page.locator('input[placeholder*="角色名稱"]').fill(roleName);
    await page.locator('input[placeholder*="說明"]').fill('E2E 測試角色');
    await page.getByRole('button', { name: '建立' }).click();

    // 角色出現在列表中，且有刪除按鈕（非系統角色）
    const roleRow = page.locator('li').filter({ hasText: roleName });
    await expect(roleRow).toBeVisible({ timeout: 15_000 });
    await expect(roleRow.getByRole('button', { name: '刪除' })).toBeVisible();

    // 清理：刪除剛建立的測試角色
    acceptNextDialog(page);
    await roleRow.getByRole('button', { name: '刪除' }).click();
    await expect(roleRow).not.toBeVisible({ timeout: 8_000 });
  });
});
