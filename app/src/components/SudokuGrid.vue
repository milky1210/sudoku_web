<template>
  <div class="sudoku-container">
    <!-- ヘッダー -->
    <div class="header">
      <h1>数独</h1>
      <div class="cost-display">
        コスト:
        <span v-for="i in maxCost" :key="i" class="cost-dot" :class="{ filled: i <= cost }">
          ●
        </span>
      </div>
    </div>

    <!-- 盤面 -->
    <div class="sudoku-grid">
      <div
        v-for="(cell, index) in grid"
        :key="index"
        :class="getCellClass(index)"
        class="cell"
        @click="selectCell(index)"
      >
        <div v-if="cell.fixed" class="fixed-value">{{ cell.value }}</div>
        <div v-else class="editable-cell">
          <div v-if="cell.value && !cell.memos.length" :class="['main-value', { 'error': cell.error }]">
            {{ cell.value }}
          </div>
          <div v-if="cell.memos.length" class="memo-grid">
            <span
              v-for="num in 9"
              :key="num"
              :class="['memo-num', { 'active': cell.memos.includes(num) }]"
            >
              {{ cell.memos.includes(num) ? num : '' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- モード切り替えタブ -->
    <div class="mode-tabs">
      <button
        @click="setMode('write')"
        :class="['mode-tab', 'write', { active: currentMode === 'write' }]"
      >
        ✏️ 書込
      </button>
      <button
        @click="setMode('memo')"
        :class="['mode-tab', 'memo', { active: currentMode === 'memo' }]"
      >
        ✍️ メモ
      </button>
      <button
        @click="setMode('view')"
        :class="['mode-tab', 'view', { active: currentMode === 'view' }]"
      >
        👁 ビュー
      </button>
      <button
        @click="setMode('skill')"
        :class="['mode-tab', 'skill', { active: currentMode === 'skill' }]"
      >
        💡 スキル
      </button>
    </div>

    <!-- 数字パッド（書込・メモ・スキルモード時のみ表示） -->
    <div v-if="currentMode !== 'view'" class="number-panel">
      <button
        v-for="num in 9"
        :key="num"
        @click="handleNumberClick(num)"
        :class="['number-btn', { selected: selectedNumber === num }]"
      >
        {{ num }}
      </button>
      <button @click="clearCell" class="number-btn clear-btn">消去</button>
      <button @click="undo" :disabled="!canUndo" class="number-btn action-btn">Undo</button>
      <button @click="redo" :disabled="!canRedo" class="number-btn action-btn">Redo</button>
    </div>

    <!-- スキル一覧（スキルモード時のみ表示） -->
    <div v-if="currentMode === 'skill'" class="skill-panel">
      <h3>スキル一覧</h3>
      <button
        v-for="skill in skills"
        :key="skill.id"
        @click="useSkill(skill.id)"
        :disabled="skill.cost > cost || selectedNumber === null"
        class="skill-btn"
      >
        <span class="skill-name">{{ skill.name }}</span>
        <span class="skill-cost">{{ skill.cost > 0 ? `-${skill.cost}` : '無料' }}</span>
        <div class="skill-desc">{{ skill.description }}</div>
      </button>
    </div>

    <!-- コントロールボタン -->
    <div class="controls">
      <button @click="newGame" class="btn">新規</button>
      <button @click="resetGame" class="btn">リセット</button>
      <button @click="checkSolution" class="btn">チェック</button>
    </div>

    <!-- メッセージ -->
    <div v-if="message" :class="['message', messageType]">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

type Mode = 'write' | 'memo' | 'view' | 'skill'

interface Cell {
  value: number | null
  fixed: boolean
  error: boolean
  memos: number[]
}

interface HistoryEntry {
  grid: Cell[]
  cost: number
}

interface Skill {
  id: string
  name: string
  cost: number
  description: string
}

const grid = ref<Cell[]>([])
const selectedCell = ref<number>(-1)
const message = ref<string>('')
const messageType = ref<'success' | 'error' | ''>('')
const currentMode = ref<Mode>('write')
const selectedNumber = ref<number | null>(null)
const cost = ref<number>(5)
const maxCost = ref<number>(5)
const history = ref<HistoryEntry[]>([])
const historyIndex = ref<number>(-1)

const skills: Skill[] = [
  {
    id: 'highlight',
    name: '置けない場所ハイライト',
    cost: 0,
    description: '選択した数字が置けない場所を表示'
  },
  {
    id: 'auto89',
    name: '8/9マス自動埋め',
    cost: 1,
    description: '行・列・ブロックで8または9マス埋まっている箇所を自動入力'
  },
  {
    id: 'autoSingle',
    name: '候補1つの自動入力',
    cost: 2,
    description: '候補が1つしかないセルを自動入力'
  },
  {
    id: 'memoN',
    name: '候補nメモ',
    cost: 1,
    description: '選択した数字の候補を全セルにメモ'
  }
]

// Computed
const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

// モード切り替え
const setMode = (mode: Mode): void => {
  currentMode.value = mode
  selectedNumber.value = null
  if (mode !== 'write' && mode !== 'memo') {
    selectedCell.value = -1
  }
}

// セル選択
const selectCell = (index: number): void => {
  if (grid.value[index].fixed) return
  if (currentMode.value === 'view') return
  selectedCell.value = index
}

// 数字ボタンクリック
const handleNumberClick = (num: number): void => {
  if (currentMode.value === 'write') {
    if (selectedCell.value === -1) return
    inputNumberToCell(num)
    saveHistory()
  } else if (currentMode.value === 'memo') {
    if (selectedCell.value === -1) return
    toggleMemoInCell(num)
    saveHistory()
  } else if (currentMode.value === 'view') {
    selectedNumber.value = num
  } else if (currentMode.value === 'skill') {
    selectedNumber.value = num
  }
}

// セルに数字を入力
const inputNumberToCell = (num: number): void => {
  if (selectedCell.value === -1) return
  const cell = grid.value[selectedCell.value]
  cell.value = num
  cell.memos = []
  cell.error = false
  message.value = ''
}

// セルのメモをトグル
const toggleMemoInCell = (num: number): void => {
  if (selectedCell.value === -1) return
  const cell = grid.value[selectedCell.value]
  cell.value = null
  const memoIndex = cell.memos.indexOf(num)
  if (memoIndex > -1) {
    cell.memos.splice(memoIndex, 1)
  } else {
    cell.memos.push(num)
    cell.memos.sort()
  }
}

// セルをクリア
const clearCell = (): void => {
  if (selectedCell.value === -1) return
  const cell = grid.value[selectedCell.value]
  cell.value = null
  cell.memos = []
  cell.error = false
  saveHistory()
}

// 履歴保存
const saveHistory = (): void => {
  // 現在のインデックス以降の履歴を削除
  history.value = history.value.slice(0, historyIndex.value + 1)

  // 現在の状態を保存
  history.value.push({
    grid: JSON.parse(JSON.stringify(grid.value)),
    cost: cost.value
  })

  historyIndex.value = history.value.length - 1

  // 履歴の最大数を制限（例: 50）
  if (history.value.length > 50) {
    history.value.shift()
    historyIndex.value--
  }
}

// Undo
const undo = (): void => {
  if (!canUndo.value) return
  historyIndex.value--
  const state = history.value[historyIndex.value]
  grid.value = JSON.parse(JSON.stringify(state.grid))
  cost.value = state.cost
}

// Redo
const redo = (): void => {
  if (!canRedo.value) return
  historyIndex.value++
  const state = history.value[historyIndex.value]
  grid.value = JSON.parse(JSON.stringify(state.grid))
  cost.value = state.cost
}

// スキル使用
const useSkill = (skillId: string): void => {
  if (selectedNumber.value === null) return

  const skill = skills.find(s => s.id === skillId)
  if (!skill || skill.cost > cost.value) return

  switch (skillId) {
    case 'highlight':
      // ハイライトは状態変更なしで視覚効果のみ
      break
    case 'auto89':
      executeAuto89()
      cost.value -= skill.cost
      break
    case 'autoSingle':
      executeAutoSingle()
      cost.value -= skill.cost
      break
    case 'memoN':
      executeMemoN(selectedNumber.value)
      cost.value -= skill.cost
      break
  }

  saveHistory()
}

// 8/9マス自動埋め
const executeAuto89 = (): void => {
  const board = gridToBoard()
  let filled = false

  // 各行・列・ブロックをチェック
  for (let i = 0; i < 9; i++) {
    // 行チェック
    const rowCells = []
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0) rowCells.push(i * 9 + j)
    }
    if (rowCells.length === 1) {
      const missingNum = findMissingNumber(board[i])
      grid.value[rowCells[0]].value = missingNum
      filled = true
    }

    // 列チェック
    const colCells = []
    const col = []
    for (let j = 0; j < 9; j++) {
      col.push(board[j][i])
      if (board[j][i] === 0) colCells.push(j * 9 + i)
    }
    if (colCells.length === 1) {
      const missingNum = findMissingNumber(col)
      grid.value[colCells[0]].value = missingNum
      filled = true
    }
  }

  // 各ブロックチェック
  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      const blockCells = []
      const block = []
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const row = blockRow * 3 + i
          const col = blockCol * 3 + j
          block.push(board[row][col])
          if (board[row][col] === 0) {
            blockCells.push(row * 9 + col)
          }
        }
      }
      if (blockCells.length === 1) {
        const missingNum = findMissingNumber(block)
        grid.value[blockCells[0]].value = missingNum
        filled = true
      }
    }
  }

  if (filled) {
    message.value = '8/9マス自動埋めを実行しました'
    messageType.value = 'success'
  } else {
    message.value = '該当するマスがありません'
    messageType.value = 'error'
  }
}

