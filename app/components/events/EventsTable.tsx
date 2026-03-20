'use client';

import { formatDistanceToNow } from 'date-fns';
import { BsEye, BsTrash, BsPencilSquare, BsCalendar, BsGeoAlt, BsCalendarEvent } from 'react-icons/bs';
import { TABLE_STYLES, useTableSelection, SelectionBanner, CheckboxHeader, CheckboxCell, TableEmptyState } from '@/app/components/ui/table-primitives';

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
  onBulkDelete?: (ids: string[]) => void;
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-500/20 text-blue-400',
  ONGOING: 'bg-green-500/20 text-green-400',
  COMPLETED: 'bg-slate-500/20 text-slate-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
};

const TYPE_COLORS: Record<string, string> = {
  TOASTMASTERS: 'bg-cyan-500/20 text-cyan-400',
  CODECRUNCH: 'bg-orange-500/20 text-orange-400',
  HEART_TALKS: 'bg-pink-500/20 text-pink-400',
  BISTEC_CLUB: 'bg-cyan-500/20 text-cyan-400',
  WORKSHOP: 'bg-teal-500/20 text-teal-400',
  TRAINING: 'bg-green-500/20 text-green-400',
};

export const EventsTable = ({ events, onEdit, onDelete, onView, onBulkDelete, isLoading = false }: EventsTableProps) => {
  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection, isAllSelected, isPartialSelected } = useTableSelection(events);

  return (
    <div className="flex flex-col gap-2">
      <SelectionBanner
        count={selectedIds.size}
        onBulkDelete={onBulkDelete ? () => onBulkDelete(Array.from(selectedIds)) : undefined}
        onClear={clearSelection}
      />

      <div className="overflow-x-auto">
        <table className="w-full table-fixed min-w-full">
          <thead className={TABLE_STYLES.thead}>
            <tr>
              <CheckboxHeader isAllSelected={isAllSelected} isPartialSelected={isPartialSelected} onToggle={toggleSelectAll} />
              <th style={{ width: '25%' }} className={TABLE_STYLES.th}>Event Title</th>
              <th style={{ width: '14%' }} className={TABLE_STYLES.th}>Type</th>
              <th style={{ width: '22%' }} className={TABLE_STYLES.th}>Date</th>
              <th style={{ width: '10%' }} className={TABLE_STYLES.th}>Participants</th>
              <th style={{ width: '12%' }} className={TABLE_STYLES.th}>Status</th>
              <th style={{ width: '14%' }} className={TABLE_STYLES.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && !isLoading ? (
              <TableEmptyState colSpan={7} icon={<BsCalendarEvent className="w-5 h-5 text-secondary" />} title="No events found" subtitle="Try adjusting your filters to see more results" />
            ) : (
              events.map((event) => (
                <tr key={event.id} className={selectedIds.has(event.id) ? TABLE_STYLES.rowSelected : TABLE_STYLES.row}>
                  <CheckboxCell checked={selectedIds.has(event.id)} onToggle={() => toggleSelect(event.id)} />
                  <td className={TABLE_STYLES.td} onClick={() => onView(event)}>
                    <p className="text-[13px] font-medium text-primary truncate">{event.title}</p>
                    {event.location && (
                      <p className="flex items-center gap-1 text-[12px] text-secondary truncate">
                        <BsGeoAlt className="w-3 h-3 shrink-0" /> {event.location}
                      </p>
                    )}
                  </td>
                  <td className={TABLE_STYLES.td}>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_COLORS[event.eventType] || 'bg-slate-500/20 text-secondary'}`}>
                      {event.eventType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className={TABLE_STYLES.tdSecondary}>
                    <div className="flex items-center gap-1">
                      <BsCalendar className="text-indigo-400 w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {new Date(event.startDate).toLocaleDateString()} — {formatDistanceToNow(new Date(event.startDate), { addSuffix: true })}
                      </span>
                    </div>
                  </td>
                  <td className={TABLE_STYLES.tdPrimary}>
                    {event.participations?.length || 0}{event.capacity ? `/${event.capacity}` : ''}
                  </td>
                  <td className={TABLE_STYLES.td}>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[event.status] || 'bg-slate-500/20 text-secondary'}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className={TABLE_STYLES.td}>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); onView(event); }} className="rounded-lg p-1.5 hover:bg-blue-500/10 transition-colors cursor-pointer" title="View">
                        <BsEye className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onEdit(event); }} className="rounded-lg p-1.5 hover:bg-indigo-500/10 transition-colors cursor-pointer" title="Edit">
                        <BsPencilSquare className="w-3.5 h-3.5 text-indigo-400" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(event.id); }} className="rounded-lg p-1.5 hover:bg-red-500/10 transition-colors cursor-pointer" title="Delete">
                        <BsTrash className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
