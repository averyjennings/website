import { useRef, useEffect, useState } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { useInView } from 'framer-motion';

interface ScrollTriggeredLottieProps {
  animationData: any;
  className?: string;
  loop?: boolean;
  // autoplay?: boolean;
  speed?: number;
  style?: React.CSSProperties;
  onComplete?: () => void;
  playOnce?: boolean;
}

export function ScrollTriggeredLottie({
  animationData,
  className = '',
  loop = true,
  // autoplay = true,
  speed = 1,
  style,
  onComplete,
  playOnce = true,
}: ScrollTriggeredLottieProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const isInView = useInView(containerRef, { once: playOnce, amount: 0.3 });
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    if (lottieRef.current && isInView && !hasPlayed) {
      lottieRef.current.play();
      if (playOnce) {
        setHasPlayed(true);
      }
    } else if (lottieRef.current && !isInView && !playOnce) {
      lottieRef.current.pause();
    }
  }, [isInView, hasPlayed, playOnce]);

  return (
    <div ref={containerRef} className={className}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={loop}
        autoplay={false}
        // @ts-expect-error - Lottie library type issue
        speed={speed}
        style={style}
        onComplete={onComplete}
      />
    </div>
  );
}