// 配列から欠けている数字を見つける
const findMissingNumber = (arr: number[]): number => {
  const nums = new Set(arr.filter(n => n !== 0))
  for (let i = 1; i <= 9; i++) {
    if (!nums.has(i)) return i
  }
  return 0
}

// 候補1つの自動入力
const executeAutoSingle = (): void => {
  let filled = false

  grid.value.forEach((cell, index) => {
    if (cell.fixed || cell.value) return

    const row = Math.floor(index / 9)
    const col = index % 9
    const candidates = []

    for (let num = 1; num <= 9; num++) {
      const board = gridToBoard()
      board[row][col] = 0
      if (isValid(board, row, col, num)) {
        candidates.push(num)
      }
    }

    if (candidates.length === 1) {
      cell.value = candidates[0]
      cell.memos = []
      filled = true
    }
  })

  if (filled) {
    message.value = '候補1つのセルを自動入力しました'
    messageType.value = 'success'
  } else {
    message.value = '該当するセルがありません'
    messageType.value = 'error'
  }
}

// 候補nメモ
const executeMemoN = (num: number): void => {
  grid.value.forEach((cell, index) => {
    if (cell.fixed || cell.value) return

    const row = Math.floor(index / 9)
    const col = index % 9
    const board = gridToBoard()
    board[row][col] = 0

    if (isValid(board, row, col, num)) {
      if (!cell.memos.includes(num)) {
        cell.memos.push(num)
        cell.memos.sort()
      }
    }
  })

  message.value = `数字${num}の候補をメモしました`
  messageType.value = 'success'
}

