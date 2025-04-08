'use client';

import { BsBarChart, BsCheckCircle, BsClock, BsBell } from 'react-icons/bs';

export default function DashboardContent() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1a1c23] p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <BsBarChart className="text-2xl text-blue-500" />
            </div>
            <span className="text-sm text-green-500">+12% from last month</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">85%</h3>
          <p className="text-gray-400">Goal Progress</p>
        </div>

        <div className="bg-[#1a1c23] p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <BsCheckCircle className="text-2xl text-green-500" />
            </div>
            <span className="text-sm text-green-500">+5% this week</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">12</h3>
          <p className="text-gray-400">Completed Goals</p>
        </div>

        <div className="bg-[#1a1c23] p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <BsClock className="text-2xl text-yellow-500" />
            </div>
            <span className="text-sm text-yellow-500">2 due soon</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">5</h3>
          <p className="text-gray-400">Pending Goals</p>
        </div>

        <div className="bg-[#1a1c23] p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <BsBell className="text-2xl text-purple-500" />
            </div>
            <span className="text-sm text-purple-500">3 new</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">8</h3>
          <p className="text-gray-400">Notifications</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1a1c23] rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-white">Goal Completed</p>
                <p className="text-sm text-gray-400">Completed "Improve Technical Skills" goal</p>
              </div>
            </div>
            <span className="text-sm text-gray-400">2 hours ago</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-white">New Goal Added</p>
                <p className="text-sm text-gray-400">Created "Team Collaboration" goal</p>
              </div>
            </div>
            <span className="text-sm text-gray-400">5 hours ago</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="text-white">Goal Updated</p>
                <p className="text-sm text-gray-400">Updated progress on "Project Management"</p>
              </div>
            </div>
            <span className="text-sm text-gray-400">1 day ago</span>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-[#1a1c23] rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Performance Metrics</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm rounded-md bg-[#2d2f36] text-gray-400">Week</button>
            <button className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white">Month</button>
            <button className="px-3 py-1 text-sm rounded-md bg-[#2d2f36] text-gray-400">Quarter</button>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-400">Performance chart will be displayed here</p>
        </div>
      </div>
    </div>
  );
} 