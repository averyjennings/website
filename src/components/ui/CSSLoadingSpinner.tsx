interface CSSLoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function CSSLoadingSpinner({ size = 40, className = '' }: CSSLoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className="animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"
        style={{
          width: size,
          height: size,
        }}
      />
    </div>
  );
}