// 数独の検証
const isValid = (board: number[][], row: number, col: number, num: number): boolean => {
  // 行チェック
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false
  }

  // 列チェック
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false
  }

  // 3x3ボックスチェック
  const startRow = row - (row % 3)
  const startCol = col - (col % 3)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false
    }
  }

  return true
}

// 数独の解決
const solveSudoku = (board: number[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num
            if (solveSudoku(board)) return true
            board[row][col] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

// 完成した数独ボードを生成
const generateCompleteBoard = (): number[][] => {
  const board: number[][] = Array(9).fill(0).map(() => Array(9).fill(0))

  // 各3x3ボックスの対角線上を埋める
  for (let box = 0; box < 3; box++) {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const randomIndex = Math.floor(Math.random() * nums.length)
        board[box * 3 + i][box * 3 + j] = nums[randomIndex]
        nums.splice(randomIndex, 1)
      }
    }
  }

  solveSudoku(board)
  return board
}

// プレイ用のボードを生成（いくつかのセルを削除）
const generatePuzzle = (difficulty: number = 40): number[][] => {
  const completeBoard = generateCompleteBoard()
  const puzzle = completeBoard.map(row => [...row])

  let cellsToRemove = difficulty
  while (cellsToRemove > 0) {
    const row = Math.floor(Math.random() * 9)
    const col = Math.floor(Math.random() * 9)
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0
      cellsToRemove--
    }
  }

  return puzzle
}

