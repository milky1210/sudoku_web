<template>
  <div class="settings-modal-overlay" @click="$emit('close')">
    <div class="settings-modal" @click.stop>
      <div class="modal-header">
        <h2>設定</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <!-- Highlight Mode Settings -->
        <div class="setting-section">
          <h3>ハイライト表示</h3>
          <p class="setting-description">数字をタップした時の表示方法を選択できます</p>

          <div class="setting-options">
            <label
              class="setting-option"
              :class="{
                selected: userProfile.highlightMode === 'invalid',
                disabled: !canUseMode('invalid'),
              }"
            >
              <input
                type="radio"
                value="invalid"
                v-model="userProfile.highlightMode"
                :disabled="!canUseMode('invalid')"
              />
              <div class="option-content">
                <div class="option-header">
                  <span class="option-title">無効セル表示</span>
                  <span
                    class="unlock-badge"
                    :class="{ locked: !userProfile.canUseInvalidHighlight }"
                  >
                    {{ userProfile.canUseInvalidHighlight ? 'Lv.10' : '🔒 Lv.10で解放' }}
                  </span>
                </div>
                <p class="option-desc">
                  選択した数字と同じ数字、および置けないセルをハイライト表示
                </p>
              </div>
            </label>

            <label
              class="setting-option"
              :class="{
                selected: userProfile.highlightMode === 'number',
                disabled: !canUseMode('number'),
              }"
            >
              <input
                type="radio"
                value="number"
                v-model="userProfile.highlightMode"
                :disabled="!canUseMode('number')"
              />
              <div class="option-content">
                <div class="option-header">
                  <span class="option-title">数字ハイライト</span>
                  <span
                    class="unlock-badge"
                    :class="{ locked: !userProfile.canUseNumberHighlight }"
                  >
                    {{ userProfile.canUseNumberHighlight ? 'Lv.5' : '🔒 Lv.5で解放' }}
                  </span>
                </div>
                <p class="option-desc">選択した数字と同じ数字のみハイライト表示</p>
              </div>
            </label>

            <label
              class="setting-option"
              :class="{
                selected: userProfile.highlightMode === 'none',
                disabled: !canUseMode('none'),
              }"
            >
              <input
                type="radio"
                value="none"
                v-model="userProfile.highlightMode"
                :disabled="!canUseMode('none')"
              />
              <div class="option-content">
                <div class="option-header">
                  <span class="option-title">ハイライトなし</span>
                  <span class="unlock-badge">Lv.1</span>
                </div>
                <p class="option-desc">ハイライト表示を行わない（上級者向け）</p>
              </div>
            </label>
          </div>
        </div>

        <!-- User Info -->
        <div class="setting-section">
          <h3>ユーザー情報</h3>
          <div class="user-info">
            <div class="info-item">
              <span class="info-label">レベル</span>
              <span class="info-value">{{ userProfile.level }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">経験値</span>
              <span class="info-value">{{ userProfile.experience }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">最大エネルギー</span>
              <span class="info-value">{{ userProfile.maxEnergy }}</span>
            </div>
          </div>
        </div>

        <!-- Reset Progress -->
        <div class="setting-section danger-zone">
          <h3>危険な操作</h3>
          <button @click="confirmReset" class="btn-danger">進行状況をリセット</button>
          <p class="warning-text">⚠️ レベル、経験値、選択したスキルがリセットされます</p>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn-primary">閉じる</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserProfileStore } from '@/stores/userProfile'

const userProfile = useUserProfileStore()

defineEmits<{
  close: []
}>()

const canUseMode = (mode: 'none' | 'number' | 'invalid'): boolean => {
  if (mode === 'none') return userProfile.canUseNoneHighlight
  if (mode === 'number') return userProfile.canUseNumberHighlight
  if (mode === 'invalid') return userProfile.canUseInvalidHighlight
  return false
}

const confirmReset = (): void => {
  if (confirm('本当に進行状況をリセットしますか？この操作は取り消せません。')) {
    userProfile.resetProfile()
    alert('進行状況がリセットされました')
  }
}
</script>

<style scoped>
.settings-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  overflow-y: auto;
}

.settings-modal {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 2px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  color: #2c3e50;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f8f9fa;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e9ecef;
  color: #2c3e50;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.setting-section {
  margin-bottom: 32px;
}

.setting-section:last-child {
  margin-bottom: 0;
}

.setting-section h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #2c3e50;
}

.setting-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #6c757d;
  line-height: 1.5;
}

.setting-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: white;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.setting-option:hover:not(.disabled) {
  border-color: #667eea;
  background: #f8f9ff;
}

.setting-option.selected {
  border-color: #667eea;
  background: #e7f3ff;
}

.setting-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setting-option input[type='radio'] {
  margin-top: 2px;
  flex-shrink: 0;
}

.option-content {
  flex: 1;
  min-width: 0;
}

.option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.option-title {
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
}

.unlock-badge {
  font-size: 11px;
  padding: 4px 8px;
  background: #28a745;
  color: white;
  border-radius: 4px;
  font-weight: bold;
}

.unlock-badge.locked {
  background: #6c757d;
}

.option-desc {
  margin: 0;
  font-size: 13px;
  color: #6c757d;
  line-height: 1.4;
}

.user-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-label {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 4px;
}

.info-value {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
}

.danger-zone {
  border-top: 2px solid #dee2e6;
  padding-top: 24px;
}

.danger-zone h3 {
  color: #dc3545;
}

.btn-danger {
  width: 100%;
  padding: 12px 24px;
  border: 2px solid #dc3545;
  border-radius: 8px;
  background: white;
  color: #dc3545;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.btn-danger:hover {
  background: #dc3545;
  color: white;
}

.warning-text {
  margin: 0;
  font-size: 12px;
  color: #dc3545;
  text-align: center;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 2px solid #e9ecef;
}

.btn-primary {
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transition: all 0.2s;
}

.btn-primary:active {
  transform: scale(0.98);
}

@media (max-width: 480px) {
  .user-info {
    grid-template-columns: 1fr;
  }
}
</style>
