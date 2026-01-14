'use client';

import { useState } from 'react';
import { BsPencil, BsTrash, BsCalendar, BsPerson, BsBriefcase } from 'react-icons/bs';

interface ReviewCycle {
  id: string;
  userId: string;
  reportingPersonId?: string | null;
  jobCategory: string | null;
  designation: string | null;
  dateOfAppointment: string | null;
  after6Months: string | null;
  reviewMonth: string | null;
  adjustedReviewMonth: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    manager?: {
      id: string;
      name: string;
      email: string;
    } | null;
  };
  reportingPerson?: {
    id: string;
    name: string;
    email: string;
  } | null;
  updatedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface ReviewCycleTableProps {
  reviewCycles: ReviewCycle[];
  onEdit: (cycle: ReviewCycle) => void;
  onDelete: (cycle: ReviewCycle) => void;
  onRefresh: () => void;
}

export default function ReviewCycleTable({ reviewCycles, onEdit, onDelete, onRefresh }: ReviewCycleTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key && prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedCycles = [...reviewCycles].sort((a, b) => {
    if (!sortConfig) return 0;

    let aValue: any = a;
    let bValue: any = b;

    for (const key of sortConfig.key.split('.')) {
      aValue = aValue?.[key];
      bValue = bValue?.[key];
    }

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <span className="text-white/60 text-xs">⇅</span>;
    }
    return (
      <span className="text-yellow-300 font-bold text-sm drop-shadow-lg">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex flex-col h-full">
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
          <table className="w-full table-fixed min-w-full">
            <thead className="sticky top-0 z-20 bg-gradient-to-r from-teal-600 to-cyan-600 border-b-2 border-teal-700 shadow-md">
            <tr>
              <th
                className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-teal-700 transition-colors whitespace-nowrap"
                style={{ width: '12%' }}
                onClick={() => handleSort('user.name')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Employee</span>
                  {getSortIcon('user.name')}
                </div>
              </th>
              <th
                className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-teal-700 transition-colors whitespace-nowrap"
                style={{ width: '12%' }}
                onClick={() => handleSort('reportingPerson.name')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Reporting Person</span>
                  {getSortIcon('reportingPerson.name')}
                </div>
              </th>
              <th
                className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-teal-700 transition-colors whitespace-nowrap"
                style={{ width: '10%' }}
                onClick={() => handleSort('jobCategory')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Job Category</span>
                  {getSortIcon('jobCategory')}
                </div>
              </th>
              <th
                className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-teal-700 transition-colors whitespace-nowrap"
                style={{ width: '12%' }}
                onClick={() => handleSort('designation')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Designation</span>
                  {getSortIcon('designation')}
                </div>
              </th>
              <th
                className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-teal-700 transition-colors whitespace-nowrap"
                style={{ width: '11%' }}
                onClick={() => handleSort('dateOfAppointment')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Appointment Date</span>
                  {getSortIcon('dateOfAppointment')}
                </div>
              </th>
              <th className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap" style={{ width: '8%' }}>6 Months</th>
              <th className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap" style={{ width: '9%' }}>Review Month</th>
              <th className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap" style={{ width: '9%' }}>Adjusted</th>
              <th className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap" style={{ width: '7%' }}>Actions</th>
            </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedCycles.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <BsCalendar className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">No review cycles found</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Click "Add Review Cycle" to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedCycles.map((cycle) => {
                const hasAdjustment = cycle.adjustedReviewMonth && 
                                     cycle.reviewMonth && 
                                     cycle.adjustedReviewMonth !== cycle.reviewMonth;
                
                return (
                  <tr
                    key={cycle.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors whitespace-nowrap ${
                      hasAdjustment ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-[11px] text-gray-900 dark:text-gray-100 font-medium truncate">
                      {cycle.user.name}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-gray-700 dark:text-gray-300 truncate">
                      {cycle.reportingPerson?.name || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-gray-700 dark:text-gray-300 truncate">
                      {cycle.jobCategory || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-gray-700 dark:text-gray-300 truncate">
                      {cycle.designation || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {formatDate(cycle.dateOfAppointment)}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {cycle.after6Months || <span className="text-gray-400">-</span>}
                    </td>
                    <td className={`py-2 px-3 text-[11px] whitespace-nowrap ${hasAdjustment ? 'text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                      {cycle.reviewMonth || <span className="text-gray-400">-</span>}
                    </td>
                    <td className={`py-2 px-3 text-[11px] whitespace-nowrap ${hasAdjustment ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                      {hasAdjustment ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          {cycle.adjustedReviewMonth}
                        </span>
                      ) : (
                        cycle.adjustedReviewMonth || <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onEdit(cycle)}
                          className="p-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                          title="Edit"
                        >
                          <BsPencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDelete(cycle)}
                          className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <BsTrash className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

