import { useState } from 'react';
import { motion } from 'framer-motion';
import { ProjectGalleryScene, Project3D } from './ProjectGalleryScene';

interface ProjectGallery3DProps {
  projects: Array<{
    id: string;
    title: string;
    description: string;
    image?: string;
    technologies: string[];
    github?: string;
    live?: string;
    featured?: boolean;
  }>;
}

export function ProjectGallery3D({ projects }: ProjectGallery3DProps) {
  const [view, setView] = useState<'2d' | '3d'>('3d');

  // Convert projects to 3D format with positions
  const projects3D: Project3D[] = projects.map((project, index) => {
    // Arrange projects in a circle
    const angle = (index / projects.length) * Math.PI * 2;
    const radius = 4;
    
    return {
      ...project,
      position: [
        Math.cos(angle) * radius,
        Math.sin(angle) * 2,
        Math.sin(angle) * radius,
      ] as [number, number, number],
      color: project.featured ? '#3b82f6' : '#8b5cf6',
      link: project.live || project.github || '#',
      image: project.image || '',
    };
  });

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setView('2d')}
          className={`px-4 py-2 rounded-lg transition-all ${
            view === '2d'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          2D View
        </button>
        <button
          onClick={() => setView('3d')}
          className={`px-4 py-2 rounded-lg transition-all ${
            view === '3d'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          3D View
        </button>
      </div>

      {/* Gallery View */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {view === '3d' ? (
          <div>
            <ProjectGalleryScene projects={projects3D} />
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              Click and drag to rotate • Scroll to zoom • Click cards to open projects
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4">
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      GitHub
                    </a>
                  )}
                  {project.live && (
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Live Demo
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}