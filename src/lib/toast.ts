import i18n from '@/i18n';
import { toast } from 'sonner';

export const showToast = {
  success: (message: string, title?: string) => {
    toast.success(title || i18n.t('toast.success'), {
      description: message,
    });
  },
  
  error: (message: string, title?: string) => {
    toast.error(title || i18n.t('toast.error'), {
      description: message,
    });
  },
  
  info: (message: string, title?: string) => {
    toast.info(title || i18n.t('toast.info'), {
      description: message,
    });
  },
  
  warning: (message: string, title?: string) => {
    toast.warning(title || i18n.t('toast.warning'), {
      description: message,
    });
  },
  
  loading: (message: string, title?: string) => {
    return toast.loading(title || i18n.t('toast.loading'), {
      description: message,
    });
  },
  
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },
};
