<template>
  <div class="sudoku-grid">
    <div
      v-for="(cell, index) in store.grid"
      :key="index"
      :class="store.getCellClass(index)"
      class="cell"
      @click="store.selectCell(index)"
    >
      <div v-if="cell.fixed" class="fixed-value">{{ cell.value }}</div>
      <div v-else class="editable-cell">
        <div v-if="cell.value && !cell.memos.length" :class="['main-value', { error: cell.error }]">
          {{ cell.value }}
        </div>
        <div v-if="cell.memos.length" class="memo-grid">
          <span
            v-for="num in 9"
            :key="num"
            :class="['memo-num', { active: cell.memos.includes(num) }]"
          >
            {{ cell.memos.includes(num) ? num : '' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSudokuStore } from '@/stores/sudoku'

const store = useSudokuStore()
</script>

<style scoped>
.sudoku-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-template-rows: repeat(9, 1fr);
  gap: 0;
  border: 3px solid #2c3e50;
  background-color: #2c3e50;
  margin-bottom: 16px;
  width: 100%;
  max-width: 380px;
  aspect-ratio: 1;
  touch-action: manipulation;
}

.cell {
  background-color: white;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  min-height: 0;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.cell.right-border {
  border-right: 3px solid #2c3e50;
}

.cell.bottom-border {
  border-bottom: 3px solid #2c3e50;
}

.cell.selected {
  background-color: #e3f2fd;
  box-shadow: inset 0 0 0 2px #2196f3;
}

.cell.highlighted {
  background-color: #fff3cd;
}

.fixed-value {
  font-size: clamp(16px, 4vw, 20px);
  font-weight: bold;
  color: #2c3e50;
  font-variant-numeric: tabular-nums;
}

.editable-cell {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.main-value {
  font-size: clamp(16px, 4vw, 20px);
  font-weight: bold;
  color: #3498db;
  font-variant-numeric: tabular-nums;
}

.main-value.error {
  color: #e74c3c;
}

.memo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  padding: 2px;
  box-sizing: border-box;
}

.memo-num {
  font-size: clamp(8px, 1.8vw, 10px);
  color: #7f8c8d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

@media (min-width: 768px) {
  .sudoku-grid {
    max-width: 420px;
  }
}
</style>
