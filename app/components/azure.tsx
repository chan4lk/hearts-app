'use client';

import { ShieldCheck, Key, Users, Fingerprint } from 'lucide-react';
import { MotionDiv, container, item } from './animations/motion';

const integrations = [
  {
    icon: Key,
    title: 'Single Sign-On',
    description: 'One-click login with Microsoft credentials. No separate passwords to manage.',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Security',
    description: 'Industry-leading security with MFA, conditional access, and compliance standards.',
  },
  {
    icon: Users,
    title: 'Auto Provisioning',
    description: 'Sync Azure AD to automate onboarding, offboarding, and role management.',
  },
  {
    icon: Fingerprint,
    title: 'Role-Based Access',
    description: 'Granular permissions for admins, managers, and employees — automatically synced.',
  },
];

export function AzureIntegration() {
  return (
    <section id="integration" className="py-20 md:py-28 bg-surface-secondary relative">
      {/* Top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--color-border-primary))] to-transparent" />

      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Content */}
          <div>
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgb(var(--color-info))]/8 dark:bg-cat-professional border border-[rgb(var(--color-info))]/12 dark:border-[rgb(var(--color-info))]/15 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-info))]" />
                <span className="text-info text-xs font-semibold tracking-wide uppercase">Integration</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-[42px] font-bold text-primary tracking-tight leading-[1.15] mb-4">
                Secure by default <br className="hidden sm:block" />
                with Microsoft Azure
              </h2>
              <p className="text-base sm:text-lg text-secondary leading-relaxed mb-10">
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
              {integrations.map(({ icon: Icon, title, description }) => (
                <MotionDiv key={title} variants={item}>
                  <div className="group p-4 rounded-xl bg-surface-elevated border border-theme hover:border-[rgba(var(--color-accent),0.15)] hover:shadow-theme-sm transition-all duration-300">
                    <Icon className="w-5 h-5 text-accent mb-3 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-sm font-semibold text-primary mb-1">{title}</h3>
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
            className="flex justify-center"
          >
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-8 bg-gradient-to-r from-[rgb(var(--color-info))]/5 via-indigo-500/8 to-[rgb(var(--color-cat-technical))]/5 rounded-full blur-3xl" />

              {/* Card stack visual */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80">
                {/* Background ring */}
                <div className="absolute inset-0 rounded-full border border-theme" />
                <div className="absolute inset-4 rounded-full border border-theme opacity-60" />
                <div className="absolute inset-8 rounded-full border border-theme opacity-30" />

                {/* Center logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[rgb(var(--color-info))] to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <svg className="w-10 h-10 text-[rgb(var(--color-text-inverse))]" viewBox="0 0 21 21" fill="none">
                      <rect x="1" y="1" width="8.5" height="8.5" fill="#F25022" rx="1" />
                      <rect x="11.5" y="1" width="8.5" height="8.5" fill="#7FBA00" rx="1" />
                      <rect x="1" y="11.5" width="8.5" height="8.5" fill="#00A4EF" rx="1" />
                      <rect x="11.5" y="11.5" width="8.5" height="8.5" fill="#FFB900" rx="1" />
                    </svg>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute top-4 right-8 px-3 py-1.5 rounded-lg bg-surface-elevated border border-theme shadow-theme-md text-2xs font-medium text-primary">
                  SSO Enabled
                </div>
                <div className="absolute bottom-8 left-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-theme shadow-theme-md text-2xs font-medium text-success flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-success))]" />
                  Connected
                </div>
                <div className="absolute top-1/2 -right-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-theme shadow-theme-md text-2xs font-medium text-primary">
                  256-bit
                </div>
              </div>
            </div>
          </MotionDiv>
        </div>
      </div>
    </section>
  );
}
