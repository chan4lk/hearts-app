import { BsSearch, BsFilter, BsPerson } from 'react-icons/bs';
import { EmployeeStats } from '@/app/components/shared/types';

interface FiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedEmployee: string;
  setSelectedEmployee: (employee: string) => void;
  employees: EmployeeStats[];
}

export default function Filters({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedEmployee,
  setSelectedEmployee,
  employees
}: FiltersProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md">
              <BsSearch className="w-3 h-3 text-white" />
            </div>
          </div>
          <input
            type="text"
            placeholder="Search goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-gray-900/50 text-white rounded-md border border-gray-700 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <div className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-md">
              <BsFilter className="w-3 h-3 text-white" />
            </div>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-gray-900/50 text-white rounded-md border border-gray-700 focus:outline-none focus:border-amber-500 text-sm appearance-none cursor-pointer"
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

        {/* Employee Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <div className="p-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-md">
              <BsPerson className="w-3 h-3 text-white" />
            </div>
          </div>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-gray-900/50 text-white rounded-md border border-gray-700 focus:outline-none focus:border-emerald-500 text-sm appearance-none cursor-pointer"
          >
            <option value="all">All Users</option>
            {/* Group by role */}
            {employees
              .filter(emp => emp.role === 'ADMIN')
              .map((employee) => (
                <option key={employee.id} value={employee.email}>
                  👑 {employee.name} (Admin)
                </option>
              ))}
            {employees
              .filter(emp => emp.role === 'MANAGER')
              .map((employee) => (
                <option key={employee.id} value={employee.email}>
                  👨‍💼 {employee.name} (Manager)
                </option>
              ))}
            {employees
              .filter(emp => emp.role === 'EMPLOYEE')
              .map((employee) => (
                <option key={employee.id} value={employee.email}>
                  👤 {employee.name} (Employee)
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
} 