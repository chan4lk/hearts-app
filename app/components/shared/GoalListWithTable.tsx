'use client';

import { ReactNode } from 'react';

const wrapperClass =
  'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/50 overflow-hidden shadow-lg';
const paginationBorderClass = 'mt-6 pt-4 border-t border-gray-700/50';

/**
 * Shared wrapper: same card style as GoalsSection, with a slot for content (GoalsTable + optional Pagination).
 * Use for pages that show a single list of goals without Assigned/Created tabs.
 */
interface GoalListWithTableProps {
  children: ReactNode;
  className?: string;
}

export default function GoalListWithTable({ children, className = '' }: GoalListWithTableProps) {
  return (
    <div className={wrapperClass}>
      <div className={`p-4 ${className}`}>{children}</div>
    </div>
  );
}

export { paginationBorderClass };
