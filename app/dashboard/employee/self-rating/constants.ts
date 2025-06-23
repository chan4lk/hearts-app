export const RATING_COLORS = {
  1: 'bg-red-500/10 text-red-400',
  2: 'bg-orange-500/10 text-orange-400',
  3: 'bg-yellow-500/10 text-yellow-400',
  4: 'bg-blue-500/10 text-blue-400',
  5: 'bg-green-500/10 text-green-400'
} as const;

export const RATING_LABELS = {
  1: 'Needs Improvement',
  2: 'Below Average',
  3: 'Average',
  4: 'Above Average',
  5: 'Excellent'
} as const;

export const RATING_DESCRIPTIONS = {
  1: 'Performance is below expectations and needs significant improvement.',
  2: 'Performance is below average and requires improvement in several areas.',
  3: 'Performance meets basic expectations but could be improved.',
  4: 'Performance exceeds expectations in most areas.',
  5: 'Performance consistently exceeds expectations and demonstrates excellence.'
} as const;

export const RATING_HOVER_COLORS = {
  1: 'hover:bg-red-500/20 hover:text-red-300',
  2: 'hover:bg-orange-500/20 hover:text-orange-300',
  3: 'hover:bg-yellow-500/20 hover:text-yellow-300',
  4: 'hover:bg-blue-500/20 hover:text-blue-300',
  5: 'hover:bg-green-500/20 hover:text-green-300'
} as const;

export const STATUS_COLORS = {
  DRAFT: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  PENDING: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  COMPLETED: 'bg-green-500/10 text-green-600 dark:text-green-400',
  APPROVED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  REJECTED: 'bg-red-500/10 text-red-600 dark:text-red-400',
  MODIFIED: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
} as const; 