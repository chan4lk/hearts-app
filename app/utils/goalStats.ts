/**
 * Shared utility for calculating goal status counts.
 * Single-pass O(n) calculation instead of multiple .filter() calls.
 */
export function countByStatus(goals: Array<{ status: string }>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const g of goals) {
    counts[g.status] = (counts[g.status] || 0) + 1;
  }
  return counts;
}

/**
 * Shared utility for calculating goal category counts.
 */
export function countByCategory(goals: Array<{ category?: string | null }>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const g of goals) {
    if (g.category) counts[g.category] = (counts[g.category] || 0) + 1;
  }
  return counts;
}
