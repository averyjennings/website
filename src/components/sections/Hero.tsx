import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { useEffect, useState } from 'react';

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background with Parallax */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
        animate={{
          backgroundPosition: `${mousePosition.x}px ${mousePosition.y}px`,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
      />
      
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-primary-200/30 dark:bg-primary-600/20 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 2,
            y: mousePosition.y * 2,
          }}
          transition={{ type: "spring", damping: 50, stiffness: 100 }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-secondary-200/30 dark:bg-secondary-600/20 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * -2,
            y: mousePosition.y * -2,
          }}
          transition={{ type: "spring", damping: 50, stiffness: 100 }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div 
          className="text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-gray-100 mb-6"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Hi, I'm{' '}
              <motion.span 
                className="gradient-text inline-block font-extrabold"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  ease: "linear",
                  repeat: Infinity,
                }}
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                Your Name
              </motion.span>
            </motion.h1>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Software Engineer passionate about building exceptional digital experiences
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button href="#projects" as="a" size="lg">
                View Projects
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button href="#contact" as="a" variant="secondary" size="lg">
                Get In Touch
              </Button>
            </motion.div>
          </motion.div>

          {/* Animated tech stack */}
          <motion.div
            variants={itemVariants}
            className="mt-16 flex flex-wrap justify-center gap-4"
          >
            {['React', 'TypeScript', 'Node.js', 'Python', 'AWS'].map((tech, index) => (
              <motion.span
                key={tech}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.1, backgroundColor: "rgb(59, 130, 246, 0.1)" }}
              >
                {tech}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.a 
            href="#about" 
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;