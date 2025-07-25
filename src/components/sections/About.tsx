import { motion, useAnimation } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useEffect } from 'react';

const About = () => {
  const skills = [
    { 
      category: 'Frontend', 
      items: ['React', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Responsive Design'],
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      category: 'Backend', 
      items: ['Node.js', 'Python', 'REST APIs', 'Database Design', 'Server Architecture'],
      color: 'from-green-500 to-emerald-500'
    },
    { 
      category: 'Cloud & Tools', 
      items: ['AWS', 'Git', 'CI/CD', 'Docker', 'Linux', 'Agile'],
      color: 'from-purple-500 to-pink-500'
    },
  ];

  const { ref: sectionRef, isInView } = useScrollAnimation({ threshold: 0.2 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <section id="about" className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-white dark:bg-gray-900 relative overflow-hidden" ref={sectionRef}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-primary-100/20 to-secondary-100/20 dark:from-primary-900/10 dark:to-secondary-900/10 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-secondary-100/20 to-primary-100/20 dark:from-secondary-900/10 dark:to-primary-900/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-10 lg:mb-12 xl:mb-16"
        >
          <motion.h2 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 lg:mb-6 leading-tight tracking-tight"
            whileInView={{ scale: [0.9, 1.02, 1] }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            About Me
          </motion.h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
            Passionate about creating elegant solutions to complex problems
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          animate={controls}
        >
          {/* About text */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 lg:mb-6 leading-tight">
              Building the future, one line at a time
            </h3>
            <div className="space-y-3 sm:space-y-4 lg:space-y-6 text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
              >
                I'm a software engineer with a passion for creating innovative solutions that make
                a difference. With expertise in modern web technologies, I specialize in building
                scalable, user-friendly applications.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                My journey in tech has been driven by curiosity and a desire to solve real-world
                problems. I believe in writing clean, maintainable code and staying up-to-date with
                the latest industry trends.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                When I'm not coding, you can find me contributing to open-source projects,
                exploring new technologies, or sharing knowledge with the developer community.
              </motion.p>
            </div>
            
            {/* Stats */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8 lg:mt-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
            >
              {[
                { label: 'Years Experience', value: '5+' },
                { label: 'Projects Completed', value: '50+' },
                { label: 'Happy Clients', value: '30+' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  className="text-center p-3 sm:p-4 lg:p-6 bg-gray-50 dark:bg-gray-800 rounded-lg touch-manipulation"
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400 leading-tight">{stat.value}</div>
                  <div className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Skills */}
          <motion.div variants={itemVariants} className="space-y-4 sm:space-y-5 lg:space-y-6">
            {skills.map((skillGroup, index) => (
              <motion.div
                key={skillGroup.category}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 sm:p-5 lg:p-6 relative overflow-hidden group touch-manipulation"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Gradient overlay on hover */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${skillGroup.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />
                
                <h4 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 relative z-10">
                  {skillGroup.category}
                </h4>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 lg:gap-3 relative z-10">
                  {skillGroup.items.map((skill, skillIndex) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 200,
                        delay: index * 0.1 + skillIndex * 0.05 
                      }}
                      viewport={{ once: true }}
                      whileHover={{ 
                        scale: 1.1,
                        rotate: [-1, 1, -1, 0],
                        transition: { duration: 0.2 }
                      }}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-xs sm:text-sm lg:text-base font-medium hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 dark:hover:from-gray-600 dark:hover:to-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 shadow-sm hover:shadow-md cursor-default touch-manipulation"
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;