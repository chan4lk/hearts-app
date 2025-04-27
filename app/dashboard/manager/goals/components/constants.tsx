import { BsRocket, BsGear, BsTrophy, BsGraphUp, BsBook, BsLightbulb, BsAward, BsBriefcase } from 'react-icons/bs';
import { ReactNode } from 'react';

interface Category {
  value: string;
  label: string;
  icon: ReactNode;
}

interface GoalTemplate {
  id: string;
  title: string;
  category: string;
  icon: ReactNode;
  description: string;
  subtitle: string;
  bgGradient: string;
  bgColor: string;
}

export const CATEGORIES: Category[] = [
  { 
    value: 'PROFESSIONAL', 
    label: 'Professional Development',
    icon: <BsRocket className="w-4 h-4 text-blue-400" />
  },
  { 
    value: 'TECHNICAL', 
    label: 'Technical Skills',
    icon: <BsGear className="w-4 h-4 text-emerald-400" />
  },
  { 
    value: 'LEADERSHIP', 
    label: 'Leadership',
    icon: <BsTrophy className="w-4 h-4 text-amber-400" />
  },
  { 
    value: 'PERSONAL', 
    label: 'Personal Growth',
    icon: <BsGraphUp className="w-4 h-4 text-purple-400" />
  },
  { 
    value: 'TRAINING', 
    label: 'Training',
    icon: <BsBook className="w-4 h-4 text-rose-400" />
  }
];

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'project-completion',
    title: 'Project Milestone',
    category: 'PROFESSIONAL',
    icon: <BsRocket className="w-6 h-6 text-blue-400" />,
    description: 'Complete [Project Name] milestone by [Date] achieving [Specific Metrics]',
    subtitle: 'Project Excellence',
    bgGradient: 'from-blue-500/10 to-transparent',
    bgColor: 'bg-[#1a1f35]'
  },
  {
    id: 'skill-mastery',
    title: 'Skill Mastery',
    category: 'TECHNICAL',
    icon: <BsLightbulb className="w-6 h-6 text-amber-400" />,
    description: 'Master [Technology/Skill] through [Training/Project] by [Date]',
    subtitle: 'Technical Growth',
    bgGradient: 'from-amber-500/10 to-transparent',
    bgColor: 'bg-[#2a2520]'
  },
  {
    id: 'leadership-initiative',
    title: 'Leadership Initiative',
    category: 'LEADERSHIP',
    icon: <BsAward className="w-6 h-6 text-purple-400" />,
    description: 'Lead [Team/Project] to achieve [Specific Outcome] by [Date]',
    subtitle: 'Leadership Development',
    bgGradient: 'from-purple-500/10 to-transparent',
    bgColor: 'bg-[#251a35]'
  },
  {
    id: 'career-growth',
    title: 'Career Development',
    category: 'PERSONAL',
    icon: <BsGraphUp className="w-6 h-6 text-emerald-400" />,
    description: 'Achieve [Career Milestone] through [Actions] by [Date]',
    subtitle: 'Professional Growth',
    bgGradient: 'from-emerald-500/10 to-transparent',
    bgColor: 'bg-[#1a2a25]'
  },
  {
    id: 'certification-goal',
    title: 'Certification Goal',
    category: 'TRAINING',
    icon: <BsBriefcase className="w-6 h-6 text-rose-400" />,
    description: 'Obtain [Certification Name] certification by [Date]',
    subtitle: 'Professional Certification',
    bgGradient: 'from-rose-500/10 to-transparent',
    bgColor: 'bg-[#2a1a20]'
  }
]; 