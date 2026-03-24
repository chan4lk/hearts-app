import { BsRocket, BsLightbulb, BsAward, BsGraphUp, BsStars, BsBriefcase, BsLightningCharge, BsBook, BsHeart, BsBarChart, BsCode, BsBug, BsPeople, BsMegaphone, BsCalculator, BsGear, BsArrowDown, BsDash, BsArrowUp, BsExclamationTriangle } from 'react-icons/bs';

export const CATEGORIES = [
  {
    value: 'PROFESSIONAL',
    label: 'Professional Development',
    icon: BsBriefcase,
    iconColor: 'text-cat-professional',
    color: 'from-blue-500 to-indigo-500',
    bgGradient: 'from-blue-500/10 to-transparent',
    bgColor: 'bg-[#1a1f35]'
  },
  {
    value: 'TECHNICAL',
    label: 'Technical Skills',
    icon: BsLightningCharge,
    iconColor: 'text-amber-400',
    color: 'from-purple-500 to-pink-500',
    bgGradient: 'from-amber-500/10 to-transparent',
    bgColor: 'bg-[#2a2520]'
  },
  {
    value: 'LEADERSHIP',
    label: 'Leadership',
    icon: BsAward,
    iconColor: 'text-cat-technical',
    color: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-purple-500/10 to-transparent',
    bgColor: 'bg-[#251a35]'
  },
  {
    value: 'PERSONAL',
    label: 'Personal Growth',
    icon: BsHeart,
    iconColor: 'text-success',
    color: 'from-rose-500 to-red-500',
    bgGradient: 'from-emerald-500/10 to-transparent',
    bgColor: 'bg-[#1a2a25]'
  },
  {
    value: 'TRAINING',
    label: 'Training',
    icon: BsBook,
    iconColor: 'text-error',
    color: 'from-amber-500 to-orange-500',
    bgGradient: 'from-rose-500/10 to-transparent',
    bgColor: 'bg-[#2a1a20]'
  },
  {
    value: 'KPI',
    label: 'Key Performance Indicators',
    icon: BsBarChart,
    iconColor: 'text-info',
    color: 'from-cyan-500 to-blue-500',
    bgGradient: 'from-cyan-500/10 to-transparent',
    bgColor: 'bg-[#1a2a35]'
  }
] as const;

