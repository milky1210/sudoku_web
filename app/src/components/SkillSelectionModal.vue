<template>
  <div class="skill-modal-overlay" @click="$emit('close')">
    <div class="skill-modal" @click.stop>
      <div class="modal-header">
        <h2>スキル選択</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <p class="instruction">
          使用するスキルを4つ選択してください<br>
          （空欄も選択可能）
        </p>

        <!-- Current selection -->
        <div class="current-selection">
          <h3>選択中のスキル ({{ selectedCount }}/4)</h3>
          <div class="selected-skills">
            <div 
              v-for="(skillId, index) in localSelection" 
              :key="index"
              class="selected-slot"
              :class="{ empty: !skillId }"
            >
              <template v-if="skillId">
                <span class="skill-icon">{{ getSkillIcon(skillId) }}</span>
                <span class="skill-name">{{ getSkillName(skillId) }}</span>
                <button @click="removeSkill(index)" class="remove-btn">×</button>
              </template>
              <template v-else>
                <span class="empty-text">空欄</span>
              </template>
            </div>
          </div>
        </div>

        <!-- Available skills by category -->
        <div class="skill-categories">
          <div v-for="category in categories" :key="category.id" class="category-section">
            <h3 class="category-title">{{ category.name }}</h3>
            <div class="skill-list">
              <button
                v-for="skill in getSkillsByCategory(category.id)"
                :key="skill.id"
                @click="toggleSkill(skill.id)"
                :class="['skill-item', { 
                  selected: isSelected(skill.id),
                  disabled: !canSelect(skill.id)
                }]"
                :disabled="!canSelect(skill.id)"
              >
                <span class="skill-icon-large">{{ skill.icon }}</span>
                <div class="skill-info">
                  <div class="skill-name-row">
                    <span class="skill-name">{{ skill.name }}</span>
                    <span class="skill-cost-badge">{{ skill.cost }}</span>
                  </div>
                  <div class="skill-desc">{{ skill.description }}</div>
                </div>
                <span v-if="isSelected(skill.id)" class="check-mark">✓</span>
              </button>
              
              <!-- Empty/None option -->
              <button
                v-if="category.id === 'basic'"
                @click="addEmpty()"
                :class="['skill-item empty-option', { disabled: selectedCount >= 4 }]"
                :disabled="selectedCount >= 4"
              >
                <span class="skill-icon-large">🚫</span>
                <div class="skill-info">
                  <div class="skill-name-row">
                    <span class="skill-name">空欄</span>
                  </div>
                  <div class="skill-desc">スキルを配置しない</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="cancel" class="btn-secondary">キャンセル</button>
        <button @click="save" class="btn-primary" :disabled="selectedCount !== 4">
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ALL_SKILLS, getSkillById } from '@/types/skills'
import type { Skill } from '@/types/skills'
import { useUserProfileStore } from '@/stores/userProfile'

const userProfile = useUserProfileStore()

const localSelection = ref<string[]>([...userProfile.selectedSkills])

const categories = [
  { id: 'basic' as const, name: '基本スキル' },
  { id: 'advanced' as const, name: '応用スキル' },
  { id: 'special' as const, name: '特殊スキル' }
]

const emit = defineEmits<{
  close: []
  save: [skills: string[]]
}>()

const selectedCount = computed(() => {
  return localSelection.value.filter(id => id !== '').length
})

const getSkillsByCategory = (category: 'basic' | 'advanced' | 'special'): Skill[] => {
  return ALL_SKILLS.filter(skill => skill.category === category)
}

const getSkillIcon = (skillId: string): string => {
  const skill = getSkillById(skillId)
  return skill?.icon || '❓'
}

const getSkillName = (skillId: string): string => {
  const skill = getSkillById(skillId)
  return skill?.name || '不明'
}

const isSelected = (skillId: string): boolean => {
  return localSelection.value.includes(skillId)
}

const canSelect = (skillId: string): boolean => {
  // Already selected
  if (isSelected(skillId)) return true
  // Max 4 skills
  if (selectedCount.value >= 4) return false
  return true
}

const toggleSkill = (skillId: string): void => {
  const index = localSelection.value.indexOf(skillId)
  if (index !== -1) {
    // Remove if already selected
    localSelection.value[index] = ''
  } else {
    // Add to first empty slot
    const emptyIndex = localSelection.value.indexOf('')
    if (emptyIndex !== -1) {
      localSelection.value[emptyIndex] = skillId
    } else if (selectedCount.value < 4) {
      // Find first slot
      for (let i = 0; i < 4; i++) {
        if (!localSelection.value[i]) {
          localSelection.value[i] = skillId
          break
        }
      }
    }
  }
}

const addEmpty = (): void => {
  const emptyIndex = localSelection.value.indexOf('')
  if (emptyIndex === -1 && selectedCount.value < 4) {
    for (let i = 0; i < 4; i++) {
      if (!localSelection.value[i]) {
        localSelection.value[i] = ''
        break
      }
    }
  }
}

const removeSkill = (index: number): void => {
  localSelection.value[index] = ''
}

const cancel = (): void => {
  emit('close')
}

const save = (): void => {
  if (selectedCount.value === 4) {
    emit('save', [...localSelection.value])
    emit('close')
  }
}
</script>

<style scoped>
.skill-modal-overlay {
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

.skill-modal {
  background: white;
  border-radius: 16px;
  max-width: 600px;
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

.instruction {
  text-align: center;
  color: #6c757d;
  margin: 0 0 24px 0;
  font-size: 14px;
  line-height: 1.6;
}

.current-selection {
  margin-bottom: 32px;
}

.current-selection h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #2c3e50;
}

.selected-skills {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.selected-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  min-height: 56px;
}

.selected-slot.empty {
  justify-content: center;
  border-style: dashed;
}

.selected-slot .skill-icon {
  font-size: 24px;
}

.selected-slot .skill-name {
  flex: 1;
  font-size: 14px;
  font-weight: bold;
  color: #2c3e50;
}

.empty-text {
  color: #adb5bd;
  font-size: 14px;
}

.remove-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.category-section {
  margin-bottom: 24px;
}

.category-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  position: relative;
}

.skill-item:hover:not(:disabled) {
  border-color: #667eea;
  background: #f8f9ff;
}

.skill-item.selected {
  border-color: #667eea;
  background: #e7f3ff;
}

.skill-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-icon-large {
  font-size: 32px;
  flex-shrink: 0;
}

.skill-info {
  flex: 1;
  min-width: 0;
}

.skill-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.skill-item .skill-name {
  font-size: 14px;
  font-weight: bold;
  color: #2c3e50;
}

.skill-cost-badge {
  display: inline-block;
  padding: 2px 6px;
  background: #e67e22;
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.skill-desc {
  font-size: 12px;
  color: #6c757d;
  line-height: 1.4;
}

.check-mark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.empty-option {
  border-style: dashed;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 2px solid #e9ecef;
}

.btn-primary, .btn-secondary {
  flex: 1;
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
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

@media (max-width: 480px) {
  .selected-skills {
    grid-template-columns: 1fr;
  }
}
</style>
