import { toast, ToastOptions } from 'react-hot-toast';

const baseToastStyle = {
  background: 'rgba(30, 32, 40, 0.95)',
  color: '#fff',
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
  gap: '16px',
};

const baseToastOptions: ToastOptions = {
  duration: 4000,
  position: 'top-center',
};

// Success toast style
const successStyle = {
  ...baseToastStyle,
  border: '1px solid rgba(34, 197, 94, 0.3)',
  borderLeft: '4px solid #22c55e',
};

// Error toast style
const errorStyle = {
  ...baseToastStyle,
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderLeft: '4px solid #ef4444',
};

export const showToast = {
  // User related toasts
  user: {
    created: () => 
      toast.success('👤 New user has been added to your team', {
        ...baseToastOptions,
        style: successStyle,
      }),
    updated: () =>
      toast.success('👤 User information has been updated successfully', {
        ...baseToastOptions,
        style: successStyle,
      }),
    deleted: () =>
      toast.success('👤 User has been removed from your team', {
        ...baseToastOptions,
        style: successStyle,
      }),
    error: (message: string) =>
      toast.error(message, {
        ...baseToastOptions,
        style: errorStyle,
      }),
  },
  
  // Generic error handler
  error: (prefix: string, error: unknown) => {
    const message = error instanceof Error 
      ? `${prefix}: ${error.message}`
      : 'An unexpected error occurred';
    
    toast.error(message, {
      ...baseToastOptions,
      style: errorStyle,
    });
  }
}; 