export const GOAL_TEMPLATES = [
  {
    id: 'project-completion',
    title: 'Project Milestone',
    category: 'PROFESSIONAL',
    icon: 'BsRocket',
    iconColor: 'text-cat-professional',
    description: 'Complete [Project Name] milestone by [Date] achieving [Specific Metrics]',
    subtitle: 'Project Excellence',
    bgGradient: 'from-blue-500/10 to-transparent',
    bgColor: 'bg-[#1a1f35]'
  },
  {
    id: 'skill-mastery',
    title: 'Skill Mastery',
    category: 'TECHNICAL',
    icon: 'BsLightbulb',
    iconColor: 'text-amber-400',
    description: 'Master [Technology/Skill] through [Training/Project] by [Date]',
    subtitle: 'Technical Growth',
    bgGradient: 'from-amber-500/10 to-transparent',
    bgColor: 'bg-[#2a2520]'
  },
  {
    id: 'leadership-initiative',
    title: 'Leadership Initiative',
    category: 'LEADERSHIP',
    icon: 'BsAward',
    iconColor: 'text-cat-technical',
    description: 'Lead [Team/Project] to achieve [Specific Outcome] by [Date]',
    subtitle: 'Leadership Development',
    bgGradient: 'from-purple-500/10 to-transparent',
    bgColor: 'bg-[#251a35]'
  },
  {
    id: 'career-growth',
    title: 'Career Development',
    category: 'PERSONAL',
    icon: 'BsGraphUp',
    iconColor: 'text-success',
    description: 'Achieve [Career Milestone] through [Actions] by [Date]',
    subtitle: 'Professional Growth',
    bgGradient: 'from-emerald-500/10 to-transparent',
    bgColor: 'bg-[#1a2a25]'
  },
  {
    id: 'innovation-project',
    title: 'Innovation Project',
    category: 'PROFESSIONAL',
    icon: 'BsStars',
    iconColor: 'text-accent',
    description: 'Develop innovative solution for [Problem] achieving [Metrics]',
    subtitle: 'Innovation & Creativity',
    bgGradient: 'from-indigo-500/10 to-transparent',
    bgColor: 'bg-[#1a1a35]'
  },
  {
    id: 'certification-goal',
    title: 'Certification Goal',
    category: 'TRAINING',
    icon: 'BsBriefcase',
    iconColor: 'text-error',
    description: 'Obtain [Certification Name] certification by [Date]',
    subtitle: 'Professional Certification',
    bgGradient: 'from-rose-500/10 to-transparent',
    bgColor: 'bg-[#2a1a20]'
  },
  {
    id: 'team-collaboration',
    title: 'Team Collaboration',
    category: 'LEADERSHIP',
    icon: 'BsAward',
    iconColor: 'text-cat-training',
    description: 'Improve team collaboration by implementing [Strategy] and achieving [Metrics] by [Date]',
    subtitle: 'Team Building',
    bgGradient: 'from-green-500/10 to-transparent',
    bgColor: 'bg-[#1a2a20]'
  },
  {
    id: 'revenue-kpi',
    title: 'Revenue Growth',
    category: 'KPI',
    icon: 'BsGraphUp',
    iconColor: 'text-info',
    description: 'Achieve quarterly revenue target of [Amount] with [Growth %] YoY growth by [Date]',
    subtitle: 'Financial Performance',
    bgGradient: 'from-cyan-500/10 to-transparent',
    bgColor: 'bg-[#1a2a2a]'
  },
  {
    id: 'customer-satisfaction-kpi',
    title: 'Customer Satisfaction (CSAT)',
    category: 'KPI',
    icon: 'BsStars',
    iconColor: 'text-warning',
    description: 'Maintain CSAT score above [Target %] and reduce customer churn to [Target %]',
    subtitle: 'Customer Success Metrics',
    bgGradient: 'from-yellow-500/10 to-transparent',
    bgColor: 'bg-[#2a2a1a]'
  },
  {
    id: 'operational-efficiency-kpi',
    title: 'Operational Efficiency',
    category: 'KPI',
    icon: 'BsLightbulb',
    iconColor: 'text-cat-personal',
    description: 'Reduce operational costs by [Target %] while maintaining quality standards above [Target %]',
    subtitle: 'Process Optimization',
    bgGradient: 'from-teal-500/10 to-transparent',
    bgColor: 'bg-[#1a2a25]'
  },
  {
    id: 'employee-performance-kpi',
    title: 'Employee Performance',
    category: 'KPI',
    icon: 'BsBarChart',
    iconColor: 'text-accent',
    description: 'Achieve team productivity rate of [Target %] and maintain employee satisfaction above [Score]',
    subtitle: 'HR Metrics',
    bgGradient: 'from-indigo-500/10 to-transparent',
    bgColor: 'bg-[#1a1a35]'
  },
  {
    id: 'market-share-kpi',
    title: 'Market Share Growth',
    category: 'KPI',
    icon: 'BsGraphUp',
    iconColor: 'text-cat-technical',
    description: 'Increase market share by [Target %] in [Market Segment] through [Strategic Actions]',
    subtitle: 'Market Performance',
    bgGradient: 'from-purple-500/10 to-transparent',
    bgColor: 'bg-[#251a35]'
  },
  {
    id: 'quality-metrics-kpi',
    title: 'Quality Assurance',
    category: 'KPI',
    icon: 'BsAward',
    iconColor: 'text-success',
    description: 'Maintain product/service quality rating of [Target %] with defect rate below [Target %]',
    subtitle: 'Quality Metrics',
    bgGradient: 'from-emerald-500/10 to-transparent',
    bgColor: 'bg-[#1a2a25]'
  },
  {
    id: 'dev-time-allocation-kpi',
    title: 'Development Time Allocation',
    category: 'KPI',
    icon: 'BsCode',
    iconColor: 'text-cat-professional',
    description: 'Maintain [Target %] of development hours dedicated to core development activities',
    subtitle: 'Development Efficiency',
    bgGradient: 'from-blue-500/10 to-transparent',
    bgColor: 'bg-[#1a1f35]'
  },
  {
    id: 'code-quality-kpi',
    title: 'Code Quality Metrics',
    category: 'KPI',
    icon: 'BsBug',
    iconColor: 'text-error',
    description: 'Achieve maximum of [Number] bugs per story with [Number] peer test cycles',
    subtitle: 'Quality Assurance',
    bgGradient: 'from-red-500/10 to-transparent',
    bgColor: 'bg-[#2a1a20]'
  },
  {
    id: 'sprint-delivery-kpi',
    title: 'Sprint Delivery Rate',
    category: 'KPI',
    icon: 'BsRocket',
    iconColor: 'text-cat-training',
    description: 'Maintain sprint delivery rate of [Target %] or higher',
    subtitle: 'Sprint Performance',
    bgGradient: 'from-green-500/10 to-transparent',
    bgColor: 'bg-[#1a2a20]'
  },
  {
    id: 'team-engagement-kpi',
    title: 'Team Engagement',
    category: 'KPI',
    icon: 'BsPeople',
    iconColor: 'text-cat-technical',
    description: 'Achieve [Target %] participation in company events (Code Crunch, Toastmasters)',
    subtitle: 'Team Participation',
    bgGradient: 'from-purple-500/10 to-transparent',
    bgColor: 'bg-[#251a35]'
  },
  {
    id: 'knowledge-sharing-kpi',
    title: 'Knowledge Sharing',
    category: 'KPI',
    icon: 'BsLightbulb',
    iconColor: 'text-amber-400',
    description: 'Conduct [Number] Hearts Talks/podcasts for knowledge sharing',
    subtitle: 'Learning & Development',
    bgGradient: 'from-amber-500/10 to-transparent',
    bgColor: 'bg-[#2a2520]'
  }
] as const;

