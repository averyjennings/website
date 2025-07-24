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
    <section id="about" className="py-20 bg-white dark:bg-gray-900 relative overflow-hidden" ref={sectionRef}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-primary-100/20 to-secondary-100/20 dark:from-primary-900/10 dark:to-secondary-900/10 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-secondary-100/20 to-primary-100/20 dark:from-secondary-900/10 dark:to-primary-900/10 blur-3xl" />
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
            About Me
          </motion.h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Passionate about creating elegant solutions to complex problems
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate={controls}
        >
          {/* About text */}
          <motion.div variants={itemVariants}>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Building the future, one line at a time
            </h3>
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
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
              className="grid grid-cols-3 gap-4 mt-8"
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
                  className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Skills */}
          <motion.div variants={itemVariants} className="space-y-6">
            {skills.map((skillGroup, index) => (
              <motion.div
                key={skillGroup.category}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 relative overflow-hidden group"
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
                
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 relative z-10">
                  {skillGroup.category}
                </h4>
                <div className="flex flex-wrap gap-2 relative z-10">
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
                      className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-sm font-medium hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 dark:hover:from-gray-600 dark:hover:to-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 shadow-sm hover:shadow-md cursor-default"
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