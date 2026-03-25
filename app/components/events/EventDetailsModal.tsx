'use client';

import { BsCalendar, BsGeo, BsPeople, BsPerson } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';
import { ModalShell } from '@/app/components/ui/form-primitives';

interface EventParticipation {
  id: string;
  participationStatus: string;
  user?: {
    name: string;
    email: string;
  };
}

interface EventData {
  title: string;
  description: string;
  eventType: string;
  status: string;
  startDate: string;
  endDate: string;
  location?: string;
  capacity?: number;
  registrationDeadline?: string;
  createdBy: { name: string };
  participations?: EventParticipation[];
}

interface EventDetailsModalProps {
  isOpen: boolean;
  event: EventData | null;
  onClose: () => void;
}

export const EventDetailsModal = ({
  isOpen,
  event,
  onClose,
}: EventDetailsModalProps) => {
  if (!event) return null;

  return (
    <ModalShell open={isOpen} onClose={onClose} title={event.title} maxWidth="max-w-2xl">
      <div className="space-y-4 max-h-96 overflow-y-auto">
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
        {event.registrationDeadline && (
          <div className="rounded-lg bg-warning-muted border border-[rgb(var(--color-warning))]/20 p-3">
            <p className="text-xs text-secondary mb-1">Registration Deadline</p>
            <p className="text-primary font-medium">
              {new Date(event.registrationDeadline).toLocaleString()}
            </p>
          </div>
        )}

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
              {event.participations.map((p: EventParticipation) => (
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
    </ModalShell>
  );
};
