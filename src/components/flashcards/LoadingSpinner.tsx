import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Ładowanie..." 
}) => {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex items-center space-x-3">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-600 font-medium">{message}</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
