<template>
  <div class="sudoku-container">
    <!-- 難易度選択画面 -->
    <DifficultySelector
      v-if="store.gameState === 'difficulty-select'"
      @select="handleDifficultySelect"
    />

    <!-- ゲーム完了画面 -->
    <CompletionScreen
      v-else-if="store.gameState === 'completed'"
      :timeMs="completionTime"
      :experience="earnedExp"
      :oldLevel="oldLevel"
      :newLevel="newLevel"
      :leveledUp="leveledUp"
      @continue="handleContinue"
      @back="store.showDifficultySelect()"
    />

    <!-- ゲーム画面 -->
    <template v-else>
      <!-- ヘッダー -->
      <div class="header">
        <h1>数独</h1>
        <div class="header-right">
          <button @click="showSettingsModal = true" class="icon-btn" title="設定">⚙️</button>
          <button @click="showSkillModal = true" class="icon-btn" title="スキル選択">📋</button>
          <div class="cost-display">
            コスト:
            <span
              v-for="i in store.maxCost"
              :key="i"
              class="cost-dot"
              :class="{ filled: i <= store.cost }"
            >
              ●
            </span>
          </div>
        </div>
      </div>

      <!-- User level info -->
      <div class="user-level-bar">
        <span class="level-badge">Lv.{{ userProfile.level }}</span>
        <div class="exp-bar-container">
          <div class="exp-bar" :style="{ width: userProfile.experienceProgress + '%' }"></div>
        </div>
        <span class="exp-text"
          >{{ userProfile.experience }} / {{ userProfile.nextLevelExperience }}</span
        >
      </div>

      <!-- 難易度表示 -->
      <div v-if="store.currentDifficulty" class="difficulty-badge">
        {{ difficultyNames[store.currentDifficulty] }}
      </div>

      <!-- 盤面 -->
      <SudokuBoard />

      <!-- モード切り替えボタン -->
      <ModeSelector />

      <!-- 数字パッド（スキルボタン含む） -->
      <NumberPad />

      <!-- コントロールボタン -->
      <GameControls />

      <!-- メッセージ -->
      <div v-if="store.message" :class="['message', store.messageType]">{{ store.message }}</div>
    </template>

    <!-- Skill selection modal -->
    <SkillSelectionModal
      v-if="showSkillModal"
      @close="showSkillModal = false"
      @save="handleSkillSave"
    />

    <!-- Settings modal -->
    <SettingsModal v-if="showSettingsModal" @close="showSettingsModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSudokuStore } from '@/stores/sudoku'
import { useUserProfileStore } from '@/stores/userProfile'
import type { Difficulty } from '@/stores/sudoku'
import DifficultySelector from './DifficultySelector.vue'
import SudokuBoard from './SudokuBoard.vue'
import ModeSelector from './ModeSelector.vue'
import NumberPad from './NumberPad.vue'
import GameControls from './GameControls.vue'
import CompletionScreen from './CompletionScreen.vue'
import SkillSelectionModal from './SkillSelectionModal.vue'
import SettingsModal from './SettingsModal.vue'

const store = useSudokuStore()
const userProfile = useUserProfileStore()

const showSkillModal = ref(false)
const showSettingsModal = ref(false)
const completionTime = ref(0)
const earnedExp = ref(0)
const oldLevel = ref(1)
const newLevel = ref(1)
const leveledUp = ref(false)

const difficultyNames: Record<Difficulty, string> = {
  easy: '簡単',
  medium: '普通',
  hard: '難しい',
  expert: '超難関',
}

const handleDifficultySelect = async (difficulty: Difficulty): Promise<void> => {
  await store.startGameWithDifficulty(difficulty)
}

const handleContinue = async (): Promise<void> => {
  if (store.currentDifficulty) {
    await store.startGameWithDifficulty(store.currentDifficulty)
  } else {
    store.showDifficultySelect()
  }
}

const handleSkillSave = (skills: string[]): void => {
  userProfile.setSelectedSkills(skills)
  showSkillModal.value = false
}

// Watch for game completion
watch(
  () => store.gameState,
  (newState) => {
    if (newState === 'completed') {
      completionTime.value = Date.now() - store.startTime
      // Extract experience info from message if available
      // This is a workaround - ideally we'd pass this data directly
      const match = store.message.match(/\+(\d+)経験値/)
      if (match) {
        earnedExp.value = parseInt(match[1])
      }
      const levelMatch = store.message.match(/Lv\.(\d+)/)
      if (levelMatch) {
        leveledUp.value = true
        newLevel.value = parseInt(levelMatch[1])
        oldLevel.value = newLevel.value - 1
      } else {
        leveledUp.value = false
        newLevel.value = userProfile.level
        oldLevel.value = userProfile.level
      }
    }
  },
)
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
  margin-bottom: 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skill-config-btn {
  width: 32px;
  height: 32px;
  border: 2px solid #667eea;
  background: white;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.skill-config-btn:hover {
  background: #f8f9ff;
  transform: scale(1.05);
}

.skill-config-btn:active {
  transform: scale(0.95);
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: 2px solid #667eea;
  background: white;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
}

.icon-btn:hover {
  background: #f8f9ff;
  transform: scale(1.05);
}

.icon-btn:active {
  transform: scale(0.95);
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

.user-level-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 380px;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 8px;
}

.level-badge {
  font-size: 14px;
  font-weight: bold;
  color: #667eea;
  white-space: nowrap;
}

.exp-bar-container {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.exp-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.exp-text {
  font-size: 11px;
  color: #6c757d;
  white-space: nowrap;
}

.difficulty-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
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
  .user-level-bar,
  .message {
    max-width: 420px;
  }
}
</style>
