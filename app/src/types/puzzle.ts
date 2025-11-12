/**
 * パズルデータの型定義
 */

export interface PuzzleData {
  id: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  hints: number
  score: number
  puzzle: number[][]
  solution: number[][]
}
