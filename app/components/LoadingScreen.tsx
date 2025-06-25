import React from 'react';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
  type: 'admin' | 'employee' | 'manager';
}

const DashboardLayout = ({ children, type }: DashboardLayoutProps) => {
  return <div className={`dashboard-${type}`}>{children}</div>;
};

const LoadingComponent = () => {
  return (
    <div className="fixed inset-0 w-full h-full z-[9999] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-violet-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Loading content */}
      <div className="fixed inset-0 flex flex-col items-center justify-center min-h-screen w-full p-4">
        {/* Main spinner */}
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 p-[2px]"
          >
            <div className="w-full h-full rounded-xl bg-slate-50 dark:bg-gray-900"></div>
          </motion.div>
          
          {/* Orbital elements */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-8 border border-violet-500/30 rounded-full"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-16 border border-indigo-500/20 rounded-full"
          />
          
          {/* Floating dots */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2 w-2 h-2 bg-violet-500 rounded-full"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -bottom-2 -left-2 w-2 h-2 bg-fuchsia-500 rounded-full"
          />
        </div>

        {/* Loading text */}
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mt-8 text-center"
        >
          <div className="text-lg font-medium text-gray-800 dark:text-white">Loading</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Please wait while we prepare your content</div>
        </motion.div>

        {/* Progress bar */}
        <div className="mt-6 w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut"
            }}
            className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingComponent;