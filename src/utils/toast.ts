
import { toast } from 'sonner';

export const showToast = {
  success: (message: string, description?: string) => 
    toast.success(message, { description }),
  error: (message: string, description?: string) => 
    toast.error(message, { description }),
  info: (message: string, description?: string) => 
    toast(message, { description })
};
