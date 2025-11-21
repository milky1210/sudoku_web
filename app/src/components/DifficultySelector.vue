<template>
  <div class="difficulty-selector">
    <div class="header">
      <h1>数独</h1>
      <p class="subtitle">難易度を選択してください</p>
    </div>

    <div class="difficulty-buttons">
      <button
        v-for="level in difficultyLevels"
        :key="level.value"
        class="difficulty-button"
        :class="level.value"
        @click="selectDifficulty(level.value)"
      >
        <div class="level-icon">{{ level.icon }}</div>
        <div class="level-name">{{ level.name }}</div>
        <div class="level-description">{{ level.description }}</div>
      </button>
    </div>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface DifficultyLevel {
  value: 'easy' | 'medium' | 'hard' | 'expert'
  name: string
  icon: string
  description: string
}

const difficultyLevels: DifficultyLevel[] = [
  {
    value: 'easy',
    name: '簡単',
    icon: '😊',
    description: '初心者向け - ヒント数: 38-40',
  },
  {
    value: 'medium',
    name: '普通',
    icon: '🤔',
    description: '中級者向け - ヒント数: 30-35',
  },
  {
    value: 'hard',
    name: '難しい',
    icon: '😤',
    description: '上級者向け - ヒント数: 25-29',
  },
  {
    value: 'expert',
    name: '超難関',
    icon: '🔥',
    description: 'エキスパート - ヒント数: 22-24',
  },
]

const errorMessage = ref<string>('')

const emit = defineEmits<{
  select: [difficulty: 'easy' | 'medium' | 'hard' | 'expert']
}>()

const selectDifficulty = (difficulty: 'easy' | 'medium' | 'hard' | 'expert'): void => {
  errorMessage.value = ''
  emit('select', difficulty)
}
</script>

<style scoped>
.difficulty-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  text-align: center;
  margin-bottom: 32px;
  color: white;
}

.header h1 {
  font-size: 36px;
  margin: 0 0 8px 0;
  font-weight: bold;
}

.subtitle {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
}

.difficulty-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 360px;
}

.difficulty-button {
  background: white;
  border: none;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: left;
}

.difficulty-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.difficulty-button:active {
  transform: translateY(-2px);
}

.difficulty-button.easy {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.difficulty-button.medium {
  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
}

.difficulty-button.hard {
  background: linear-gradient(135deg, #fd79a8 0%, #fab1a0 100%);
}

.difficulty-button.expert {
  background: linear-gradient(135deg, #e17055 0%, #d63031 100%);
  color: white;
}

.level-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.level-name {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.level-description {
  font-size: 14px;
  opacity: 0.8;
}

.error-message {
  margin-top: 16px;
  padding: 12px 20px;
  background-color: #ff6b6b;
  color: white;
  border-radius: 8px;
  font-weight: bold;
}

@media (max-width: 480px) {
  .difficulty-buttons {
    max-width: 100%;
  }

  .header h1 {
    font-size: 28px;
  }

  .level-icon {
    font-size: 28px;
  }

  .level-name {
    font-size: 20px;
  }
}
</style>
