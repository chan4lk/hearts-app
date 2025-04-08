'use client';

import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Link from 'next/link';
import { useState } from 'react';
import { BsSearch, BsGrid3X3, BsListUl } from 'react-icons/bs';

export default function EmployeeDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  return (
    <DashboardLayout type="employee">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Goal Setting</h2>
            <p className="text-gray-400">Set and track your performance goals</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#2d2f36] text-gray-400 hover:text-white'
              }`}
            >
              <BsListUl className="text-xl" />
              <span className="hidden sm:inline">Timeline View</span>
            </button>
            
            <Link
              href="/goals/new"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>+ New Goal</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BsSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select className="px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
          </select>
          
          <select className="px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>
            <option value="professional">Professional</option>
            <option value="personal">Personal</option>
            <option value="technical">Technical</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-[#1a1c23] rounded-lg p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2d2f36] mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-white mb-2">No goals found</h3>
        <p className="text-gray-400 mb-6">
          You haven't created any goals yet. Click the 'New Goal' button to get started.
        </p>
        <Link
          href="/goals/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create your first goal
        </Link>
      </div>
    </DashboardLayout>
  );
}