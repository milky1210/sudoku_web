"""Verify generated puzzles for uniqueness.

Loads a puzzles.json file (default ../app/public/puzzles/puzzles.json),
then for each puzzle counts solutions (early exit at 2). Produces a
report JSON with puzzles that have solution count != 1.
"""
import json
import os
import argparse
from generate_fast import FastSudokuGenerator


def verify_puzzles(input_path: str, output_path: str, limit: int = 2):
    gen = FastSudokuGenerator()

    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    with open(input_path, 'r', encoding='utf-8') as f:
        puzzles = json.load(f)

    total = len(puzzles)
    print(f"Checking {total} puzzles from {input_path}...")

    bad = []
    counts = {0: 0, 1: 0, 2: 0}

    for idx, p in enumerate(puzzles, start=1):
        puzzle_grid = p.get('puzzle')
        sols = gen.count_solutions(puzzle_grid, limit=limit)
        if sols not in counts:
            counts[2] += 1
        else:
            counts[sols] += 1

        if sols != 1:
            bad.append({
                'id': p.get('id'),
                'difficulty': p.get('difficulty'),
                'hints': p.get('hints'),
                'solutions_found': sols
            })

        if idx % 100 == 0:
            print(f"  Checked {idx}/{total} (bad so far: {len(bad)})")

    report = {
        'total_checked': total,
        'counts': counts,
        'bad_count': len(bad),
        'bad_puzzles': bad
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print("\nDone.")
    print(json.dumps({'total': total, 'unique': counts.get(1,0), 'bad': len(bad)}, ensure_ascii=False))
    print(f"Report written to: {output_path}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Verify puzzles.json for uniqueness')
    parser.add_argument('input', nargs='?', default='../app/public/puzzles/puzzles.json', help='Path to puzzles.json')
    parser.add_argument('--out', '-o', default='../app/public/puzzles/verify_report.json', help='Path to write report')
    args = parser.parse_args()
    verify_puzzles(args.input, args.out)
