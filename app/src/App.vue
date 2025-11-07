<script setup lang="ts">
import SudokuGrid from './components/SudokuGrid.vue'
</script>

<template>
  <div id="app">
    <div class="mobile-container">
      <SudokuGrid />
    </div>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  margin: 0;
}

.mobile-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  box-shadow: none;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* PC表示時：スマホサイズに制限 */
@media (min-width: 768px) {
  .mobile-container {
    max-width: 420px;
    min-height: 844px;
    max-height: 90vh;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
}

/* 超大画面向け */
@media (min-width: 1200px) {
  .mobile-container {
    max-width: 420px;
    min-height: 844px;
    max-height: 844px;
  }
}
</style>
