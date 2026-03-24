import { BsRocket, BsLightbulb, BsAward, BsGraphUp, BsStars, BsBriefcase, BsLightningCharge, BsBook, BsHeart, BsBarChart, BsCode, BsBug, BsPeople, BsMegaphone, BsCalculator, BsGear, BsArrowDown, BsDash, BsArrowUp, BsExclamationTriangle } from 'react-icons/bs';

export const CATEGORIES = [
  {
    value: 'PROFESSIONAL',
    label: 'Professional Development',
    icon: BsBriefcase,
    iconColor: 'text-blue-400',
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
    iconColor: 'text-purple-400',
    color: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-purple-500/10 to-transparent',
    bgColor: 'bg-[#251a35]'
  },
  {
    value: 'PERSONAL',
    label: 'Personal Growth',
    icon: BsHeart,
    iconColor: 'text-emerald-400',
    color: 'from-rose-500 to-red-500',
    bgGradient: 'from-emerald-500/10 to-transparent',
    bgColor: 'bg-[#1a2a25]'
  },
  {
    value: 'TRAINING',
    label: 'Training',
    icon: BsBook,
    iconColor: 'text-rose-400',
    color: 'from-amber-500 to-orange-500',
    bgGradient: 'from-rose-500/10 to-transparent',
    bgColor: 'bg-[#2a1a20]'
  },
  {
    value: 'KPI',
    label: 'Key Performance Indicators',
    icon: BsBarChart,
    iconColor: 'text-cyan-400',
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
    iconColor: 'text-blue-400',
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
    iconColor: 'text-purple-400',
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
    iconColor: 'text-emerald-400',
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
    iconColor: 'text-indigo-400',
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
    iconColor: 'text-rose-400',
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
    iconColor: 'text-green-400',
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
    iconColor: 'text-cyan-400',
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
    iconColor: 'text-teal-400',
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
    iconColor: 'text-indigo-400',
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
    iconColor: 'text-purple-400',
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
    iconColor: 'text-emerald-400',
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
    iconColor: 'text-blue-400',
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
    iconColor: 'text-red-400',
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
    iconColor: 'text-green-400',
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
    iconColor: 'text-purple-400',
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
  1: 'bg-red-500/10 text-red-400',
  2: 'bg-orange-500/10 text-orange-400',
  3: 'bg-yellow-500/10 text-warning',
  4: 'bg-blue-500/10 text-blue-400',
  5: 'bg-green-500/10 text-green-400'
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
  1: 'hover:bg-red-500/20 hover:text-red-300',
  2: 'hover:bg-orange-500/20 hover:text-orange-300',
  3: 'hover:bg-yellow-500/20 hover:text-yellow-300',
  4: 'hover:bg-blue-500/20 hover:text-blue-300',
  5: 'hover:bg-green-500/20 hover:text-green-300'
} as const;

export const STATUS_COLORS = {
  DRAFT: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  PENDING: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  COMPLETED: 'bg-green-500/10 text-green-600 dark:text-green-400',
  APPROVED: 'bg-blue-500/10 text-info',
  REJECTED: 'bg-red-500/10 text-error',
  MODIFIED: 'bg-yellow-500/10 text-yellow-600 dark:text-warning'
} as const;

/** Shared status badge styles for GoalsTable and AdminGoalsTable. Use for consistent goal status UI. */
export const GOAL_STATUS_BADGE_CONFIG: Record<string, { bg: string; text: string }> = {
  APPROVED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  REJECTED: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
  PENDING: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  MODIFIED: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  COMPLETED: { bg: 'bg-green-500/20', text: 'text-green-400' },
  DRAFT: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  IN_PROGRESS: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  ON_HOLD: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  BLOCKED: { bg: 'bg-red-500/20', text: 'text-red-400' },
};

export const DEPARTMENTS = [
  {
    value: 'ENGINEERING',
    label: 'Engineering',
    icon: 'BsCode',
    iconColor: 'text-blue-400',
    color: 'from-blue-500 to-indigo-500'
  },
  {
    value: 'SALES',
    label: 'Sales',
    icon: 'BsGraphUp',
    iconColor: 'text-green-400',
    color: 'from-green-500 to-emerald-500'
  },
  {
    value: 'MARKETING',
    label: 'Marketing',
    icon: 'BsMegaphone',
    iconColor: 'text-purple-400',
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
    iconColor: 'text-emerald-400',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    value: 'OPERATIONS',
    label: 'Operations',
    icon: 'BsGear',
    iconColor: 'text-gray-400',
    color: 'from-gray-500 to-slate-500'
  },
  {
    value: 'CUSTOMER_SUCCESS',
    label: 'Customer Success',
    icon: 'BsHeart',
    iconColor: 'text-rose-400',
    color: 'from-rose-500 to-red-500'
  },
  {
    value: 'PRODUCT',
    label: 'Product',
    icon: 'BsLightbulb',
    iconColor: 'text-cyan-400',
    color: 'from-cyan-500 to-blue-500'
  }
] as const;

export const PRIORITIES = [
  {
    value: 'LOW',
    label: 'Low',
    icon: BsArrowDown,
    iconColor: 'text-gray-400',
    color: 'from-gray-400 to-gray-500',
    bgColor: 'bg-gray-500/10'
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    icon: BsDash,
    iconColor: 'text-warning',
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-500/10'
  },
  {
    value: 'HIGH',
    label: 'High',
    icon: BsArrowUp,
    iconColor: 'text-orange-400',
    color: 'from-orange-400 to-red-500',
    bgColor: 'bg-orange-500/10'
  },
  {
    value: 'URGENT',
    label: 'Urgent',
    icon: BsExclamationTriangle,
    iconColor: 'text-red-400',
    color: 'from-red-400 to-red-600',
    bgColor: 'bg-red-500/10'
  }
] as const;

// ─── Theme / UI colors (shared; was manager/setgoals/styles/colors) ───
export const THEME_COLORS = {
  primary: {
    gradient: 'from-indigo-600/90 via-purple-600/90 to-pink-600/90',
    text: 'text-accent',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/50',
    hover: 'hover:bg-indigo-500/20',
  },
  secondary: {
    gradient: 'from-blue-500/10 to-blue-600/10',
    text: 'text-info',
    bg: 'bg-blue-500/10',
    border: 'border-blue-200/20 dark:border-blue-600/20',
  },
  success: {
    gradient: 'from-emerald-500/10 to-emerald-600/10',
    text: 'text-success',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-200/20 dark:border-emerald-600/20',
  },
  warning: {
    gradient: 'from-amber-500/10 to-amber-600/10',
    text: 'text-warning',
    bg: 'bg-amber-500/10',
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
    primary: 'text-white',
    secondary: 'text-slate-400',
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