import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface UserProfile {
  level: number
  experience: number
  selectedSkills: string[] // Array of 4 skill IDs
}

const STORAGE_KEY = 'sudoku-user-profile'

// Experience required for each level (cumulative)
const LEVEL_REQUIREMENTS = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, // Levels 1-10
  3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450, // Levels 11-20
  11500, 12600, 13750, 14950, 16200, 17500, 18850, 20250, 21700, 23200, // Levels 21-30
]

export const useUserProfileStore = defineStore('userProfile', () => {
  // State
  const level = ref<number>(1)
  const experience = ref<number>(0)
  const selectedSkills = ref<string[]>(['fill8', 'possible1', 'memoN', 'save'])

  // Computed
  const maxEnergy = computed(() => {
    // Base energy of 5, +1 every 2 levels
    return 5 + Math.floor((level.value - 1) / 2)
  })

  const nextLevelExperience = computed(() => {
    if (level.value >= LEVEL_REQUIREMENTS.length) {
      return LEVEL_REQUIREMENTS[LEVEL_REQUIREMENTS.length - 1]
    }
    return LEVEL_REQUIREMENTS[level.value]
  })

  const experienceProgress = computed(() => {
    const currentLevelExp = level.value > 1 ? LEVEL_REQUIREMENTS[level.value - 1] : 0
    const nextLevelExp = nextLevelExperience.value
    const progressExp = experience.value - currentLevelExp
    const requiredExp = nextLevelExp - currentLevelExp
    return Math.min(100, Math.max(0, (progressExp / requiredExp) * 100))
  })

  // ESP skill accuracy based on level
  const espAccuracy = computed(() => {
    // 60% at level 1, increases to 95% at level 30
    const baseAccuracy = 60
    const maxAccuracy = 95
    const levelBonus = Math.min(29, level.value - 1) * ((maxAccuracy - baseAccuracy) / 29)
    return Math.floor(baseAccuracy + levelBonus)
  })

  // Highlight mode unlock levels
  const highlightMode = ref<'none' | 'number' | 'invalid'>('invalid')

  const canUseNumberHighlight = computed(() => level.value >= 5)
  const canUseNoneHighlight = computed(() => level.value >= 1)
  const canUseInvalidHighlight = computed(() => level.value >= 10)

  // Actions
  const addExperience = (exp: number): { leveledUp: boolean; newLevel: number } => {
    const oldLevel = level.value
    experience.value += exp

    // Check for level up
    while (
      level.value < LEVEL_REQUIREMENTS.length &&
      experience.value >= LEVEL_REQUIREMENTS[level.value]
    ) {
      level.value++
    }

    return {
      leveledUp: level.value > oldLevel,
      newLevel: level.value
    }
  }

  const setSelectedSkills = (skills: string[]): void => {
    if (skills.length !== 4) {
      console.error('Must select exactly 4 skills')
      return
    }
    selectedSkills.value = [...skills]
  }

  const setHighlightMode = (mode: 'none' | 'number' | 'invalid'): void => {
    if (mode === 'number' && !canUseNumberHighlight.value) {
      console.error('Number highlight mode requires level 5')
      return
    }
    if (mode === 'invalid' && !canUseInvalidHighlight.value) {
      console.error('Invalid-cell highlight mode requires level 10')
      return
    }
    highlightMode.value = mode
  }

  const loadProfile = (): void => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const profile: UserProfile = JSON.parse(stored)
        level.value = profile.level || 1
        experience.value = profile.experience || 0
        selectedSkills.value = profile.selectedSkills || ['fill8', 'possible1', 'memoN', 'save']
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }

  const saveProfile = (): void => {
    try {
      const profile: UserProfile = {
        level: level.value,
        experience: experience.value,
        selectedSkills: selectedSkills.value
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch (error) {
      console.error('Failed to save user profile:', error)
    }
  }

  const resetProfile = (): void => {
    level.value = 1
    experience.value = 0
    selectedSkills.value = ['fill8', 'possible1', 'memoN', 'save']
    highlightMode.value = 'invalid'
    saveProfile()
  }

  // Watch for changes and auto-save
  watch([level, experience, selectedSkills], () => {
    saveProfile()
  }, { deep: true })

  // Load profile on initialization
  loadProfile()

  return {
    // State
    level,
    experience,
    selectedSkills,
    highlightMode,
    // Computed
    maxEnergy,
    nextLevelExperience,
    experienceProgress,
    espAccuracy,
    canUseNumberHighlight,
    canUseNoneHighlight,
  canUseInvalidHighlight,
    // Actions
    addExperience,
    setSelectedSkills,
    setHighlightMode,
    loadProfile,
    saveProfile,
    resetProfile
  }
})
