<template>
  <div class="controls">
    <button @click="store.newGame" class="btn">新規</button>
    <button @click="store.resetGame" class="btn">リセット</button>
    <button @click="store.checkSolution" class="btn">チェック</button>
  </div>
</template>

<script setup lang="ts">
import { useSudokuStore } from '@/stores/sudoku'

const store = useSudokuStore()
</script>

<style scoped>
.controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  width: 100%;
  max-width: 380px;
}

.btn {
  flex: 1;
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

@media (min-width: 768px) {
  .controls {
    max-width: 420px;
  }
}
</style>
