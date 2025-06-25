import { BsRocket, BsLightbulb, BsAward, BsGraphUp, BsStars, BsBriefcase, BsLightningCharge, BsBook, BsHeart } from 'react-icons/bs';

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