import { test, expect } from '@playwright/test';

test.describe('Sudoku App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // ページが完全に読み込まれ、Vueコンポーネントが初期化されるまで待つ
    await page.waitForLoadState('networkidle');
    // 数独グリッドが生成されるまで追加で待つ
    await page.locator('.sudoku-grid').waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
  });

  test('should display the sudoku title and cost', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('数独');
    await expect(page.locator('.cost-display')).toBeVisible();
  });

  test('should have mode tabs', async ({ page }) => {
    await expect(page.locator('.mode-tab.write')).toBeVisible();
    await expect(page.locator('.mode-tab.memo')).toBeVisible();
    await expect(page.locator('.mode-tab.view')).toBeVisible();
    await expect(page.locator('.mode-tab.skill')).toBeVisible();
  });

  test('should switch between modes', async ({ page }) => {
    // デフォルトは書込モード
    await expect(page.locator('.mode-tab.write')).toHaveClass(/active/);

    // メモモードに切り替え
    await page.locator('.mode-tab.memo').click();
    await expect(page.locator('.mode-tab.memo')).toHaveClass(/active/);
    await expect(page.locator('.mode-tab.write')).not.toHaveClass(/active/);

    // ビューモードに切り替え
    await page.locator('.mode-tab.view').click();
    await expect(page.locator('.mode-tab.view')).toHaveClass(/active/);
    await expect(page.locator('.mode-tab.memo')).not.toHaveClass(/active/);

    // スキルモードに切り替え
    await page.locator('.mode-tab.skill').click();
    await expect(page.locator('.mode-tab.skill')).toHaveClass(/active/);
    await expect(page.locator('.mode-tab.view')).not.toHaveClass(/active/);
  });

  test('should show number panel in write mode', async ({ page }) => {
    await expect(page.locator('.number-panel')).toBeVisible();
  });

  test('should not show number panel in view mode', async ({ page }) => {
    await page.locator('.mode-tab.view').click();
    await expect(page.locator('.number-panel')).not.toBeVisible();
  });

  test('should show skill panel in skill mode', async ({ page }) => {
    await page.locator('.mode-tab.skill').click();
    await expect(page.locator('.skill-panel')).toBeVisible();
    await expect(page.locator('.skill-btn')).toHaveCount(4);
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

  test('should be able to input a number in write mode', async ({ page }) => {
    // 書込モードであることを確認
    await expect(page.locator('.mode-tab.write')).toHaveClass(/active/);

    // 空のセルを選択
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

    const emptyCell = cells.nth(emptyCellIndex);
    await emptyCell.click();
    await page.waitForTimeout(100);

    // 数字1を入力
    await page.locator('.number-btn').filter({ hasText: /^1$/ }).click();

    // Vueのリアクティブ更新を待つ
    await page.waitForTimeout(100);

    // セルに数字が表示されていることを確認
    await expect(emptyCell.locator('.main-value')).toBeVisible();
    await expect(emptyCell.locator('.main-value')).toContainText('1');
  });  test('should toggle memo mode', async ({ page }) => {
    // デフォルトは書込モード
    await expect(page.locator('.mode-tab.write')).toHaveClass(/active/);

    // メモモードに切り替え
    await page.locator('.mode-tab.memo').click();
    await expect(page.locator('.mode-tab.memo')).toHaveClass(/active/);

    // 書込モードに戻す
    await page.locator('.mode-tab.write').click();
    await expect(page.locator('.mode-tab.write')).toHaveClass(/active/);
  });

  test('should be able to input memo in memo mode', async ({ page }) => {
    // メモモードに切り替え
    await page.locator('.mode-tab.memo').click();

    // 少し待つ（モード切替後の安定化）
    await page.waitForTimeout(100);

    // 空のセルを選択
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

    const emptyCell = cells.nth(emptyCellIndex);
    await emptyCell.click();
    await page.waitForTimeout(100);

    // 数字1をメモ入力
    await page.locator('.number-btn').filter({ hasText: /^1$/ }).click();

    // Vueのリアクティブ更新を待つ
    await page.waitForTimeout(100);

    // メモが表示されていることを確認
    await expect(emptyCell.locator('.memo-num.active')).toBeVisible();
    await expect(emptyCell.locator('.memo-num.active')).toContainText('1');
  });  test('should clear cell with clear button', async ({ page }) => {
    // 空のセルを選択
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

    const emptyCell = cells.nth(emptyCellIndex);
    await emptyCell.click();
    await page.waitForTimeout(100);

    // 数字を入力
    await page.locator('.number-btn').filter({ hasText: /^1$/ }).click();
    await page.waitForTimeout(100);

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
    // 空のセルを選択
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

    const emptyCell = cells.nth(emptyCellIndex);
    await emptyCell.click();
    await page.waitForTimeout(100);

    // 数字を入力
    await page.locator('.number-btn').filter({ hasText: /^1$/ }).click();
    await page.waitForTimeout(100);

    // リセットボタンをクリック
    await page.locator('.btn').filter({ hasText: 'リセット' }).click();

    // 入力した数字が消えていることを確認
    await expect(emptyCell.locator('.main-value')).toBeHidden();
  });

  test('should check solution and show message', async ({ page }) => {
    // チェックボタンをクリックする前に、数字パネル等のオーバーレイが
    // コントロールを遮っていないことを確認して閉じる
    const numberPanel = page.locator('.number-panel');
    if (await numberPanel.isVisible()) {
      // まずはページ外をクリックして選択を解除してみる
      await page.locator('body').click();
      await page.waitForTimeout(100);
      // まだ表示されている場合はビューに切り替えて確実に非表示にする
      if (await numberPanel.isVisible()) {
        await page.locator('.mode-tab.view').click();
        await page.waitForTimeout(100);
      }
    }

    // チェックボタンをクリック
    await page.locator('.btn').filter({ hasText: 'チェック' }).click();

    // メッセージが表示されていることを確認
    const message = page.locator('.message');
    await expect(message).toBeVisible();
  });

  test('should work undo and redo', async ({ page }) => {
    // 空のセルを選択
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

    const emptyCell = cells.nth(emptyCellIndex);
    await emptyCell.click();
    await page.waitForTimeout(100);

    // 数字を入力
    await page.locator('.number-btn').filter({ hasText: /^1$/ }).click();
    await page.waitForTimeout(100);
    await expect(emptyCell.locator('.main-value')).toContainText('1');

    // Undo
    await page.locator('.action-btn').filter({ hasText: 'Undo' }).click();
    await page.waitForTimeout(100);
    await expect(emptyCell.locator('.main-value')).toBeHidden();

    // Redo
    await page.locator('.action-btn').filter({ hasText: 'Redo' }).click();
    await page.waitForTimeout(100);
    await expect(emptyCell.locator('.main-value')).toContainText('1');
  });

  test.skip('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // モバイルレイアウトでも正常に動作することを確認
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.sudoku-grid')).toBeVisible();
    await expect(page.locator('.mode-tabs')).toBeVisible();
  });
});
