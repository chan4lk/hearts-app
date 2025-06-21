import { toast } from 'sonner';

const toastStyle = {
  background: 'rgba(30, 32, 40, 0.95)',
  color: '#fff',
  border: '1px solid rgba(45, 55, 72, 0.5)',
  borderRadius: '16px',
  padding: '20px 24px',
  fontSize: '16px',
  fontWeight: '600',
  textAlign: 'center' as const,
  width: 'auto',
  maxWidth: '450px',
  margin: '0 auto',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
};

const successStyle = {
  ...toastStyle,
  border: '1px solid rgba(34, 197, 94, 0.3)',
  borderLeft: '4px solid #22c55e'
};

const errorStyle = {
  ...toastStyle,
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderLeft: '4px solid #ef4444'
};

const defaultOptions = {
  duration: 4000,
  position: 'top-center',
} as const;

export const showToast = {
  // User related toasts
  user: {
    created: () => 
      toast('👤 New user has been added to your team', {
        ...defaultOptions,
        description: 'The user account has been created successfully.',
        style: successStyle
      }),
    updated: () =>
      toast('👤 User information has been updated', {
        ...defaultOptions,
        description: 'The user details have been saved successfully.',
        style: successStyle
      }),
    deleted: () =>
      toast('👤 User has been removed', {
        ...defaultOptions,
        description: 'The user has been deleted from your team.',
        style: successStyle
      }),
    error: (message: string) =>
      toast(message, {
        ...defaultOptions,
        style: errorStyle
      }),
  },

  // Goal related toasts
  goal: {
    created: () =>
      toast('🎯 Goal created successfully!', {
        ...defaultOptions,
        description: 'Your goal has been created and is ready for review.',
        style: successStyle
      }),
    updated: () =>
      toast('✅ Goal updated successfully!', {
        ...defaultOptions,
        description: 'Your goal has been updated with the new information.',
        style: successStyle
      }),
    deleted: () =>
      toast('🗑️ Goal deleted successfully!', {
        ...defaultOptions,
        description: 'The goal has been permanently removed from the system.',
        style: successStyle
      }),
    error: (message: string) =>
      toast(message, {
        ...defaultOptions,
        style: errorStyle
      }),
  },
  
  // Generic error handler
  error: (prefix: string, error: unknown) => {
    const message = error instanceof Error 
      ? `${prefix}: ${error.message}`
      : 'An unexpected error occurred';
    
    toast(message, {
      ...defaultOptions,
      style: errorStyle
    });
  }
}; 