import { BsCalendarCheck, BsPlus, BsUpload } from 'react-icons/bs';

interface HeroSectionProps {
  onAddNew: () => void;
  onImport: () => void;
}

export default function HeroSection({ onAddNew, onImport }: HeroSectionProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-900/30 via-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-xl p-4 border border-indigo-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <BsCalendarCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white mb-0.5">Review Cycles Management</h1>
            <p className="text-gray-400 text-xs">Manage employee review cycles and performance evaluation schedules</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onImport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all shadow-md text-xs font-medium"
          >
            <BsUpload className="w-4 h-4" />
            <span>Import Excel</span>
          </button>
          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-md text-xs font-medium"
          >
            <BsPlus className="w-4 h-4" />
            <span>Add Review Cycle</span>
          </button>
        </div>
      </div>
    </div>
  );
}

