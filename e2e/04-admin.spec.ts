import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Flow 5: Admin 角色與權限管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('http://localhost:5173/admin');
    await page.waitForSelector('h1', { timeout: 15_000 });
  });

  test('Admin 頁面可正常顯示', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('看到角色列表 Tab 與使用者 Tab', async ({ page }) => {
    await expect(page.getByRole('button', { name: /角色/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /使用者/ })).toBeVisible();
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
