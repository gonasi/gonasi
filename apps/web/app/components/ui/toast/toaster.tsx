import { useEffect } from 'react';
import { toast as notify } from 'sonner';

interface Toast {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  description?: string | undefined;
  duration?: number | undefined;
}

export function useToast(toast?: Toast | null) {
  useEffect(() => {
    if (toast?.type === 'error') {
      notify.error(toast.message);
    }
    if (toast?.type === 'success') {
      notify.success(toast.message);
    }
  }, [toast]);
}
