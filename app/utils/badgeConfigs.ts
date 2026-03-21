import { IconType } from 'react-icons';
import {
  BsCheckCircle, BsXCircle, BsClock, BsGear, BsPlayCircle,
  BsCircle, BsPauseCircle, BsFlag, BsBuilding, BsPerson
} from 'react-icons/bs';

// ── Status Badge Config (single source of truth) ──
export const STATUS_BADGE_CONFIG: Record<string, { bg: string; text: string; icon: IconType }> = {
  APPROVED:    { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: BsCheckCircle },
  REJECTED:    { bg: 'bg-rose-500/20',    text: 'text-rose-400',    icon: BsXCircle },
  PENDING:     { bg: 'bg-amber-500/20',   text: 'text-amber-400',   icon: BsClock },
  MODIFIED:    { bg: 'bg-blue-500/20',    text: 'text-blue-400',    icon: BsGear },
  COMPLETED:   { bg: 'bg-green-500/20',   text: 'text-green-400',   icon: BsCheckCircle },
  DRAFT:       { bg: 'bg-slate-500/20',   text: 'text-slate-400',   icon: BsGear },
  IN_PROGRESS: { bg: 'bg-blue-500/20',    text: 'text-blue-400',    icon: BsPlayCircle },
  NOT_STARTED: { bg: 'bg-slate-500/20',   text: 'text-slate-400',   icon: BsCircle },
  ON_HOLD:     { bg: 'bg-amber-500/20',   text: 'text-amber-400',   icon: BsPauseCircle },
  BLOCKED:     { bg: 'bg-red-500/20',     text: 'text-red-400',     icon: BsFlag },
};

export function getStatusConfig(status: string) {
  return STATUS_BADGE_CONFIG[status] || STATUS_BADGE_CONFIG.PENDING;
}

// ── Priority Badge Config (single source of truth) ──
export const PRIORITY_BADGE_CONFIG: Record<string, { bg: string; text: string; icon: IconType; label: string }> = {
  URGENT: { bg: 'bg-red-500/20',     text: 'text-red-400',     icon: BsFlag, label: 'Urgent' },
  HIGH:   { bg: 'bg-rose-500/20',    text: 'text-rose-400',    icon: BsFlag, label: 'High' },
  MEDIUM: { bg: 'bg-amber-500/20',   text: 'text-amber-400',   icon: BsFlag, label: 'Medium' },
  LOW:    { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: BsFlag, label: 'Low' },
};

export function getPriorityConfig(priority: string) {
  return PRIORITY_BADGE_CONFIG[priority] || PRIORITY_BADGE_CONFIG.MEDIUM;
}

// ── Department Config (single source of truth) ──
export const DEPARTMENT_CONFIG: Record<string, { color: string; bg: string; icon: IconType; label: string }> = {
  ENGINEERING:      { color: 'text-blue-400',   bg: 'bg-blue-500/10',   icon: BsGear,     label: 'Engineering' },
  MARKETING:        { color: 'text-purple-400', bg: 'bg-purple-500/10', icon: BsBuilding,  label: 'Marketing' },
  SALES:            { color: 'text-green-400',  bg: 'bg-green-500/10',  icon: BsBuilding,  label: 'Sales' },
  HR:               { color: 'text-pink-400',   bg: 'bg-pink-500/10',   icon: BsPerson,    label: 'HR' },
  FINANCE:          { color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   icon: BsBuilding,  label: 'Finance' },
  OPERATIONS:       { color: 'text-gray-400',   bg: 'bg-gray-500/10',   icon: BsGear,      label: 'Operations' },
  CUSTOMER_SUCCESS: { color: 'text-rose-400',   bg: 'bg-rose-500/10',   icon: BsPerson,    label: 'Customer Success' },
  PRODUCT:          { color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   icon: BsGear,      label: 'Product' },
};

export function getDepartmentConfig(department: string) {
  return DEPARTMENT_CONFIG[department] || DEPARTMENT_CONFIG.ENGINEERING;
}
