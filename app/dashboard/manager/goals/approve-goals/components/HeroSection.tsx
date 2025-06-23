import { motion } from 'framer-motion';
import { BsStars, BsBarChart } from 'react-icons/bs';

export default function HeroSection() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-xl p-6 shadow-lg"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
            Approve Goals
            <span className="inline-flex animate-bounce">✨</span>
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
            <p className="text-white/80">Review and manage pending employee goals</p>
          </div>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-white/30 transition-all duration-300"
          >
            <BsStars className="text-lg text-white" />
            <span className="text-white text-sm">Review Goals</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-white/30 transition-all duration-300"
          >
            <BsBarChart className="text-lg text-white" />
            <span className="text-white text-sm">Analytics</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
} 