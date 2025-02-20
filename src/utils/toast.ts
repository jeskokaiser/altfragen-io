
import { toast } from 'sonner';

type ToastOptions = {
  description?: string;
  duration?: number;
};

export const showToast = {
  success: (message: string, options?: ToastOptions) => 
    toast.success(message, { 
      duration: 4000,
      ...options 
    }),
  error: (message: string, options?: ToastOptions) => 
    toast.error(message, { 
      duration: 4000,
      ...options 
    }),
  info: (message: string, options?: ToastOptions) => 
    toast(message, { 
      duration: 4000,
      ...options 
    }),
  // For cases where we previously used "destructive" variant
  warning: (message: string, options?: ToastOptions) => 
    toast.error(message, { 
      duration: 4000,
      ...options 
    })
};