export const getStatusBadge = (status: string) => {
  const statusVariants = {
    PENDING: 'secondary',
    COMPLETED: 'default',
    APPROVED: 'default',
    REJECTED: 'destructive',
    MODIFIED: 'outline',
    DRAFT: 'outline'
  } as const;

  return statusVariants[status as keyof typeof statusVariants] || 'secondary';
}; 
export const RATING_COLORS = {
  1: 'bg-error-muted text-error',
  2: 'bg-rating-2 text-rating-2',
  3: 'bg-rating-3 text-warning',
  4: 'bg-cat-professional text-cat-professional',
  5: 'bg-cat-training text-cat-training'
} as const;

export const RATING_LABELS = {
  1: "Needs Improvement",
  2: "Below Expectations",
  3: "Meets Expectations",
  4: "Exceeds Expectations",
  5: "Outstanding"
} as const;

export const RATING_DESCRIPTIONS = {
  1: "Performance consistently falls below expected standards. Significant improvement needed in key areas.",
  2: "Performance occasionally meets standards but improvement is needed to fully meet expectations.",
  3: "Performance consistently meets job requirements and expectations. Demonstrates solid competence.",
  4: "Performance frequently exceeds job requirements. Demonstrates strong skills and initiative.",
  5: "Performance consistently exceeds all expectations. Demonstrates exceptional achievements."
} as const;

export const RATING_HOVER_COLORS = {
  1: 'hover:bg-error-muted hover:text-error',
  2: 'hover:bg-rating-2 hover:text-rating-2',
  3: 'hover:bg-rating-3 hover:text-yellow-300',
  4: 'hover:bg-cat-professional hover:text-cat-professional',
  5: 'hover:bg-cat-training hover:text-cat-training'
} as const;

export const STATUS_COLORS = {
  DRAFT: 'bg-cat-technical text-purple-600 dark:text-cat-technical',
  PENDING: 'bg-surface-secondary text-secondary dark:text-tertiary',
  COMPLETED: 'bg-cat-training text-green-600 dark:text-cat-training',
  APPROVED: 'bg-cat-professional text-info',
  REJECTED: 'bg-error-muted text-error',
  MODIFIED: 'bg-rating-3 text-yellow-600 dark:text-warning'
} as const;

/** Shared status badge styles for GoalsTable and AdminGoalsTable. Use for consistent goal status UI. */
export const GOAL_STATUS_BADGE_CONFIG: Record<string, { bg: string; text: string }> = {
  APPROVED: { bg: 'bg-success-muted', text: 'text-success' },
  REJECTED: { bg: 'bg-error-muted', text: 'text-error' },
  PENDING: { bg: 'bg-warning-muted', text: 'text-amber-400' },
  MODIFIED: { bg: 'bg-cat-professional', text: 'text-cat-professional' },
  COMPLETED: { bg: 'bg-cat-training', text: 'text-cat-training' },
  DRAFT: { bg: 'bg-surface-secondary', text: 'text-tertiary' },
  IN_PROGRESS: { bg: 'bg-cat-professional', text: 'text-cat-professional' },
  ON_HOLD: { bg: 'bg-warning-muted', text: 'text-amber-400' },
  BLOCKED: { bg: 'bg-error-muted', text: 'text-error' },
};

