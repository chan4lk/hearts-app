import { motion } from 'framer-motion';
import { BsBullseye, BsArrowLeft } from 'react-icons/bs';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl p-4 shadow-lg bg-gradient-to-r from-teal-600 to-cyan-600 border-b border-teal-500/30"
    >

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <BsBullseye className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              All Users Goals
            </h2>
            <p className="text-white/90 text-[11px]">View and manage goals across all users</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

