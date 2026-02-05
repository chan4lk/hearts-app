'use client';

import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  BsCalendar,
  BsGeo,
  BsCheckCircle,
  BsXCircle,
  BsClockHistory,
} from 'react-icons/bs';

interface EventParticipationCardProps {
  participation: any;
  onUpdateStatus: (eventId: string, status: string) => void;
  onAddFeedback: (eventId: string) => void;
  isLoading?: boolean;
}

export const EventParticipationCard = ({
  participation,
  onUpdateStatus,
  onAddFeedback,
  isLoading = false,
}: EventParticipationCardProps) => {
  const { event, participationStatus, hoursContributed, feedback } =
    participation;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTERED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'ATTENDED':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'NO_SHOW':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'CANCELLED':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-white/10 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ATTENDED':
        return <BsCheckCircle className="text-green-400" />;
      case 'NO_SHOW':
        return <BsXCircle className="text-red-400" />;
      case 'REGISTERED':
        return <BsClockHistory className="text-blue-400" />;
      default:
        return null;
    }
  };

  const isPastEvent = new Date(event.endDate) < new Date();
  const eventStatus = event.status;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/2 p-5 backdrop-blur-xl hover:border-indigo-500/50 transition"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          {event.location && (
            <p className="flex items-center gap-1 text-sm text-white/60 mt-1">
              <BsGeo /> {event.location}
            </p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${getStatusColor(
            participationStatus
          )}`}
        >
          {getStatusIcon(participationStatus)}
          {participationStatus}
        </span>
      </div>

      {/* Date and Time */}
      <div className="mb-4 flex items-center gap-2 text-sm text-white/70">
        <BsCalendar className="text-indigo-400" />
        <span>
          {new Date(event.startDate).toLocaleDateString()} at{' '}
          {new Date(event.startDate).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Event Description */}
      <p className="mb-4 text-sm text-white/70 line-clamp-2">
        {event.description}
      </p>

      {/* Participation Details */}
      {isPastEvent && (
        <div className="mb-4 space-y-3">
          {hoursContributed && (
            <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3">
              <p className="text-xs text-white/60 mb-1">Hours Contributed</p>
              <p className="text-lg font-bold text-indigo-300">{hoursContributed}h</p>
            </div>
          )}

          {feedback && (
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-xs text-white/60 mb-1">Your Feedback</p>
              <p className="text-sm text-white/80">{feedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isPastEvent && participationStatus === 'REGISTERED' ? (
          <>
            <button
              onClick={() => onUpdateStatus(event.id, 'ATTENDED')}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-green-500/20 px-3 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/30 disabled:opacity-50 transition"
            >
              Mark Attended
            </button>
            <button
              onClick={() => onUpdateStatus(event.id, 'NO_SHOW')}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30 disabled:opacity-50 transition"
            >
              Mark No Show
            </button>
          </>
        ) : isPastEvent && participationStatus === 'ATTENDED' ? (
          <button
            onClick={() => onAddFeedback(event.id)}
            className="flex-1 rounded-lg bg-blue-500/20 px-3 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-500/30 transition"
          >
            {feedback ? 'Edit Feedback' : 'Add Feedback'}
          </button>
        ) : !isPastEvent ? (
          <div className="text-xs text-white/60 text-center w-full py-2">
            Event starts {formatDistanceToNow(new Date(event.startDate), { addSuffix: true })}
          </div>
        ) : (
          <div className="text-xs text-white/60 text-center w-full py-2">
            Event completed
          </div>
        )}
      </div>

      {/* Event Status Badge */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-white/50">
          {event.eventType.replace(/_/g, ' ')}
        </span>
        <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-white/10 text-white/70">
          {event.status}
        </span>
      </div>
    </motion.div>
  );
};
