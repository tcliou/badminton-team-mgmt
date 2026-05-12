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
    // 等待角色列表的 <li> 出現（精確等 li 元素，避免匹配 TopBar 的 @admin）
    await page.waitForSelector('ul li:has-text("admin")', { timeout: 8_000 });
  });

  test('Admin 頁面可正常顯示', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('看到角色列表 Tab 與使用者 Tab', async ({ page }) => {
    await expect(page.getByRole('button', { name: '使用者與角色指派' })).toBeVisible();
    await expect(page.getByRole('button', { name: '角色與權限' })).toBeVisible();
  });

  test('角色列表顯示系統角色（admin）', async ({ page }) => {
    // 在 <li> 中找 admin 角色（避免匹配 TopBar 的 @admin 造成 strict mode violation）
    const adminRoleRow = page.locator('li').filter({ hasText: /^admin/ });
    await expect(adminRoleRow.first()).toBeVisible();
    // 系統角色有「系統」badge（同樣限定在 li 內）
    await expect(adminRoleRow.first().getByText('系統')).toBeVisible();
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

    // 等待 accordion 展開動畫 + 資料渲染
    await expect(page.locator('input[type="checkbox"]').first()).toBeVisible({ timeout: 8_000 });
  });

  test('球員角色無法訪問 Admin 頁面', async ({ page }) => {
    // 清除 admin session，以 player 身份重新登入
    await loginAs(page, 'player');

    // 嘗試直接訪問 admin 頁面
    await page.goto('http://localhost:5173/admin');
    // 應被重導到 403 或首頁
    await expect(page).toHaveURL(/\/(403|$)/);
  });
});

