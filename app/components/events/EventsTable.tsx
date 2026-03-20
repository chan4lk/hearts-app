'use client';

import { formatDistanceToNow } from 'date-fns';
import { BsEye, BsTrash, BsPencilSquare, BsCalendar, BsGeoAlt } from 'react-icons/bs';

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: string;
  location?: string;
  startDate: string;
  endDate: string;
  capacity?: number;
  status: string;
  createdBy: { name: string };
  participations: any[];
}

interface EventsTableProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onView: (event: Event) => void;
  isLoading?: boolean;
}

export const EventsTable = ({
  events,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
}: EventsTableProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-500/20 text-blue-300';
      case 'ONGOING':
        return 'bg-green-500/20 text-green-300';
      case 'COMPLETED':
        return 'bg-slate-500/20 text-slate-300';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-white/10 text-white';
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      TOASTMASTERS: 'bg-cyan-500/20 text-cyan-300',
      CODECRUNCH: 'bg-orange-500/20 text-orange-300',
      HEART_TALKS: 'bg-pink-500/20 text-pink-300',
      BISTEC_CLUB: 'bg-cyan-500/20 text-cyan-300',
      WORKSHOP: 'bg-teal-500/20 text-teal-300',
      TRAINING: 'bg-green-500/20 text-green-300',
      default: 'bg-white/10 text-white',
    };
    return colors[type] || colors.default;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed min-w-full">
        <thead className="sticky top-0 z-20 bg-surface-secondary border-b border-theme">
          <tr>
            <th className="px-4 py-3 text-left text-[12px] font-semibold text-secondary uppercase tracking-wider">
              Event Title
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold text-secondary uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold text-secondary uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold text-secondary uppercase tracking-wider">
              Participants
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold text-secondary uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold text-secondary uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              className="border-b border-theme hover:bg-surface-secondary/50 transition-colors"
            >
              <td className="px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium text-primary">{event.title}</p>
                  {event.location && (
                    <p className="flex items-center gap-1 text-[12px] text-secondary">
                      <BsGeoAlt /> {event.location}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getEventTypeColor(
                    event.eventType
                  )}`}
                >
                  {event.eventType.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-4 py-3 text-[12px] text-secondary">
                <div className="flex items-center gap-1">
                  <BsCalendar className="text-teal-400" />
                  {new Date(event.startDate).toLocaleDateString()} -{' '}
                  {formatDistanceToNow(new Date(event.startDate), {
                    addSuffix: true,
                  })}
                </div>
              </td>
              <td className="px-4 py-3 text-[13px] text-primary">
                {event.participations?.length || 0}
                {event.capacity ? `/${event.capacity}` : ''}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                    event.status
                  )}`}
                >
                  {event.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(event)}
                    className="rounded-lg p-2 hover:bg-blue-500/20 transition"
                    title="View details"
                  >
                    <BsEye className="text-blue-400" />
                  </button>
                  <button
                    onClick={() => onEdit(event)}
                    className="rounded-lg p-2 hover:bg-teal-500/20 transition"
                    title="Edit event"
                  >
                    <BsPencilSquare className="text-teal-400" />
                  </button>
                  <button
                    onClick={() => onDelete(event.id)}
                    className="rounded-lg p-2 hover:bg-red-500/20 transition"
                    title="Delete event"
                  >
                    <BsTrash className="text-red-400" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {events.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-secondary">No events found</p>
        </div>
      )}
    </div>
  );
};
