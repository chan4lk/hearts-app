// Centralized configuration for filters and status badges
// Import this in your pages to maintain consistency across the app

import { STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_CONFIG } from './Filters';

export { STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_CONFIG };

// Helper function to get status badge styles
export function getStatusStyle(status: string) {
  return (STATUS_CONFIG as any)[status] || {
    label: status,
    borderColor: 'border-gray-500/30',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-300',
    gradient: 'from-gray-500 to-slate-500'
  };
}

// Helper function to get priority badge styles
export function getPriorityStyle(priority: string) {
  return (PRIORITY_CONFIG as any)[priority] || {
    label: priority,
    borderColor: 'border-gray-500/30',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-300',
    gradient: 'from-gray-400 to-gray-500'
  };
}

// Helper function to get category label
export function getCategoryLabel(category: string) {
  return (CATEGORY_CONFIG as any)[category]?.label || category;
}

// Common stat item configurations
export const STAT_ITEMS = {
  // Admin dashboard stats
  TOTAL_USERS: {
    title: 'Total Users',
    icon: 'BsPeople',
    gradient: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  EMPLOYEES: {
    title: 'Employees',
    icon: 'BsPeople',
    gradient: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  },
  MANAGERS: {
    title: 'Managers',
    icon: 'BsGraphUp',
    gradient: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  ADMINS: {
    title: 'Admins',
    icon: 'BsShieldExclamation',
    gradient: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30'
  },
  TOTAL_GOALS: {
    title: 'Total Goals',
    icon: 'BsBullseye',
    gradient: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30'
  },
  DRAFT_GOALS: {
    title: 'Draft',
    icon: 'BsPencil',
    gradient: 'from-gray-500 to-slate-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30'
  },
  APPROVED_GOALS: {
    title: 'Approved',
    icon: 'BsCheckCircle',
    gradient: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  },
  REJECTED_GOALS: {
    title: 'Rejected',
    icon: 'BsXCircle',
    gradient: 'from-rose-500 to-red-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30'
  },
  COMPLETED_GOALS: {
    title: 'Completed',
    icon: 'BsCheckCircle',
    gradient: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  }
};

// Hero section color presets
export const HERO_GRADIENTS = {
  DEFAULT: 'from-teal-600 to-cyan-600',
  ADMIN: 'from-indigo-600 to-blue-600',
  MANAGER: 'from-purple-600 to-pink-600',
  EMPLOYEE: 'from-green-600 to-emerald-600',
  ANALYTICS: 'from-orange-600 to-red-600'
};

// Responsive grid column configurations
export const GRID_COLUMNS = {
  STATS_ADMIN: { mobile: 2, tablet: 3, desktop: 5 },
  STATS_MANAGER: { mobile: 2, tablet: 3, desktop: 4 },
  STATS_EMPLOYEE: { mobile: 2, tablet: 2, desktop: 3 },
  COMPACT: { mobile: 2, tablet: 3, desktop: 4 }
};
