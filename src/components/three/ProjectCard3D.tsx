import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Image } from '@react-three/drei';
import { Mesh, Vector3 } from 'three';
import { Project3D } from './ProjectGalleryScene';

interface ProjectCard3DProps {
  project: Project3D;
  index: number;
}

export function ProjectCard3D({ project, index }: ProjectCard3DProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Animate on hover
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(
        new Vector3(
          hovered ? 1.1 : 1,
          hovered ? 1.1 : 1,
          hovered ? 1.1 : 1
        ),
        0.1
      );
      
      // Gentle floating animation
      meshRef.current.position.y = project.position[1] + Math.sin(state.clock.elapsedTime + index) * 0.1;
    }
  });

  const handleClick = () => {
    // Open project link in new tab
    window.open(project.link, '_blank');
  };

  return (
    <group position={project.position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        {/* Card Background */}
        <RoundedBox args={[3, 4, 0.3]} radius={0.1} smoothness={4}>
          <meshStandardMaterial
            color={hovered ? project.color : '#1a1a1a'}
            metalness={0.2}
            roughness={0.8}
            emissive={hovered ? project.color : '#000000'}
            emissiveIntensity={hovered ? 0.2 : 0}
          />
        </RoundedBox>
        
        {/* Project Image */}
        {project.image && (
          <Image
            url={project.image}
            scale={[2.5, 1.5]}
            position={[0, 0.8, 0.16]}
            transparent
            opacity={0.9}
          />
        )}
        
        {/* Title */}
        <Text
          position={[0, -0.5, 0.16]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {project.title}
        </Text>
        
        {/* Description */}
        <Text
          position={[0, -1, 0.16]}
          fontSize={0.15}
          color="#cccccc"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.5}
          textAlign="center"
        >
          {project.description}
        </Text>
        
        {/* Tech stack */}
        <group position={[0, -1.5, 0.16]}>
          {project.technologies.slice(0, 3).map((tech, i) => (
            <Text
              key={tech}
              position={[(i - 1) * 0.8, 0, 0]}
              fontSize={0.12}
              color={project.color}
              anchorX="center"
              anchorY="middle"
            >
              {tech}
            </Text>
          ))}
        </group>
        
        {/* Glow effect on hover */}
        {hovered && (
          <pointLight
            position={[0, 0, 1]}
            intensity={0.5}
            color={project.color}
            distance={5}
          />
        )}
      </mesh>
    </group>
  );
}