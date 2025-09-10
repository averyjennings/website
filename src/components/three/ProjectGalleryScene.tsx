import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float } from '@react-three/drei';
import { Suspense } from 'react';
import { ProjectCard3D } from './ProjectCard3D';
import { ParticleField } from './ParticleField';
import { CSSLoadingSpinner } from '../ui/CSSLoadingSpinner';

export interface Project3D {
  id: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  link: string;
  position: [number, number, number];
  color: string;
}

interface ProjectGallerySceneProps {
  projects: Project3D[];
}

export function ProjectGalleryScene({ projects }: ProjectGallerySceneProps) {
  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-gray-900 to-black rounded-xl overflow-hidden">
      <Suspense fallback={
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
          <CSSLoadingSpinner size={80} className="mb-4" />
          <p className="text-white text-lg animate-pulse">Loading 3D Gallery...</p>
          <p className="text-gray-400 text-sm mt-2">This may take a moment on first load</p>
        </div>
      }>
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={60} />
          
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <spotLight 
            position={[0, 10, 0]} 
            angle={0.3} 
            penumbra={1} 
            intensity={1} 
            castShadow 
          />
          
          {/* Environment */}
          <Environment preset="city" />
          <fog attach="fog" args={['#000000', 10, 30]} />
          
          {/* Particle Field Background */}
          <ParticleField count={500} />
          
          {/* Project Cards */}
          {projects.map((project, index) => (
            <Float
              key={project.id}
              speed={1.5}
              rotationIntensity={0.5}
              floatIntensity={0.5}
              floatingRange={[-0.1, 0.1]}
            >
              <ProjectCard3D 
                project={project} 
                index={index}
              />
            </Float>
          ))}
          
          {/* Controls */}
          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            minDistance={5}
            maxDistance={20}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}