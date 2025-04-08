'use client';

import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useState } from 'react';
import { BsSearch, BsListUl, BsPeople, BsClock } from 'react-icons/bs';

export default function ManagerDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <DashboardLayout type="manager">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Goal Approvals</h2>
            <p className="text-gray-400">Review and approve employee goals</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              <BsListUl className="text-xl" />
              <span className="hidden sm:inline">List View</span>
            </button>
            
            <button 
              className="flex items-center space-x-2 px-4 py-2 bg-[#2d2f36] text-gray-400 hover:text-white rounded-lg"
            >
              <BsPeople className="text-xl" />
              <span className="hidden sm:inline">Comparison</span>
            </button>
            
            <button 
              className="flex items-center space-x-2 px-4 py-2 bg-[#2d2f36] text-gray-400 hover:text-white rounded-lg"
            >
              <BsClock className="text-xl" />
              <span className="hidden sm:inline">History</span>
            </button>
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
            <option value="">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="modified">Needs Modification</option>
          </select>
          
          <select className="px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Employees</option>
            <option value="active">Active</option>
            <option value="onLeave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-[#1a1c23] rounded-lg p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2d2f36] mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-white mb-2">No pending approvals</h3>
        <p className="text-gray-400">
          There are no goals waiting for your approval at the moment.
        </p>
      </div>
    </DashboardLayout>
  );
} 