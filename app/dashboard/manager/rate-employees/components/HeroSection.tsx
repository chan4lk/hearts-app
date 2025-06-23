import { motion } from "framer-motion";
import { BsStars, BsBarChart, BsArrowUpRight } from "react-icons/bs";

export default function HeroSection() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative px-4"
    >
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl overflow-hidden">
        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        {/* Glass Card */}
        <div className="relative backdrop-blur-sm border border-white/10 rounded-2xl">
          <div className="p-6 flex flex-col lg:flex-row items-center gap-6">
            {/* Left Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="relative w-10 h-10"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-violet-500 rounded-lg rotate-45"></div>
                  <div className="absolute inset-0.5 bg-violet-600 rounded-lg rotate-45"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BsStars className="w-5 h-5 text-white" />
                  </div>
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Rate Employees
                  </h1>
                  <p className="text-indigo-200 text-sm">
                    Performance evaluation dashboard
                  </p>
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 transition-all"
              >
                <BsStars className="w-4 h-4 text-pink-300 group-hover:rotate-12 transition-transform" />
                <span className="text-sm text-white">Review</span>
                <BsArrowUpRight className="w-3 h-3 text-pink-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 transition-all"
              >
                <BsBarChart className="w-4 h-4 text-blue-300 group-hover:translate-y-[-1px] transition-transform" />
                <span className="text-sm text-white">Stats</span>
                <BsArrowUpRight className="w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </motion.button>
            </div>
          </div>

          
        </div>
      </div>
    </motion.div>
  );
} 