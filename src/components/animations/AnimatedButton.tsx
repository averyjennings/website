import { useState, useRef } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { motion } from 'framer-motion';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  animationData?: any;
  showSuccessAnimation?: boolean;
}

export function AnimatedButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  animationData,
  showSuccessAnimation = false,
}: AnimatedButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  const handleClick = () => {
    if (showSuccessAnimation) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
    onClick?.();
  };

  const baseClasses = 'relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 overflow-hidden';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    ghost: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={handleClick}
      onMouseEnter={() => {
        setIsHovered(true);
        if (animationData && lottieRef.current) {
          lottieRef.current.play();
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (animationData && lottieRef.current) {
          lottieRef.current.stop();
        }
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="relative z-10">{children}</span>
      
      {/* Hover animation overlay */}
      {animationData && (
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <Lottie
            lottieRef={lottieRef}
            animationData={animationData}
            loop={false}
            autoplay={false}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}
      
      {/* Success animation */}
      {showSuccess && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-green-500 text-white"
        >
          ✓
        </motion.div>
      )}
      
      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 bg-white opacity-25"
        initial={{ scale: 0 }}
        animate={isHovered ? { scale: 2 } : { scale: 0 }}
        transition={{ duration: 0.5 }}
        style={{ borderRadius: '50%' }}
      />
    </motion.button>
  );
}