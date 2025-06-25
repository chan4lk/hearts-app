import { BsRocket, BsLightbulb, BsAward, BsGraphUp, BsStars, BsBriefcase, BsSpeedometer2 } from 'react-icons/bs';

export const CATEGORIES = [
  { value: 'PROFESSIONAL', label: 'Professional Development' },
  { value: 'TECHNICAL', label: 'Technical Skills' },
  { value: 'LEADERSHIP', label: 'Leadership' },
  { value: 'PERSONAL', label: 'Personal Growth' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'KPIS', label: 'Key Performance Indicators' }
] as const;

export const GOAL_TEMPLATES = [
  {
    id: 'project-completion',
    title: 'Project Milestone',
    category: 'PROFESSIONAL',
    icon: BsRocket,
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
    icon: BsLightbulb,
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
    icon: BsAward,
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
    icon: BsGraphUp,
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
    icon: BsStars,
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
    icon: BsBriefcase,
    iconColor: 'text-rose-400',
    description: 'Obtain [Certification Name] certification by [Date]',
    subtitle: 'Professional Certification',
    bgGradient: 'from-rose-500/10 to-transparent',
    bgColor: 'bg-[#2a1a20]'
  },
  {
    id: 'performance-metrics',
    title: 'Performance Metrics',
    category: 'KPIS',
    icon: BsSpeedometer2,
    iconColor: 'text-cyan-400',
    description: 'Achieve [KPI Target] for [Metric] by [Date] with [Specific Actions]',
    subtitle: 'Performance Excellence',
    bgGradient: 'from-cyan-500/10 to-transparent',
    bgColor: 'bg-[#1a252a]'
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