// ボードをグリッドに変換
const boardToGrid = (board: number[][]): Cell[] => {
  const cells: Cell[] = []
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      cells.push({
        value: board[i][j] || null,
        fixed: board[i][j] !== 0,
        error: false,
        memos: []
      })
    }
  }
  return cells
}

// グリッドをボードに変換
const gridToBoard = (): number[][] => {
  const board: number[][] = []
  for (let i = 0; i < 9; i++) {
    board[i] = []
    for (let j = 0; j < 9; j++) {
      board[i][j] = grid.value[i * 9 + j].value || 0
    }
  }
  return board
}

// セルのクラスを取得
const getCellClass = (index: number): string => {
  const row = Math.floor(index / 9)
  const col = index % 9
  const classes = []

  if ((col + 1) % 3 === 0 && col !== 8) classes.push('right-border')
  if ((row + 1) % 3 === 0 && row !== 8) classes.push('bottom-border')
  if (selectedCell.value === index) classes.push('selected')

  // ビューモード: 選択された数字と同じ数字をハイライト
  if (currentMode.value === 'view' && selectedNumber.value !== null) {
    if (grid.value[index].value === selectedNumber.value) {
      classes.push('highlighted')
    }
  }

  // スキルモード: ハイライトスキル使用時
  if (currentMode.value === 'skill' && selectedNumber.value !== null) {
    const board = gridToBoard()
    board[row][col] = 0
    if (!isValid(board, row, col, selectedNumber.value)) {
      classes.push('invalid-placement')
    } else if (!grid.value[index].fixed && !grid.value[index].value) {
      classes.push('valid-placement')
    }
  }

  return classes.join(' ')
}

// 新しいゲーム
const newGame = (): void => {
  const puzzle = generatePuzzle(40)
  grid.value = boardToGrid(puzzle)
  selectedCell.value = -1
  selectedNumber.value = null
  message.value = ''
  messageType.value = ''
  cost.value = maxCost.value
  history.value = []
  historyIndex.value = -1
  saveHistory()
}

// リセット
const resetGame = (): void => {
  grid.value.forEach(cell => {
    if (!cell.fixed) {
      cell.value = null
      cell.error = false
      cell.memos = []
    }
  })
  selectedCell.value = -1
  selectedNumber.value = null
  message.value = ''
  messageType.value = ''
  cost.value = maxCost.value
  history.value = []
  historyIndex.value = -1
  saveHistory()
}

// 解答チェック
const checkSolution = (): void => {
  // エラーをクリア
  grid.value.forEach(cell => cell.error = false)

  const board = gridToBoard()
  let hasError = false
  let isComplete = true

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const index = row * 9 + col
      const num = board[row][col]

      if (num === 0) {
        isComplete = false
        continue
      }

      // 一時的に削除して検証
      board[row][col] = 0
      if (!isValid(board, row, col, num)) {
        grid.value[index].error = true
        hasError = true
      }
      board[row][col] = num
    }
  }

  if (hasError) {
    message.value = '赤いマスに誤りがあります'
    messageType.value = 'error'
  } else if (isComplete) {
    message.value = '正解です！おめでとう！'
    messageType.value = 'success'
  } else {
    message.value = 'ここまで正解です'
    messageType.value = 'success'
  }
}

onMounted(() => {
  newGame()
})
</script>

<style scoped>
.sudoku-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 380px;
  margin-bottom: 12px;
}

h1 {
  margin: 0;
  font-size: 24px;
  color: #2c3e50;
}

.cost-display {
  font-size: 14px;
  font-weight: bold;
  color: #2c3e50;
}

.cost-dot {
  margin: 0 2px;
  color: #ddd;
  transition: color 0.3s;
}

.cost-dot.filled {
  color: #f39c12;
}

.sudoku-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-template-rows: repeat(9, 1fr);
  gap: 0;
  border: 3px solid #2c3e50;
  background-color: #2c3e50;
  margin-bottom: 16px;
  width: 100%;
  max-width: 380px;
  aspect-ratio: 1;
  touch-action: manipulation;
}

