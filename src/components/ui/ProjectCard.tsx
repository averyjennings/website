import { motion } from 'framer-motion';
import { useState } from 'react';

interface ProjectCardProps {
  title: string;
  description: string;
  technologies: string[];
  github: string;
  demo: string;
  image: string;
  index: number;
  category?: string;
  featured?: boolean;
  stars?: number;
  forks?: number;
  language?: string;
  updatedAt?: string;
}

const ProjectCard = ({ 
  title, 
  description, 
  technologies, 
  github, 
  demo, 
  index, 
  featured, 
  stars = 0, 
  forks = 0, 
  language, 
  updatedAt 
}: ProjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col relative"
    >
      {/* Featured badge */}
      {featured && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 + index * 0.1 }}
          className="absolute top-4 right-4 z-10"
        >
          <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
            Featured
          </span>
        </motion.div>
      )}

      {/* Project Image */}
      <div className="h-48 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-600 dark:from-primary-600 dark:to-secondary-800"
          animate={{
            opacity: isHovered ? 0.95 : 0.9,
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Animated pattern */}
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundPosition: isHovered ? ['0% 0%', '100% 100%'] : '0% 0%',
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              scale: isHovered ? 1.1 : 1,
              rotate: isHovered ? 5 : 0,
            }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="text-white text-4xl font-bold">{title.substring(0, 2).toUpperCase()}</span>
          </motion.div>
        </div>
      </div>

      {/* Project Content */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-1">
              {title}
            </h3>
            {language && (
              <motion.span
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full font-medium ml-2 flex-shrink-0"
                whileHover={{ scale: 1.05 }}
              >
                {language}
              </motion.span>
            )}
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{description}</p>
          
          {/* Repository Stats */}
          {(stars > 0 || forks > 0 || updatedAt) && (
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
              {stars > 0 && (
                <motion.div 
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>{stars}</span>
                </motion.div>
              )}
              {forks > 0 && (
                <motion.div 
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 18.178l-4.62-2.699C6.17 14.479 5.5 13.266 5.5 12s.67-2.479 1.88-3.479L12 5.822l4.62 2.699C17.83 9.521 18.5 10.734 18.5 12s-.67 2.479-1.88 3.479L12 18.178z" />
                    <path d="M12 0L5.46 3.22C3.36 4.45 2 6.64 2 9.05v5.9c0 2.41 1.36 4.6 3.46 5.83L12 24l6.54-3.22C20.64 19.55 22 17.36 22 14.95v-5.9c0-2.41-1.36-4.6-3.46-5.83L12 0z" />
                  </svg>
                  <span>{forks}</span>
                </motion.div>
              )}
              {updatedAt && (
                <motion.div 
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </motion.div>
              )}
            </div>
          )}

          {/* Technologies */}
          <div className="flex flex-wrap gap-2 mb-4">
            {technologies.slice(0, 4).map((tech, techIndex) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 + techIndex * 0.05 }}
                whileHover={{ scale: 1.1 }}
                className="text-xs px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full font-medium"
              >
                {tech}
              </motion.span>
            ))}
            {technologies.length > 4 && (
              <span className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                +{technologies.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <motion.a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group/link"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5 mr-2 group-hover/link:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Code</span>
          </motion.a>
          {demo && demo !== github && (
            <motion.a
              href={demo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group/link"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5 mr-2 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="font-medium">Demo</span>
            </motion.a>
          )}
          {(!demo || demo === github) && (
            <span className="flex items-center text-gray-400 dark:text-gray-500">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="font-medium text-sm">Repository</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;