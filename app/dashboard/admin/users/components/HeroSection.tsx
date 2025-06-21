import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-xl rounded-xl p-4 text-white shadow-lg border border-white/20">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-xl" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1 bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-sm text-indigo-100/90">Manage your team members and their roles</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 