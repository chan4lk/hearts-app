import { BsPlus } from 'react-icons/bs';

interface HeaderProps {
  onQuickCreateClick: () => void;
}

export function Header({ onQuickCreateClick }: HeaderProps) {
  return (
    <div className="bg-[#1E2028] rounded-xl p-4 sm:p-6 border border-gray-800 shadow-lg backdrop-blur-sm bg-opacity-95">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white flex flex-wrap items-center gap-2">
            Manage Employee Goals
            <span className="bg-indigo-500/10 px-2 py-1 rounded-full text-indigo-400 text-sm font-medium">
              Manager Portal
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Create and manage goals for your assigned employees</p>
        </div>
        <button 
          onClick={onQuickCreateClick}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 font-semibold text-base shadow-lg hover:shadow-xl active:scale-95"
        >
          <BsPlus className="w-5 h-5" />
          Quick Create
        </button>
      </div>
    </div>
  );
} 