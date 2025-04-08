'use client';

import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { BsPeople, BsLightning, BsClock, BsShieldExclamation } from 'react-icons/bs';

export default function AdminDashboard() {
  return (
    <DashboardLayout type="admin">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1a1c23] p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <BsPeople className="text-2xl text-blue-500" />
            </div>
            <span className="text-sm text-green-500">+12% from last month</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">5</h3>
          <p className="text-gray-400">Total Users</p>
        </div>

        <div className="bg-[#1a1c23] p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <BsLightning className="text-2xl text-purple-500" />
            </div>
            <span className="text-sm text-green-500">+5% from last hour</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">42</h3>
          <p className="text-gray-400">Active Sessions</p>
        </div>

        <div className="bg-[#1a1c23] p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <BsClock className="text-2xl text-green-500" />
            </div>
            <span className="text-sm text-green-500">All systems operational</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">99.9%</h3>
          <p className="text-gray-400">System Uptime</p>
        </div>

        <div className="bg-[#1a1c23] p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
              <BsShieldExclamation className="text-2xl text-red-500" />
            </div>
            <span className="text-sm text-red-500">Requires attention</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">3</h3>
          <p className="text-gray-400">Security Alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-[#1a1c23] rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-white">User Login</p>
                  <p className="text-sm text-gray-400">Successful login from IP 192.168.1.1</p>
                </div>
              </div>
              <span className="text-sm text-gray-400">3:45:00 PM</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-white">System Update</p>
                  <p className="text-sm text-gray-400">System updated to version 2.1.0</p>
                </div>
              </div>
              <span className="text-sm text-gray-400">3:00:00 PM</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-white">Failed Login Attempt</p>
                  <p className="text-sm text-gray-400">Failed login attempt from IP 203.0.113.1</p>
                </div>
              </div>
              <span className="text-sm text-gray-400">2:45:00 PM</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-[#1a1c23] rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-6">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-white">Database</span>
              </div>
              <span className="text-green-500">100%</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-white">API Server</span>
              </div>
              <span className="text-green-500">100%</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-white">Cache Server</span>
              </div>
              <span className="text-yellow-500">85%</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-white">File Storage</span>
              </div>
              <span className="text-green-500">100%</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 