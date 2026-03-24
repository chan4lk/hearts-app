'use client';

import { BsPencil, BsTrash, BsCalendar } from 'react-icons/bs';
import { TABLE_STYLES, useTableSelection, useSorting, SortIcon, SelectionBanner, CheckboxHeader, CheckboxCell, TableEmptyState } from '@/app/components/ui/table-primitives';

interface ReviewCycle {
  id: string;
  userId: string;
  reportingPersonId?: string | null;
  jobCategory: string | null;
  designation: string | null;
  dateOfAppointment: string | null;
  after6Months: string | null;
  reviewMonth: string | null;
  adjustedReviewMonth: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string; role: string; manager?: { id: string; name: string; email: string } | null };
  reportingPerson?: { id: string; name: string; email: string } | null;
  updatedBy?: { id: string; name: string; email: string } | null;
}

interface ReviewCycleTableProps {
  reviewCycles: ReviewCycle[];
  onEdit: (cycle: ReviewCycle) => void;
  onDelete: (cycle: ReviewCycle) => void;
  onRefresh: () => void;
  onBulkDelete?: (ids: string[]) => void;
}

export default function ReviewCycleTable({ reviewCycles, onEdit, onDelete, onRefresh, onBulkDelete }: ReviewCycleTableProps) {
  const { sorted: sortedCycles, sortKey, sortDir, handleSort } = useSorting(reviewCycles);
  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection, isAllSelected, isPartialSelected } = useTableSelection(reviewCycles);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try { return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return dateString; }
  };

  const SH = ({ col, label, w }: { col: string; label: string; w: string }) => (
    <th className={TABLE_STYLES.thSortable} style={{ width: w }} onClick={() => handleSort(col)}>
      <div className="flex items-center gap-1.5"><span>{label}</span><SortIcon column={col} sortKey={sortKey} sortDir={sortDir} /></div>
    </th>
  );

  return (
    <div className="bg-surface-primary rounded-lg border border-theme overflow-hidden shadow-sm flex flex-col h-full gap-2">
      {selectedIds.size > 0 && (
        <div className="mx-2 mt-2">
          <SelectionBanner count={selectedIds.size} onBulkDelete={onBulkDelete ? () => onBulkDelete(Array.from(selectedIds)) : undefined} onClear={clearSelection} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
          <table className="w-full table-fixed min-w-full">
            <thead className={TABLE_STYLES.thead}>
              <tr>
                <CheckboxHeader isAllSelected={isAllSelected} isPartialSelected={isPartialSelected} onToggle={toggleSelectAll} />
                <SH col="user.name" label="Employee" w="11%" />
                <SH col="reportingPerson.name" label="Reporting Person" w="12%" />
                <SH col="jobCategory" label="Job Category" w="10%" />
                <SH col="designation" label="Designation" w="12%" />
                <SH col="dateOfAppointment" label="Appointment Date" w="11%" />
                <th className={TABLE_STYLES.th} style={{ width: '8%' }}>6 Months</th>
                <th className={TABLE_STYLES.th} style={{ width: '9%' }}>Review Month</th>
                <th className={TABLE_STYLES.th} style={{ width: '9%' }}>Adjusted</th>
                <th className={TABLE_STYLES.th} style={{ width: '7%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCycles.length === 0 ? (
                <TableEmptyState colSpan={11} icon={<BsCalendar className="w-5 h-5 text-secondary" />} title="No review cycles found" subtitle='Click "Add Review Cycle" to get started' />
              ) : (
                sortedCycles.map((cycle) => {
                  const hasAdj = cycle.adjustedReviewMonth && cycle.reviewMonth && cycle.adjustedReviewMonth !== cycle.reviewMonth;
                  return (
                    <tr key={cycle.id} className={`${TABLE_STYLES.row} whitespace-nowrap ${selectedIds.has(cycle.id) ? 'bg-accent/5' : hasAdj ? 'bg-[rgb(var(--color-info))]/5 border-l-4 border-l-blue-500' : ''}`}>
                      <CheckboxCell checked={selectedIds.has(cycle.id)} onToggle={() => toggleSelect(cycle.id)} />
                      <td className={TABLE_STYLES.tdPrimary}>{cycle.user.name}</td>
                      <td className={TABLE_STYLES.tdPrimary}>{cycle.reportingPerson?.name || <span className="text-secondary">-</span>}</td>
                      <td className={TABLE_STYLES.tdPrimary}>{cycle.jobCategory || <span className="text-secondary">-</span>}</td>
                      <td className={TABLE_STYLES.tdPrimary}>{cycle.designation || <span className="text-secondary">-</span>}</td>
                      <td className={`${TABLE_STYLES.td} text-xs text-primary whitespace-nowrap`}>{formatDate(cycle.dateOfAppointment)}</td>
                      <td className={`${TABLE_STYLES.td} text-xs text-primary whitespace-nowrap`}>{cycle.after6Months || <span className="text-secondary">-</span>}</td>
                      <td className={`${TABLE_STYLES.td} text-xs whitespace-nowrap ${hasAdj ? 'text-secondary line-through' : 'text-primary'}`}>{cycle.reviewMonth || <span className="text-secondary">-</span>}</td>
                      <td className={`${TABLE_STYLES.td} text-xs whitespace-nowrap ${hasAdj ? 'text-info font-semibold' : 'text-primary'}`}>
                        {hasAdj ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs bg-cat-professional text-blue-600 dark:text-cat-professional">{cycle.adjustedReviewMonth}</span>
                        ) : (cycle.adjustedReviewMonth || <span className="text-secondary">-</span>)}
                      </td>
                      <td className={TABLE_STYLES.td}>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => onEdit(cycle)} className="p-1 text-indigo-500 hover:text-accent hover:bg-accent-muted rounded transition-colors cursor-pointer" title="Edit"><BsPencil className="w-3 h-3" /></button>
                          <button onClick={() => onDelete(cycle)} className="p-1 text-red-500 hover:text-error hover:bg-error-muted rounded transition-colors cursor-pointer" title="Delete"><BsTrash className="w-3 h-3" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
