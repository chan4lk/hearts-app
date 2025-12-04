import { BsFilter, BsFolder2Open, BsFlag } from 'react-icons/bs';
import { motion } from 'framer-motion';

interface FiltersProps {
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedPriority?: string;
  onPriorityChange?: (value: string) => void;
}

// Status configuration matching system colors
const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    borderColor: 'border-gray-500/30',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-300',
    gradient: 'from-gray-500 to-slate-500'
  },
  APPROVED: {
    label: 'Approved',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-300',
    gradient: 'from-emerald-500 to-teal-500'
  },
  REJECTED: {
    label: 'Rejected',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-300',
    gradient: 'from-rose-500 to-red-500'
  },
  COMPLETED: {
    label: 'Completed',
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-300',
    gradient: 'from-green-500 to-emerald-500'
  },
  PENDING: {
    label: 'Pending',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-300',
    gradient: 'from-amber-500 to-orange-500'
  }
};

// Priority configuration
const PRIORITY_CONFIG = {
  LOW: {
    label: 'Low',
    borderColor: 'border-gray-500/30',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-300',
    gradient: 'from-gray-400 to-gray-500'
  },
  MEDIUM: {
    label: 'Medium',
    borderColor: 'border-yellow-500/30',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-300',
    gradient: 'from-yellow-400 to-orange-500'
  },
  HIGH: {
    label: 'High',
    borderColor: 'border-orange-500/30',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-300',
    gradient: 'from-orange-400 to-red-500'
  },
  URGENT: {
    label: 'Urgent',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-300',
    gradient: 'from-red-400 to-red-600'
  }
};

export default function Filters({
  selectedStatus,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
  selectedPriority = '',
  onPriorityChange,
}: FiltersProps) {
  const selectedStatusConfig = selectedStatus && selectedStatus !== 'all' && STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG]
    ? STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG]
    : null;

  const statusBorderColor = selectedStatusConfig
    ? selectedStatusConfig.borderColor.replace('/30', '/50')
    : 'border-gray-700';
  const statusBgColor = selectedStatusConfig
    ? selectedStatusConfig.bgColor
    : 'bg-gray-900/50';
  const statusTextColor = selectedStatusConfig
    ? selectedStatusConfig.textColor
    : 'text-white';
  const statusIconGradient = selectedStatusConfig
    ? selectedStatusConfig.gradient
    : 'from-amber-500 to-orange-500';

  const selectedPriorityConfig = selectedPriority && PRIORITY_CONFIG[selectedPriority as keyof typeof PRIORITY_CONFIG]
    ? PRIORITY_CONFIG[selectedPriority as keyof typeof PRIORITY_CONFIG]
    : null;

  const priorityBorderColor = selectedPriorityConfig
    ? selectedPriorityConfig.borderColor.replace('/30', '/50')
    : 'border-gray-700';
  const priorityBgColor = selectedPriorityConfig
    ? selectedPriorityConfig.bgColor
    : 'bg-gray-900/50';
  const priorityTextColor = selectedPriorityConfig
    ? selectedPriorityConfig.textColor
    : 'text-white';
  const priorityIconGradient = selectedPriorityConfig
    ? selectedPriorityConfig.gradient
    : 'from-violet-500 to-purple-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border-2 border-gray-700/50"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Status Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
            <div className={`p-1.5 rounded-md bg-gradient-to-r ${statusIconGradient}`}>
              <BsFilter className="w-3 h-3 text-white" />
            </div>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`w-full pl-10 pr-8 py-2.5 ${statusBgColor} ${statusTextColor} rounded-lg border ${statusBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-amber-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-opacity-70 hover:shadow-sm`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              color: selectedStatusConfig ? undefined : 'rgb(209 213 219)'
            }}
          >
            <option value="all" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Statuses</option>
            <option value="DRAFT" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>Draft</option>
            <option value="PENDING" style={{ backgroundColor: '#1f2937', color: '#fcd34d' }}>Pending</option>
            <option value="APPROVED" style={{ backgroundColor: '#1f2937', color: '#6ee7b7' }}>Approved</option>
            <option value="REJECTED" style={{ backgroundColor: '#1f2937', color: '#fca5a5' }}>Rejected</option>
            <option value="COMPLETED" style={{ backgroundColor: '#1f2937', color: '#86efac' }}>Completed</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
            <div className="p-1.5 rounded-md bg-gradient-to-r from-purple-500 to-indigo-500">
              <BsFolder2Open className="w-3 h-3 text-white" />
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-opacity-70 hover:shadow-sm"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center'
            }}
          >
            <option value="all" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Categories</option>
            <option value="PROFESSIONAL" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>Professional</option>
            <option value="TECHNICAL" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>Technical</option>
            <option value="LEADERSHIP" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>Leadership</option>
            <option value="PERSONAL" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>Personal</option>
            <option value="TRAINING" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>Training</option>
            <option value="KPI" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>KPI</option>
          </select>
        </div>

        {/* Priority Filter */}
        {onPriorityChange && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
              <div className={`p-1.5 rounded-md bg-gradient-to-r ${priorityIconGradient}`}>
                <BsFlag className="w-3 h-3 text-white" />
              </div>
            </div>
            <select
              value={selectedPriority}
              onChange={(e) => onPriorityChange(e.target.value)}
              className={`w-full pl-10 pr-8 py-2.5 ${priorityBgColor} ${priorityTextColor} rounded-lg border ${priorityBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-violet-500 focus:ring-violet-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-opacity-70 hover:shadow-sm`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                color: selectedPriorityConfig ? undefined : 'rgb(209 213 219)'
              }}
            >
              <option value="" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Priorities</option>
              <option value="LOW" style={{ backgroundColor: '#1f2937', color: '#9ca3af' }}>Low</option>
              <option value="MEDIUM" style={{ backgroundColor: '#1f2937', color: '#fcd34d' }}>Medium</option>
              <option value="HIGH" style={{ backgroundColor: '#1f2937', color: '#fb923c' }}>High</option>
              <option value="URGENT" style={{ backgroundColor: '#1f2937', color: '#fca5a5' }}>Urgent</option>
            </select>
          </div>
        )}
      </div>
    </motion.div>
  );
}

