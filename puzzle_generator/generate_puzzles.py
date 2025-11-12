"""
数独パズル生成器
唯一解を保証する高品質なパズルを生成
"""
import json
import random
from typing import List, Tuple, Optional
import os


class SudokuGenerator:
    """数独パズル生成クラス"""
    
    def __init__(self):
        self.size = 9
        self.box_size = 3
    
    def is_valid(self, board: List[List[int]], row: int, col: int, num: int) -> bool:
        """指定位置に数字を配置できるかチェック"""
        # 行チェック
        if num in board[row]:
            return False
        
        # 列チェック
        if num in [board[i][col] for i in range(self.size)]:
            return False
        
        # 3x3ブロックチェック
        start_row = (row // self.box_size) * self.box_size
        start_col = (col // self.box_size) * self.box_size
        for i in range(start_row, start_row + self.box_size):
            for j in range(start_col, start_col + self.box_size):
                if board[i][j] == num:
                    return False
        
        return True
    
    def solve(self, board: List[List[int]], find_all: bool = False) -> int:
        """
        バックトラッキングでパズルを解く
        find_all=True の場合、解の数を数える（2つ見つけたら打ち切り）
        """
        solutions = []
        
        def backtrack():
            if len(solutions) > 1 and find_all:
                return  # 複数解が見つかったので打ち切り
            
            # 空のセルを探す
            for i in range(self.size):
                for j in range(self.size):
                    if board[i][j] == 0:
                        # 1-9を試す
                        for num in range(1, 10):
                            if self.is_valid(board, i, j, num):
                                board[i][j] = num
                                backtrack()
                                board[i][j] = 0
                        return
            
            # すべて埋まった = 解が見つかった
            if find_all:
                solutions.append([row[:] for row in board])
            else:
                solutions.append(True)
        
        backtrack()
        return len(solutions) if find_all else (1 if solutions else 0)
    
    def generate_complete_board(self) -> List[List[int]]:
        """完成した数独盤面を生成"""
        board = [[0] * self.size for _ in range(self.size)]
        
        # 対角線上の3x3ブロックを埋める（これらは独立している）
        for box in range(3):
            nums = list(range(1, 10))
            random.shuffle(nums)
            for i in range(self.box_size):
                for j in range(self.box_size):
                    board[box * self.box_size + i][box * self.box_size + j] = nums[i * self.box_size + j]
        
        # 残りを解く
        self.solve(board)
        return board
    
    def count_solutions(self, board: List[List[int]]) -> int:
        """解の数を数える（2つ以上見つかったら打ち切り）"""
        board_copy = [row[:] for row in board]
        return self.solve(board_copy, find_all=True)
    
    def generate_puzzle(self, difficulty: str = 'medium') -> Tuple[List[List[int]], List[List[int]]]:
        """
        指定難易度のパズルを生成
        difficulty: 'easy', 'medium', 'hard', 'expert'
        """
        # 難易度ごとのヒント数の範囲
        hints_range = {
            'easy': (36, 40),      # 41-45個削除
            'medium': (30, 35),    # 46-51個削除
            'hard': (25, 29),      # 52-56個削除
            'expert': (22, 24)     # 57-59個削除
        }
        
        min_hints, max_hints = hints_range.get(difficulty, (30, 35))
        target_hints = random.randint(min_hints, max_hints)
        
        max_attempts = 20
        for attempt in range(max_attempts):
            # 完成盤を生成
            solution = self.generate_complete_board()
            puzzle = [row[:] for row in solution]
            
            # セルのインデックスをランダムに並べる
            cells = [(i, j) for i in range(self.size) for j in range(self.size)]
            random.shuffle(cells)
            
            removed = 0
            for row, col in cells:
                if removed >= 81 - target_hints:
                    break
                
                # 一時的に削除
                temp = puzzle[row][col]
                puzzle[row][col] = 0
                
                # 唯一解チェック
                puzzle_copy = [row[:] for row in puzzle]
                if self.count_solutions(puzzle_copy) == 1:
                    removed += 1
                else:
                    # 複数解になる場合は戻す
                    puzzle[row][col] = temp
            
            # 目標ヒント数に近い場合は成功
            current_hints = sum(1 for i in range(self.size) for j in range(self.size) if puzzle[i][j] != 0)
            if abs(current_hints - target_hints) <= 2:
                return puzzle, solution
        
        # 最大試行回数に達した場合でも返す
        return puzzle, solution
    
    def calculate_difficulty_score(self, puzzle: List[List[int]]) -> int:
        """パズルの難易度スコアを計算（簡易版）"""
        hints = sum(1 for i in range(self.size) for j in range(self.size) if puzzle[i][j] != 0)
        # ヒントが少ないほど高スコア
        return 81 - hints


def generate_puzzle_database(output_dir: str = '/output'):
    """パズルデータベースを生成"""
    generator = SudokuGenerator()
    
    # 各難易度のパズル数
    puzzle_counts = {
        'easy': 10,
        'medium': 10,
        'hard': 10,
        'expert': 10
    }
    
    all_puzzles = []
    
    print("パズル生成開始...")
    
    for difficulty, count in puzzle_counts.items():
        print(f"\n{difficulty.upper()} レベルのパズルを{count}個生成中...")
        
        for i in range(count):
            puzzle, solution = generator.generate_puzzle(difficulty)
            score = generator.calculate_difficulty_score(puzzle)
            
            puzzle_data = {
                'id': f"{difficulty}_{i+1:03d}",
                'difficulty': difficulty,
                'score': score,
                'puzzle': puzzle,
                'solution': solution
            }
            
            all_puzzles.append(puzzle_data)
            
            if (i + 1) % 10 == 0:
                print(f"  {i+1}/{count} 完了")
    
    # 出力ディレクトリを作成
    os.makedirs(output_dir, exist_ok=True)
    
    # 全パズルを保存
    output_path = os.path.join(output_dir, 'puzzles.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_puzzles, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 合計 {len(all_puzzles)} 個のパズルを生成しました")
    print(f"📁 保存先: {output_path}")
    
    # 統計情報を表示
    print("\n=== 統計情報 ===")
    for difficulty in ['easy', 'medium', 'hard', 'expert']:
        count = sum(1 for p in all_puzzles if p['difficulty'] == difficulty)
        if count > 0:
            avg_score = sum(p['score'] for p in all_puzzles if p['difficulty'] == difficulty) / count
            print(f"{difficulty.upper()}: {count}個, 平均スコア: {avg_score:.1f}")


if __name__ == '__main__':
    generate_puzzle_database()