// ── Flow 6: 使用者建立與停用 ─────────────────────────────────────────────────
// serial：確保 create → suspend → activate 依序執行
// beforeAll 負責建立測試使用者，afterAll 負責清理，
// 因此單獨在 Playwright UI 點執行任一 test 也能正常運作。
// 注意：此 describe 依賴 Edge Functions 正在執行（本機需 supabase functions serve）
test.describe.serial('Flow 6: 使用者建立與停用/啟用', () => {
  // 固定 username，不依賴 Date.now()，確保單獨執行時也能找到同一個使用者
  const testUsername = 'e2etestuser';
  const testDisplayName = 'E2E 測試帳號';

  /** 透過 UI 建立測試使用者（若已存在則略過） */
  async function ensureTestUserExists(browser: import('@playwright/test').Browser) {
    const page = await browser.newPage();
    try {
      await loginAs(page, 'admin');
      await page.goto('http://localhost:5173/admin');
      await page.waitForSelector('h1', { timeout: 15_000 });
      await page.waitForSelector('button[aria-pressed]', { timeout: 8_000 });
      await page.waitForSelector('button:has-text("新增使用者")', { timeout: 8_000 });

      // 若已存在就略過（前次測試可能沒清乾淨）
      const existing = page.locator('li').filter({ hasText: testDisplayName });
      if (await existing.count() > 0) return;

      await page.getByRole('button', { name: '新增使用者' }).click();
      await page.waitForSelector('#cu-username', { timeout: 8_000 });
      await page.locator('#cu-username').fill(testUsername);
      await page.locator('#cu-display').fill(testDisplayName);
      await page.locator('#cu-role').selectOption('44444444-4444-4444-4444-444444444444');
      await page.getByRole('button', { name: '建立帳號' }).click();
      await page.waitForSelector('text=帳號建立成功', { timeout: 15_000 });
      await page.getByRole('button', { name: '確認' }).click();
    } finally {
      await page.close();
    }
  }

  /** 透過 UI 刪除測試使用者（若存在） */
  async function deleteTestUserIfExists(browser: import('@playwright/test').Browser) {
    const page = await browser.newPage();
    try {
      await loginAs(page, 'admin');
      await page.goto('http://localhost:5173/admin');
      await page.waitForSelector('h1', { timeout: 15_000 });
      await page.waitForSelector('button[aria-pressed]', { timeout: 8_000 });
      await page.waitForSelector('button:has-text("新增使用者")', { timeout: 8_000 });

      const userRow = page.locator('li').filter({ hasText: testDisplayName });
      if (await userRow.count() === 0) return;

      let dialogCount = 0;
      page.on('dialog', async (dialog) => {
        dialogCount++;
        await (dialogCount === 1 ? dialog.accept() : dialog.accept(testUsername));
      });

      await userRow.getByRole('button', { name: '刪除' }).click();
      await page.waitForSelector(`li:has-text("${testDisplayName}")`, {
        state: 'detached',
        timeout: 15_000,
      });
    } finally {
      await page.close();
    }
  }

  // 每組測試開始前：確保使用者存在（含 active 狀態，處理前次測試殘留的 suspended 狀態）
  test.beforeAll(async ({ browser }) => {
    await deleteTestUserIfExists(browser); // 清除前次殘留
    await ensureTestUserExists(browser);   // 重新建立，確保 active 狀態
  });

  // 所有測試結束後：清理
  test.afterAll(async ({ browser }) => {
    await deleteTestUserIfExists(browser);
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('http://localhost:5173/admin');
    await page.waitForSelector('h1', { timeout: 15_000 });
    await page.waitForSelector('button[aria-pressed]', { timeout: 8_000 });
    await page.waitForSelector('button:has-text("新增使用者")', { timeout: 8_000 });
  });

  test('新增使用者：填寫表單並看到一次性密碼', async ({ page }) => {
    // 用不同的 username 測試對話框流程（主測試帳號已由 beforeAll 建立）
    const tempUsername = `e2etmp${Date.now()}`;

    // 開啟對話框
    await page.getByRole('button', { name: '新增使用者' }).click();
    await page.waitForSelector('#cu-username', { timeout: 8_000 });

    // 填寫表單
    await page.locator('#cu-username').fill(tempUsername);
    await page.locator('#cu-display').fill('E2E 臨時帳號');
    await page.locator('#cu-role').selectOption('44444444-4444-4444-4444-444444444444');
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

    // 確認臨時使用者出現在列表中
    await expect(page.getByText('E2E 臨時帳號')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(`@${tempUsername}`)).toBeVisible();

    // 清理臨時帳號（兩步驟刪除）
    const tmpRow = page.locator('li').filter({ hasText: 'E2E 臨時帳號' });
    let dialogCount = 0;
    page.on('dialog', async (dialog) => {
      dialogCount++;
      await (dialogCount === 1 ? dialog.accept() : dialog.accept(tempUsername));
    });
    await tmpRow.getByRole('button', { name: '刪除' }).click();
    await expect(tmpRow).not.toBeVisible({ timeout: 15_000 });
  });


  test('停用使用者：列表顯示「已停用」badge', async ({ page }) => {
    // 等待上一個 test 建立的使用者出現在列表（query 非同步，需顯式等待）
    const userRow = page.locator('li').filter({ hasText: testDisplayName });
    await expect(userRow).toBeVisible({ timeout: 15_000 });

    // 點擊「停用」前先設定 dialog 處理（須在觸發前註冊）
    acceptNextDialog(page);
    await userRow.getByRole('button', { name: '停用' }).click();

    // 等待「已停用」badge 出現
    await expect(userRow.getByText('已停用')).toBeVisible({ timeout: 15_000 });

    // 整列應半透明（opacity class）
    await expect(userRow).toHaveClass(/opacity-60/);
  });

  test('啟用使用者：移除「已停用」badge', async ({ page }) => {
    // 等待使用者出現（serial 保證此時已停用）
    const userRow = page.locator('li').filter({ hasText: testDisplayName });
    await expect(userRow).toBeVisible({ timeout: 15_000 });

    // 等待「已停用」badge（由前一個 test 設定）
    await expect(userRow.getByText('已停用')).toBeVisible({ timeout: 10_000 });

    acceptNextDialog(page);
    await userRow.getByRole('button', { name: '啟用' }).click();

    // badge 應消失，opacity 恢復
    await expect(userRow.getByText('已停用')).not.toBeVisible({ timeout: 15_000 });
    await expect(userRow).not.toHaveClass(/opacity-60/);
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

