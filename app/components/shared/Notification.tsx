import { BsCheckCircle, BsXCircle } from 'react-icons/bs';

interface NotificationProps {
  show: boolean;
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

export function Notification({ show, type, message, onClose }: NotificationProps) {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`relative p-4 rounded-lg shadow-lg flex items-center gap-3 ${
        type === 'success' ? 'bg-[#1E2028] border border-emerald-500/20' : 'bg-[#1E2028] border border-rose-500/20'
      } min-w-[300px] transform transition-all duration-300 ease-in-out`}>
        {type === 'success' ? 
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <BsCheckCircle className="w-5 h-5 text-emerald-400" />
          </div> : 
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
            <BsXCircle className="w-5 h-5 text-rose-400" />
          </div>
        }
        <div className="flex-1">
          <h3 className={`font-medium ${type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {type === 'success' ? 'Success' : 'Error'}
          </h3>
          <p className="text-gray-300 text-sm mt-1">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="absolute top-1 right-1 text-gray-400 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
} 