import React from 'react';
import { useToast, type Toast } from './use-toast';

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem = ({ toast, onDismiss }: ToastProps) => {
  const baseClasses = "fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg border";
  const variantClasses = {
    default: "bg-white border-gray-200 text-gray-900",
    success: "bg-green-50 border-green-200 text-green-800",
    destructive: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[toast.variant]} animate-slide-in`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{toast.title}</h4>
          {toast.description && (
            <p className="text-sm opacity-90 mt-1">{toast.description}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Zamknij powiadomienie"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const Toaster = () => {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
};

// CSS Animation styles (można dodać do global.css)
export const toastStyles = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;
