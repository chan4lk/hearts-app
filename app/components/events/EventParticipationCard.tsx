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
import {
  EVENT_CATEGORIES,
  TOASTMASTER_ROLES,
  HEARTS_TALK_ROLES,
} from '@/app/components/shared/constants';

interface EventParticipationCardProps {
  participation: any;
  onUpdateStatus: (eventId: string, status: string) => void;
  onUpdateRole?: (
    eventId: string,
    data: { toastmasterRole?: string; heartsTalkRole?: string }
  ) => void;
  onAddFeedback: (eventId: string) => void;
  isLoading?: boolean;
}

export const EventParticipationCard = ({
  participation,
  onUpdateStatus,
  onUpdateRole,
  onAddFeedback,
  isLoading = false,
}: EventParticipationCardProps) => {
  const {
    event,
    participationStatus,
    hoursContributed,
    feedback,
    toastmasterRole,
    heartsTalkRole,
  } = participation;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTERED':
        return 'bg-cat-professional text-cat-professional border-blue-500/30';
      case 'ATTENDED':
        return 'bg-cat-training text-cat-training border-green-500/30';
      case 'NO_SHOW':
        return 'bg-error-muted text-error border-red-500/30';
      case 'CANCELLED':
        return 'bg-surface-secondary text-gray-300 border-gray-500/30';
      default:
        return 'bg-white/10 text-[rgb(var(--color-text-inverse))]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ATTENDED':
        return <BsCheckCircle className="text-cat-training" />;
      case 'NO_SHOW':
        return <BsXCircle className="text-error" />;
      case 'REGISTERED':
        return <BsClockHistory className="text-cat-professional" />;
      default:
        return null;
    }
  };

  const isPastEvent = new Date(event.endDate) < new Date();
  const eventStatus = event.status;

  const categoryLabel =
    event.eventType === 'OTHER' && event.categoryLabel
      ? event.categoryLabel
      : EVENT_CATEGORIES.find((c) => c.value === event.eventType)?.label ??
        event.eventType.replace(/_/g, ' ');

  const isToastmasters = event.eventType === 'TOASTMASTERS';
  const isHeartsTalk = event.eventType === 'HEART_TALKS';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-theme bg-surface-secondary p-5 backdrop-blur-xl hover:border-teal-500/50 transition"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-primary">{event.title}</h3>
          {event.location && (
            <p className="flex items-center gap-1 text-sm text-secondary mt-1">
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
      <div className="mb-4 flex items-center gap-2 text-sm text-secondary">
        <BsCalendar className="text-cat-personal" />
        <span>
          {new Date(event.startDate).toLocaleDateString()} at{' '}
          {new Date(event.startDate).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Event Description */}
      <p className="mb-4 text-sm text-secondary line-clamp-2">
        {event.description}
      </p>

      {/* Toastmaster role selection */}
      {isToastmasters && onUpdateRole && (
        <div className="mb-4">
          <label className="block text-xs text-secondary mb-1">
            Toastmaster role
          </label>
          <select
            value={toastmasterRole ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              onUpdateRole(event.id, {
                toastmasterRole: v || undefined,
              });
            }}
            disabled={isLoading}
            className="w-full rounded-lg border border-theme bg-surface-secondary px-3 py-2 text-sm text-primary focus:border-teal-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select role…</option>
            {TOASTMASTER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Hearts Talk – Participant or Facilitator */}
      {isHeartsTalk && onUpdateRole && (
        <div className="mb-4">
          <label className="block text-xs text-secondary mb-1">
            Hearts Talk – Participant or Facilitator
          </label>
          <select
            value={heartsTalkRole ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              onUpdateRole(event.id, {
                heartsTalkRole: (v as 'PARTICIPANT' | 'FACILITATOR') || undefined,
              });
            }}
            disabled={isLoading}
            className="w-full rounded-lg border border-theme bg-surface-secondary px-3 py-2 text-sm text-primary focus:border-teal-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select…</option>
            {HEARTS_TALK_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Participation Details */}
      {isPastEvent && (
        <div className="mb-4 space-y-3">
          {hoursContributed && (
            <div className="rounded-lg bg-cat-personal border border-teal-500/20 p-3">
              <p className="text-xs text-secondary mb-1">Hours Contributed</p>
              <p className="text-lg font-bold text-cat-personal">{hoursContributed}h</p>
            </div>
          )}

          {feedback && (
            <div className="rounded-lg bg-cat-professional border border-[rgba(var(--color-info),0.2)] p-3">
              <p className="text-xs text-secondary mb-1">Your Feedback</p>
              <p className="text-sm text-secondary">{feedback}</p>
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
              className="flex-1 rounded-lg bg-cat-training px-3 py-2 text-sm font-semibold text-cat-training hover:bg-cat-training disabled:opacity-50 transition"
            >
              Mark Attended
            </button>
            <button
              onClick={() => onUpdateStatus(event.id, 'NO_SHOW')}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-error-muted px-3 py-2 text-sm font-semibold text-error hover:bg-[rgb(var(--color-error))]/30 disabled:opacity-50 transition"
            >
              Mark No Show
            </button>
          </>
        ) : isPastEvent && participationStatus === 'ATTENDED' ? (
          <button
            onClick={() => onAddFeedback(event.id)}
            className="flex-1 rounded-lg bg-cat-professional px-3 py-2 text-sm font-semibold text-cat-professional hover:bg-cat-professional transition"
          >
            {feedback ? 'Edit Feedback' : 'Add Feedback'}
          </button>
        ) : !isPastEvent ? (
          <div className="text-xs text-secondary text-center w-full py-2">
            Event starts {formatDistanceToNow(new Date(event.startDate), { addSuffix: true })}
          </div>
        ) : (
          <div className="text-xs text-secondary text-center w-full py-2">
            Event completed
          </div>
        )}
      </div>

      {/* Event Status Badge & Category */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-tertiary">{categoryLabel}</span>
        <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-white/10 text-secondary">
          {event.status}
        </span>
      </div>
    </motion.div>
  );
};
