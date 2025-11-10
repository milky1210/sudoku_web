import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Mode = 'write' | 'memo' | 'view' | 'skill'

export interface Cell {
  value: number | null
  fixed: boolean
  error: boolean
  memos: number[]
}

export interface HistoryEntry {
  grid: Cell[]
  cost: number
}

export interface Skill {
  id: string
  name: string
  cost: number
  description: string
}

export const useSudokuStore = defineStore('sudoku', () => {
  // State
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

  // Utility functions
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

  const generateCompleteBoard = (): number[][] => {
    const board: number[][] = Array(9)
      .fill(0)
      .map(() => Array(9).fill(0))

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

  const generatePuzzle = (difficulty: number = 40): number[][] => {
    const completeBoard = generateCompleteBoard()
    const puzzle = completeBoard.map((row) => [...row])

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

  const findMissingNumber = (arr: number[]): number => {
    const nums = new Set(arr.filter((n) => n !== 0))
    for (let i = 1; i <= 9; i++) {
      if (!nums.has(i)) return i
    }
    return 0
  }

  // Actions
  const setMode = (mode: Mode): void => {
    currentMode.value = mode
    selectedNumber.value = null
    if (mode !== 'write' && mode !== 'memo') {
      selectedCell.value = -1
    }
  }

  const selectCell = (index: number): void => {
    if (grid.value[index].fixed) return
    if (currentMode.value === 'view') return
    selectedCell.value = index
  }

  const inputNumberToCell = (num: number): void => {
    if (selectedCell.value === -1) return
    const cell = grid.value[selectedCell.value]
    cell.value = num
    cell.memos = []
    cell.error = false
    message.value = ''
  }

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

  const clearCell = (): void => {
    if (selectedCell.value === -1) return
    const cell = grid.value[selectedCell.value]
    cell.value = null
    cell.memos = []
    cell.error = false
    saveHistory()
  }

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

  const undo = (): void => {
    if (!canUndo.value) return
    historyIndex.value--
    const state = history.value[historyIndex.value]
    grid.value = JSON.parse(JSON.stringify(state.grid))
    cost.value = state.cost
  }

  const redo = (): void => {
    if (!canRedo.value) return
    historyIndex.value++
    const state = history.value[historyIndex.value]
    grid.value = JSON.parse(JSON.stringify(state.grid))
    cost.value = state.cost
  }

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

  const useSkill = (skillId: string): void => {
    if (selectedNumber.value === null) return

    const skill = skills.find((s) => s.id === skillId)
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

  const resetGame = (): void => {
    grid.value.forEach((cell) => {
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

  const checkSolution = (): void => {
    // エラーをクリア
    grid.value.forEach((cell) => (cell.error = false))

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

  return {
    // State
    grid,
    selectedCell,
    message,
    messageType,
    currentMode,
    selectedNumber,
    cost,
    maxCost,
    skills,
    // Computed
    canUndo,
    canRedo,
    // Actions
    setMode,
    selectCell,
    handleNumberClick,
    clearCell,
    undo,
    redo,
    useSkill,
    getCellClass,
    newGame,
    resetGame,
    checkSolution
  }
})
