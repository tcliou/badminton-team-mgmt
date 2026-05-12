import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Flow 4: 財務對帳頁面', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('http://localhost:5173/finance');
    await page.waitForSelector('h1', { timeout: 15_000 });
  });

  test('看到財務頁面三個分頁', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // 三個 Tab 按鈕
    await expect(page.getByRole('button', { name: '應收費用' })).toBeVisible();
    await expect(page.getByRole('button', { name: '對帳' })).toBeVisible();
    await expect(page.getByRole('button', { name: '收支總帳' })).toBeVisible();
  });

  test('切換到對帳 Tab，顯示待確認清單或空態', async ({ page }) => {
    await page.getByRole('button', { name: '對帳' }).click();
    await page.waitForTimeout(1000);

    const hasPending = (await page.getByRole('button', { name: '確認收款' }).count()) > 0;
    if (hasPending) {
      await expect(page.getByRole('button', { name: '確認收款' }).first()).toBeVisible();
    } else {
      await expect(page.getByText('目前沒有待確認的繳費')).toBeVisible();
    }
  });

  test('切換到收支總帳 Tab，顯示月份與收支摘要', async ({ page }) => {
    await page.getByRole('button', { name: '收支總帳' }).click();

    // 月份導覽按鈕
    await expect(page.getByLabel('prev month')).toBeVisible();
    await expect(page.getByLabel('next month')).toBeVisible();

    // 收入、支出、結餘三個數字格
    await expect(page.getByText('收入')).toBeVisible();
    await expect(page.getByText('支出')).toBeVisible();
    await expect(page.getByText('結餘')).toBeVisible();
  });

  test('收支總帳 Tab — 匯出 Excel 按鈕存在', async ({ page }) => {
    await page.getByRole('button', { name: '收支總帳' }).click();
    await expect(page.getByRole('button', { name: /匯出 Excel/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /列印/ })).toBeVisible();
  });

  test('收支總帳 Tab — 切換月份不崩潰', async ({ page }) => {
    await page.getByRole('button', { name: '收支總帳' }).click();
    // 切到上個月
    await page.getByLabel('prev month').click();
    // 確認頁面仍然正常
    await expect(page.getByLabel('next month')).toBeVisible();
    await page.getByLabel('next month').click();
    await expect(page.getByText('結餘')).toBeVisible();
  });
});
