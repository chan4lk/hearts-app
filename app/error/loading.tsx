'use client';

import { motion } from 'framer-motion';

const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-primary">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        className="w-6 h-6 border-2 border-transparent border-t-indigo-500 border-r-purple-500/50 rounded-full"
      />
    </div>
  );
};

export default Loading;
