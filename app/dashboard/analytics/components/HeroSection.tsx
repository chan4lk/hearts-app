'use client';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { BsBarChart } from 'react-icons/bs';

interface HeroSectionProps {
  userRole?: string;
}

export default function HeroSection({ userRole }: HeroSectionProps) {
  const { data: session } = useSession();
  const currentUserRole = userRole || session?.user?.role;

  const pageTitle = currentUserRole === 'ADMIN' 
    ? 'Analytics Dashboard' 
    : currentUserRole === 'MANAGER' 
      ? 'Team Analytics Dashboard' 
      : 'My Performance Analytics';

  const pageDescription = currentUserRole === 'ADMIN' 
    ? 'Organization-wide performance metrics and insights' 
    : currentUserRole === 'MANAGER' 
      ? 'Performance metrics for your team members' 
      : 'Your personal performance metrics and insights';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-lg p-4 shadow-lg"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BsBarChart className="w-5 h-5" />
            {pageTitle}
          </h2>
          <p className="text-purple-100 text-xs">{pageDescription}</p>
        </div>
      </div>
    </motion.div>
  );
}

