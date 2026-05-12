import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers';

test.describe('Flow 1: 登入與首頁瀏覽', () => {
  test('未登入直接訪問首頁，應重導到登入頁', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('帳號密碼錯誤，顯示錯誤訊息', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.locator('#username').fill('admin');
    await page.locator('#password').fill('wrong-password-12345');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('以 admin 身份登入，看到首頁公告與行事曆', async ({ page }) => {
    await loginAs(page, 'admin');
    // loginAs 已確認 @admin 出現，頁面已完成載入
    // 首頁 h1 存在
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 公告區塊存在（有 section 或 Megaphone icon）
    await expect(page.locator('section').first()).toBeVisible();

    // 行事曆存在（FullCalendar 的 fc-view-harness）
    await expect(page.locator('.fc-view-harness')).toBeVisible();
  });

  test('TopBar 顯示使用者名稱與登出按鈕', async ({ page }) => {
    await loginAs(page, 'admin');
    // loginAs 已確保 @admin 可見
    await expect(page.getByText('@admin')).toBeVisible();
    await expect(page.getByRole('button', { name: '登出' })).toBeVisible();
  });

  test('點登出後返回登入頁', async ({ page }) => {
    await loginAs(page, 'admin');
    await logout(page);
    await expect(page).toHaveURL(/\/login/);
  });
});
