import { motion } from 'framer-motion';
import { ScrollTriggeredLottie } from './ScrollTriggeredLottie';
import skillsGearAnimation from '@/assets/animations/skills-gear.json';

interface AnimatedSkillCardProps {
  category: string;
  items: string[];
  color: string;
  delay?: number;
}

export function AnimatedSkillCard({ category, items, color, delay = 0 }: AnimatedSkillCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 100 }}
      whileHover={{ y: -5 }}
      className="relative group"
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Gradient background on hover */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
        />
        
        {/* Animated icon */}
        <div className="absolute top-2 right-2 w-16 h-16 opacity-10 group-hover:opacity-20 transition-opacity">
          <ScrollTriggeredLottie
            animationData={skillsGearAnimation}
            loop={false}
            playOnce={false}
          />
        </div>
        
        {/* Content */}
        <h3 className={`text-xl font-bold mb-4 bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
          {category}
        </h3>
        
        <ul className="space-y-2">
          {items.map((skill, index) => (
            <motion.li
              key={skill}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + index * 0.1 }}
              className="flex items-center gap-2"
            >
              <motion.span
                className={`w-2 h-2 rounded-full bg-gradient-to-r ${color}`}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
              />
              <span className="text-gray-600 dark:text-gray-300">{skill}</span>
            </motion.li>
          ))}
        </ul>
        
        {/* Decorative elements */}
        <motion.div
          className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: delay + 0.5, duration: 0.5 }}
          style={{ transformOrigin: 'left' }}
        />
      </div>
    </motion.div>
  );
}