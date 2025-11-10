<template>
  <div v-if="store.currentMode !== 'view'" class="number-panel">
    <button
      v-for="num in 9"
      :key="num"
      @click="store.handleNumberClick(num)"
      :class="['number-btn', { selected: store.selectedNumber === num }]"
    >
      {{ num }}
    </button>
    <button @click="store.clearCell" class="number-btn clear-btn">消去</button>
    <button @click="store.undo" :disabled="!store.canUndo" class="number-btn action-btn">
      Undo
    </button>
    <button @click="store.redo" :disabled="!store.canRedo" class="number-btn action-btn">
      Redo
    </button>
  </div>
</template>

<script setup lang="ts">
import { useSudokuStore } from '@/stores/sudoku'

const store = useSudokuStore()
</script>

<style scoped>
.number-panel {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 12px;
  width: 100%;
  max-width: 380px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 12px;
}

.number-btn {
  aspect-ratio: 1;
  font-size: 20px;
  font-weight: bold;
  border: 2px solid #3498db;
  border-radius: 8px;
  background-color: white;
  color: #3498db;
  cursor: pointer;
  transition: all 0.15s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  font-variant-numeric: tabular-nums;
}

.number-btn.selected {
  background-color: #3498db;
  color: white;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.3);
}

.number-btn:active {
  transform: scale(0.95);
}

.number-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Prevent disabled buttons inside overlays from intercepting pointer events
   so underlying controls (e.g. footer buttons) can still receive clicks. */
.number-panel .number-btn:disabled,
.number-panel .action-btn:disabled {
  pointer-events: none;
}

.clear-btn {
  grid-column: span 2;
  font-size: 16px;
  border-color: #e74c3c;
  color: #e74c3c;
}

.clear-btn:active {
  background-color: #e74c3c;
  color: white;
}

.action-btn {
  font-size: 14px;
  border-color: #95a5a6;
  color: #95a5a6;
}

.action-btn:active:not(:disabled) {
  background-color: #95a5a6;
  color: white;
}

@media (min-width: 768px) {
  .number-panel {
    max-width: 420px;
  }
}
</style>
