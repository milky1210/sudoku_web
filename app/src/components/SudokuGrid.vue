<template>
  <div class="sudoku-container">
    <h1>数独パズル</h1>
    <div class="sudoku-grid">
      <div 
        v-for="(cell, index) in grid" 
        :key="index"
        :class="getCellClass(index)"
        class="cell"
      >
        <input
          v-if="!cell.fixed"
          type="text"
          maxlength="1"
          :value="cell.value || ''"
          @input="handleInput(index, $event)"
          @focus="selectedCell = index"
          :class="{ 'error': cell.error, 'selected': selectedCell === index }"
        />
        <div v-else class="fixed-value">{{ cell.value }}</div>
      </div>
    </div>
    <div class="controls">
      <button @click="newGame" class="btn">新しいゲーム</button>
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
}

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
