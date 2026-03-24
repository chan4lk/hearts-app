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
  SCHEDULED: 'bg-cat-professional text-cat-professional',
  ONGOING: 'bg-cat-training text-cat-training',
  COMPLETED: 'bg-surface-secondary text-tertiary',
  CANCELLED: 'bg-error-muted text-error',
};

const TYPE_COLORS: Record<string, string> = {
  TOASTMASTERS: 'bg-info-muted text-info',
  CODECRUNCH: 'bg-rating-2 text-rating-2',
  HEART_TALKS: 'bg-[rgb(var(--color-cat-kpi))]/20 text-cat-kpi',
  BISTEC_CLUB: 'bg-info-muted text-info',
  WORKSHOP: 'bg-cat-personal text-cat-personal',
  TRAINING: 'bg-cat-training text-cat-training',
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
                    <p className="text-xs font-medium text-primary truncate">{event.title}</p>
                    {event.location && (
                      <p className="flex items-center gap-1 text-xs text-secondary truncate">
                        <BsGeoAlt className="w-3 h-3 shrink-0" /> {event.location}
                      </p>
                    )}
                  </td>
                  <td className={TABLE_STYLES.td}>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ${TYPE_COLORS[event.eventType] || 'bg-surface-secondary text-secondary'}`}>
                      {event.eventType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className={TABLE_STYLES.tdSecondary}>
                    <div className="flex items-center gap-1">
                      <BsCalendar className="text-accent w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {new Date(event.startDate).toLocaleDateString()} — {formatDistanceToNow(new Date(event.startDate), { addSuffix: true })}
                      </span>
                    </div>
                  </td>
                  <td className={TABLE_STYLES.tdPrimary}>
                    {event.participations?.length || 0}{event.capacity ? `/${event.capacity}` : ''}
                  </td>
                  <td className={TABLE_STYLES.td}>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium ${STATUS_COLORS[event.status] || 'bg-surface-secondary text-secondary'}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className={TABLE_STYLES.td}>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); onView(event); }} className="rounded-lg p-1.5 hover:bg-cat-professional transition-colors cursor-pointer" title="View">
                        <BsEye className="w-3.5 h-3.5 text-cat-professional" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onEdit(event); }} className="rounded-lg p-1.5 hover:bg-accent-muted transition-colors cursor-pointer" title="Edit">
                        <BsPencilSquare className="w-3.5 h-3.5 text-accent" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(event.id); }} className="rounded-lg p-1.5 hover:bg-error-muted transition-colors cursor-pointer" title="Delete">
                        <BsTrash className="w-3.5 h-3.5 text-error" />
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
