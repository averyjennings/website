import React, { useRef, useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { useInView } from 'framer-motion';
import codeTypingAnimation from '@/assets/animations/code-typing.json';
import { CSSLoadingSpinner } from '@/components/ui/CSSLoadingSpinner';

export const HeroCodeAnimation = React.memo(() => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for animation data
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={ref} className="relative">
      {isInView && (
        <>
        {isLoading && (
          <div className="flex items-center justify-center h-[300px]">
            <CSSLoadingSpinner size={60} />
          </div>
        )}
        {!isLoading && (
        <div className="relative bg-gray-900 dark:bg-gray-800 rounded-lg p-4 shadow-2xl border border-gray-700">
          <div className="absolute top-3 left-3 flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          
          <Lottie
            animationData={codeTypingAnimation}
            loop={false}
            onComplete={() => setAnimationComplete(true)}
            className="mt-6 w-full h-[200px]"
          />
          
          {animationComplete && (
            <div className="absolute bottom-3 right-3 text-xs text-gray-500 animate-pulse">
              Ready to build amazing things...
            </div>
          )}
        </div>
        )}
        </>
      )}
    </div>
  );
});

HeroCodeAnimation.displayName = 'HeroCodeAnimation';