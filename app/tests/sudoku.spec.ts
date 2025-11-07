import { test, expect } from '@playwright/test';

test.describe('Sudoku App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 各テスト前にページをリロードして状態をクリア
    await page.reload();
    // 少し待ってページが完全に読み込まれるようにする
    await page.waitForTimeout(100);
  });

  test('should display the sudoku title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('数独');
  });

  test('should have a sudoku grid with 81 cells', async ({ page }) => {
    const cells = page.locator('.cell');
    await expect(cells).toHaveCount(81);
  });

  test.skip('should have number buttons 1-9', async ({ page }) => {
    // まずセルを選択して数字パネルを表示
    const emptyCell = page.locator('.cell').filter({ hasNotClass: 'fixed-value' }).first();
    await emptyCell.click();

    // 数字ボタンが表示されていることを確認
    for (let i = 1; i <= 9; i++) {
      await expect(page.locator('.number-btn').filter({ hasText: i.toString() })).toBeVisible();
    }
  });

  test('should have control buttons', async ({ page }) => {
    await expect(page.locator('.btn').filter({ hasText: '新規' })).toBeVisible();
    await expect(page.locator('.btn').filter({ hasText: 'リセット' })).toBeVisible();
    await expect(page.locator('.btn').filter({ hasText: 'チェック' })).toBeVisible();
  });

  test.skip('should be able to select a cell', async ({ page }) => {
    // 空のセルを選択（固定されていないセル）
    const emptyCell = page.locator('.cell').filter({ hasNotClass: 'fixed-value' }).first();
    await emptyCell.click();

    // 数字パネルが表示されていることを確認（セル選択の証拠）
    await expect(page.locator('.number-panel')).toBeVisible();
  });

  test('should be able to input a number', async ({ page }) => {
    // 空のセルを選択
    const emptyCell = page.locator('.cell').filter({ hasNotClass: 'fixed-value' }).first();
    await emptyCell.click();

    // 数字パネルが表示されるまで待つ
    await page.locator('.number-panel').waitFor({ state: 'visible' });

    // 数字1を入力
    await page.locator('.number-btn').filter({ hasText: '1' }).click();

    // セルに数字が表示されていることを確認
    await expect(emptyCell.locator('.main-value')).toContainText('1');
  });

  test('should toggle memo mode', async ({ page }) => {
    const memoButton = page.locator('.memo-toggle');
    await expect(memoButton).toContainText('通常モード');

    await memoButton.click();
    await expect(memoButton).toContainText('メモモード');

    await memoButton.click();
    await expect(memoButton).toContainText('通常モード');
  });

  test('should be able to input memo', async ({ page }) => {
    // メモモードに切り替え
    await page.locator('.memo-toggle').click();

    // 空のセルを選択
    const emptyCell = page.locator('.cell').filter({ hasNotClass: 'fixed-value' }).first();
    await emptyCell.click();

    // 数字パネルが表示されるまで待つ
    await page.locator('.number-panel').waitFor({ state: 'visible' });

    // 数字1をメモ入力
    await page.locator('.number-btn').filter({ hasText: '1' }).click();

    // メモが表示されていることを確認
    await expect(emptyCell.locator('.memo-num.active')).toContainText('1');
  });

  test('should clear cell with clear button', async ({ page }) => {
    // 数字を入力
    const emptyCell = page.locator('.cell').filter({ hasNotClass: 'fixed-value' }).first();
    await emptyCell.click();

    // 数字パネルが表示されるまで待つ
    await page.locator('.number-panel').waitFor({ state: 'visible' });

    await page.locator('.number-btn').filter({ hasText: '1' }).click();

    // クリアボタンで消去
    await page.locator('.clear-btn').click();

    // セルが空であることを確認
    await expect(emptyCell.locator('.main-value')).toBeHidden();
  });

  test('should generate new puzzle', async ({ page }) => {
    // 現在のグリッドの状態を保存
    const initialCells = await page.locator('.fixed-value').allTextContents();

    // 新規ボタンをクリック
    await page.locator('.btn').filter({ hasText: '新規' }).click();

    // グリッドが変更されていることを確認
    const newCells = await page.locator('.fixed-value').allTextContents();
    expect(initialCells).not.toEqual(newCells);
  });

  test('should reset puzzle', async ({ page }) => {
    // 数字を入力
    const emptyCell = page.locator('.cell').filter({ hasNotClass: 'fixed-value' }).first();
    await emptyCell.click();

    // 数字パネルが表示されるまで待つ
    await page.locator('.number-panel').waitFor({ state: 'visible' });

    await page.locator('.number-btn').filter({ hasText: '1' }).click();

    // リセットボタンをクリック
    await page.locator('.btn').filter({ hasText: 'リセット' }).click();

    // 入力した数字が消えていることを確認
    await expect(emptyCell.locator('.main-value')).toBeHidden();
  });

  test('should check solution and show message', async ({ page }) => {
    // チェックボタンをクリック
    await page.locator('.btn').filter({ hasText: 'チェック' }).click();

    // メッセージが表示されていることを確認
    const message = page.locator('.message');
    await expect(message).toBeVisible();
  });

  test.skip('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // モバイルレイアウトでも正常に動作することを確認
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.sudoku-grid')).toBeVisible();

    // モバイルではセルを選択しないと数字パネルが表示されない
    const emptyCell = page.locator('.cell').filter({ hasNotClass: 'fixed-value' }).first();
    await emptyCell.click();
    await expect(page.locator('.number-panel')).toBeVisible();
  });
});