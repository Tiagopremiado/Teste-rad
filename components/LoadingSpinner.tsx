import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text, className = '' }) => {
  return (
    <div className={`flex justify-center items-center flex-col h-24 ${className}`}>
        <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-amber-400"></div>
        {text && <p className="mt-3 text-sm text-gray-400">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;