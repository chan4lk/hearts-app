import { motion } from "framer-motion";
import { BsStarFill, BsBarChart, BsLightning } from "react-icons/bs";

interface HeroSectionProps {
  userRole?: string;
}

export function HeroSection({ userRole }: HeroSectionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-xl shadow-lg">
        {/* Ambient background effect */}
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute right-1/4 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform -translate-y-1/2"></div>
          <div className="absolute left-1/4 bottom-0 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl transform translate-y-1/2"></div>
        </div>

        {/* Content */}
        <div className="relative px-5 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Title group */}
            <div className="flex-1 flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 15 }}
                className="bg-white/15 p-2 rounded-lg backdrop-blur-sm"
              >
                <BsLightning className="w-4 h-4 text-yellow-300" />
              </motion.div>
              <div>
                <h1 className="text-xl font-semibold text-white">Self Rating</h1>
                <p className="text-indigo-100/70 text-xs">
                  {userRole === 'MANAGER' 
                    ? 'Rate your performance on your goals'
                    : 'Rate your performance on assigned goals'}
                </p>
              </div>
            </div>

            {/* Action buttons - Combined into a single control */}
            <motion.div 
              className="flex bg-white/10 rounded-lg p-1 backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
            >
              <motion.button
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                className="px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors"
              >
                <BsStarFill className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-xs font-medium text-white">Rate</span>
              </motion.button>
              <motion.button
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                className="px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors"
              >
                <BsBarChart className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-xs font-medium text-white">Stats</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 