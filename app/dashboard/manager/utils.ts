import { BsShield, BsClock, BsXCircle, BsArrowRight, BsCheckCircle, BsChat } from 'react-icons/bs';
import { StatusStyle, GoalStatus } from './types';
import React from 'react';

const createIcon = (Icon: React.ComponentType<{ className?: string }>, className: string) => {
  return React.createElement(Icon, { className });
};

export const STATUS_STYLES: Record<Exclude<GoalStatus, 'DELETED'>, StatusStyle> = {
  APPROVED: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    icon: createIcon(BsShield, 'w-4 h-4'),
    gradient: 'from-emerald-500/10'
  },
  PENDING: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    icon: createIcon(BsClock, 'w-4 h-4'),
    gradient: 'from-amber-500/10'
  },
  REJECTED: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    icon: createIcon(BsXCircle, 'w-4 h-4'),
    gradient: 'from-rose-500/10'
  },
  MODIFIED: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    icon: createIcon(BsArrowRight, 'w-4 h-4'),
    gradient: 'from-blue-500/10'
  },
  COMPLETED: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    icon: createIcon(BsCheckCircle, 'w-4 h-4'),
    gradient: 'from-purple-500/10'
  },
  DRAFT: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    icon: createIcon(BsChat, 'w-4 h-4'),
    gradient: 'from-gray-500/10'
  }
};

export const getStatusStyle = (status: GoalStatus): StatusStyle => {
  if (status === 'DELETED') {
    return {
      bg: 'bg-gray-500/10',
      text: 'text-gray-400',
      icon: createIcon(BsXCircle, 'w-4 h-4'),
      gradient: 'from-gray-500/10'
    };
  }
  return STATUS_STYLES[status as keyof typeof STATUS_STYLES];
}; 