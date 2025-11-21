<template>
  <div class="completion-screen">
    <div class="completion-content">
      <h2 class="completion-title">🎉 完成！</h2>

      <!-- Time display -->
      <div class="time-info">
        <span class="time-label">クリアタイム</span>
        <span class="time-value">{{ formattedTime }}</span>
      </div>

      <!-- Experience info -->
      <div class="exp-info">
        <div class="exp-gained">
          <span class="exp-label">獲得経験値</span>
          <span class="exp-value">+{{ experience }}</span>
        </div>

        <div v-if="leveledUp" class="level-up-banner">
          <span class="level-up-text">🌟 レベルアップ！</span>
          <span class="level-text">Lv.{{ oldLevel }} → Lv.{{ newLevel }}</span>
        </div>
      </div>

      <!-- User stats -->
      <div class="user-stats">
        <div class="stat-item">
          <span class="stat-label">現在のレベル</span>
          <span class="stat-value">Lv.{{ userProfile.level }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">総エネルギー</span>
          <span class="stat-value">{{ userProfile.maxEnergy }}</span>
        </div>
      </div>

      <!-- Level progress bar -->
      <div class="progress-section">
        <div class="progress-label">
          <span>次のレベルまで</span>
          <span>{{ userProfile.experience }} / {{ userProfile.nextLevelExperience }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: userProfile.experienceProgress + '%' }"></div>
        </div>
      </div>

      <!-- Skill recommendations for level ups -->
      <div v-if="leveledUp" class="recommendations">
        <h3>新しい機能が利用可能！</h3>
        <div v-if="newLevel === 5" class="recommendation-item">
          ✨ 数字ハイライト機能が解放されました！
        </div>
        <div v-if="newLevel === 10" class="recommendation-item">
          ✨ ハイライトなしモードが利用可能になりました！
        </div>
        <div v-if="newLevel % 2 === 0" class="recommendation-item">
          ⚡ 最大エネルギーが増加しました！
        </div>
      </div>

      <!-- Action buttons -->
      <div class="action-buttons">
        <button @click="$emit('continue')" class="btn-primary">次の問題へ</button>
        <button @click="$emit('back')" class="btn-secondary">難易度選択に戻る</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserProfileStore } from '@/stores/userProfile'

interface Props {
  timeMs: number
  experience: number
  oldLevel: number
  newLevel: number
  leveledUp: boolean
}

const props = defineProps<Props>()
defineEmits<{
  continue: []
  back: []
}>()

const userProfile = useUserProfileStore()

const formattedTime = computed(() => {
  const totalSeconds = Math.floor(props.timeMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})
</script>

<style scoped>
.completion-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.completion-content {
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.completion-title {
  text-align: center;
  font-size: 32px;
  margin: 0 0 24px 0;
  color: #2c3e50;
}

.time-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 16px;
}

.time-label {
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.time-value {
  color: white;
  font-size: 24px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.exp-info {
  margin-bottom: 16px;
}

.exp-gained {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff9e6;
  border: 2px solid #ffd700;
  border-radius: 8px;
  margin-bottom: 12px;
}

.exp-label {
  color: #856404;
  font-size: 14px;
  font-weight: bold;
}

.exp-value {
  color: #856404;
  font-size: 24px;
  font-weight: bold;
}

.level-up-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 12px;
  animation: pulse 0.5s ease-in-out;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.level-up-text {
  color: white;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
}

.level-text {
  color: white;
  font-size: 20px;
  font-weight: bold;
}

.user-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-label {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
}

.progress-section {
  margin-bottom: 20px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 8px;
}

.progress-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.recommendations {
  background: #e7f3ff;
  border: 2px solid #2196f3;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.recommendations h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #1976d2;
}

.recommendation-item {
  padding: 8px 0;
  color: #1565c0;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:active {
  transform: translateY(2px);
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:active {
  background: #f8f9fa;
}
</style>
