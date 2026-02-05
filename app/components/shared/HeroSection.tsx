'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Button } from '@/app/components/ui/button';
import { BsPlus, BsCollection } from 'react-icons/bs';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  gradient?: string; // e.g., 'from-teal-600 to-cyan-600'
  children?: ReactNode;
  useSessionName?: boolean; // if true, requires useSession hook
  onCreateClick?: () => void;
  onBulkCreateClick?: () => void;
}

export default function HeroSection({
  title,
  subtitle = "Manage your organization's goals and users",
  userName,
  gradient = 'from-teal-600 to-cyan-600',
  children,
  useSessionName = false,
  onCreateClick,
  onBulkCreateClick
}: HeroSectionProps) {
  // If useSessionName is true, the parent component should pass userName
  const displayName = userName || 'User';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-xl p-6 shadow-lg bg-gradient-to-r ${gradient}`}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" 
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative flex items-center justify-between">
        <div className="space-y-2 flex-1">
          {title ? (
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {title}
            </h2>
          ) : (
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Welcome back, {displayName}
            </h2>
          )}
          {subtitle && (
            <p className="text-white/90 text-sm">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onBulkCreateClick && (
            <Button 
              onClick={onBulkCreateClick} 
              variant="outline" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 border-0"
            >
              <BsCollection className="mr-2 h-4 w-4" />
              Bulk Create
            </Button>
          )}
          {onCreateClick && (
            <Button 
              onClick={onCreateClick} 
              className="bg-white text-teal-600 hover:bg-white/90 border-0"
            >
              <BsPlus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          )}
          {children}
        </div>
      </div>
    </motion.div>
  );
}
