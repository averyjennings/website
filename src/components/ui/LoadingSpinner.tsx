import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/animations/loading-spinner.json';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export const LoadingSpinner = React.memo(({ size = 100, className = '' }: LoadingSpinnerProps) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Lottie
        animationData={loadingAnimation}
        loop
        style={{ width: size, height: size }}
      />
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';