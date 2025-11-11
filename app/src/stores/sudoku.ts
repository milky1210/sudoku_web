import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Mode = 'write' | 'memo'

export interface Cell {
  value: number | null
  fixed: boolean
  error: boolean
  memos: number[]
  highlight: boolean
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
      id: 'auto89',
      name: '残り1マス埋め',
      cost: 0,
      description: '8個埋まっている行・列・ブロックの残り1マスを自動入力'
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

  // 各数字が盤面に何個あるかをカウント
  const numberCounts = computed(() => {
    const counts: Record<number, number> = {}
    for (let i = 1; i <= 9; i++) {
      counts[i] = 0
    }
    grid.value.forEach((cell) => {
      if (cell.value !== null) {
        counts[cell.value]++
      }
    })
    return counts
  })

  // 数字が9個埋まっているかチェック
  const isNumberComplete = (num: number): boolean => {
    return numberCounts.value[num] >= 9
  }

  // 残り1マスの箇所があるかチェック（8/9マススキル用）
  const hasOneCellGap = computed(() => {
    const board = gridToBoard()

    // 各行をチェック
    for (let i = 0; i < 9; i++) {
      const rowCells = []
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) rowCells.push(i * 9 + j)
      }
      if (rowCells.length === 1) return true
    }

    // 各列をチェック
    for (let i = 0; i < 9; i++) {
      const colCells = []
      for (let j = 0; j < 9; j++) {
        if (board[j][i] === 0) colCells.push(j * 9 + i)
      }
      if (colCells.length === 1) return true
    }

    // 各ブロックをチェック
    for (let blockRow = 0; blockRow < 3; blockRow++) {
      for (let blockCol = 0; blockCol < 3; blockCol++) {
        const blockCells = []
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const row = blockRow * 3 + i
            const col = blockCol * 3 + j
            if (board[row][col] === 0) {
              blockCells.push(row * 9 + col)
            }
          }
        }
        if (blockCells.length === 1) return true
      }
    }

    return false
  })

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
          memos: [],
          highlight: false
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
    // 数字が入っているセル（固定セルまたは入力済みセル）をクリックした場合
    const clickedCell = grid.value[index]
    if (clickedCell.value !== null) {
      // その数字を選択状態にする
      selectedNumber.value = clickedCell.value
      selectedCell.value = -1
      return
    }

    // 空のセルの場合
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
    }
    // 数字選択状態を更新
    selectedNumber.value = num
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

    // 残り1マスの箇所を探して、最初の1つだけを埋める
    // 行チェック
    for (let i = 0; i < 9; i++) {
      const rowCells = []
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) rowCells.push(i * 9 + j)
      }
      if (rowCells.length === 1) {
        const missingNum = findMissingNumber(board[i])
        const cellIndex = rowCells[0]
        grid.value[cellIndex].value = missingNum
        grid.value[cellIndex].memos = []
        grid.value[cellIndex].highlight = true
        setTimeout(() => {
          grid.value[cellIndex].highlight = false
        }, 1000)
        message.value = '残り1マスを埋めました'
        messageType.value = 'success'
        return
      }
    }

    // 列チェック
    for (let i = 0; i < 9; i++) {
      const colCells = []
      const col = []
      for (let j = 0; j < 9; j++) {
        col.push(board[j][i])
        if (board[j][i] === 0) colCells.push(j * 9 + i)
      }
      if (colCells.length === 1) {
        const missingNum = findMissingNumber(col)
        const cellIndex = colCells[0]
        grid.value[cellIndex].value = missingNum
        grid.value[cellIndex].memos = []
        grid.value[cellIndex].highlight = true
        setTimeout(() => {
          grid.value[cellIndex].highlight = false
        }, 1000)
        message.value = '残り1マスを埋めました'
        messageType.value = 'success'
        return
      }
    }

    // ブロックチェック
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
          const cellIndex = blockCells[0]
          grid.value[cellIndex].value = missingNum
          grid.value[cellIndex].memos = []
          grid.value[cellIndex].highlight = true
          setTimeout(() => {
            grid.value[cellIndex].highlight = false
          }, 1000)
          message.value = '残り1マスを埋めました'
          messageType.value = 'success'
          return
        }
      }
    }

    // 該当なし
    message.value = '残り1マスの箇所がありません'
    messageType.value = 'error'
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
    const skill = skills.find((s) => s.id === skillId)
    if (!skill || skill.cost > cost.value) return

    // スキルごとに必要な条件をチェック
    if (skillId === 'memoN' && selectedNumber.value === null) return

    switch (skillId) {
      case 'auto89':
        executeAuto89()
        cost.value -= skill.cost
        break
      case 'autoSingle':
        executeAutoSingle()
        cost.value -= skill.cost
        break
      case 'memoN':
        if (selectedNumber.value !== null) {
          executeMemoN(selectedNumber.value)
          cost.value -= skill.cost
        }
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

    // スキルで埋めたセルのアニメーション
    if (grid.value[index].highlight) {
      classes.push('skill-filled')
    }

    // 選択された数字と同じ数字をハイライト
    if (selectedNumber.value !== null && grid.value[index].value === selectedNumber.value) {
      classes.push('highlighted')
    }

    // 選択された数字が置けないセルをハイライト（赤）
    // 空のセルまたは既に数字が入っているセル両方をチェック
    if (selectedNumber.value !== null) {
      const board = gridToBoard()
      board[row][col] = 0
      if (!isValid(board, row, col, selectedNumber.value)) {
        classes.push('invalid-placement')
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
    numberCounts,
    isNumberComplete,
    hasOneCellGap,
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
