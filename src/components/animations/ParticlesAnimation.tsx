import React from 'react';
import { ScrollTriggeredLottie } from './ScrollTriggeredLottie';
import particlesAnimation from '@/assets/animations/particles.json';

export const ParticlesAnimation = React.memo(() => {
  return (
    <ScrollTriggeredLottie
      animationData={particlesAnimation}
      className="absolute inset-0 opacity-20 pointer-events-none"
      loop={true}
      playOnce={false}
    />
  );
});

ParticlesAnimation.displayName = 'ParticlesAnimation';