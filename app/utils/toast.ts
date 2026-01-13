// Toast system disabled - all functions are no-ops
export const showToast = {
  // User related toasts - disabled
  user: {
    created: () => {},
    updated: () => {},
    deleted: () => {},
    error: (_message: string) => {},
  },

  // Goal related toasts - disabled
  goal: {
    created: () => {},
    updated: () => {},
    deleted: () => {},
    error: (_message: string) => {},
  },

  // Settings related toasts - disabled
  settings: {
    updated: () => {},
    reset: () => {},
    error: (_prefix: string, _message: string) => {},
  },
  
  // Generic error handler - disabled
  error: (_prefix: string, _error: unknown) => {},

  // Generic success handler - disabled
  success: (_title: string, _description?: string) => {},

  // Generic info handler - disabled
  info: (_title: string, _description?: string) => {},
};