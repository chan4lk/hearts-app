import { motion } from 'framer-motion';
import { IconType } from 'react-icons';
import { BsArrowUpRight } from 'react-icons/bs';

interface StatsCardProps {
  icon: IconType;
  title: string;
  value: number;
  total: number;
  color: string;
  delay?: number;
}

export default function StatsCard({ icon: Icon, title, value, total, color, delay = 0 }: StatsCardProps) {
  return (
    <motion.div variants={itemVariants} className="group">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-lg p-3 shadow-md hover:shadow-lg transition-all duration-300 border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 bg-gradient-to-br ${color} rounded-lg`}>
            <Icon className="text-base text-white" />
          </div>
          <BsArrowUpRight className="text-sm text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">{value}</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">{title}</p>
        <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(value / total) * 100}%` }}
            transition={{ duration: 1, delay }}
            className={`h-full bg-gradient-to-r ${color} rounded-full`}
          />
        </div>
      </div>
    </motion.div>
  );
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}; 