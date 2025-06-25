import { BsPeople, BsChevronDown, BsPersonCircle } from 'react-icons/bs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { motion } from 'framer-motion';

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
  const selectedName = selectedEmployee === 'all' 
    ? 'All Employees' 
    : assignedEmployees.find(e => e.id === selectedEmployee)?.name;

  return (
    <div className="relative">
      <Select value={selectedEmployee} onValueChange={onEmployeeChange}>
        <SelectTrigger 
          className="h-9 px-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 
            hover:border-white/20 text-white rounded-lg transition-all duration-200 min-w-[180px]
            focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/10">
              <BsPeople className="w-3 h-3 text-indigo-400" />
            </div>
            <span className="text-sm font-medium truncate">{selectedName}</span>
            <BsChevronDown className="w-3 h-3 text-white/40 ml-auto" />
          </div>
        </SelectTrigger>

        <SelectContent 
          className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-lg 
            shadow-xl shadow-black/20 p-1 min-w-[200px]"
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SelectItem 
              value="all"
              className="rounded-md hover:bg-white/5 focus:bg-white/5 transition-colors py-1.5 px-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10">
                  <BsPeople className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-sm text-white/90">All Employees</span>
              </div>
            </SelectItem>

            <div className="my-1 h-px bg-white/5" />

            {assignedEmployees.map((employee) => (
              <SelectItem 
                key={employee.id} 
                value={employee.id}
                className="rounded-md hover:bg-white/5 focus:bg-white/5 transition-colors py-1.5 px-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/10">
                    <BsPersonCircle className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <span className="text-sm text-white/90 truncate">{employee.name}</span>
                </div>
              </SelectItem>
            ))}
          </motion.div>
        </SelectContent>
      </Select>
    </div>
  );
} 