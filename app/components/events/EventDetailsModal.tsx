'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BsX, BsCalendar, BsGeo, BsPeople, BsPerson } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';

interface EventDetailsModalProps {
  isOpen: boolean;
  event: any;
  onClose: () => void;
}

export const EventDetailsModal = ({
  isOpen,
  event,
  onClose,
}: EventDetailsModalProps) => {
  if (!event) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-2xl rounded-xl border border-theme bg-surface-elevated p-6 shadow-theme-lg backdrop-blur-xl max-h-96 overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">{event.title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-surface-secondary transition"
              >
                <BsX className="text-2xl text-primary" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-secondary mb-2">
                  Description
                </h3>
                <p className="text-secondary">{event.description}</p>
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-surface-secondary p-3 border border-theme">
                  <p className="text-xs text-secondary mb-1">Event Type</p>
                  <p className="text-primary font-medium">
                    {event.eventType.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-secondary p-3 border border-theme">
                  <p className="text-xs text-secondary mb-1">Status</p>
                  <p className="text-primary font-medium">{event.status}</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-start gap-3 rounded-lg bg-cat-personal border border-[rgb(var(--color-event-social))]/20 p-3">
                <BsCalendar className="text-cat-personal mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-secondary mb-1">Date & Time</p>
                  <p className="text-primary font-medium">
                    {new Date(event.startDate).toLocaleString()} to{' '}
                    {new Date(event.endDate).toLocaleString()}
                  </p>
                  <p className="text-xs text-tertiary mt-1">
                    Starts {formatDistanceToNow(new Date(event.startDate), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-3 rounded-lg bg-cat-professional border border-[rgba(var(--color-info),0.2)] p-3">
                  <BsGeo className="text-cat-professional mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-secondary mb-1">Location</p>
                    <p className="text-primary font-medium">{event.location}</p>
                  </div>
                </div>
              )}

              {/* Capacity & Participants */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-surface-secondary p-3 border border-theme">
                  <p className="text-xs text-secondary mb-1 flex items-center gap-1">
                    <BsPeople /> Participants
                  </p>
                  <p className="text-2xl font-bold text-cat-personal">
                    {event.participations?.length || 0}
                  </p>
                </div>
                {event.capacity && (
                  <div className="rounded-lg bg-surface-secondary p-3 border border-theme">
                    <p className="text-xs text-secondary mb-1">Capacity</p>
                    <p className="text-primary font-medium">{event.capacity}</p>
                  </div>
                )}
              </div>

              {/* Registration Deadline */}
              <div className="rounded-lg bg-warning-muted border border-[rgb(var(--color-warning))]/20 p-3">
                <p className="text-xs text-secondary mb-1">Registration Deadline</p>
                <p className="text-primary font-medium">
                  {new Date(event.registrationDeadline).toLocaleString()}
                </p>
              </div>

              {/* Organizer */}
              <div className="flex items-center gap-3 rounded-lg bg-surface-secondary p-3 border border-theme">
                <BsPerson className="text-secondary" />
                <div>
                  <p className="text-xs text-secondary">Organized by</p>
                  <p className="text-primary font-medium">{event.createdBy.name}</p>
                </div>
              </div>

              {/* Participants List */}
              {event.participations && event.participations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-secondary mb-2">
                    Participants ({event.participations.length})
                  </h3>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {event.participations.map((p: any) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg bg-surface-secondary p-2 border border-theme"
                      >
                        <div>
                          <p className="text-sm text-primary font-medium">
                            {p.user?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-tertiary">
                            {p.user?.email}
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-cat-training px-2 py-1 text-xs font-medium text-cat-training">
                          {p.participationStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
