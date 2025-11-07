<template>
  <div class="sudoku-container">
    <div class="header">
      <h1>数独</h1>
      <button 
        @click="toggleMemoMode" 
        :class="['memo-toggle', { active: isMemoMode }]"
      >
        {{ isMemoMode ? 'メモモード' : '通常モード' }}
      </button>
    </div>
    
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

    <!-- 数字選択パネル -->
    <div v-if="selectedCell !== -1 && !grid[selectedCell]?.fixed" class="number-panel">
      <button 
        v-for="num in 9" 
        :key="num"
        @click="inputNumber(num)"
        class="number-btn"
      >
        {{ num }}
      </button>
      <button @click="inputNumber(null)" class="number-btn clear-btn">消去</button>
    </div>

    <div class="controls">
      <button @click="newGame" class="btn">新規</button>
      <button @click="resetGame" class="btn">リセット</button>
      <button @click="checkSolution" class="btn">チェック</button>
    </div>
    
    <div v-if="message" :class="['message', messageType]">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Cell {
  value: number | null
  fixed: boolean
  error: boolean
  memos: number[]
}

const grid = ref<Cell[]>([])
const selectedCell = ref<number>(-1)
const message = ref<string>('')
const messageType = ref<'success' | 'error' | ''>('')
const isMemoMode = ref<boolean>(false)

const toggleMemoMode = (): void => {
  isMemoMode.value = !isMemoMode.value
}

const selectCell = (index: number): void => {
  if (grid.value[index].fixed) return
  selectedCell.value = index
}

const inputNumber = (num: number | null): void => {
  if (selectedCell.value === -1) return
  
  const cell = grid.value[selectedCell.value]
  
  if (num === null) {
    // 消去
    cell.value = null
    cell.memos = []
    cell.error = false
  } else if (isMemoMode.value) {
    // メモモード
    cell.value = null
    const memoIndex = cell.memos.indexOf(num)
    if (memoIndex > -1) {
      cell.memos.splice(memoIndex, 1)
    } else {
      cell.memos.push(num)
      cell.memos.sort()
    }
  } else {
    // 通常入力
    cell.value = num
    cell.memos = []
    cell.error = false
  }
  
  message.value = ''
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
  
  return classes.join(' ')
}

// 新しいゲーム
const newGame = (): void => {
  const puzzle = generatePuzzle(40)
  grid.value = boardToGrid(puzzle)
  selectedCell.value = -1
  message.value = ''
  messageType.value = ''
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
  message.value = ''
  messageType.value = ''
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
  margin-bottom: 16px;
}

h1 {
  margin: 0;
  font-size: 24px;
  color: #2c3e50;
}

.memo-toggle {
  padding: 8px 16px;
  font-size: 14px;
  border: 2px solid #3498db;
  border-radius: 8px;
  background-color: white;
  color: #3498db;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: bold;
}

.memo-toggle.active {
  background-color: #3498db;
  color: white;
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

.number-panel {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 16px;
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

.number-btn:active {
  transform: scale(0.95);
  background-color: #3498db;
  color: white;
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
  .number-panel,
  .controls,
  .message {
    max-width: 420px;
  }
}
</style>

const grid = ref<Cell[]>([])
const selectedCell = ref<number>(-1)
const message = ref<string>('')
const messageType = ref<'success' | 'error' | ''>('')

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
        error: false
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
  
  return classes.join(' ')
}

// 入力処理
const handleInput = (index: number, event: Event): void => {
  const input = event.target as HTMLInputElement
  const value = input.value
  
  if (value === '' || value === ' ') {
    grid.value[index].value = null
    grid.value[index].error = false
    return
  }
  
  const num = parseInt(value)
  if (isNaN(num) || num < 1 || num > 9) {
    input.value = grid.value[index].value?.toString() || ''
    return
  }
  
  grid.value[index].value = num
  grid.value[index].error = false
  message.value = ''
}

// 新しいゲーム
const newGame = (): void => {
  const puzzle = generatePuzzle(40)
  grid.value = boardToGrid(puzzle)
  message.value = ''
  messageType.value = ''
}

// リセット
const resetGame = (): void => {
  grid.value.forEach(cell => {
    if (!cell.fixed) {
      cell.value = null
      cell.error = false
    }
  })
  message.value = ''
  messageType.value = ''
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
    message.value = '赤くなっているセルに誤りがあります'
    messageType.value = 'error'
  } else if (isComplete) {
    message.value = '正解です！おめでとうございます！'
    messageType.value = 'success'
  } else {
    message.value = 'これまでは正しいです。続けてください！'
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
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.sudoku-grid {
  display: grid;
  grid-template-columns: repeat(9, 50px);
  grid-template-rows: repeat(9, 50px);
  gap: 0;
  border: 3px solid #2c3e50;
  background-color: #2c3e50;
  margin-bottom: 20px;
}

.cell {
  background-color: white;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell.right-border {
  border-right: 3px solid #2c3e50;
}

.cell.bottom-border {
  border-bottom: 3px solid #2c3e50;
}

.cell input {
  width: 100%;
  height: 100%;
  border: none;
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #3498db;
  outline: none;
  background-color: transparent;
}

.cell input:focus {
  background-color: #e3f2fd;
}

.cell input.selected {
  background-color: #e3f2fd;
}

.cell input.error {
  background-color: #ffebee;
  color: #e74c3c;
}

.fixed-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
}

.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.btn {
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  background-color: #3498db;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn:hover {
  background-color: #2980b9;
}

.btn:active {
  background-color: #1c598a;
}

.message {
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: bold;
  margin-top: 10px;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>
