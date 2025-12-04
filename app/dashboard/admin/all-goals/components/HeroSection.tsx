import { motion } from 'framer-motion';
import { BsBullseye, BsArrowLeft } from 'react-icons/bs';
import Link from 'next/link';

export default function HeroSection() {
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
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin"
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <BsArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              All Users Goals
              <span className="inline-flex animate-bounce">🎯</span>
            </h2>
            <p className="text-purple-100 text-xs">View and manage goals across all users</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
          <BsBullseye className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

