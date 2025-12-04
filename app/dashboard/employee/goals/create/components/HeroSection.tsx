import { motion } from 'framer-motion';
import { BsPlus, BsStars } from 'react-icons/bs';
import { useSession } from 'next-auth/react';

interface HeroSectionProps {
  onCreateClick: () => void;
  totalGoals: number;
  completedGoals: number;
}

export const HeroSection = ({ onCreateClick, totalGoals, completedGoals }: HeroSectionProps) => {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'User';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-lg p-4 shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Create Your Goals, {userName}
            <span className="inline-flex animate-bounce">✨</span>
          </h2>
          <p className="text-purple-100 text-xs">Define your personal objectives and growth targets</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCreateClick}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-200 border border-white/30"
        >
          <BsPlus className="w-5 h-5" />
          <span className="text-sm font-medium">Create Goal</span>
        </motion.button>
      </div>
    </motion.div>
  );
};
