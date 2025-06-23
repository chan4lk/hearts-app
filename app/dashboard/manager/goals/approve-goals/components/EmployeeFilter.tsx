import { BsFilter, BsPerson, BsPersonLinesFill } from 'react-icons/bs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmployeeFilterProps {
  selectedEmployee: string;
  onEmployeeChange: (value: string) => void;
  employeeStats: Array<{
    id: string;
    name: string;
    pendingGoals: number;
  }>;
}

export default function EmployeeFilter({ selectedEmployee, onEmployeeChange, employeeStats }: EmployeeFilterProps) {
  return (
    <div className="relative group w-full max-w-xs">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <BsFilter className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
      </div>
      <Select
        value={selectedEmployee}
        onValueChange={onEmployeeChange}
      >
        <SelectTrigger className="pl-9 pr-3 py-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-full rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <BsPerson className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <SelectValue placeholder="Filter by employee..." />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-600/50">
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <BsPersonLinesFill className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-900 dark:text-white">All Employees</span>
            </div>
          </SelectItem>
          {employeeStats.map(emp => (
            <SelectItem key={emp.id} value={emp.id}>
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2">
                  <BsPerson className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white truncate">{emp.name}</span>
                </div>
                <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  {emp.pendingGoals}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 