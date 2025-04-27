import { BsPlus } from 'react-icons/bs';

interface HeaderProps {
  onQuickCreateClick: () => void;
}

export function Header({ onQuickCreateClick }: HeaderProps) {
  return (
    <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Manage Employee Goals
            <span className="bg-indigo-500/10 p-1 rounded text-indigo-400 text-sm font-normal">
              Manager Portal
            </span>
          </h1>
          <p className="text-gray-400 mt-1">Create and manage goals for your assigned employees</p>
        </div>
        <button 
          onClick={onQuickCreateClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold text-base"
        >
          <BsPlus className="w-5 h-5" />
          Quick Create
        </button>
      </div>
    </div>
  );
} 