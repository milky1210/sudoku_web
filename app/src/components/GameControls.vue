<template>
  <div class="controls">
    <button @click="handleNewGame" class="btn">新規</button>
    <button @click="store.resetGame" class="btn">リセット</button>
    <button @click="store.checkSolution" class="btn">チェック</button>
    <button @click="store.showDifficultySelect" class="btn btn-difficulty">難易度変更</button>
  </div>
</template>

<script setup lang="ts">
import { useSudokuStore } from '@/stores/sudoku'

const store = useSudokuStore()

const handleNewGame = async (): Promise<void> => {
  if (store.currentDifficulty) {
    await store.startGameWithDifficulty(store.currentDifficulty)
  } else {
    store.showDifficultySelect()
  }
}
</script>

<style scoped>
.controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  width: 100%;
  max-width: 380px;
  flex-wrap: wrap;
}

.btn {
  flex: 1;
  min-width: calc(50% - 4px);
  padding: 12px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  background-color: #95a5a6;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: bold;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.btn:active {
  background-color: #7f8c8d;
}

.btn-difficulty {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.btn-difficulty:active {
  background: linear-gradient(135deg, #5568d3 0%, #63408d 100%);
}

@media (min-width: 768px) {
  .controls {
    max-width: 420px;
  }
}
</style>
