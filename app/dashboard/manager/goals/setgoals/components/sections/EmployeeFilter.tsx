import { BsPerson } from 'react-icons/bs';

interface User {
  id: string;
  name: string;
  email: string;
}

interface EmployeeFilterProps {
  selectedEmployee: string;
  onEmployeeChange: (value: string) => void;
  assignedEmployees: User[];
}

export function EmployeeFilter({ selectedEmployee, onEmployeeChange, assignedEmployees }: EmployeeFilterProps) {
  const employeeBorderColor = selectedEmployee !== 'all'
    ? 'border-cyan-500/50'
    : 'border-gray-700';

  const employeeBgColor = selectedEmployee !== 'all'
    ? 'bg-cyan-500/10'
    : 'bg-gray-900/50';

  const employeeTextColor = selectedEmployee !== 'all'
    ? 'text-cyan-300'
    : 'text-white';

  return (
    <div className="relative w-full sm:w-auto sm:max-w-xs">
      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
        <div className="p-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-md">
          <BsPerson className="w-3 h-3 text-white" />
        </div>
      </div>
      <select
        value={selectedEmployee}
        onChange={(e) => onEmployeeChange(e.target.value)}
        className={`w-full pl-10 pr-8 py-2.5 ${employeeBgColor} ${employeeTextColor} rounded-lg border ${employeeBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-cyan-500 focus:ring-cyan-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-opacity-70 hover:shadow-sm`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          color: selectedEmployee !== 'all' ? undefined : 'rgb(209 213 219)'
        }}
      >
        <option value="all" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Employees</option>
        {assignedEmployees.map(emp => (
          <option
            key={emp.id}
            value={emp.id}
            style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}
          >
            {emp.name}
          </option>
        ))}
      </select>
    </div>
  );
}
