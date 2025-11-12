"""
高速な数独パズル生成器
事前生成されたテンプレートと変換を使用
"""
import json
import random
import os
from copy import deepcopy


class FastSudokuGenerator:
    """高速数独パズル生成クラス"""
    
    def __init__(self):
        self.size = 9
        self.box_size = 3
    
    def is_valid(self, board: list[list[int]], row: int, col: int, num: int) -> bool:
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
    
    def solve(self, board: list[list[int]]) -> bool:
        """バックトラッキングでパズルを解く"""
        for i in range(self.size):
            for j in range(self.size):
                if board[i][j] == 0:
                    for num in range(1, 10):
                        if self.is_valid(board, i, j, num):
                            board[i][j] = num
                            if self.solve(board):
                                return True
                            board[i][j] = 0
                    return False
        return True
    
    def generate_complete_board(self) -> list[list[int]]:
        """完成した数独盤面を生成"""
        board = [[0] * self.size for _ in range(self.size)]
        
        # 対角線上の3x3ブロックを埋める
        for box in range(3):
            nums = list(range(1, 10))
            random.shuffle(nums)
            for i in range(self.box_size):
                for j in range(self.box_size):
                    board[box * self.box_size + i][box * self.box_size + j] = nums[i * self.box_size + j]
        
        # 残りを解く
        self.solve(board)
        return board
    
    def remove_numbers(self, board: list[list[int]], count: int) -> list[list[int]]:
        """指定された数のセルを削除"""
        # 深いコピーを作る（元の解を壊さない）
        puzzle = [row[:] for row in board]
        cells = [(i, j) for i in range(self.size) for j in range(self.size)]
        random.shuffle(cells)

        removed = 0

        for (row, col) in cells:
            if removed >= count:
                break

            # 一時的に消して一意解かを確認する
            backup = puzzle[row][col]
            puzzle[row][col] = 0

            sols = self.count_solutions(puzzle, limit=2)
            if sols == 1:
                removed += 1
            else:
                # 多解が発生するなら戻す
                puzzle[row][col] = backup

        if removed < count:
            print(f"警告: 要求された{count}個の削除に対して、実際に削除できたのは{removed}個でした。")

        return puzzle

    def count_solutions(self, board: list[list[int]], limit: int = 2) -> int:
        """与えられた盤面の解の数を数える（上限を指定して早期終了）"""
        # Use a copy to avoid mutating the original
        work = [row[:] for row in board]
        count = 0

        def find_least_candidates():
            """Find empty cell with the fewest candidates (MRV heuristic).
            Returns (i, j, candidates) or (None, None, None) if no empty cells.
            """
            best_i = best_j = None
            best_cands = None

            for i in range(self.size):
                for j in range(self.size):
                    if work[i][j] == 0:
                        cands = []
                        for num in range(1, 10):
                            if self.is_valid(work, i, j, num):
                                cands.append(num)
                        if not cands:
                            return i, j, []  # dead end
                        if best_cands is None or len(cands) < len(best_cands):
                            best_i, best_j, best_cands = i, j, cands
                            if len(best_cands) == 1:
                                return best_i, best_j, best_cands

            return best_i, best_j, best_cands

        def backtrack():
            nonlocal count
            if count >= limit:
                return

            i, j, cands = find_least_candidates()
            if i is None:
                # no empty cells -> found a solution
                count += 1
                return

            if not cands:
                # dead end
                return

            for num in cands:
                work[i][j] = num
                backtrack()
                work[i][j] = 0
                if count >= limit:
                    return

        backtrack()
        return count
    
    def generate_puzzle(self, difficulty: str = 'medium') -> tuple[list[list[int]], list[list[int]]]:
        """
        指定難易度のパズルを生成
        """
        # 難易度ごとの削除数
        remove_count = {
            'easy': random.randint(41, 45),
            'medium': random.randint(46, 51),
            'hard': random.randint(52, 56),
            'expert': random.randint(57, 60)
        }
        
        solution = self.generate_complete_board()
        puzzle = self.remove_numbers(solution, remove_count.get(difficulty, 48))
        
        return puzzle, solution


def generate_puzzle_database(output_dir: str = '/output'):
    """パズルデータベースを生成"""
    generator = FastSudokuGenerator()
    
    # 各難易度のパズル数
    puzzle_counts = {
        'easy': 15,
        'medium': 15,
        'hard': 15,
        'expert': 15
    }
    
    all_puzzles = []
    
    print("パズル生成開始...")
    
    for difficulty, count in puzzle_counts.items():
        print(f"\n{difficulty.upper()} レベルのパズルを{count}個生成中...")
        
        for i in range(count):
            puzzle, solution = generator.generate_puzzle(difficulty)
            
            # ヒント数を計算
            hints = sum(1 for row in puzzle for cell in row if cell != 0)
            score = 81 - hints
            
            puzzle_data = {
                'id': f"{difficulty}_{i+1:03d}",
                'difficulty': difficulty,
                'hints': hints,
                'score': score,
                'puzzle': puzzle,
                'solution': solution
            }
            
            all_puzzles.append(puzzle_data)
            
            if (i + 1) % 5 == 0:
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
        puzzles = [p for p in all_puzzles if p['difficulty'] == difficulty]
        if puzzles:
            avg_hints = sum(p['hints'] for p in puzzles) / len(puzzles)
            print(f"{difficulty.upper()}: {len(puzzles)}個, 平均ヒント数: {avg_hints:.1f}")


if __name__ == '__main__':
    generate_puzzle_database()
