export const colors = {
  primary: {
    gradient: "from-indigo-600/90 via-purple-600/90 to-pink-600/90",
    text: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/50",
    hover: "hover:bg-indigo-500/20",
  },
  secondary: {
    gradient: "from-blue-500/10 to-blue-600/10",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-200/20 dark:border-blue-600/20",
  },
  success: {
    gradient: "from-emerald-500/10 to-emerald-600/10",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-200/20 dark:border-emerald-600/20",
  },
  warning: {
    gradient: "from-amber-500/10 to-amber-600/10",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-200/20 dark:border-amber-600/20",
  },
  background: {
    primary: "bg-white/80 dark:bg-gray-800/80",
    secondary: "bg-gray-50/80 dark:bg-gray-700/80",
    gradient: "from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
  },
  border: {
    light: "border-white/20 dark:border-gray-700/50",
  },
  text: {
    primary: "text-gray-900 dark:text-white",
    secondary: "text-gray-600 dark:text-gray-400",
  }
} as const; 