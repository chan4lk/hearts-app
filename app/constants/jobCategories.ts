/**
 * Predefined Job Categories
 * This file contains all available job categories for employees.
 * To add a new job category, simply add it to the array below.
 */

export const JOB_CATEGORIES = [
  'Executive',
  'Senior Executive',
  'Sub Contractor',
  'Intern'
] as const;

export type JobCategory = typeof JOB_CATEGORIES[number];

/**
 * Get all job categories as a sorted array
 */
export function getJobCategories(): string[] {
  return [...JOB_CATEGORIES].sort();
}

/**
 * Search job categories by keyword
 */
export function searchJobCategories(keyword: string): string[] {
  if (!keyword.trim()) {
    return getJobCategories();
  }
  const lowerKeyword = keyword.toLowerCase();
  return JOB_CATEGORIES.filter(category =>
    category.toLowerCase().includes(lowerKeyword)
  ).sort();
}

