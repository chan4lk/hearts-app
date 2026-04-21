'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import PageTitle from '@/app/components/shared/PageTitle';
import Modal from '@/app/components/shared/Modal';
import { FormActions } from '@/app/components/shared/FormField';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CalendarDays,
  Plus,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  AlertTriangle,
  MapPin,
  Tag,
  Leaf,
  Drumstick,
  Users,
  Check,
  X,
  Clock,
  Search,
} from 'lucide-react';

type EventStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
type RsvpStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';
type MealPreference = 'NONE' | 'VEG' | 'NON_VEG';

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  dateTime: string;
  location: string | null;
  eventType: string | null;
  status: EventStatus;
  _count: { participations: number };
  mealCounts: { veg: number; nonVeg: number; unspecified: number; confirmed: number };
}

interface Participant {
  id: string;
  status: RsvpStatus;
  mealPreference: MealPreference;
  user: { id: string; name: string; email: string; department: string | null };
}

interface EventDetail {
  id: string;
  title: string;
  participations: Participant[];
  stats: {
    confirmed: number;
    declined: number;
    pending: number;
    meal: { veg: number; nonVeg: number; unspecified: number };
  };
}

const toDatetimeLocal = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const nowDatetimeLocal = () => toDatetimeLocal(new Date().toISOString());

const formatEventTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelled, setShowCancelled] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState(nowDatetimeLocal);
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setDateTime(nowDatetimeLocal());
    setLocation('');
    setEventType('');
    setCreateError('');
  };

  const openCreate = () => {
    resetCreateForm();
    setShowCreate(true);
  };

  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [editing, setEditing] = useState<EventRow | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDateTime, setEditDateTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editEventType, setEditEventType] = useState('');
  const [editStatus, setEditStatus] = useState<EventStatus>('SCHEDULED');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [deleting, setDeleting] = useState<EventRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [viewing, setViewing] = useState<EventRow | null>(null);
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [participantFilter, setParticipantFilter] = useState<'ALL' | RsvpStatus>('ALL');

  const flashMsg = (type: 'success' | 'error', msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 3500);
  };

  const fetchEvents = useCallback(async () => {
    const res = await fetch('/api/events');
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const eventTypes = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) if (e.eventType) set.add(e.eventType);
    return Array.from(set).sort();
  }, [events]);

  const visibleEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const typeQ = typeFilter.trim().toLowerCase();
    return events.filter((e) => {
      if (!showCancelled && e.status === 'CANCELLED') return false;
      if (typeQ) {
        const et = (e.eventType ?? '').toLowerCase();
        if (!et.includes(typeQ)) return false;
      }
      if (q) {
        const hay = `${e.title} ${e.description ?? ''} ${e.location ?? ''} ${e.eventType ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, showCancelled, typeFilter, search]);

  const scheduledCount = events.filter((e) => e.status === 'SCHEDULED').length;
  const cancelledCount = events.filter((e) => e.status === 'CANCELLED').length;
  const totalInvites = events.reduce((sum, e) => sum + e._count.participations, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateTime) return;
    setCreating(true);
    setCreateError('');
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        dateTime: new Date(dateTime).toISOString(),
        location: location.trim() || undefined,
        eventType: eventType.trim() || undefined,
      }),
    });
    if (res.ok) {
      resetCreateForm();
      setShowCreate(false);
      await fetchEvents();
      flashMsg('success', 'Event created');
    } else {
      const d = await res.json().catch(() => ({}));
      setCreateError(d.error || 'Failed to create event');
    }
    setCreating(false);
  };

  const handleToggle = async (ev: EventRow) => {
    const nextStatus: EventStatus = ev.status === 'CANCELLED' ? 'SCHEDULED' : 'CANCELLED';
    const res = await fetch(`/api/events/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      await fetchEvents();
      flashMsg('success', nextStatus === 'CANCELLED' ? 'Event cancelled' : 'Event reactivated');
    } else {
      flashMsg('error', 'Failed to update event');
    }
  };

  const openEdit = (ev: EventRow) => {
    setEditing(ev);
    setEditTitle(ev.title);
    setEditDescription(ev.description || '');
    setEditDateTime(toDatetimeLocal(ev.dateTime));
    setEditLocation(ev.location || '');
    setEditEventType(ev.eventType || '');
    setEditStatus(ev.status);
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editTitle.trim() || !editDateTime) return;
    setSaving(true);
    setEditError('');
    const res = await fetch(`/api/events/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDescription.trim() ? editDescription.trim() : null,
        dateTime: new Date(editDateTime).toISOString(),
        location: editLocation.trim() ? editLocation.trim() : null,
        eventType: editEventType.trim() ? editEventType.trim() : null,
        status: editStatus,
      }),
    });
    if (res.ok) {
      setEditing(null);
      await fetchEvents();
      flashMsg('success', 'Event updated');
    } else {
      const d = await res.json().catch(() => ({}));
      setEditError(d.error || 'Failed to save event');
    }
    setSaving(false);
  };

  const openParticipants = async (ev: EventRow) => {
    setViewing(ev);
    setDetail(null);
    setDetailLoading(true);
    setParticipantFilter('ALL');
    const res = await fetch(`/api/events/${ev.id}`);
    if (res.ok) {
      setDetail(await res.json());
    } else {
      flashMsg('error', 'Failed to load participants');
      setViewing(null);
    }
    setDetailLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError('');
    const res = await fetch(`/api/events/${deleting.id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleting(null);
      await fetchEvents();
      flashMsg('success', 'Event deleted');
    } else {
      const d = await res.json().catch(() => ({}));
      setDeleteError(d.error || 'Failed to delete event');
    }
    setDeleteBusy(false);
  };

  return (
    <DashboardLayout type="admin">
      <datalist id="event-type-options">
        {eventTypes.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <div className="max-w-3xl mx-auto space-y-6">
        <PageTitle
          title="Events"
          subtitle="Create and manage company events"
          icon={CalendarDays}
          iconColor="--color-accent"
          actions={
            <button
              type="button"
              onClick={openCreate}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Event
            </button>
          }
        />

        {flash && (
          <div
            className={`px-4 py-2 rounded-xl text-sm border ${
              flash.type === 'success'
                ? 'bg-success-muted text-success border-theme'
                : 'bg-error-muted text-error border-theme'
            }`}
          >
            {flash.msg}
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Events', value: events.length },
              { label: 'Scheduled', value: scheduledCount },
              { label: 'Cancelled', value: cancelledCount },
              { label: 'Total Invites', value: totalInvites },
            ].map(({ label, value }) => (
              <div key={label} className="card-stat text-center">
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-2xs text-tertiary">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, location, type..."
              className="input-base pl-9"
              aria-label="Search events"
            />
          </div>
          <div className="relative sm:w-56">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
            <input
              type="text"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              placeholder="All types"
              className="input-base pl-9 pr-8"
              list="event-type-options"
              autoComplete="off"
              aria-label="Filter by type (type to search)"
            />
            {typeFilter && (
              <button
                type="button"
                onClick={() => setTypeFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary focus-ring rounded p-0.5"
                aria-label="Clear type filter"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-secondary cursor-pointer select-none flex-shrink-0">
            <input
              type="checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
              className="focus-ring"
            />
            Show cancelled
          </label>
        </div>

        <p className="text-xs text-tertiary -mt-2">
          Showing {visibleEvents.length} of {events.length} event{events.length === 1 ? '' : 's'}
          {(search || typeFilter || !showCancelled) && (
            <>
              {' · '}
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('');
                  setShowCancelled(true);
                }}
                className="text-accent hover:underline focus-ring rounded"
              >
                Clear filters
              </button>
            </>
          )}
        </p>

        {loading ? (
          <PageSkeleton type="cards" count={3} />
        ) : visibleEvents.length === 0 ? (
          <div className="empty-container">
            <div
              className="empty-icon-ring"
              style={{ backgroundColor: 'rgba(var(--color-accent),0.1)' }}
            >
              <Calendar className="w-10 h-10" style={{ color: 'rgb(var(--color-accent))' }} />
            </div>
            <p className="empty-title">
              {events.length === 0 ? 'No events yet' : 'No events match the current filters'}
            </p>
            <p className="empty-description">
              {events.length === 0
                ? 'Click "New Event" to add your first event'
                : 'Try a different search term, clear the type filter, or toggle "Show cancelled".'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto scrollbar-hide pr-1 -mr-1">
            <AnimatePresence initial={false}>
              {visibleEvents.map((ev) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={`flex items-start justify-between gap-3 p-4 card-interactive cursor-pointer ${
                    ev.status === 'CANCELLED' ? 'opacity-70' : ''
                  }`}
                  onClick={() => openParticipants(ev)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openParticipants(ev);
                    }
                  }}
                  aria-label={`View participants of ${ev.title}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`icon-box-md flex-shrink-0 ${
                        ev.status === 'SCHEDULED'
                          ? 'bg-[rgba(var(--color-accent),0.1)]'
                          : 'bg-surface-secondary'
                      }`}
                    >
                      <Calendar
                        className={`w-5 h-5 ${
                          ev.status === 'SCHEDULED' ? 'text-accent' : 'text-tertiary'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-primary truncate">{ev.title}</p>
                      <p className="text-xs text-tertiary flex items-center gap-2 flex-wrap mt-0.5">
                        <span>{formatEventTime(ev.dateTime)}</span>
                        {ev.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {ev.location}
                          </span>
                        )}
                        {ev.eventType && (
                          <span className="badge-base bg-surface-secondary text-secondary inline-flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {ev.eventType}
                          </span>
                        )}
                        <span>
                          {ev._count.participations} invited
                          {ev.mealCounts.confirmed > 0 && ` · ${ev.mealCounts.confirmed} confirmed`}
                        </span>
                        {ev.mealCounts.veg > 0 && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-success-muted text-success"
                            title="Vegetarian"
                          >
                            <Leaf className="w-3 h-3" /> {ev.mealCounts.veg} veg
                          </span>
                        )}
                        {ev.mealCounts.nonVeg > 0 && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-accent-muted text-accent"
                            title="Non-vegetarian"
                          >
                            <Drumstick className="w-3 h-3" /> {ev.mealCounts.nonVeg} non-veg
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {ev.status === 'CANCELLED' ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-warning-muted text-warning border border-theme"
                        aria-label="Cancelled event"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: 'rgb(var(--color-warning))' }}
                        />
                        Cancelled
                      </span>
                    ) : ev.status === 'COMPLETED' ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-info-muted text-info border border-theme"
                        aria-label="Completed event"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: 'rgb(var(--color-info))' }}
                        />
                        Completed
                      </span>
                    ) : (
                      <span className="h-[18px]" aria-hidden="true" />
                    )}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => openParticipants(ev)}
                        className="focus-ring rounded-lg p-2 text-tertiary hover:text-accent hover:bg-accent-muted transition-colors"
                        aria-label={`View participants of ${ev.title}`}
                        title="View participants"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(ev)}
                        className="focus-ring rounded-lg p-2 text-tertiary hover:text-accent hover:bg-accent-muted transition-colors"
                        aria-label={`Edit ${ev.title}`}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(ev)}
                        className="focus-ring rounded-lg p-1"
                        aria-label={
                          ev.status === 'CANCELLED'
                            ? `Reactivate ${ev.title}`
                            : `Cancel ${ev.title}`
                        }
                        title={ev.status === 'CANCELLED' ? 'Reactivate' : 'Cancel'}
                      >
                        {ev.status !== 'CANCELLED' ? (
                          <ToggleRight className="w-8 h-8 text-success" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-tertiary" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleting(ev);
                          setDeleteError('');
                        }}
                        className="focus-ring rounded-lg p-2 text-tertiary hover:text-error hover:bg-error-muted transition-colors"
                        aria-label={`Delete ${ev.title}`}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => !creating && setShowCreate(false)}
        title="New Event"
        icon={<Calendar className="w-5 h-5 text-accent" />}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="input-label">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title (e.g., CodeCrunch — Q2)"
              className="input-base"
              maxLength={200}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              rows={3}
              className="input-textarea"
              maxLength={2000}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="input-label">When</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="input-base"
                required
              />
            </div>
            <div>
              <label className="input-label">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-base"
                maxLength={200}
                placeholder="Optional"
              />
            </div>
          </div>
          <div>
            <label className="input-label">Type</label>
            <input
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="input-base"
              maxLength={50}
              placeholder="Pick one or type a new one"
              list="event-type-options"
              autoComplete="off"
            />
            <p className="text-2xs text-tertiary mt-1">
              Choose from existing types or enter a new one.
            </p>
          </div>
          <p className="text-xs text-tertiary">
            All active employees will be invited automatically. They can RSVP and pick a meal
            preference from their events page.
          </p>
          {createError && <p className="text-xs text-error">{createError}</p>}
          <FormActions
            onCancel={() => setShowCreate(false)}
            submitLabel={creating ? 'Creating...' : 'Create Event'}
            loading={creating}
            disabled={!title.trim() || !dateTime}
          />
        </form>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => !saving && setEditing(null)}
        title="Edit Event"
        icon={<Pencil className="w-5 h-5 text-accent" />}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="input-label">Title</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input-base"
              maxLength={200}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="input-textarea"
              rows={3}
              maxLength={2000}
              placeholder="Optional"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="input-label">When</label>
              <input
                type="datetime-local"
                value={editDateTime}
                onChange={(e) => setEditDateTime(e.target.value)}
                className="input-base"
                required
              />
            </div>
            <div>
              <label className="input-label">Location</label>
              <input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="input-base"
                maxLength={200}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="input-label">Type</label>
              <input
                value={editEventType}
                onChange={(e) => setEditEventType(e.target.value)}
                className="input-base"
                maxLength={50}
                placeholder="Pick one or type a new one"
                list="event-type-options"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="input-label">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as EventStatus)}
                className="input-base"
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
          {editing && editing._count.participations > 0 && (
            <p className="text-xs text-tertiary">
              Note: {editing._count.participations} participant
              {editing._count.participations === 1 ? ' is' : 's are'} already invited. Changes apply
              immediately.
            </p>
          )}
          {editError && <p className="text-xs text-error">{editError}</p>}
          <FormActions
            onCancel={() => setEditing(null)}
            submitLabel="Save Changes"
            loading={saving}
            disabled={!editTitle.trim() || !editDateTime}
          />
        </form>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => !deleteBusy && setDeleting(null)}
        title="Delete Event"
        icon={<AlertTriangle className="w-5 h-5 text-error" />}
      >
        <div className="space-y-4">
          {deleting && deleting._count.participations > 0 ? (
            <>
              <p className="text-sm text-secondary">
                <strong className="text-primary">{deleting.title}</strong> has{' '}
                <strong className="text-primary">
                  {deleting._count.participations} participant
                  {deleting._count.participations === 1 ? '' : 's'}
                </strong>{' '}
                invited. Deleting will permanently remove the event and every RSVP.
              </p>
              <p className="text-sm text-secondary">
                If you want to preserve the record, use <strong>Cancel Instead</strong> — the event
                will be hidden from the calendar but RSVPs and history stay intact.
              </p>
              {deleteError && <p className="text-xs text-error">{deleteError}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleting(null)}
                  disabled={deleteBusy}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                {deleting.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const target = deleting;
                      setDeleting(null);
                      if (target) await handleToggle(target);
                    }}
                    className="btn-primary flex-1"
                  >
                    Cancel Instead
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteBusy}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[rgb(var(--color-error))] text-[rgb(var(--color-text-inverse))] rounded-xl text-sm font-medium hover:opacity-90 focus-ring shadow-sm transition-all disabled:opacity-60"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleteBusy ? 'Deleting...' : 'Delete Anyway'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-secondary">
                Are you sure you want to delete{' '}
                <strong className="text-primary">{deleting?.title}</strong>? This action cannot be
                undone.
              </p>
              {deleteError && <p className="text-xs text-error">{deleteError}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleting(null)}
                  disabled={deleteBusy}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteBusy}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[rgb(var(--color-error))] text-[rgb(var(--color-text-inverse))] rounded-xl text-sm font-medium hover:opacity-90 focus-ring shadow-sm transition-all disabled:opacity-60"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleteBusy ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={!!viewing}
        onClose={() => {
          setViewing(null);
          setDetail(null);
        }}
        title={viewing ? `Participants — ${viewing.title}` : 'Participants'}
        icon={<Users className="w-5 h-5 text-accent" />}
        maxWidth="max-w-2xl"
      >
        {detailLoading ? (
          <p className="text-sm text-secondary py-4">Loading participants...</p>
        ) : detail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="card-stat text-center py-3">
                <p className="text-xl sm:text-2xl font-bold text-success">{detail.stats.confirmed}</p>
                <p className="text-2xs text-tertiary">Confirmed</p>
              </div>
              <div className="card-stat text-center py-3">
                <p className="text-xl sm:text-2xl font-bold text-warning">{detail.stats.pending}</p>
                <p className="text-2xs text-tertiary">Pending</p>
              </div>
              <div className="card-stat text-center py-3">
                <p className="text-xl sm:text-2xl font-bold text-error">{detail.stats.declined}</p>
                <p className="text-2xs text-tertiary">Declined</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-secondary">
              <span className="text-xs font-semibold text-tertiary">Meal count (confirmed):</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-success-muted text-success">
                <Leaf className="w-3 h-3" /> {detail.stats.meal.veg} veg
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-accent-muted text-accent">
                <Drumstick className="w-3 h-3" /> {detail.stats.meal.nonVeg} non-veg
              </span>
              {detail.stats.meal.unspecified > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-warning-muted text-warning">
                  {detail.stats.meal.unspecified} unspecified
                </span>
              )}
            </div>

            <div className="flex gap-1.5">
              {(['ALL', 'CONFIRMED', 'PENDING', 'DECLINED'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setParticipantFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-2xs font-semibold focus-ring transition-all ${
                    participantFilter === f
                      ? 'bg-accent text-[rgb(var(--color-text-inverse))]'
                      : 'bg-surface-secondary text-secondary hover:text-primary'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-theme border border-theme rounded-xl">
              {detail.participations
                .filter((p) => participantFilter === 'ALL' || p.status === participantFilter)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-primary truncate">{p.user.name}</p>
                      <p className="text-2xs text-tertiary truncate">
                        {p.user.department || p.user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p.mealPreference === 'VEG' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-success-muted text-success">
                          <Leaf className="w-3 h-3" /> Veg
                        </span>
                      )}
                      {p.mealPreference === 'NON_VEG' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-accent-muted text-accent">
                          <Drumstick className="w-3 h-3" /> Non-Veg
                        </span>
                      )}
                      {p.status === 'CONFIRMED' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-success-muted text-success">
                          <Check className="w-3 h-3" /> Confirmed
                        </span>
                      )}
                      {p.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-warning-muted text-warning">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                      {p.status === 'DECLINED' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-error-muted text-error">
                          <X className="w-3 h-3" /> Declined
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              {detail.participations.filter(
                (p) => participantFilter === 'ALL' || p.status === participantFilter
              ).length === 0 && (
                <p className="text-sm text-tertiary text-center py-6">No participants in this filter</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setViewing(null);
                  setDetail(null);
                }}
                className="btn-secondary flex-1"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (viewing) {
                    const ev = viewing;
                    setViewing(null);
                    setDetail(null);
                    openEdit(ev);
                  }
                }}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                <Pencil className="w-4 h-4" /> Edit Event
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </DashboardLayout>
  );
}
