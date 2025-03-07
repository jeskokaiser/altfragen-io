
import { toast } from 'sonner';

export const showToast = {
  success: (title: string, options?: { description?: string }) => {
    toast.success(title, {
      description: options?.description,
    });
  },
  error: (title: string, options?: { description?: string }) => {
    toast.error(title, {
      description: options?.description,
    });
  },
  info: (title: string, options?: { description?: string }) => {
    toast.info(title, {
      description: options?.description,
    });
  },
  warning: (title: string, options?: { description?: string }) => {
    toast.warning(title, {
      description: options?.description,
    });
  },
};
