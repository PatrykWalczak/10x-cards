import { useState, useCallback } from 'react';

interface LoadingStates {
  signIn: boolean;
  signUp: boolean;
  resetPassword: boolean;
  [key: string]: boolean;
}

export const useAuthLoading = () => {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    signIn: false,
    signUp: false,
    resetPassword: false,
  });

  const setLoading = useCallback((operation: keyof LoadingStates, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [operation]: isLoading,
    }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  return {
    loadingStates,
    setLoading,
    isAnyLoading,
  };
};
