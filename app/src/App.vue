<script setup lang="ts">
import SudokuGrid from './components/SudokuGrid.vue'
</script>

<template>
  <div id="app">
    <SudokuGrid />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}
</style>
