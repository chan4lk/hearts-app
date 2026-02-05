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
            className="relative w-full max-w-2xl rounded-xl border border-white/10 bg-gradient-to-b from-gray-900 to-gray-800 p-6 shadow-2xl backdrop-blur-xl max-h-96 overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">{event.title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-white/10 transition"
              >
                <BsX className="text-2xl text-white" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-2">
                  Description
                </h3>
                <p className="text-white/80">{event.description}</p>
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                  <p className="text-xs text-white/60 mb-1">Event Type</p>
                  <p className="text-white font-medium">
                    {event.eventType.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                  <p className="text-xs text-white/60 mb-1">Status</p>
                  <p className="text-white font-medium">{event.status}</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-start gap-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3">
                <BsCalendar className="text-indigo-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-white/60 mb-1">Date & Time</p>
                  <p className="text-white font-medium">
                    {new Date(event.startDate).toLocaleString()} to{' '}
                    {new Date(event.endDate).toLocaleString()}
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    Starts {formatDistanceToNow(new Date(event.startDate), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-3 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                  <BsGeo className="text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-white/60 mb-1">Location</p>
                    <p className="text-white font-medium">{event.location}</p>
                  </div>
                </div>
              )}

              {/* Capacity & Participants */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                  <p className="text-xs text-white/60 mb-1 flex items-center gap-1">
                    <BsPeople /> Participants
                  </p>
                  <p className="text-2xl font-bold text-indigo-400">
                    {event.participations?.length || 0}
                  </p>
                </div>
                {event.capacity && (
                  <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                    <p className="text-xs text-white/60 mb-1">Capacity</p>
                    <p className="text-white font-medium">{event.capacity}</p>
                  </div>
                )}
              </div>

              {/* Registration Deadline */}
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <p className="text-xs text-white/60 mb-1">Registration Deadline</p>
                <p className="text-white font-medium">
                  {new Date(event.registrationDeadline).toLocaleString()}
                </p>
              </div>

              {/* Organizer */}
              <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 border border-white/10">
                <BsPerson className="text-white/60" />
                <div>
                  <p className="text-xs text-white/60">Organized by</p>
                  <p className="text-white font-medium">{event.createdBy.name}</p>
                </div>
              </div>

              {/* Participants List */}
              {event.participations && event.participations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/60 mb-2">
                    Participants ({event.participations.length})
                  </h3>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {event.participations.map((p: any) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg bg-white/5 p-2 border border-white/10"
                      >
                        <div>
                          <p className="text-sm text-white font-medium">
                            {p.user?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-white/50">
                            {p.user?.email}
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">
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
