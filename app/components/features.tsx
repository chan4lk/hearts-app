'use client';

import { MotionDiv, container, item } from './animations/motion';
import {
  Goal, Users, BarChart, Shield, LineChart, Award, Star, Zap,
  Target, TrendingUp, ClipboardCheck, CalendarCheck
} from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'Goal Management',
    description: 'Set, track, and achieve goals with structured frameworks that align individual performance with organizational objectives.',
    accent: 'from-indigo-500 to-blue-500',
    accentBg: 'bg-accent/8 dark:bg-accent-muted',
  },
  {
    icon: TrendingUp,
    title: 'Performance Analytics',
    description: 'Real-time dashboards with actionable insights, trend analysis, and AI-powered recommendations for continuous improvement.',
    accent: 'from-emerald-500 to-teal-500',
    accentBg: 'bg-[rgb(var(--color-success))]/8 dark:bg-success-muted',
  },
  {
    icon: ClipboardCheck,
    title: 'Review Cycles',
    description: 'Streamline performance reviews with customizable cycles, manager ratings, self-assessments, and 360-degree feedback.',
    accent: 'from-purple-500 to-violet-500',
    accentBg: 'bg-[rgb(var(--color-cat-technical))]/8 dark:bg-cat-technical',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Assign goals, monitor team progress, and manage employee hierarchies with role-based access control.',
    accent: 'from-blue-500 to-cyan-500',
    accentBg: 'bg-[rgb(var(--color-info))]/8 dark:bg-cat-professional',
  },
  {
    icon: Star,
    title: 'Rating System',
    description: 'Comprehensive 5-point rating with self and manager assessments, comments, and historical performance tracking.',
    accent: 'from-amber-500 to-orange-500',
    accentBg: 'bg-[rgb(var(--color-warning))]/8 dark:bg-warning-muted',
  },
  {
    icon: CalendarCheck,
    title: 'Event Tracking',
    description: 'Organize and track participation in Toastmaster sessions, training events, code crunches, and team activities.',
    accent: 'from-rose-500 to-pink-500',
    accentBg: 'bg-error-muted dark:bg-error-muted',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28 bg-surface-primary relative">
      {/* Subtle top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--color-border-primary))] to-transparent" />

      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mb-14 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(var(--color-accent),0.08)] border border-[rgba(var(--color-accent),0.12)] mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-accent text-xs font-semibold tracking-wide uppercase">Platform</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-[42px] font-bold text-primary tracking-tight leading-[1.15] mb-4">
            Everything you need to <br className="hidden sm:block" />
            drive performance
          </h2>
          <p className="text-base sm:text-lg text-secondary leading-relaxed">
            A complete toolkit for managing goals, tracking progress, and building a culture of continuous improvement.
          </p>
        </MotionDiv>

        <MotionDiv
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
          {features.map(({ icon: Icon, title, description, accent, accentBg }) => (
            <MotionDiv key={title} variants={item}>
              <div className="group relative p-6 rounded-xl border border-theme hover:border-[rgba(var(--color-accent),0.2)] bg-surface-elevated hover:shadow-theme-md transition-all duration-300">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg ${accentBg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className={`w-5 h-5 bg-gradient-to-r ${accent} bg-clip-text`} style={{ color: 'transparent', WebkitBackgroundClip: 'text' }} />
                </div>

                {/* Content */}
                <h3 className="text-sm font-semibold text-primary mb-2 tracking-tight">{title}</h3>
                <p className="text-xs text-secondary leading-relaxed">{description}</p>
              </div>
            </MotionDiv>
          ))}
        </MotionDiv>
      </div>
    </section>
  );
}
