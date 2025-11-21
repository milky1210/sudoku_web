<template>
  <div class="mode-and-skills">
    <!-- モード切り替えボタン -->
    <button @click="toggleMode" :class="['mode-button', store.currentMode]">
      <span class="mode-icon">{{ modeIcon }}</span>
      <span class="mode-text">{{ modeText }}</span>
    </button>

    <!-- スキルボタン -->
    <button
      v-for="skill in store.selectedSkills"
      :key="skill.id"
      @click="handleSkillClick(skill.id)"
      @touchstart.prevent="handleTouchStart(skill)"
      @touchend.prevent="handleTouchEnd(skill.id)"
      @touchcancel="cancelLongPress"
      @mousedown="startLongPress(skill)"
      @mouseup="cancelLongPress"
      @mouseleave="cancelLongPress"
      :disabled="isSkillDisabled(skill)"
      :class="['skill-btn', `skill-${skill.id}`]"
    >
      <span class="skill-icon">{{ skill.icon }}</span>
      <span class="skill-cost">{{ skill.cost }}</span>
    </button>

    <!-- 長押しツールチップ -->
    <div v-if="showTooltip" class="tooltip">
      <div class="tooltip-name">{{ tooltipSkill?.name }}</div>
      <div class="tooltip-desc">{{ tooltipSkill?.description }}</div>
      <div class="tooltip-cost">コスト: {{ tooltipSkill?.cost }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSudokuStore, type Skill } from '@/stores/sudoku'

const store = useSudokuStore()

const showTooltip = ref(false)
const tooltipSkill = ref<Skill | null>(null)
let longPressTimer: number | null = null

const toggleMode = () => {
  if (store.currentMode === 'write') {
    store.setMode('memo')
  } else {
    store.setMode('write')
  }
}

const modeIcon = computed(() => {
  return store.currentMode === 'write' ? '✏️' : '✍️'
})

const modeText = computed(() => {
  return store.currentMode === 'write' ? '書込' : 'メモ'
})

const isSkillDisabled = (skill: Skill): boolean => {
  if (skill.cost > store.cost) return true
  switch (skill.id) {
    case 'fill8':
    case 'auto89':
      // 残り1マスの箇所があるか直接チェック
      if (!store.grid || store.grid.length === 0) return true
      return !hasOneCellGap()
    case 'memoN':
      return store.selectedNumber === null
    case 'hint':
    case 'clear':
      return store.selectedCell === -1
    case 'load':
      return !store.hasSavedState
    default:
      return false
  }
}

const hasOneCellGap = (): boolean => {
  if (!store.grid || store.grid.length === 0) return false

  // 各行をチェック
  for (let i = 0; i < 9; i++) {
    let emptyCount = 0
    for (let j = 0; j < 9; j++) {
      if (store.grid[i * 9 + j].value === null) emptyCount++
    }
    if (emptyCount === 1) return true
  }

  // 各列をチェック
  for (let i = 0; i < 9; i++) {
    let emptyCount = 0
    for (let j = 0; j < 9; j++) {
      if (store.grid[j * 9 + i].value === null) emptyCount++
    }
    if (emptyCount === 1) return true
  }

  // 各ブロックをチェック
  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      let emptyCount = 0
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const row = blockRow * 3 + i
          const col = blockCol * 3 + j
          if (store.grid[row * 9 + col].value === null) emptyCount++
        }
      }
      if (emptyCount === 1) return true
    }
  }

  return false
}

const handleSkillClick = (skillId: string) => {
  console.log('Skill clicked:', skillId)
  if (!showTooltip.value) {
    console.log('Calling store.useSkill')
    store.useSkill(skillId)
  } else {
    console.log('Tooltip is showing, not calling skill')
  }
}

const handleTouchStart = (skill: Skill) => {
  console.log('Touch start:', skill.id)
  startLongPress(skill)
}

const handleTouchEnd = (skillId: string) => {
  console.log('Touch end:', skillId, 'showTooltip:', showTooltip.value)
  if (longPressTimer !== null) {
    // 長押しタイマーがまだ実行されていない = 短いタップ
    clearTimeout(longPressTimer)
    longPressTimer = null
    console.log('Short tap detected, executing skill')
    store.useSkill(skillId)
  } else if (showTooltip.value) {
    // 長押しでツールチップが表示されている場合は閉じるだけ
    console.log('Closing tooltip')
    showTooltip.value = false
    tooltipSkill.value = null
  }
}

const startLongPress = (skill: Skill) => {
  longPressTimer = window.setTimeout(() => {
    tooltipSkill.value = skill
    showTooltip.value = true
    longPressTimer = null
    console.log('Long press detected, showing tooltip')
  }, 500) as unknown as number
}

const cancelLongPress = () => {
  if (longPressTimer !== null) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  showTooltip.value = false
  tooltipSkill.value = null
}
</script>

<style scoped>
.mode-and-skills {
  display: flex;
  gap: 8px;
  width: 100%;
  max-width: 380px;
  margin-bottom: 12px;
  position: relative;
}

.mode-button {
  flex: 1;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: bold;
  border: 3px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.mode-button.write {
  background-color: #3498db;
  border-color: #2980b9;
  color: white;
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
}

.mode-button.memo {
  background-color: #2ecc71;
  border-color: #27ae60;
  color: white;
  box-shadow: 0 2px 4px rgba(46, 204, 113, 0.3);
}

.mode-button:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.mode-icon {
  font-size: 18px;
}

.mode-text {
  font-size: 14px;
}

.skill-btn {
  width: 56px;
  height: 56px;
  font-size: 20px;
  font-weight: bold;
  border: 2px solid #e67e22;
  border-radius: 8px;
  background-color: white;
  color: #e67e22;
  cursor: pointer;
  transition: all 0.15s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  position: relative;
  flex-shrink: 0;
}

.skill-btn:active {
  transform: scale(0.95);
  background-color: #e67e22;
  color: white;
}

.skill-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.skill-icon {
  font-size: 24px;
  line-height: 1;
}

.skill-cost {
  font-size: 10px;
  font-weight: bold;
  background-color: #e67e22;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 2px;
  right: 2px;
}

.tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  z-index: 1000;
  min-width: 200px;
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.9);
}

.tooltip-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}

.tooltip-desc {
  font-size: 12px;
  margin-bottom: 6px;
  line-height: 1.4;
}

.tooltip-cost {
  font-size: 11px;
  color: #ffa726;
  font-weight: bold;
}

@media (min-width: 768px) {
  .mode-and-skills {
    max-width: 420px;
  }
}
</style>
