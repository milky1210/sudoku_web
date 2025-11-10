<template>
  <div v-if="store.currentMode === 'skill'" class="skill-panel">
    <h3>スキル一覧</h3>
    <button
      v-for="skill in store.skills"
      :key="skill.id"
      @click="store.useSkill(skill.id)"
      :disabled="skill.cost > store.cost || store.selectedNumber === null"
      class="skill-btn"
    >
      <span class="skill-name">{{ skill.name }}</span>
      <span class="skill-cost">{{ skill.cost > 0 ? `-${skill.cost}` : '無料' }}</span>
      <div class="skill-desc">{{ skill.description }}</div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useSudokuStore } from '@/stores/sudoku'

const store = useSudokuStore()
</script>

<style scoped>
.skill-panel {
  width: 100%;
  max-width: 380px;
  margin-bottom: 12px;
  padding: 12px;
  background-color: #fff3e0;
  border-radius: 12px;
  border: 2px solid #e67e22;
}

.skill-panel h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #d35400;
}

.skill-btn {
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  border: 2px solid #e67e22;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.skill-btn:hover:not(:disabled) {
  background-color: #fff9f0;
}

.skill-btn:active:not(:disabled) {
  background-color: #e67e22;
  color: white;
}

.skill-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

/* Allow clicks to pass through disabled skill buttons so they don't block
   underlying elements when panels overlap. */
.skill-panel .skill-btn:disabled {
  pointer-events: none;
}

.skill-name {
  font-weight: bold;
  font-size: 15px;
  display: inline-block;
  margin-right: 8px;
}

.skill-cost {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: #e67e22;
  color: white;
  font-size: 12px;
  font-weight: bold;
  font-variant-numeric: tabular-nums;
}

.skill-desc {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

@media (min-width: 768px) {
  .skill-panel {
    max-width: 420px;
  }
}
</style>
