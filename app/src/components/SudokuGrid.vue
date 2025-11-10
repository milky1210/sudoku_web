<template>
  <div class="sudoku-container">
    <!-- ヘッダー -->
    <div class="header">
      <h1>数独</h1>
      <div class="cost-display">
        コスト:
        <span v-for="i in store.maxCost" :key="i" class="cost-dot" :class="{ filled: i <= store.cost }">
          ●
        </span>
      </div>
    </div>

    <!-- 盤面 -->
    <SudokuBoard />

    <!-- モード切り替えタブ -->
    <ModeSelector />

    <!-- 数字パッド -->
    <NumberPad />

    <!-- スキル一覧 -->
    <SkillPanel />

    <!-- コントロールボタン -->
    <GameControls />

    <!-- メッセージ -->
    <div v-if="store.message" :class="['message', store.messageType]">{{ store.message }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSudokuStore } from '@/stores/sudoku'
import SudokuBoard from './SudokuBoard.vue'
import ModeSelector from './ModeSelector.vue'
import NumberPad from './NumberPad.vue'
import SkillPanel from './SkillPanel.vue'
import GameControls from './GameControls.vue'

const store = useSudokuStore()

onMounted(() => {
  store.newGame()
})
</script>

<style scoped>
.sudoku-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 380px;
  margin-bottom: 12px;
}

h1 {
  margin: 0;
  font-size: 24px;
  color: #2c3e50;
}

.cost-display {
  font-size: 14px;
  font-weight: bold;
  color: #2c3e50;
}

.cost-dot {
  margin: 0 2px;
  color: #ddd;
  transition: color 0.3s;
}

.cost-dot.filled {
  color: #f39c12;
}

.message {
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: bold;
  margin-top: 8px;
  width: 100%;
  max-width: 380px;
  text-align: center;
  box-sizing: border-box;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 2px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 2px solid #f5c6cb;
}

@media (min-width: 768px) {
  .header,
  .message {
    max-width: 420px;
  }
}
</style>
