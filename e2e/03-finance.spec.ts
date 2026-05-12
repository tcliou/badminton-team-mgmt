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
    // 三個 Tab 按鈕（exact:true 避免匹配「新增應收費用」等含子字串的按鈕）
    await expect(page.getByRole('button', { name: '應收費用', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '對帳',     exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '收支總帳', exact: true })).toBeVisible();
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
    await page.getByRole('button', { name: '收支總帳', exact: true }).click();

    // 等待 Tab 內容載入：月份導覽按鈕出現即代表組件已渲染
    await expect(page.getByLabel('prev month')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByLabel('next month')).toBeVisible();

    // 收入、支出、結餘三個數字格（exact:true 避免匹配含子字串的 td）
    await expect(page.getByText('收入', { exact: true })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('支出', { exact: true })).toBeVisible();
    await expect(page.getByText('結餘', { exact: true })).toBeVisible();
  });

  test('收支總帳 Tab — 匯出 Excel 按鈕存在', async ({ page }) => {
    await page.getByRole('button', { name: '收支總帳', exact: true }).click();
    await expect(page.getByRole('button', { name: /匯出 Excel/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /列印/ })).toBeVisible();
  });

  test('收支總帳 Tab — 切換月份不崩潰', async ({ page }) => {
    await page.getByRole('button', { name: '收支總帳', exact: true }).click();
    // 等待 Tab 內容載入
    await expect(page.getByLabel('prev month')).toBeVisible({ timeout: 8_000 });

    // 切到上個月
    await page.getByLabel('prev month').click();
    // 指定等待下一月按鈕仍可見（資料重新載入完成）
    await expect(page.getByLabel('next month')).toBeVisible({ timeout: 8_000 });
    await page.getByLabel('next month').click();
    // 結餘摘要應仍在畫面（頁面有多個「結餘」label，取第一個即可）
    await expect(page.getByText('結餘', { exact: true }).first()).toBeVisible({ timeout: 8_000 });
  });
});
