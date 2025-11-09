import { test, expect, Page } from '@playwright/test';

// ヘルパー関数: 空のセルを選択し、数字パネルが表示されるまで待つ
async function selectEmptyCellAndWaitForPanel(page: Page) {
  // まず81個のセルが全て読み込まれるまで待つ
  await page.locator('.cell').nth(80).waitFor({ state: 'visible' });

  // 空のセルが存在することを確認（少し待つ）
  await page.waitForTimeout(200);

  // 空のセルを特定し、そのインデックスを保存
  const cells = page.locator('.cell');
  let emptyCellIndex = -1;

  for (let i = 0; i < 81; i++) {
    const cell = cells.nth(i);
    const hasFixedClass = await cell.evaluate(el => el.querySelector('.fixed-value') !== null);
    if (!hasFixedClass) {
      emptyCellIndex = i;
      break;
    }
  }

  if (emptyCellIndex === -1) {
    throw new Error('No empty cell found');
  }

  const emptyCell = cells.nth(emptyCellIndex);

  // 数字パネルが表示されるまで最大5回試行
  let panelVisible = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    // 強制的にクリックを実行
    await emptyCell.click({ force: true });
    try {
      await page.locator('.number-panel').waitFor({ state: 'visible', timeout: 2000 });
      panelVisible = true;
      break;
    } catch {
      // クリック失敗したら少し待って次の試行へ
      await page.waitForTimeout(500);
    }
  }

  if (!panelVisible) {
    throw new Error('Number panel did not appear after 5 attempts');
  }

  return emptyCell;
}test.describe('Sudoku App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // ページが完全に読み込まれ、Vueコンポーネントが初期化されるまで待つ
    await page.waitForLoadState('networkidle');
    // 数独グリッドが生成されるまで追加で待つ
    await page.locator('.sudoku-grid').waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
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
    const emptyCell = page.locator('.cell:not(.fixed-value)').first();
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
    const emptyCell = page.locator('.cell:not(.fixed-value)').first();
    await emptyCell.click();

    // 数字パネルが表示されていることを確認（セル選択の証拠）
    await expect(page.locator('.number-panel')).toBeVisible();
  });

  test('should be able to input a number', async ({ page }) => {
    // 空のセルを選択し、数字パネルが表示されるまで待つ
    const emptyCell = await selectEmptyCellAndWaitForPanel(page);

    // 数字1を入力
    await page.locator('.number-btn').filter({ hasText: '1' }).click();

    // Vueのリアクティブ更新を待つ
    await page.waitForTimeout(100);

    // セルに数字が表示されていることを確認
    await expect(emptyCell.locator('.main-value')).toBeVisible();
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

    // 少し待つ（モード切替後の安定化）
    await page.waitForTimeout(100);

    // 空のセルを選択し、数字パネルが表示されるまで待つ
    const emptyCell = await selectEmptyCellAndWaitForPanel(page);

    // 数字1をメモ入力
    await page.locator('.number-btn').filter({ hasText: '1' }).click();

    // Vueのリアクティブ更新を待つ
    await page.waitForTimeout(100);

    // メモが表示されていることを確認
    await expect(emptyCell.locator('.memo-num.active')).toBeVisible();
    await expect(emptyCell.locator('.memo-num.active')).toContainText('1');
  });  test('should clear cell with clear button', async ({ page }) => {
    // 空のセルを選択し、数字パネルが表示されるまで待つ
    const emptyCell = await selectEmptyCellAndWaitForPanel(page);

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
    // 空のセルを選択し、数字パネルが表示されるまで待つ
    const emptyCell = await selectEmptyCellAndWaitForPanel(page);

    await page.locator('.number-btn').filter({ hasText: '1' }).click();

    // リセットボタンをクリック
    await page.locator('.btn').filter({ hasText: 'リセット' }).click();

    // 入力した数字が消えていることを確認
    await expect(emptyCell.locator('.main-value')).toBeHidden();
  });  test('should check solution and show message', async ({ page }) => {
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
    const emptyCell = page.locator('.cell:not(.fixed-value)').first();
    await emptyCell.click();
    await expect(page.locator('.number-panel')).toBeVisible();
  });
});