export const DEPARTMENTS = [
  {
    value: 'ENGINEERING',
    label: 'Engineering',
    icon: 'BsCode',
    iconColor: 'text-cat-professional',
    color: 'from-blue-500 to-indigo-500'
  },
  {
    value: 'SALES',
    label: 'Sales',
    icon: 'BsGraphUp',
    iconColor: 'text-cat-training',
    color: 'from-green-500 to-emerald-500'
  },
  {
    value: 'MARKETING',
    label: 'Marketing',
    icon: 'BsMegaphone',
    iconColor: 'text-cat-technical',
    color: 'from-purple-500 to-pink-500'
  },
  {
    value: 'HR',
    label: 'Human Resources',
    icon: 'BsPeople',
    iconColor: 'text-amber-400',
    color: 'from-amber-500 to-orange-500'
  },
  {
    value: 'FINANCE',
    label: 'Finance',
    icon: 'BsCalculator',
    iconColor: 'text-success',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    value: 'OPERATIONS',
    label: 'Operations',
    icon: 'BsGear',
    iconColor: 'text-tertiary',
    color: 'from-gray-500 to-slate-500'
  },
  {
    value: 'CUSTOMER_SUCCESS',
    label: 'Customer Success',
    icon: 'BsHeart',
    iconColor: 'text-error',
    color: 'from-rose-500 to-red-500'
  },
  {
    value: 'PRODUCT',
    label: 'Product',
    icon: 'BsLightbulb',
    iconColor: 'text-info',
    color: 'from-cyan-500 to-blue-500'
  }
] as const;

export const PRIORITIES = [
  {
    value: 'LOW',
    label: 'Low',
    icon: BsArrowDown,
    iconColor: 'text-tertiary',
    color: 'from-gray-400 to-gray-500',
    bgColor: 'bg-surface-secondary'
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    icon: BsDash,
    iconColor: 'text-warning',
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-rating-3'
  },
  {
    value: 'HIGH',
    label: 'High',
    icon: BsArrowUp,
    iconColor: 'text-rating-2',
    color: 'from-orange-400 to-red-500',
    bgColor: 'bg-rating-2'
  },
  {
    value: 'URGENT',
    label: 'Urgent',
    icon: BsExclamationTriangle,
    iconColor: 'text-error',
    color: 'from-red-400 to-red-600',
    bgColor: 'bg-error-muted'
  }
] as const;

// ─── Theme / UI colors (shared; was manager/setgoals/styles/colors) ───
export const THEME_COLORS = {
  primary: {
    gradient: 'from-indigo-600/90 via-purple-600/90 to-pink-600/90',
    text: 'text-accent',
    bg: 'bg-accent-muted',
    border: 'border-indigo-500/50',
    hover: 'hover:bg-accent-muted',
  },
  secondary: {
    gradient: 'from-blue-500/10 to-blue-600/10',
    text: 'text-info',
    bg: 'bg-cat-professional',
    border: 'border-blue-200/20 dark:border-blue-600/20',
  },
  success: {
    gradient: 'from-emerald-500/10 to-emerald-600/10',
    text: 'text-success',
    bg: 'bg-success-muted',
    border: 'border-emerald-200/20 dark:border-emerald-600/20',
  },
  warning: {
    gradient: 'from-amber-500/10 to-amber-600/10',
    text: 'text-warning',
    bg: 'bg-[rgb(var(--color-warning))]/10',
    border: 'border-amber-200/20 dark:border-amber-600/20',
  },
  background: {
    primary: 'bg-slate-900/80',
    secondary: 'bg-slate-800/50',
    gradient: 'from-[#0B1120] via-[#0B1120] to-[#0B1120]',
  },
  border: {
    light: 'border-slate-800/60',
  },
  text: {
    primary: 'text-[rgb(var(--color-text-inverse))]',
    secondary: 'text-tertiary',
  },
} as const;

