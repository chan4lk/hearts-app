'use client';

import { motion } from 'framer-motion';

const Loading = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 0.8, 1]
            }}
            transition={{
              rotate: { duration: 1.2, repeat: Infinity, ease: "linear" },
              scale: { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 border-r-purple-500 rounded-full"
          />
        </div>
    );
  };

export default Loading;