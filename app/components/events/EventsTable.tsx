'use client';

import { formatDistanceToNow } from 'date-fns';
import { BsEye, BsTrash, BsEdit, BsCalendar, BsGeo } from 'react-icons/bs';

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
        return 'bg-gray-500/20 text-gray-300';
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
        <thead className="sticky top-0 z-20 bg-gradient-to-r from-teal-600 to-cyan-600 border-b-2 border-teal-700 shadow-md">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
              Event Title
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
              Participants
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              className="border-b border-white/5 hover:bg-white/5 transition"
            >
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-white">{event.title}</p>
                  {event.location && (
                    <p className="flex items-center gap-1 text-xs text-white/60">
                      <BsGeo /> {event.location}
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
              <td className="px-4 py-3 text-sm text-white/70">
                <div className="flex items-center gap-1">
                  <BsCalendar className="text-teal-400" />
                  {new Date(event.startDate).toLocaleDateString()} -{' '}
                  {formatDistanceToNow(new Date(event.startDate), {
                    addSuffix: true,
                  })}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-white/70">
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
                    <BsEdit className="text-teal-400" />
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
          <p className="text-white/60">No events found</p>
        </div>
      )}
    </div>
  );
};
