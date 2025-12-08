import { motion } from 'framer-motion';
import { BsPersonPlus } from 'react-icons/bs';
import { useSession } from 'next-auth/react';

interface HeroSectionProps {
  onAddUser: () => void;
}

export default function HeroSection({ onAddUser }: HeroSectionProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Admin';

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
            User Management, {userName}
            <span className="inline-flex animate-bounce">👥</span>
          </h2>
          <p className="text-purple-100 text-xs">Manage your team members and their roles</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddUser}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/20 text-white rounded-lg shadow-sm hover:shadow transition-all duration-200 border border-white/30 hover:border-white/50"
        >
          <span className="text-sm font-medium">Add User</span>
          <div className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10">
            <BsPersonPlus className="w-4 h-4" />
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}
