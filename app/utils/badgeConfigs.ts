import { IconType } from 'react-icons';
import {
  BsCheckCircle, BsXCircle, BsClock, BsGear, BsPlayCircle,
  BsCircle, BsPauseCircle, BsFlag, BsBuilding, BsPerson
} from 'react-icons/bs';

// ── Status Badge Config ──
// Uses semantic CSS variables from globals.css
export const STATUS_BADGE_CONFIG: Record<string, { bg: string; text: string; icon: IconType }> = {
  APPROVED:    { bg: 'bg-success-muted',       text: 'text-success',    icon: BsCheckCircle },
  REJECTED:    { bg: 'bg-error-muted',         text: 'text-error',      icon: BsXCircle },
  PENDING:     { bg: 'bg-warning-muted',       text: 'text-warning',    icon: BsClock },
  MODIFIED:    { bg: 'bg-warning-muted',       text: 'text-warning',    icon: BsGear },
  COMPLETED:   { bg: 'bg-info-muted',          text: 'text-info',       icon: BsCheckCircle },
  DRAFT:       { bg: 'bg-surface-secondary',   text: 'text-secondary',  icon: BsGear },
  IN_PROGRESS: { bg: 'bg-info-muted',          text: 'text-info',       icon: BsPlayCircle },
  ON_HOLD:     { bg: 'bg-warning-muted',       text: 'text-warning',    icon: BsPauseCircle },
  BLOCKED:     { bg: 'bg-error-muted',         text: 'text-error',      icon: BsFlag },
};

export function getStatusConfig(status: string) {
  return STATUS_BADGE_CONFIG[status] || STATUS_BADGE_CONFIG.PENDING;
}

// ── Priority Badge Config ──
export const PRIORITY_BADGE_CONFIG: Record<string, { bg: string; text: string; icon: IconType; label: string }> = {
  URGENT: { bg: 'bg-priority-urgent', text: 'text-priority-urgent', icon: BsFlag, label: 'Urgent' },
  HIGH:   { bg: 'bg-priority-high',   text: 'text-priority-high',   icon: BsFlag, label: 'High' },
  MEDIUM: { bg: 'bg-priority-medium', text: 'text-priority-medium', icon: BsFlag, label: 'Medium' },
  LOW:    { bg: 'bg-priority-low',    text: 'text-priority-low',    icon: BsFlag, label: 'Low' },
};

export function getPriorityConfig(priority: string) {
  return PRIORITY_BADGE_CONFIG[priority] || PRIORITY_BADGE_CONFIG.MEDIUM;
}

// ── Department Config ──
export const DEPARTMENT_CONFIG: Record<string, { color: string; bg: string; icon: IconType; label: string }> = {
  ENGINEERING:      { color: 'text-cat-professional', bg: 'bg-cat-professional', icon: BsGear,     label: 'Engineering' },
  MARKETING:        { color: 'text-cat-technical',    bg: 'bg-cat-technical',    icon: BsBuilding,  label: 'Marketing' },
  SALES:            { color: 'text-cat-training',     bg: 'bg-cat-training',     icon: BsBuilding,  label: 'Sales' },
  HR:               { color: 'text-cat-kpi',          bg: 'bg-cat-kpi',          icon: BsPerson,    label: 'HR' },
  FINANCE:          { color: 'text-info',             bg: 'bg-info-muted',       icon: BsBuilding,  label: 'Finance' },
  OPERATIONS:       { color: 'text-secondary',        bg: 'bg-surface-secondary', icon: BsGear,     label: 'Operations' },
  CUSTOMER_SUCCESS: { color: 'text-error',            bg: 'bg-error-muted',      icon: BsPerson,    label: 'Customer Success' },
  PRODUCT:          { color: 'text-info',             bg: 'bg-info-muted',       icon: BsGear,      label: 'Product' },
};

export function getDepartmentConfig(department: string) {
  return DEPARTMENT_CONFIG[department] || DEPARTMENT_CONFIG.ENGINEERING;
}
