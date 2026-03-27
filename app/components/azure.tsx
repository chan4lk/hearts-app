'use client';

import { ShieldCheck, Key, Users, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';
const MotionDiv = motion.div;
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const integrations = [
  {
    icon: Key,
    title: 'Single Sign-On',
    description: 'One-click login with Microsoft credentials. No separate passwords to manage.',
    iconColor: 'text-accent',
    iconBg: 'bg-accent-muted',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Security',
    description: 'Industry-leading security with MFA, conditional access, and compliance standards.',
    iconColor: 'text-success',
    iconBg: 'bg-success-muted',
  },
  {
    icon: Users,
    title: 'Auto Provisioning',
    description: 'Sync Azure AD to automate onboarding, offboarding, and role management.',
    iconColor: 'text-info',
    iconBg: 'bg-info-muted',
  },
  {
    icon: Fingerprint,
    title: 'Role-Based Access',
    description: 'Granular permissions for admins, managers, and employees — automatically synced.',
    iconColor: 'text-cat-technical',
    iconBg: 'bg-cat-technical',
  },
];

export function AzureIntegration() {
  return (
    <section id="integration" className="py-24 md:py-32 bg-surface-primary relative overflow-hidden">
      {/* Top gradient border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--color-info))]/30 to-transparent" />

      {/* Background glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-l from-[rgb(var(--color-info))]/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Content */}
          <div>
            <MotionDiv
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-info-muted border border-[rgba(var(--color-info),0.15)] mb-6">
                <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-info))] animate-pulse" />
                <span className="text-info text-xs font-bold tracking-widest uppercase">Integration</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary tracking-tight leading-[1.08] mb-5">
                Secure by default{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[rgb(var(--color-info))] to-[rgb(var(--color-accent))]">
                  with Microsoft Azure
                </span>
              </h2>
              <p className="text-base sm:text-lg text-secondary leading-relaxed mb-10 max-w-lg">
                AspireHub integrates directly with Azure Active Directory — your team signs in with existing credentials, and permissions sync automatically.
              </p>
            </MotionDiv>

            <MotionDiv
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {integrations.map(({ icon: Icon, title, description, iconColor, iconBg }) => (
                <MotionDiv key={title} variants={item}>
                  <div className="group p-5 rounded-2xl bg-surface-elevated border border-theme hover:border-[rgba(var(--color-accent),0.2)] hover:shadow-theme-md transition-all duration-300">
                    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <h3 className="text-sm font-bold text-primary mb-1.5">{title}</h3>
                    <p className="text-xs text-secondary leading-relaxed">{description}</p>
                  </div>
                </MotionDiv>
              ))}
            </MotionDiv>
          </div>

          {/* Right — Visual */}
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-12 bg-gradient-to-r from-[rgb(var(--color-info))]/[0.06] via-[rgb(var(--color-accent))]/[0.08] to-[rgb(var(--color-cat-technical))]/[0.04] rounded-full blur-3xl" />

              {/* Card stack visual */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80">
                {/* Background rings with animation */}
                <div className="absolute inset-0 rounded-full border border-[rgba(var(--color-info),0.15)] animate-pulse-slow" />
                <div className="absolute inset-4 rounded-full border border-[rgba(var(--color-accent),0.12)]" />
                <div className="absolute inset-8 rounded-full border border-[rgba(var(--color-info),0.08)]" />

                {/* Center logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-22 h-22 rounded-2xl bg-gradient-to-br from-[rgb(var(--color-info))] to-[rgb(var(--color-accent))] flex items-center justify-center shadow-xl shadow-[rgba(var(--color-info),0.25)] p-5">
                    <svg className="w-10 h-10" viewBox="0 0 21 21" fill="none">
                      <rect x="1" y="1" width="8.5" height="8.5" fill="#F25022" rx="1.5" />
                      <rect x="11.5" y="1" width="8.5" height="8.5" fill="#7FBA00" rx="1.5" />
                      <rect x="1" y="11.5" width="8.5" height="8.5" fill="#00A4EF" rx="1.5" />
                      <rect x="11.5" y="11.5" width="8.5" height="8.5" fill="#FFB900" rx="1.5" />
                    </svg>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute top-4 right-8 px-3.5 py-2 rounded-xl bg-surface-elevated border border-theme shadow-theme-lg text-2xs font-bold text-primary animate-float-slow">
                  SSO Enabled
                </div>
                <div className="absolute bottom-8 left-2 px-3.5 py-2 rounded-xl bg-surface-elevated border border-theme shadow-theme-lg text-2xs font-bold text-success flex items-center gap-2 animate-float-medium">
                  <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-success))]" />
                  Connected
                </div>
                <div className="absolute top-1/2 -right-2 px-3.5 py-2 rounded-xl bg-surface-elevated border border-theme shadow-theme-lg text-2xs font-bold text-primary">
                  256-bit AES
                </div>
              </div>
            </div>
          </MotionDiv>
        </div>
      </div>
    </section>
  );
}
