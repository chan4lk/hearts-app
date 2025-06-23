import { motion } from "framer-motion";
import { BsFilter } from "react-icons/bs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmployeeStats } from "../types";

interface EmployeeFilterProps {
  filterEmployee: string;
  setFilterEmployee: (value: string) => void;
  employeeStats: EmployeeStats[];
}

export default function EmployeeFilter({ filterEmployee, setFilterEmployee, employeeStats }: EmployeeFilterProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex justify-end"
    >
      <div className="relative group min-w-[220px]">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
          <BsFilter className="w-4 h-4 text-gray-400 group-hover:text-violet-500 transition-colors" />
        </div>
        <Select value={filterEmployee} onValueChange={setFilterEmployee}>
          <SelectTrigger 
            className="pl-8 pr-3 py-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm 
                       border border-violet-100 dark:border-violet-900/30
                       text-gray-700 dark:text-gray-200 text-sm
                       focus:ring-1 focus:ring-violet-400 focus:border-violet-400
                       transition-all w-full rounded-full shadow-sm
                       hover:bg-white/60 dark:hover:bg-gray-800/60"
          >
            <SelectValue placeholder="Filter employees..." />
          </SelectTrigger>
          <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-none rounded-lg shadow-lg p-1 max-h-[280px]">
            <SelectItem value="all" className="rounded-md transition-colors hover:bg-violet-50 dark:hover:bg-violet-900/20">
              <div className="flex items-center gap-2 py-0.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-violet-400 to-violet-600 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">All</span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-200">All Employees</span>
              </div>
            </SelectItem>
            {employeeStats.map(emp => (
              <SelectItem 
                key={emp.id} 
                value={emp.id}
                className="rounded-md transition-colors hover:bg-violet-50 dark:hover:bg-violet-900/20"
              >
                <div className="flex items-center justify-between w-full py-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center ring-2 ring-white/90 dark:ring-gray-800">
                      <span className="text-white text-xs font-medium">{emp.name[0]}</span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-200">{emp.name}</span>
                  </div>
                  <div className="flex items-center">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 
                               text-violet-600 dark:text-violet-300 font-medium"
                    >
                      {emp.ratedGoals}/{emp.totalGoals}
                    </motion.div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
} 