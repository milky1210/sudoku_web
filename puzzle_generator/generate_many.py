import json
import os
import random
from generate_fast import FastSudokuGenerator
import sys

"""
Generate many puzzles and save to the given output directory as puzzles.json.
Usage: python generate_many.py <output_dir> [total_count]
If total_count is omitted, defaults to 4000.
This script distributes puzzles evenly across difficulties: easy, medium, hard, expert.
"""

def generate_many(output_dir: str, total_count: int = 4000):
    generator = FastSudokuGenerator()
    difficulties = ['easy', 'medium', 'hard', 'expert']
    per = total_count // len(difficulties)
    remainder = total_count % len(difficulties)

    puzzle_counts = {d: per for d in difficulties}
    # distribute remainder
    for i in range(remainder):
        puzzle_counts[difficulties[i]] += 1

    all_puzzles = []
    print(f"Generating total {total_count} puzzles -> distribution: {puzzle_counts}")

    for difficulty, count in puzzle_counts.items():
        print(f"Generating {count} puzzles for difficulty {difficulty}...")
        for i in range(count):
            puzzle, solution = generator.generate_puzzle(difficulty)
            hints = sum(1 for row in puzzle for cell in row if cell != 0)
            score = 81 - hints
            puzzle_data = {
                'id': f"{difficulty}_{i+1:04d}",
                'difficulty': difficulty,
                'hints': hints,
                'score': score,
                'puzzle': puzzle,
                'solution': solution
            }
            all_puzzles.append(puzzle_data)
            if (i+1) % 100 == 0:
                print(f"  {i+1}/{count} done for {difficulty}")

    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'puzzles.json')
    print(f"Writing {len(all_puzzles)} puzzles to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_puzzles, f, ensure_ascii=False, indent=2)
    print("Done")


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '../app/public/puzzles'
    total = int(sys.argv[2]) if len(sys.argv) > 2 else 4000
    generate_many(out, total)
