import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'destructive' | 'success';
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default', duration = 5000 }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, title, description, variant, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const dismiss = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    toast,
    dismiss,
    dismissAll,
  };
};

export const useAuthToast = () => {
  const { toast } = useToast();

  const showSuccess = useCallback((message: string) => {
    toast({
      title: 'Sukces',
      description: message,
      variant: 'success',
    });
  }, [toast]);

  const showError = useCallback((message: string) => {
    toast({
      title: 'Błąd',
      description: message,
      variant: 'destructive',
    });
  }, [toast]);

  const showInfo = useCallback((message: string) => {
    toast({
      title: 'Informacja',
      description: message,
      variant: 'default',
    });
  }, [toast]);

  return { showSuccess, showError, showInfo };
};
