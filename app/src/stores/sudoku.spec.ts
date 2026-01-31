import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSudokuStore } from './sudoku'

// Mock the puzzleService
vi.mock('@/services/puzzleService', () => ({
  puzzleService: {
    loadPuzzle: vi.fn().mockResolvedValue({
      puzzle: '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
      solution: '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
      difficulty: 'easy',
      id: 'test-puzzle',
    }),
  },
}))

describe('useSudokuStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('isNumberComplete', () => {
    it('should return true when a number has 9 instances in write mode', () => {
      const store = useSudokuStore()
      // Initialize the grid with 81 cells
      store.grid = Array(81)
        .fill(null)
        .map(() => ({
          value: null,
          fixed: false,
          error: false,
          memos: [],
          highlight: false,
        }))

      // In write mode by default
      expect(store.currentMode).toBe('write')

      // Create a grid where number 1 appears 9 times
      for (let i = 0; i < 9; i++) {
        store.grid[i].value = 1
        store.grid[i].fixed = true
      }

      expect(store.isNumberComplete(1)).toBe(true)
    })

    it('should return false in memo mode even when a number has 9 instances', () => {
      const store = useSudokuStore()
      // Initialize the grid with 81 cells
      store.grid = Array(81)
        .fill(null)
        .map(() => ({
          value: null,
          fixed: false,
          error: false,
          memos: [],
          highlight: false,
        }))

      // Create a grid where number 1 appears 9 times
      for (let i = 0; i < 9; i++) {
        store.grid[i].value = 1
        store.grid[i].fixed = true
      }

      // Switch to memo mode
      store.setMode('memo')
      expect(store.currentMode).toBe('memo')

      // In memo mode, isNumberComplete should always return false
      expect(store.isNumberComplete(1)).toBe(false)
    })

    it('should enable all number buttons in memo mode', () => {
      const store = useSudokuStore()
      // Initialize the grid with 81 cells
      store.grid = Array(81)
        .fill(null)
        .map(() => ({
          value: null,
          fixed: false,
          error: false,
          memos: [],
          highlight: false,
        }))

      // Put 9 instances of each number
      for (let num = 1; num <= 9; num++) {
        for (let i = 0; i < 9; i++) {
          store.grid[(num - 1) * 9 + i].value = num
        }
      }

      // Switch to memo mode
      store.setMode('memo')

      // All numbers should be enabled (isNumberComplete returns false)
      for (let num = 1; num <= 9; num++) {
        expect(store.isNumberComplete(num)).toBe(false)
      }
    })

    it('should return false in write mode when a number has less than 9 instances', () => {
      const store = useSudokuStore()
      // Initialize the grid with 81 cells
      store.grid = Array(81)
        .fill(null)
        .map(() => ({
          value: null,
          fixed: false,
          error: false,
          memos: [],
          highlight: false,
        }))

      // In write mode by default
      expect(store.currentMode).toBe('write')

      // Put only 8 instances of number 1
      for (let i = 0; i < 8; i++) {
        store.grid[i].value = 1
      }

      expect(store.isNumberComplete(1)).toBe(false)
    })
  })
})
