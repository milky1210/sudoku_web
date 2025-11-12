/**
 * パズル読み込みサービス
 */
import type { PuzzleData } from '@/types/puzzle'

class PuzzleService {
  private puzzles: PuzzleData[] = []
  private loaded = false

  async loadPuzzles(): Promise<void> {
    if (this.loaded) return

    try {
      const response = await fetch('/puzzles/puzzles.json')
      if (!response.ok) {
        throw new Error('Failed to load puzzles')
      }
      this.puzzles = await response.json()
      this.loaded = true
    } catch (error) {
      console.error('Error loading puzzles:', error)
      throw error
    }
  }

  getPuzzlesByDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'expert'): PuzzleData[] {
    return this.puzzles.filter((p) => p.difficulty === difficulty)
  }

  getRandomPuzzle(difficulty: 'easy' | 'medium' | 'hard' | 'expert'): PuzzleData | null {
    const puzzles = this.getPuzzlesByDifficulty(difficulty)
    if (puzzles.length === 0) return null
    return puzzles[Math.floor(Math.random() * puzzles.length)]
  }

  getAllPuzzles(): PuzzleData[] {
    return this.puzzles
  }
}

export const puzzleService = new PuzzleService()
