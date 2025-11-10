<template>
  <div class="mode-tabs">
    <button
      @click="store.setMode('write')"
      :class="['mode-tab', 'write', { active: store.currentMode === 'write' }]"
    >
      ✏️ 書込
    </button>
    <button
      @click="store.setMode('memo')"
      :class="['mode-tab', 'memo', { active: store.currentMode === 'memo' }]"
    >
      ✍️ メモ
    </button>
    <button
      @click="store.setMode('view')"
      :class="['mode-tab', 'view', { active: store.currentMode === 'view' }]"
    >
      👁 ビュー
    </button>
    <button
      @click="store.setMode('skill')"
      :class="['mode-tab', 'skill', { active: store.currentMode === 'skill' }]"
    >
      💡 スキル
    </button>
  </div>
</template>

<script setup lang="ts">
import { useSudokuStore } from '@/stores/sudoku'

const store = useSudokuStore()
</script>

<style scoped>
.mode-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  width: 100%;
  max-width: 380px;
  margin-bottom: 12px;
}

.mode-tab {
  padding: 10px 8px;
  font-size: 14px;
  font-weight: bold;
  border: 2px solid transparent;
  border-radius: 8px;
  background-color: #f0f0f0;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.mode-tab.active {
  border-width: 3px;
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.mode-tab.write.active {
  background-color: #3498db;
  border-color: #2980b9;
  color: white;
}

.mode-tab.memo.active {
  background-color: #2ecc71;
  border-color: #27ae60;
  color: white;
}

.mode-tab.view.active {
  background-color: #95a5a6;
  border-color: #7f8c8d;
  color: white;
}

.mode-tab.skill.active {
  background-color: #e67e22;
  border-color: #d35400;
  color: white;
}

@media (min-width: 768px) {
  .mode-tabs {
    max-width: 420px;
  }
}
</style>
