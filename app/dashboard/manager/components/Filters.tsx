import { BsSearch, BsFilter, BsPerson } from 'react-icons/bs';
import { EmployeeStats } from '../types';

interface FiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedEmployee: string;
  setSelectedEmployee: (employee: string) => void;
  employees: EmployeeStats[];
  activeTab: 'employee' | 'personal' | 'assigned';
}

export default function Filters({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedEmployee,
  setSelectedEmployee,
  employees,
  activeTab
}: FiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 animate-in slide-in-from-top-4 duration-500">
      <div className="w-full md:w-auto md:flex-1">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-lg">
              <BsSearch className="w-4 h-4 text-white" />
            </div>
          </div>
          <input
            type="text"
            placeholder={`Search ${activeTab === 'employee' ? 'employee' : activeTab === 'personal' ? 'personal' : 'assigned'} goals...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-4 py-4 bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-xl text-white rounded-2xl border border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 hover:bg-gradient-to-r hover:from-gray-700/80 hover:to-gray-600/80 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/20"
          />
        </div>
      </div>
      
      <div className="relative group w-full md:w-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <div className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-lg">
            <BsFilter className="w-4 h-4 text-white" />
          </div>
        </div>
        <select 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="pl-14 pr-4 py-4 bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-xl text-white rounded-2xl border border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 hover:bg-gradient-to-r hover:from-gray-700/80 hover:to-gray-600/80 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 appearance-none cursor-pointer min-w-[180px]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(31, 41, 55, 0.8), rgba(55, 65, 81, 0.8))`
          }}
        >
          <option value="" className="bg-gray-800 text-white">All Statuses</option>
          <option value="DRAFT" className="bg-gray-800 text-white">Draft</option>
          <option value="PENDING" className="bg-gray-800 text-white">Pending</option>
          <option value="APPROVED" className="bg-gray-800 text-white">Approved</option>
          <option value="REJECTED" className="bg-gray-800 text-white">Rejected</option>
          <option value="MODIFIED" className="bg-gray-800 text-white">Modified</option>
          <option value="COMPLETED" className="bg-gray-800 text-white">Completed</option>
        </select>
      </div>

      <div className="relative group w-full md:w-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <div className="p-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg shadow-lg">
            <BsPerson className="w-4 h-4 text-white" />
          </div>
        </div>
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="pl-14 pr-4 py-4 bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-xl text-white rounded-2xl border border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 hover:bg-gradient-to-r hover:from-gray-700/80 hover:to-gray-600/80 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 appearance-none cursor-pointer min-w-[180px]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(31, 41, 55, 0.8), rgba(55, 65, 81, 0.8))`
          }}
        >
          <option value="all" className="bg-gray-800 text-white">All Employees</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.email} className="bg-gray-800 text-white">
              {employee.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
} 