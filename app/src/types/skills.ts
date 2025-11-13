/**
 * スキル定義
 */

export interface Skill {
  id: string
  name: string
  cost: number
  description: string
  icon: string
  category: 'basic' | 'advanced' | 'special'
}

export const ALL_SKILLS: Skill[] = [
  // Basic skills
  {
    id: 'fill8',
    name: '8マス埋め',
    cost: 0,
    description: '8個埋まっている行・列・ブロックの残り1マスを自動入力',
    icon: '⑧',
    category: 'basic'
  },
  {
    id: 'fill8All',
    name: '8マス全埋め',
    cost: 1,
    description: '8個埋まっている全ての行・列・ブロックを自動入力',
    icon: '🎯',
    category: 'basic'
  },
  {
    id: 'possible1',
    name: '候補1入力',
    cost: 0,
    description: '候補が1つしかないセルを1つ自動入力',
    icon: '①',
    category: 'basic'
  },
  {
    id: 'possible1All',
    name: '候補1全入力',
    cost: 1,
    description: '候補が1つしかない全てのセルを自動入力',
    icon: '✨',
    category: 'basic'
  },
  {
    id: 'memoN',
    name: '候補メモ',
    cost: 1,
    description: '選択した数字の候補を全セルにメモ',
    icon: '📝',
    category: 'basic'
  },
  {
    id: 'memoAll',
    name: '全候補メモ',
    cost: 2,
    description: '全ての空セルに候補をメモ',
    icon: '📋',
    category: 'advanced'
  },
  // Special skills
  {
    id: 'save',
    name: 'セーブ',
    cost: 1,
    description: '現在の盤面を保存（loadボタンに切り替わる）',
    icon: '💾',
    category: 'special'
  },
  {
    id: 'load',
    name: 'ロード',
    cost: 2,
    description: '保存した盤面を復元（saveボタンに切り替わる）',
    icon: '📂',
    category: 'special'
  },
  {
    id: 'esp',
    name: 'エスパー',
    cost: 3,
    description: '候補が2つ以上の中で最小のセルを高確率で正解入力',
    icon: '🔮',
    category: 'special'
  },
  {
    id: 'hint',
    name: 'ヒント',
    cost: 2,
    description: '選択したセルに正しい数字を表示（メモとして）',
    icon: '💡',
    category: 'advanced'
  },
  {
    id: 'clear',
    name: 'クリア',
    cost: 1,
    description: '選択したセルとその候補をクリア',
    icon: '🗑️',
    category: 'basic'
  },
  {
    id: 'nakedPair',
    name: 'ネイキッドペア',
    cost: 2,
    description: '同じ2つの候補を持つセルペアから他のセルの候補を削除',
    icon: '👥',
    category: 'advanced'
  }
]

// Get skill by ID
export const getSkillById = (id: string): Skill | undefined => {
  return ALL_SKILLS.find((skill) => skill.id === id)
}

// Get skills by category
export const getSkillsByCategory = (category: 'basic' | 'advanced' | 'special'): Skill[] => {
  return ALL_SKILLS.filter((skill) => skill.category === category)
}
