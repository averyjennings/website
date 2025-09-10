import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface ParticleFieldProps {
  count?: number;
}

export function ParticleField({ count = 500 }: ParticleFieldProps) {
  const ref = useRef<THREE.Points>(null);
  
  // Generate random particle positions
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30; // z
    }
    
    return positions;
  }, [count]);

  // Animate particles
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.getElapsedTime() * 0.05;
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.075;
      
      // Move particles based on mouse position
      const mouse = state.mouse;
      ref.current.position.x = mouse.x * 0.5;
      ref.current.position.y = mouse.y * 0.5;
    }
  });

  return (
    <Points ref={ref} positions={particles} stride={3} frustumCulled>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}