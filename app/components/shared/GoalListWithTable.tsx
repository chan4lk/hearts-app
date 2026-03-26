'use client';

import { ReactNode } from 'react';

const wrapperClass =
  'card-base';
const paginationBorderClass = 'mt-6 pt-4 border-t border-theme';

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
