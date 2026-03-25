'use client';

import { MotionDiv, container, item } from './animations/motion';
import {
  Target, TrendingUp, ClipboardCheck, Users, Star, CalendarCheck,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'Goal Management',
    description: 'Set, track, and achieve goals with structured frameworks that align individual and organizational objectives.',
    iconColor: 'text-accent',
    iconBg: 'bg-accent-muted',
    stat: '3K+ goals',
    statColor: 'text-accent',
  },
  {
    icon: TrendingUp,
    title: 'Performance Analytics',
    description: 'Real-time dashboards with actionable insights, trend analysis, and AI-powered recommendations.',
    iconColor: 'text-success',
    iconBg: 'bg-success-muted',
    stat: 'AI-powered',
    statColor: 'text-success',
  },
  {
    icon: ClipboardCheck,
    title: 'Review Cycles',
    description: 'Streamline performance reviews with customizable cycles, manager ratings, and 360-degree feedback.',
    iconColor: 'text-cat-technical',
    iconBg: 'bg-cat-technical',
    stat: '360° feedback',
    statColor: 'text-cat-technical',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Assign goals, monitor team progress, and manage employee hierarchies with role-based access control.',
    iconColor: 'text-info',
    iconBg: 'bg-info-muted',
    stat: 'Role-based',
    statColor: 'text-info',
  },
  {
    icon: Star,
    title: 'Rating System',
    description: 'Comprehensive 5-point rating with self and manager assessments, comments, and historical tracking.',
    iconColor: 'text-warning',
    iconBg: 'bg-warning-muted',
    stat: '5-point scale',
    statColor: 'text-warning',
  },
  {
    icon: CalendarCheck,
    title: 'Event Tracking',
    description: 'Organize and track participation in training events, Toastmasters, code crunches, and team activities.',
    iconColor: 'text-error',
    iconBg: 'bg-error-muted',
    stat: 'Multi-type',
    statColor: 'text-error',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32 bg-surface-secondary relative overflow-hidden">
      {/* Top gradient line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--color-accent))]/30 to-transparent" />

      {/* Background decorations */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[rgb(var(--color-accent))]/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[rgb(var(--color-cat-technical))]/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section header */}
        <MotionDiv
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-accent-muted border border-[rgba(var(--color-accent),0.15)] mb-6">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-accent text-xs font-bold tracking-widest uppercase">Platform</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary tracking-tight leading-[1.08] mb-5">
            Everything you need to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[rgb(var(--color-accent))] to-[rgb(var(--color-cat-technical))]">
              drive performance
            </span>
          </h2>
          <p className="text-base sm:text-lg text-secondary leading-relaxed max-w-2xl mx-auto">
            A complete toolkit for managing goals, tracking progress, and building a culture of continuous improvement.
          </p>
        </MotionDiv>

        {/* Feature cards — completely new design */}
        <MotionDiv
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          {features.map(({ icon: Icon, title, description, iconColor, iconBg, stat, statColor }) => (
            <MotionDiv key={title} variants={item}>
              <div className="group relative p-6 sm:p-7 rounded-2xl bg-surface-elevated border border-theme hover:border-[rgba(var(--color-accent),0.25)] transition-all duration-400 h-full hover:shadow-theme-lg cursor-default">
                {/* Top row: icon + stat badge */}
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center group-hover:scale-110 group-hover:shadow-theme-sm transition-all duration-400`}>
                    <Icon className={`w-7 h-7 ${iconColor}`} strokeWidth={1.8} />
                  </div>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full bg-surface-secondary text-2xs font-bold ${statColor} tracking-wide`}>
                    {stat}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-primary mb-2 tracking-tight">{title}</h3>
                <p className="text-sm text-secondary leading-relaxed mb-5">{description}</p>

                {/* Learn more link */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-accent opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                  <span>Learn more</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </MotionDiv>
          ))}
        </MotionDiv>
      </div>
    </section>
  );
}
