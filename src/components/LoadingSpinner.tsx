import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
      <div className="flex space-x-2">
        <div className="w-4 h-4 rounded-full bg-primary-600 loading-dot"></div>
        <div className="w-4 h-4 rounded-full bg-primary-600 loading-dot"></div>
        <div className="w-4 h-4 rounded-full bg-primary-600 loading-dot"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;