// ─── Designations & job categories (single source; was app/constants/) ───

/** Predefined designations for employees. */
export const DESIGNATIONS = [
  'Senior Software Engineer',
  'Software Engineer',
  'QA Lead',
  'Tech Lead',
  'Senior Tech Lead',
  'Associate Tech Lead',
  'Accountant',
  'Senior Accountant',
  'Consultant - Senior',
  'Manager - IT Security',
  'Security Manager - GCN',
  'Security Engineer',
  'Project Manager',
  'Graphic Designer',
  'Learning and Development Coordinator',
  'Operations Executive',
  'Senior Finance Executive',
  'Administrative Assistant',
  'Talent Acquisition Specialist',
  'Business Analyst',
  'Lead - Client Operations',
  'Associate QA Engineer',
  'Finance Executive',
  'BTG Consultant - Security Engineer',
  'System Engineer',
  'BTG Consultant - Junior Process Analyst',
  'Associate Software Engineer',
  'BTG Consultant - Accounting Practice Lead',
  'Senior Power Platform Developer',
  'BTG Consultant - Tech Lead',
  'Sales Executive',
  'Senior Medical Marketing Executive',
  'Customer Success Officer',
  'Senior Quality Assurance Engineer',
  'Senior QA Engineer',
  'BTG Consultant - SharePoint',
  'Consultant - Tech Lead',
  'BTG Consultant - PM Trainee',
  'Associate BI Engineer',
  'Practice Lead',
  'Accounts Executive',
  'Associate Project Manager',
  'Senior Digital Marketing Executive',
  'People & Culture Executive',
  'Technical Security Specialist - Information Assurance',
  'UI Lead',
  'Finance Trainee',
  'Senior Data Engineer',
  'Senior Draughtsman',
  'BTG Consultant',
  'Senior Network Engineer',
  'Event Management Executive'
] as const;

/** Predefined job categories for employees. */
export const JOB_CATEGORIES = [
  'Executive',
  'Senior Executive',
  'Sub Contractor',
  'Intern'
] as const;

export function getDesignations(): string[] {
  return [...DESIGNATIONS].sort();
}

export function searchDesignations(keyword: string): string[] {
  if (!keyword.trim()) return getDesignations();
  const lowerKeyword = keyword.toLowerCase();
  return DESIGNATIONS.filter(d => d.toLowerCase().includes(lowerKeyword)).sort();
}

export function getJobCategories(): string[] {
  return [...JOB_CATEGORIES].sort();
}

export function searchJobCategories(keyword: string): string[] {
  if (!keyword.trim()) return getJobCategories();
  const lowerKeyword = keyword.toLowerCase();
  return JOB_CATEGORIES.filter(c => c.toLowerCase().includes(lowerKeyword)).sort();
}

// ─── Event categories & roles (Admin event form, Employee participation) ───

/** Primary event categories – dropdown + "Other" for custom. Maps to EventType. */
export const EVENT_CATEGORIES = [
  { value: 'TOASTMASTERS', label: 'Toastmaster' },
  { value: 'CODECRUNCH', label: 'Code Crunch' },
  { value: 'RBT_TRAINING', label: 'RBT Training' },
  { value: 'TRAINING', label: 'Trainings' },
  { value: 'HEART_TALKS', label: 'Hearts Talks' },
  { value: 'OTHER', label: 'Other (enter below)' },
] as const;

/** Toastmaster role selection for participation. */
export const TOASTMASTER_ROLES = [
  'President',
  'Toastmaster',
  'Table Topics Master',
  'Round Robin Master',
  'Timer',
  'Ah Counter',
  'General Evaluator',
  'Prepared Speech Evaluator',
  'Table Topics Evaluator',
  'Grammarian',
  'Prepared Speech',
] as const;

/** Hearts Talk participation type. */
export const HEARTS_TALK_ROLES = [
  { value: 'PARTICIPANT', label: 'Participant' },
  { value: 'FACILITATOR', label: 'Facilitator' },
] as const;

/** Event status options for admin form (no Other). */
export const EVENT_STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

/** Event categories for form dropdown (excludes Other). */
export const EVENT_CATEGORIES_FORM = EVENT_CATEGORIES.filter(
  (c) => c.value !== 'OTHER'
);