.cell {
  background-color: white;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  min-height: 0;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.cell.right-border {
  border-right: 3px solid #2c3e50;
}

.cell.bottom-border {
  border-bottom: 3px solid #2c3e50;
}

.cell.selected {
  background-color: #e3f2fd;
  box-shadow: inset 0 0 0 2px #2196f3;
}

.cell.highlighted {
  background-color: #fff3cd;
}

.fixed-value {
  font-size: clamp(16px, 4vw, 20px);
  font-weight: bold;
  color: #2c3e50;
}

.editable-cell {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.main-value {
  font-size: clamp(16px, 4vw, 20px);
  font-weight: bold;
  color: #3498db;
}

.main-value.error {
  color: #e74c3c;
}

.memo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  padding: 2px;
  box-sizing: border-box;
}

.memo-num {
  font-size: clamp(8px, 1.8vw, 10px);
  color: #7f8c8d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

/* モード切り替えタブ */
.mode-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  width: 100%;
  max-width: 380px;
  margin-bottom: 12px;
}

.mode-tab {
  padding: 10px 8px;
  font-size: 14px;
  font-weight: bold;
  border: 2px solid transparent;
  border-radius: 8px;
  background-color: #f0f0f0;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.mode-tab.active {
  border-width: 3px;
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0,0,0,0.1);
}

.mode-tab.write.active {
  background-color: #3498db;
  border-color: #2980b9;
  color: white;
}

.mode-tab.memo.active {
  background-color: #2ecc71;
  border-color: #27ae60;
  color: white;
}

.mode-tab.view.active {
  background-color: #95a5a6;
  border-color: #7f8c8d;
  color: white;
}

.mode-tab.skill.active {
  background-color: #e67e22;
  border-color: #d35400;
  color: white;
}

.number-panel {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 12px;
  width: 100%;
  max-width: 380px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 12px;
}

.number-btn {
  aspect-ratio: 1;
  font-size: 20px;
  font-weight: bold;
  border: 2px solid #3498db;
  border-radius: 8px;
  background-color: white;
  color: #3498db;
  cursor: pointer;
  transition: all 0.15s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.number-btn.selected {
  background-color: #3498db;
  color: white;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.3);
}

.number-btn:active {
  transform: scale(0.95);
}

.number-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Prevent disabled buttons inside overlays from intercepting pointer events
   so underlying controls (e.g. footer buttons) can still receive clicks. */
.number-panel .number-btn:disabled,
.number-panel .action-btn:disabled {
  pointer-events: none;
}

.clear-btn {
  grid-column: span 2;
  font-size: 16px;
  border-color: #e74c3c;
  color: #e74c3c;
}

.clear-btn:active {
  background-color: #e74c3c;
  color: white;
}

.action-btn {
  font-size: 14px;
  border-color: #95a5a6;
  color: #95a5a6;
}

.action-btn:active:not(:disabled) {
  background-color: #95a5a6;
  color: white;
}

/* スキルパネル */
.skill-panel {
  width: 100%;
  max-width: 380px;
  margin-bottom: 12px;
  padding: 12px;
  background-color: #fff3e0;
  border-radius: 12px;
  border: 2px solid #e67e22;
}

.skill-panel h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #d35400;
}

.skill-btn {
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  border: 2px solid #e67e22;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.skill-btn:hover:not(:disabled) {
  background-color: #fff9f0;
}

.skill-btn:active:not(:disabled) {
  background-color: #e67e22;
  color: white;
}

.skill-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

/* Allow clicks to pass through disabled skill buttons so they don't block
   underlying elements when panels overlap. */
.skill-panel .skill-btn:disabled {
  pointer-events: none;
}

.skill-name {
  font-weight: bold;
  font-size: 15px;
  display: inline-block;
  margin-right: 8px;
}

.skill-cost {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: #e67e22;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.skill-desc {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}


.controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  width: 100%;
  max-width: 380px;
}

.btn {
  flex: 1;
  padding: 12px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  background-color: #95a5a6;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: bold;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.btn:active {
  background-color: #7f8c8d;
}

.message {
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: bold;
  margin-top: 8px;
  width: 100%;
  max-width: 380px;
  text-align: center;
  box-sizing: border-box;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 2px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 2px solid #f5c6cb;
}

@media (min-width: 768px) {
  .sudoku-grid {
    max-width: 420px;
  }

  .header,
  .mode-tabs,
  .number-panel,
  .skill-panel,
  .controls,
  .message {
    max-width: 420px;
  }
}
</style>
