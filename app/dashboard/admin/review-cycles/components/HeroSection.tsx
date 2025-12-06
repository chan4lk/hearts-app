import { BsCalendarCheck, BsPlus } from 'react-icons/bs';

interface HeroSectionProps {
  onAddNew: () => void;
}

export default function HeroSection({ onAddNew }: HeroSectionProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-900/30 via-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-xl p-6 border border-indigo-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-lg">
            <BsCalendarCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Review Cycles Management</h1>
            <p className="text-gray-400 text-sm">Manage employee review cycles and performance evaluation schedules</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-md"
          >
            <BsPlus className="w-5 h-5" />
            <span>Add Review Cycle</span>
          </button>
        </div>
      </div>
    </div>
  );
}

