# Sudoku Puzzle Generator

This directory contains a Python-based sudoku puzzle generator that creates high-quality puzzles with guaranteed valid solutions.

## Overview

The puzzle generator creates sudoku puzzles at four difficulty levels:
- **Easy** (簡単): 38-40 hints (41-45 removed cells)
- **Medium** (普通): 30-35 hints (46-51 removed cells)
- **Hard** (難しい): 25-29 hints (52-56 removed cells)
- **Expert** (超難関): 22-24 hints (57-60 removed cells)

## Usage

### Using Docker (Recommended)

Generate puzzles using Docker Compose:

```bash
docker compose --profile generator up puzzle-generator
```

This will generate puzzles and save them to `app/public/puzzles/puzzles.json`.

### Local Development

1. Install Python dependencies:
```bash
cd puzzle_generator
pip install -r requirements.txt
```

2. Generate puzzles:
```bash
python generate_fast.py
```

Or specify a custom output directory:
```bash
python -c "from generate_fast import generate_puzzle_database; generate_puzzle_database('../app/public/puzzles')"
```

## Output Format

The generated `puzzles.json` file contains an array of puzzle objects:

```json
{
  "id": "easy_001",
  "difficulty": "easy",
  "hints": 40,
  "score": 41,
  "puzzle": [[...], [...], ...],
  "solution": [[...], [...], ...]
}
```

- **id**: Unique puzzle identifier
- **difficulty**: Difficulty level (easy, medium, hard, expert)
- **hints**: Number of pre-filled cells
- **score**: Difficulty score (81 - hints)
- **puzzle**: 9x9 grid with 0 for empty cells
- **solution**: Complete solved grid

## Files

- `Dockerfile`: Docker configuration for the generator
- `requirements.txt`: Python dependencies
- `generate_puzzles.py`: Full puzzle generator with unique solution checking (slower)
- `generate_fast.py`: Fast puzzle generator (currently used)

## Customization

To adjust the number of puzzles generated, edit `generate_fast.py`:

```python
puzzle_counts = {
    'easy': 15,     # Change these numbers
    'medium': 15,
    'hard': 15,
    'expert': 15
}
```

## Algorithm

The fast generator uses the following approach:

1. **Generate Complete Board**: Fill diagonal 3x3 blocks randomly, then solve the rest using backtracking
2. **Remove Numbers**: Randomly remove a specific number of cells based on difficulty
3. **Export**: Save puzzles with metadata to JSON

Note: The fast generator prioritizes speed over uniqueness checking. For production use with guaranteed unique solutions, consider using `generate_puzzles.py` instead (much slower).
