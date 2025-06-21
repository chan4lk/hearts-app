import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0B1120] via-[#132145] to-[#1E1B4B] z-50 flex items-center justify-center">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
        
        {/* Animated circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse-medium"></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-indigo-400 rounded-full animate-float-particle-${i + 1}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.2}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Loading Animation */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="w-24 h-24 rounded-full border-4 border-t-indigo-500 border-r-purple-500 border-b-blue-500 border-l-transparent animate-spin"></div>
          
          {/* Inner pulsing circle */}
          <div className="absolute inset-0 m-auto w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 rounded-full animate-pulse-fast flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#0B1120] flex items-center justify-center">
              <span className="text-2xl animate-bounce">📈</span>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 animate-gradient">
              Loading...
            </span>
          </h2>
          <div className="flex items-center gap-1.5 text-gray-400">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-loading-dot-1"></div>
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-loading-dot-2"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-loading-dot-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 