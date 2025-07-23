import { motion } from 'framer-motion';
import ProjectCard from '../ui/ProjectCard';
import { useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const Projects = () => {
  const [filter, setFilter] = useState('all');
  const { ref: sectionRef, isInView } = useScrollAnimation({ threshold: 0.1 });

  const projects = [
    {
      title: 'E-Commerce Platform',
      description: 'A full-stack e-commerce solution with real-time inventory management, secure payment processing, and admin dashboard.',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe', 'Redis', 'Docker'],
      github: 'https://github.com',
      demo: 'https://example.com',
      image: '',
      category: 'fullstack',
      featured: true,
    },
    {
      title: 'Task Management System',
      description: 'A collaborative task management application with real-time updates, team collaboration features, and AI-powered insights.',
      technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Socket.io', 'Prisma', 'tRPC'],
      github: 'https://github.com',
      demo: 'https://example.com',
      image: '',
      category: 'fullstack',
      featured: true,
    },
    {
      title: 'Data Visualization Dashboard',
      description: 'An interactive analytics dashboard with beautiful charts, real-time data updates, and customizable widgets.',
      technologies: ['Vue.js', 'D3.js', 'Express', 'Python', 'Chart.js', 'WebSocket'],
      github: 'https://github.com',
      demo: 'https://example.com',
      image: '',
      category: 'frontend',
      featured: false,
    },
    {
      title: 'Machine Learning API',
      description: 'RESTful API service for ML model deployment with automatic scaling, monitoring, and versioning.',
      technologies: ['Python', 'FastAPI', 'TensorFlow', 'Docker', 'AWS', 'Redis'],
      github: 'https://github.com',
      demo: 'https://example.com',
      image: '',
      category: 'backend',
      featured: false,
    },
    {
      title: 'Mobile Fitness App',
      description: 'Cross-platform mobile application for fitness tracking with workout plans and progress analytics.',
      technologies: ['React Native', 'TypeScript', 'Firebase', 'Redux', 'Expo'],
      github: 'https://github.com',
      demo: 'https://example.com',
      image: '',
      category: 'mobile',
      featured: true,
    },
    {
      title: 'DevOps Automation Tool',
      description: 'CLI tool for automating deployment pipelines with infrastructure as code and monitoring integration.',
      technologies: ['Go', 'Kubernetes', 'Terraform', 'GitHub Actions', 'Prometheus'],
      github: 'https://github.com',
      demo: 'https://example.com',
      image: '',
      category: 'tools',
      featured: false,
    },
  ];

  const categories = [
    { id: 'all', label: 'All Projects' },
    { id: 'fullstack', label: 'Full Stack' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'mobile', label: 'Mobile' },
    { id: 'tools', label: 'Tools' },
  ];

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(project => project.category === filter);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <section id="projects" className="py-20 bg-gray-50 dark:bg-gray-800 relative overflow-hidden" ref={sectionRef}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary-100/30 to-transparent dark:from-primary-900/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4"
            whileInView={{ scale: [0.9, 1.02, 1] }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Featured Projects
          </motion.h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Here are some of my recent projects that showcase my skills and passion for development
          </p>
          
          {/* Filter buttons */}
          <motion.div 
            className="flex flex-wrap justify-center gap-2 mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => setFilter(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  filter === category.id
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category.label}
                {category.id === 'all' && (
                  <span className="ml-1 text-xs opacity-70">
                    ({projects.length})
                  </span>
                )}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          layout
        >
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.title}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.05,
                layout: {
                  type: "spring",
                  bounce: 0.4,
                },
              }}
            >
              <ProjectCard
                {...project}
                index={index}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* View more on GitHub */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
        >
          <motion.a
            href={`https://github.com/${import.meta.env.VITE_GITHUB_USERNAME || 'yourusername'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>View all projects on GitHub</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default Projects;