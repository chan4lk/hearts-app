import React from 'react';
import { motion } from 'framer-motion';

const LoadingComponent = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-primary">
      {/* Subtle nebula glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative flex flex-col items-center gap-6">
        {/* Orbital spinner */}
        <div className="relative w-12 h-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-r-purple-500/50"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-1 rounded-full border border-transparent border-b-indigo-400/30"
          />
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-2 h-2 rounded-full bg-indigo-400"
            />
          </div>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
              className="w-1.5 h-1.5 rounded-full bg-slate-500"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingComponent;
