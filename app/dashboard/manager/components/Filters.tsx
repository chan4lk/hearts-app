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
    <div className="flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-auto md:flex-1">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BsSearch className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
          </div>
          <input
            type="text"
            placeholder={`Search ${activeTab === 'employee' ? 'employee' : activeTab === 'personal' ? 'personal' : 'assigned'} goals...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#1E2028] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-[#252832] hover:border-gray-600"
          />
        </div>
      </div>
      
      <div className="relative group w-full md:w-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <BsFilter className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
        </div>
        <select 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="pl-10 pr-4 py-3 bg-[#1E2028] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-[#252832] hover:border-gray-600 transition-all appearance-none cursor-pointer min-w-[180px]"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="MODIFIED">Modified</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {activeTab === 'employee' && (
        <div className="relative group w-full md:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BsPerson className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
          </div>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="pl-10 pr-4 py-3 bg-[#1E2028] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-[#252832] hover:border-gray-600 transition-all appearance-none cursor-pointer min-w-[180px]"
          >
            <option value="all">All Employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.email}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
} 