# Source Tree Analysis — Bistec AspireHub

## Annotated Directory Tree

```
hearts-app/
├── app/                              # Next.js App Router (all client components)
│   ├── api/                          # 46 API route handlers (68 HTTP methods)
│   │   ├── admin/                    # Admin-only routes
│   │   │   ├── activities/           # Recent activities feed
│   │   │   ├── events/               # Event CRUD + [eventId] management
│   │   │   ├── goals/stats/          # Goal statistics aggregation
│   │   │   ├── review-cycles/        # Review cycle CRUD + import/export
│   │   │   ├── stats/                # System dashboard statistics
│   │   │   └── users/                # User CRUD + password + validate-manager
│   │   ├── ai/                       # AI-powered features (6 routes, OpenAI)
│   │   │   ├── generate-goal/        # Goal suggestions from prompt
│   │   │   ├── goal-risk-analysis/   # Risk assessment
│   │   │   ├── improve-feedback/     # Feedback rewriting
│   │   │   ├── performance-insights/ # AI performance analysis
│   │   │   ├── personalized-goals/   # Profile-based recommendations
│   │   │   └── review-automation/    # Automated performance reviews
│   │   ├── analytics/dashboard/      # Role-scoped analytics (7 parallel queries)
│   │   ├── auth/                     # NextAuth + login + register
│   │   ├── employees/                # Team member queries + assigned
│   │   ├── events/                   # Event browsing + participation
│   │   ├── goals/                    # Core goal CRUD + ratings (14 routes)
│   │   │   ├── [goalId]/             # Individual goal operations
│   │   │   │   ├── activity/         # Activity timeline
│   │   │   │   ├── approve/          # Goal approval
│   │   │   │   ├── reject/           # Goal rejection
│   │   │   │   ├── due-date/         # Due date updates
│   │   │   │   ├── priority/         # Priority updates
│   │   │   │   ├── progress/         # Progress tracking
│   │   │   │   ├── status/           # Status transitions
│   │   │   │   ├── self-rating/      # Employee self-rating
│   │   │   │   ├── manager-rating/   # Manager rating
│   │   │   │   └── ratings/          # Rating read/write
│   │   │   ├── ai-suggestions/       # AI goal suggestions
│   │   │   └── bulk/                 # Bulk goal creation
│   │   ├── health/                   # Health check (DB connectivity)
│   │   ├── notifications/            # In-app notifications
│   │   ├── ratings/                  # Batch rating submission (self + manager)
│   │   ├── reports/generate/         # Report generation (JSON/PDF)
│   │   └── users/                    # User management
│   │
│   ├── components/                   # React components
│   │   ├── ai/                       # 4 AI components (suggestions, risk, insights, writing)
│   │   ├── animations/               # Framer Motion helpers (MotionDiv, variants)
│   │   ├── events/                   # 5 event components (modals, table, cards)
│   │   ├── goals/                    # 2 goal sub-components (timeline, progress tracker)
│   │   ├── layout/                   # DashboardLayout (sidebar, header, user menu)
│   │   ├── shared/                   # 18 shared components + types.ts + constants.ts
│   │   ├── ui/                       # UI primitives (Radix, form/table primitives)
│   │   ├── Header.tsx                # Landing page header
│   │   ├── Footer.tsx                # Landing page footer
│   │   ├── features.tsx              # Landing features section
│   │   ├── azure.tsx                 # Azure AD integration showcase
│   │   ├── LoadingPage.tsx           # Global loading spinner
│   │   └── ProgressUpdateForm.tsx    # Progress update form
│   │
│   ├── dashboard/                    # Dashboard pages (19 routes total)
│   │   ├── admin/                    # Admin pages
│   │   │   ├── page.tsx              # System Control Panel
│   │   │   ├── all-goals/            # Goals Explorer
│   │   │   ├── events/               # Events Hub
│   │   │   ├── review-cycles/        # Review Cycles (with components/)
│   │   │   ├── users/                # People Directory (with components/)
│   │   │   └── components/           # AdminGoalsTable
│   │   ├── analytics/                # Shared analytics (with components/)
│   │   ├── employee/                 # Employee pages
│   │   │   ├── page.tsx              # Employee Dashboard
│   │   │   ├── goals/create/         # My Goals (with components/)
│   │   │   ├── self-rating/          # Self Rating
│   │   │   ├── events/               # My Events + browse/
│   │   │   └── components/           # GoalsSection
│   │   └── manager/                  # Manager pages
│   │       ├── page.tsx              # Team Command Center
│   │       ├── goals/approve-goals/  # Decision Panel
│   │       ├── goals/setgoals/       # Goal Assignment (with components/)
│   │       ├── rate-employees/       # Evaluation Studio
│   │       ├── components/           # GoalsGrid, GoalsSection
│   │       └── utils.ts              # Status styles
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAnalyticsData.ts       # Analytics data fetching with filters
│   │   └── useRoleAccess.ts          # Route authorization + nav items
│   │
│   ├── lib/                          # App-level utilities
│   │   └── utils.ts                  # cn() class merger (clsx + tailwind-merge)
│   │
│   ├── login/page.tsx                # Login page (Azure AD SSO + credentials)
│   ├── error/page.tsx                # Auth error page
│   │
│   ├── utils/                        # Shared utilities
│   │   ├── badgeConfigs.ts           # Status/priority/department badge configs
│   │   ├── goalHelpers.ts            # Goal ownership helpers
│   │   ├── pdfGenerator.ts           # PDF report generation (jsPDF)
│   │   └── roleAccess.ts             # RBAC path authorization + nav generation
│   │
│   ├── globals.css                   # Design system tokens (100+ CSS variables)
│   ├── layout.tsx                    # Root layout (font, theme script, providers)
│   ├── page.tsx                      # Landing/marketing page
│   └── providers.tsx                 # Session + Theme + Settings providers
│
├── lib/                              # Core business logic
│   ├── auth.ts                       # NextAuth config (Azure AD + Credentials)
│   ├── env.ts                        # Environment variable validation
│   ├── logger.ts                     # Azure App Insights logger (PII redaction)
│   ├── openai.ts                     # OpenAI integration (7 AI functions)
│   ├── pagination.ts                 # Pagination utilities + limits
│   ├── performanceMonitor.ts         # In-memory performance metrics (p50/p95/p99)
│   ├── prisma.ts                     # Prisma client singleton
│   ├── queryOptimization.ts          # Cached/optimized queries (TTL cache)
│   ├── rateLimit.ts                  # In-memory rate limiter (5 tiers)
│   ├── securityUtils.ts             # RBAC, sanitization, lockout, password policy
│   ├── utils.ts                      # cn() utility (duplicate of app/lib/utils.ts)
│   └── validation.ts                 # Zod schemas for all API inputs
│
├── prisma/                           # Database layer
│   ├── schema.prisma                 # 7 models, 8 enums
│   ├── migrations/                   # 16 migrations (2025-04 to 2026-03)
│   ├── seed.ts                       # Seed data (3 users)
│   ├── tsconfig.json                 # Seed TypeScript config
│   └── backups/                      # DB backups
│
├── __tests__/                        # Vitest tests (35 total cases)
│   ├── validation.test.ts            # Zod schema tests (29 cases)
│   └── security.test.ts              # XSS sanitization tests (6 cases)
│
├── infra/                            # Pulumi Azure IaC
│   ├── index.ts                      # Resource Group, App Service, PostgreSQL
│   ├── Pulumi.yaml                   # Project config
│   ├── Pulumi.dev.yaml               # Dev stack (encrypted secrets)
│   ├── package.json                  # Pulumi dependencies
│   └── tsconfig.json                 # IaC TypeScript config
│
├── public/                           # Static assets (favicon, images)
│
├── scripts/                          # DB management scripts (11 files)
│   ├── run-event-migration.js        # Event migration runner
│   ├── regenerate-prisma.js          # Prisma client regeneration
│   ├── fix-prisma-types.js           # Type fixing utility
│   ├── recover-db.js                 # DB recovery (Prisma)
│   ├── recover-db-v2.js              # DB recovery (hardcoded SQL)
│   ├── run-recovery.js               # DB recovery (pg driver)
│   ├── fix-migrations.sql            # Master recovery SQL
│   ├── fix-db.ps1                    # PowerShell recovery wrapper
│   ├── fix-db.bat                    # Windows batch recovery wrapper
│   ├── db-manage.sh                  # Docker Compose management (Linux)
│   ├── db-manage.bat                 # Docker Compose management (Windows)
│   └── seed-db.js                    # Alternative JS seed script
│
├── types/                            # TypeScript declarations
│   └── next-auth.d.ts               # NextAuth module augmentation (role field)
│
├── middleware.ts                      # Edge middleware (auth + RBAC)
├── next.config.js                    # Security headers, webpack, standalone output
├── tailwind.config.js                # Theme config, animations, dark mode
├── vitest.config.ts                  # Test configuration
├── tsconfig.json                     # TypeScript config (strict, bundler resolution)
├── postcss.config.js                 # PostCSS + TailwindCSS
├── package.json                      # Dependencies + scripts
├── Dockerfile                        # Multi-stage production build (node:20-slim)
├── docker-compose.yml                # Local dev (PostgreSQL 15 + pgAdmin)
├── docker-compose.migration.yml      # Azure migration runner
├── CLAUDE.md                         # AI assistant project standards
└── README.md                         # Project documentation
```

## Critical Folders

| Folder | Purpose | Key Files |
|--------|---------|-----------|
| `app/api/` | All backend API logic | 46 route.ts files |
| `app/components/shared/` | Reusable UI components | 18 components + types + constants |
| `app/components/ui/` | UI primitive layer | Radix wrappers, form/table primitives |
| `app/dashboard/` | All page routes | 19 pages across admin/manager/employee |
| `lib/` | Core business services | auth, validation, security, AI, caching |
| `prisma/` | Data layer | Schema, migrations, seed |

## Entry Points

| Entry Point | File | Purpose |
|-------------|------|---------|
| App root | `app/layout.tsx` | Root layout with font, theme, providers |
| Landing page | `app/page.tsx` | Marketing/landing page |
| Auth | `app/login/page.tsx` | Login page |
| Dashboard redirect | `app/dashboard/page.tsx` | Role-based routing |
| Edge middleware | `middleware.ts` | Request interception |
| API health | `app/api/health/route.ts` | Health check |
| DB schema | `prisma/schema.prisma` | Data model definition |
