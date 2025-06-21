import { motion } from 'framer-motion';
import { IconType } from 'react-icons';

interface StatsCardProps {
  icon: IconType;
  title: string;
  value: number;
  total: number;
  color: string;
  delay?: number;
}

export default function StatsCard({ icon: Icon, title, value, total, color, delay = 0 }: StatsCardProps) {
  const percentage = (value / total) * 100;
  
  return (
    <motion.div variants={itemVariants} className="group">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2.5 shadow-sm border border-white/10 dark:border-gray-700/30 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`p-1.5 bg-gradient-to-br ${color} rounded-md`}>
            <Icon className="text-sm text-white" />
          </div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{title}</p>
        </div>
        
        <div className="flex items-end gap-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{value}</h3>
          <div className="flex-1 h-4 flex items-end">
            <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, delay }}
                className={`h-full bg-gradient-to-r ${color}`}
              />
            </div>
          </div>
        </div>

        <div className="absolute -right-8 -bottom-8 w-16 h-16 bg-gradient-to-br from-current to-transparent opacity-5 rounded-full blur-xl transition-opacity group-hover:opacity-10"
          style={{ color: color.split(' ')[1].replace('to-', '') }}
        />
      </div>
    </motion.div>
  );
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}; 