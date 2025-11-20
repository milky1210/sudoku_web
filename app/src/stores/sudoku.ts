import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { puzzleService } from '@/services/puzzleService'
import type { PuzzleData } from '@/types/puzzle'
import { ALL_SKILLS, getSkillById } from '@/types/skills'
import type { Skill } from '@/types/skills'
import { useUserProfileStore } from './userProfile'

export type Mode = 'write' | 'memo'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

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

export { type Skill } from '@/types/skills'

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
  const currentDifficulty = ref<Difficulty | null>(null)
  const currentPuzzle = ref<PuzzleData | null>(null)
  const gameState = ref<'difficulty-select' | 'playing' | 'completed'>('difficulty-select')
  const startTime = ref<number>(0)
  const savedGrid = ref<Cell[] | null>(null)
  const hasSavedState = ref<boolean>(false)

  // Get user profile store
  const userProfile = useUserProfileStore()

  // All available skills
  const allSkills = ALL_SKILLS

  // Currently selected skills (from user profile)
  const selectedSkills = computed(() => {
    return userProfile.selectedSkills
      .map((id) => getSkillById(id))
      .filter((skill): skill is Skill => skill !== undefined)
  })

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
    // モード切り替え時はselectedNumberをリセットしない
    if (mode !== 'write' && mode !== 'memo') {
      selectedNumber.value = null
      selectedCell.value = -1
    }
  }

  const selectCell = (index: number): void => {
    const clickedCell = grid.value[index]
    
    // 固定セル（パズルの一部）の場合は選択状態にせず、数字だけ選択
    if (clickedCell.fixed && clickedCell.value !== null) {
      selectedNumber.value = clickedCell.value
      selectedCell.value = -1
      return
    }

    // 入力済みの非固定セルまたは空のセルの場合はセルを選択
    selectedCell.value = index
    
    // 入力済みの場合はその数字も選択状態にする
    if (clickedCell.value !== null) {
      selectedNumber.value = clickedCell.value
    }
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

  const executeFill8 = (): void => {
    const board = gridToBoard()

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

    message.value = '残り1マスの箇所がありません'
    messageType.value = 'error'
  }

  const executeFill8All = (): void => {
    const board = gridToBoard()
    let filled = false

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
        filled = true
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
        filled = true
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
          filled = true
        }
      }
    }

    if (filled) {
      message.value = '全ての残り1マスを埋めました'
      messageType.value = 'success'
    } else {
      message.value = '残り1マスの箇所がありません'
      messageType.value = 'error'
    }
  }

  const executePossible1 = (): void => {
    let filled = false

    for (let index = 0; index < grid.value.length; index++) {
      const cell = grid.value[index]
      if (cell.fixed || cell.value) continue

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
        cell.highlight = true
        setTimeout(() => {
          cell.highlight = false
        }, 1000)
        filled = true
        message.value = '候補1つのセルを自動入力しました'
        messageType.value = 'success'
        return
      }
    }

    if (!filled) {
      message.value = '該当するセルがありません'
      messageType.value = 'error'
    }
  }

  const executePossible1All = (): void => {
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
        cell.highlight = true
        setTimeout(() => {
          cell.highlight = false
        }, 1000)
        filled = true
      }
    })

    if (filled) {
      message.value = '候補1つのセルを全て自動入力しました'
      messageType.value = 'success'
    } else {
      message.value = '該当するセルがありません'
      messageType.value = 'error'
    }
  }

  const executeMemoAll = (): void => {
    grid.value.forEach((cell, index) => {
      if (cell.fixed || cell.value) return

      const row = Math.floor(index / 9)
      const col = index % 9
      const board = gridToBoard()
      board[row][col] = 0

      cell.memos = []
      for (let num = 1; num <= 9; num++) {
        if (isValid(board, row, col, num)) {
          cell.memos.push(num)
        }
      }
    })

    message.value = '全ての候補をメモしました'
    messageType.value = 'success'
  }

  const executeSave = (): void => {
    savedGrid.value = JSON.parse(JSON.stringify(grid.value))
    hasSavedState.value = true
    message.value = '盤面を保存しました'
    messageType.value = 'success'
  }

  const executeLoad = (): void => {
    if (!savedGrid.value || !hasSavedState.value) {
      message.value = '保存された盤面がありません'
      messageType.value = 'error'
      return
    }

    grid.value = JSON.parse(JSON.stringify(savedGrid.value))
    hasSavedState.value = false
    savedGrid.value = null
    message.value = '保存した盤面を復元しました'
    messageType.value = 'success'
  }

  const executeEsp = (): void => {
    if (!currentPuzzle.value) {
      message.value = 'エスパースキルはパズル実行中のみ使用可能です'
      messageType.value = 'error'
      return
    }

    // Find cells with 2+ candidates and pick the one with minimum candidates
    let minCandidates = 10
    let targetCells: { index: number; candidates: number[] }[] = []

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

      if (candidates.length >= 2) {
        if (candidates.length < minCandidates) {
          minCandidates = candidates.length
          targetCells = [{ index, candidates }]
        } else if (candidates.length === minCandidates) {
          targetCells.push({ index, candidates })
        }
      }
    })

    if (targetCells.length === 0) {
      message.value = '候補が2つ以上のセルがありません'
      messageType.value = 'error'
      return
    }

    // Pick random cell from targets
    const target = targetCells[Math.floor(Math.random() * targetCells.length)]
    const row = Math.floor(target.index / 9)
    const col = target.index % 9
    const correctAnswer = currentPuzzle.value.solution[row][col]

    // ESP accuracy based on user level
    const accuracy = userProfile.espAccuracy
    const success = Math.random() * 100 < accuracy

    if (success) {
      grid.value[target.index].value = correctAnswer
      grid.value[target.index].memos = []
      grid.value[target.index].highlight = true
      setTimeout(() => {
        grid.value[target.index].highlight = false
      }, 1000)
      message.value = 'エスパーで正解を導きました！'
      messageType.value = 'success'
    } else {
      // Pick a wrong answer
      const wrongAnswers = target.candidates.filter((n) => n !== correctAnswer)
      if (wrongAnswers.length > 0) {
        const wrongAnswer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)]
        grid.value[target.index].value = wrongAnswer
        grid.value[target.index].memos = []
        grid.value[target.index].highlight = true
        setTimeout(() => {
          grid.value[target.index].highlight = false
        }, 1000)
        message.value = 'エスパーに失敗しました...'
        messageType.value = 'error'
      }
    }
  }

  const executeHint = (): void => {
    if (selectedCell.value === -1) {
      message.value = 'セルを選択してください'
      messageType.value = 'error'
      return
    }

    if (!currentPuzzle.value) {
      message.value = 'ヒントはパズル実行中のみ使用可能です'
      messageType.value = 'error'
      return
    }

    const cell = grid.value[selectedCell.value]
    if (cell.fixed || cell.value) {
      message.value = '既に入力されているセルです'
      messageType.value = 'error'
      return
    }

    const row = Math.floor(selectedCell.value / 9)
    const col = selectedCell.value % 9
    const correctAnswer = currentPuzzle.value.solution[row][col]

    if (!cell.memos.includes(correctAnswer)) {
      cell.memos.push(correctAnswer)
      cell.memos.sort()
    }

    message.value = `ヒント: ${correctAnswer}をメモしました`
    messageType.value = 'success'
  }

  const executeClear = (): void => {
    if (selectedCell.value === -1) {
      message.value = 'セルを選択してください'
      messageType.value = 'error'
      return
    }

    const cell = grid.value[selectedCell.value]
    if (cell.fixed) {
      message.value = '固定されたセルはクリアできません'
      messageType.value = 'error'
      return
    }

    cell.value = null
    cell.memos = []
    cell.error = false
    message.value = 'セルをクリアしました'
    messageType.value = 'success'
  }

  const executeNakedPair = (): void => {
    let updated = false

    // Check rows
    for (let row = 0; row < 9; row++) {
      const cells: { index: number; memos: number[] }[] = []
      for (let col = 0; col < 9; col++) {
        const index = row * 9 + col
        const cell = grid.value[index]
        if (!cell.fixed && !cell.value && cell.memos.length === 2) {
          cells.push({ index, memos: [...cell.memos] })
        }
      }

      // Find pairs
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          if (
            cells[i].memos[0] === cells[j].memos[0] &&
            cells[i].memos[1] === cells[j].memos[1]
          ) {
            // Found a naked pair, remove these candidates from other cells in the row
            const pairNums = cells[i].memos
            for (let col = 0; col < 9; col++) {
              const index = row * 9 + col
              if (index !== cells[i].index && index !== cells[j].index) {
                const cell = grid.value[index]
                if (!cell.fixed && !cell.value) {
                  const before = cell.memos.length
                  cell.memos = cell.memos.filter((m) => !pairNums.includes(m))
                  if (cell.memos.length < before) updated = true
                }
              }
            }
          }
        }
      }
    }

    if (updated) {
      message.value = 'ネイキッドペアで候補を削除しました'
      messageType.value = 'success'
    } else {
      message.value = 'ネイキッドペアが見つかりませんでした'
      messageType.value = 'error'
    }
  }

  const useSkill = (skillId: string): void => {
    console.log('useSkill called with:', skillId)
    const skill = getSkillById(skillId)
    if (!skill) {
      console.log('Skill not found')
      return
    }
    if (skill.cost > cost.value) {
      console.log('Not enough cost:', skill.cost, '>', cost.value)
      message.value = 'コストが足りません'
      messageType.value = 'error'
      return
    }

    // スキルごとに必要な条件をチェック
    if (skillId === 'memoN' && selectedNumber.value === null) {
      console.log('memoN requires number selection')
      message.value = '数字を選択してください'
      messageType.value = 'error'
      return
    }

    console.log('Executing skill:', skillId)
    
    // Execute skill based on ID
    switch (skillId) {
      case 'fill8':
        executeFill8()
        cost.value -= skill.cost
        break
      case 'fill8All':
        executeFill8All()
        cost.value -= skill.cost
        break
      case 'possible1':
        executePossible1()
        cost.value -= skill.cost
        break
      case 'possible1All':
        executePossible1All()
        cost.value -= skill.cost
        break
      case 'memoN':
        if (selectedNumber.value !== null) {
          executeMemoN(selectedNumber.value)
          cost.value -= skill.cost
        }
        break
      case 'memoAll':
        executeMemoAll()
        cost.value -= skill.cost
        break
      case 'save':
        executeSave()
        cost.value -= skill.cost
        break
      case 'load':
        executeLoad()
        cost.value -= skill.cost
        break
      case 'esp':
        executeEsp()
        cost.value -= skill.cost
        break
      case 'hint':
        executeHint()
        cost.value -= skill.cost
        break
      case 'clear':
        executeClear()
        cost.value -= skill.cost
        break
      case 'nakedPair':
        executeNakedPair()
        cost.value -= skill.cost
        break
      // Legacy skill IDs for backward compatibility
      case 'auto89':
        executeFill8()
        cost.value -= skill.cost
        break
      case 'autoSingle':
        executePossible1()
        cost.value -= skill.cost
        break
      default:
        message.value = '未実装のスキルです'
        messageType.value = 'error'
        return
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

    const highlightMode = userProfile.highlightMode

    // Highlight mode: none - no highlighting
    if (highlightMode === 'none') {
      return classes.join(' ')
    }

    // Highlight mode: number - highlight same numbers
    if (highlightMode === 'number' || highlightMode === 'invalid') {
      if (selectedNumber.value !== null && grid.value[index].value === selectedNumber.value) {
        classes.push('highlighted')
      }
    }

    // Highlight mode: invalid - highlight invalid placements (current behavior)
    if (highlightMode === 'invalid') {
      if (selectedNumber.value !== null) {
        const board = gridToBoard()
        board[row][col] = 0
        if (!isValid(board, row, col, selectedNumber.value)) {
          classes.push('invalid-placement')
        }
      }
    }

    return classes.join(' ')
  }

  const startGameWithDifficulty = async (difficulty: Difficulty): Promise<void> => {
    try {
      await puzzleService.loadPuzzles()
      const puzzle = puzzleService.getRandomPuzzle(difficulty)
      
      if (!puzzle) {
        throw new Error(`No puzzles found for difficulty: ${difficulty}`)
      }
      
      currentDifficulty.value = difficulty
      currentPuzzle.value = puzzle
      grid.value = boardToGrid(puzzle.puzzle)
      selectedCell.value = -1
      selectedNumber.value = null
      message.value = ''
      messageType.value = ''
      // Use max energy from user profile
      maxCost.value = userProfile.maxEnergy
      cost.value = maxCost.value
      history.value = []
      historyIndex.value = -1
      gameState.value = 'playing'
      startTime.value = Date.now()
      savedGrid.value = null
      hasSavedState.value = false
      saveHistory()
    } catch (error) {
      console.error('Failed to start game:', error)
      message.value = 'パズルの読み込みに失敗しました'
      messageType.value = 'error'
    }
  }

  const showDifficultySelect = (): void => {
    gameState.value = 'difficulty-select'
    grid.value = []
    currentDifficulty.value = null
    currentPuzzle.value = null
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
    maxCost.value = userProfile.maxEnergy
    cost.value = maxCost.value
    history.value = []
    historyIndex.value = -1
    startTime.value = Date.now()
    savedGrid.value = null
    hasSavedState.value = false
    saveHistory()
  }

  const calculateExperience = (difficulty: Difficulty, timeMs: number): number => {
    // Base experience by difficulty
    const baseExp: Record<Difficulty, number> = {
      easy: 50,
      medium: 100,
      hard: 200,
      expert: 400
    }

    let exp = baseExp[difficulty]

    // Time bonuses (in seconds)
    const timeSec = Math.floor(timeMs / 1000)
    if (timeSec <= 60) {
      exp = Math.floor(exp * 1.5) // 50% bonus for under 1 minute
    } else if (timeSec <= 180) {
      exp = Math.floor(exp * 1.2) // 20% bonus for under 3 minutes
    }

    return exp
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
      // Calculate experience and time
      const timeMs = Date.now() - startTime.value
      const exp = calculateExperience(currentDifficulty.value || 'medium', timeMs)
      const result = userProfile.addExperience(exp)
      
      gameState.value = 'completed'
      message.value = `正解！ +${exp}経験値`
      if (result.leveledUp) {
        message.value += ` レベルアップ！ Lv.${result.newLevel}`
      }
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
    allSkills,
    selectedSkills,
    currentDifficulty,
    currentPuzzle,
    gameState,
    startTime,
    hasSavedState,
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
    startGameWithDifficulty,
    showDifficultySelect,
    resetGame,
    checkSolution
  }
})
