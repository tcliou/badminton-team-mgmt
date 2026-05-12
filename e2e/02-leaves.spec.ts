import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Flow 2: 球員提交請假', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'player');
    await page.goto('http://localhost:5173/leaves');
    // 等 h1 出現代表頁面已完成渲染（不再是 loading 狀態）
    await page.waitForSelector('h1', { timeout: 15_000 });
  });

  test('看到請假表單', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // 請假表單的 h2
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    // 必要欄位
    await expect(page.getByLabel('開始時間')).toBeVisible();
    await expect(page.getByLabel('結束時間')).toBeVisible();
    await expect(page.getByLabel('請假類型')).toBeVisible();
  });

  test('送出請假後在清單中出現', async ({ page }) => {
    // 填寫未來的請假時間
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const dayAfter = new Date(tomorrow);
    dayAfter.setHours(12, 0, 0, 0);

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    await page.getByLabel('開始時間').fill(fmt(tomorrow));
    await page.getByLabel('結束時間').fill(fmt(dayAfter));
    await page.getByLabel('請假類型').selectOption('personal');
    await page.getByLabel('備註（選填）').fill('E2E test leave');

    await page.getByRole('button', { name: '送出請假' }).click();

    // 等待請假清單更新：出現剛才送出的請假
    await expect(page.getByText('E2E test leave')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Flow 3: 教練審核請假', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('http://localhost:5173/leaves');
    await page.waitForSelector('h1', { timeout: 15_000 });
  });

  test('教練看到「待審核」Tab', async ({ page }) => {
    await expect(page.getByRole('button', { name: '待審核' })).toBeVisible();
  });

  test('切換到待審核 Tab，若有 pending 可看到審核按鈕', async ({ page }) => {
    await page.getByRole('button', { name: '待審核' }).click();
    // 等待 list 渲染（可能空也可能有資料）
    await page.waitForTimeout(1000);

    const confirmBtns = page.getByRole('button', { name: '核准' });
    const rejectBtns = page.getByRole('button', { name: '駁回' });
    const empty = page.getByText('目前沒有待審核');

    // 有資料時顯示按鈕，無資料時顯示空態
    const count = await confirmBtns.count();
    if (count > 0) {
      await expect(confirmBtns.first()).toBeVisible();
      await expect(rejectBtns.first()).toBeVisible();
    } else {
      await expect(empty).toBeVisible();
    }
  });
});
