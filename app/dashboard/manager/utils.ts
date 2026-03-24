import { BsShield, BsClock, BsXCircle, BsArrowRight, BsCheckCircle, BsChat, BsPlayCircle, BsStopCircle, BsPauseCircle, BsExclamationCircle } from 'react-icons/bs';
import { StatusStyle, Goal } from '@/app/components/shared/types';
import React from 'react';

type GoalStatus = Goal['status'];

const createIcon = (Icon: React.ComponentType<{ className?: string }>, className: string) => {
  return React.createElement(Icon, { className });
};

export const STATUS_STYLES: Record<Exclude<GoalStatus, 'DELETED'>, StatusStyle> = {
  APPROVED: {
    bg: 'bg-success-muted',
    text: 'text-success',
    icon: createIcon(BsShield, 'w-4 h-4'),
    gradient: 'from-[rgb(var(--color-success))]/10'
  },
  PENDING: {
    bg: 'bg-[rgb(var(--color-warning))]/10',
    text: 'text-warning',
    icon: createIcon(BsClock, 'w-4 h-4'),
    gradient: 'from-[rgb(var(--color-warning))]/10'
  },
  REJECTED: {
    bg: 'bg-error-muted',
    text: 'text-error',
    icon: createIcon(BsXCircle, 'w-4 h-4'),
    gradient: 'from-[rgb(var(--color-error))]/10'
  },
  MODIFIED: {
    bg: 'bg-cat-professional',
    text: 'text-cat-professional',
    icon: createIcon(BsArrowRight, 'w-4 h-4'),
    gradient: 'from-[rgb(var(--color-info))]/10'
  },
  COMPLETED: {
    bg: 'bg-cat-technical',
    text: 'text-cat-technical',
    icon: createIcon(BsCheckCircle, 'w-4 h-4'),
    gradient: 'from-[rgb(var(--color-cat-technical))]/10'
  },
  DRAFT: {
    bg: 'bg-surface-secondary',
    text: 'text-tertiary',
    icon: createIcon(BsChat, 'w-4 h-4'),
    gradient: 'from-gray-500/10'
  },
  IN_PROGRESS: {
    bg: 'bg-cat-professional',
    text: 'text-cat-professional',
    icon: createIcon(BsPlayCircle, 'w-4 h-4'),
    gradient: 'from-[rgb(var(--color-info))]/10'
  },
  ON_HOLD: {
    bg: 'bg-[rgb(var(--color-warning))]/10',
    text: 'text-warning',
    icon: createIcon(BsPauseCircle, 'w-4 h-4'),
    gradient: 'from-[rgb(var(--color-warning))]/10'
  },
  BLOCKED: {
    bg: 'bg-error-muted',
    text: 'text-error',
    icon: createIcon(BsExclamationCircle, 'w-4 h-4'),
    gradient: 'from-[rgb(var(--color-error))]/10'
  }
};

export const getStatusStyle = (status: GoalStatus): StatusStyle => {
  if (status === 'DELETED') {
    return {
      bg: 'bg-surface-secondary',
      text: 'text-tertiary',
      icon: createIcon(BsXCircle, 'w-4 h-4'),
      gradient: 'from-gray-500/10'
    };
  }
  return STATUS_STYLES[status as keyof typeof STATUS_STYLES];
}; 