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
      return <span className="text-gray-500">⇅</span>;
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/50 overflow-hidden shadow-lg">
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-800/50 bg-blue-900/20">
                <th
                  className="text-left py-3 px-4 text-sm font-semibold text-gray-300 cursor-pointer hover:bg-white/5 transition-colors select-none"
                  onClick={() => handleSort('user.name')}
                >
                  <div className="flex items-center gap-2">
                    <BsPerson className="w-4 h-4" />
                    <span>Full Name</span>
                    {getSortIcon('user.name')}
                  </div>
                </th>
                <th
                  className="text-left py-3 px-4 text-sm font-semibold text-gray-300 cursor-pointer hover:bg-white/5 transition-colors select-none"
                  onClick={() => handleSort('reportingPerson.name')}
                >
                  <div className="flex items-center gap-2">
                    <BsPerson className="w-4 h-4" />
                    <span>Reporting Person</span>
                    {getSortIcon('reportingPerson.name')}
                  </div>
                </th>
                <th
                  className="text-left py-3 px-4 text-sm font-semibold text-gray-300 cursor-pointer hover:bg-white/5 transition-colors select-none"
                  onClick={() => handleSort('jobCategory')}
                >
                  <div className="flex items-center gap-2">
                    <BsBriefcase className="w-4 h-4" />
                    <span>Job Category</span>
                    {getSortIcon('jobCategory')}
                  </div>
                </th>
                <th
                  className="text-left py-3 px-4 text-sm font-semibold text-gray-300 cursor-pointer hover:bg-white/5 transition-colors select-none"
                  onClick={() => handleSort('designation')}
                >
                  <span>Designation</span>
                  {getSortIcon('designation')}
                </th>
                <th
                  className="text-left py-3 px-4 text-sm font-semibold text-gray-300 cursor-pointer hover:bg-white/5 transition-colors select-none"
                  onClick={() => handleSort('dateOfAppointment')}
                >
                  <div className="flex items-center gap-2">
                    <BsCalendar className="w-4 h-4" />
                    <span>Date of Appointment</span>
                    {getSortIcon('dateOfAppointment')}
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">After 6 Months</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Review Month</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Adjusted Review Month</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCycles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-xl"></div>
                        <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full flex items-center justify-center border-2 border-indigo-500/30">
                          <BsCalendar className="w-8 h-8 text-indigo-400" />
                        </div>
                      </div>
                      <p className="text-lg font-medium text-gray-300 mb-1">No review cycles found</p>
                      <p className="text-sm text-gray-500">Click "Add Review Cycle" to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedCycles.map((cycle, index) => {
                  // Check if adjusted review month is different from review month
                  const hasAdjustment = cycle.adjustedReviewMonth && 
                                       cycle.reviewMonth && 
                                       cycle.adjustedReviewMonth !== cycle.reviewMonth;
                  
                  return (
                  <tr
                    key={cycle.id}
                    className={`border-b transition-colors ${
                      hasAdjustment
                        ? 'bg-indigo-500/10 hover:bg-indigo-500/15 border-l-4 border-l-indigo-500 border-indigo-400/20'
                        : index % 2 === 0 
                          ? 'bg-gray-800/30 hover:bg-gray-700/40 border-white/5'
                          : 'bg-gray-800/50 hover:bg-gray-700/50 border-white/5'
                    }`}
                  >
                    <td className="py-3 px-4 text-sm text-gray-300">{cycle.user.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {cycle.reportingPerson?.name || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">{cycle.jobCategory || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{cycle.designation || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {formatDate(cycle.dateOfAppointment)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">{cycle.after6Months || '-'}</td>
                    <td className={`py-3 px-4 text-sm ${hasAdjustment ? 'text-gray-400' : 'text-gray-300'}`}>
                      {hasAdjustment ? (
                        <span className="line-through decoration-2 decoration-red-400/70">
                          {cycle.reviewMonth}
                        </span>
                      ) : (
                        cycle.reviewMonth || '-'
                      )}
                    </td>
                    <td className={`py-3 px-4 text-sm ${hasAdjustment ? 'text-indigo-300 font-semibold' : 'text-gray-300'}`}>
                      {hasAdjustment ? (
                        <span className="flex items-center gap-2">
                          <span className="text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded">
                            {cycle.adjustedReviewMonth}
                          </span>
                        </span>
                      ) : (
                        cycle.adjustedReviewMonth || '-'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(cycle)}
                          className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <BsPencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(cycle)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <BsTrash className="w-4 h-4" />
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

