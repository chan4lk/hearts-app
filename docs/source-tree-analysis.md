# Bistec AspireHub - Source Tree Analysis

**Generated:** 2026-02-28 | **Scan Level:** Deep

## Annotated Directory Tree

```
hearts-app/                          # Project root (Next.js 14 monolith)
│
├── app/                             # Next.js App Router (main application)
│   ├── layout.tsx                   # ⚡ Root layout (HTML shell, SessionProvider)
│   ├── page.tsx                     # ⚡ Landing page (hero, features, CTA)
│   ├── providers.tsx                # Client providers (Session, Settings context)
│   ├── globals.css                  # Global styles (Tailwind + custom)
│   │
│   ├── api/                         # 🔌 Backend API routes
│   │   ├── auth/                    # Authentication endpoints
│   │   │   ├── [...nextauth]/       # NextAuth.js handler (Azure AD + Credentials)
│   │   │   ├── register/            # User registration
│   │   │   └── change-password/     # Password change
│   │   ├── goals/                   # Goal CRUD + workflow
│   │   │   ├── route.ts             # GET (list), POST (create)
│   │   │   ├── [id]/               # Single goal operations
│   │   │   │   ├── route.ts         # GET, PUT, DELETE
│   │   │   │   ├── approve/         # PUT (approve/reject)
│   │   │   │   ├── progress/        # POST (update progress)
│   │   │   │   └── submit/          # POST (submit for approval)
│   │   │   └── bulk/               # POST (bulk create goals)
│   │   ├── admin/                   # Admin-only endpoints
│   │   │   ├── stats/              # System statistics
│   │   │   ├── users/              # User management CRUD
│   │   │   │   └── [id]/           # Single user operations
│   │   │   └── review-cycles/      # Review cycle management
│   │   │       ├── [id]/           # Single cycle operations
│   │   │       └── import/         # Excel bulk import
│   │   ├── ai/                      # AI-powered endpoints
│   │   │   ├── suggestions/        # Goal suggestions (GPT-3.5)
│   │   │   ├── personalized-goals/ # Personalized goals (GPT-4o-mini)
│   │   │   ├── enhance/            # Description enhancement
│   │   │   ├── risk-analysis/      # Goal risk analysis
│   │   │   ├── performance-insights/ # Performance insights
│   │   │   └── writing-assistant/  # AI writing help
│   │   ├── analytics/              # Dashboard analytics
│   │   │   └── dashboard/          # Comprehensive analytics data
│   │   ├── employees/              # Employee data
│   │   │   └── assigned/           # Manager's assigned employees
│   │   ├── notifications/          # Notification CRUD
│   │   ├── ratings/                # Goal ratings
│   │   ├── reports/                # Report generation
│   │   │   └── generate/           # PDF/JSON report generation
│   │   ├── users/                  # User lookup
│   │   ├── health/                 # Health check endpoint
│   │   └── utils/                  # API utilities
│   │       └── error-handler.ts    # Centralized error handling
│   │
│   ├── components/                  # 🎨 React components
│   │   ├── Header.tsx              # Landing page header/nav
│   │   ├── Footer.tsx              # Landing page footer
│   │   ├── LoadingPage.tsx         # Loading spinner
│   │   ├── ProgressUpdateForm.tsx  # Goal progress update form
│   │   ├── features.tsx            # Feature showcase (landing)
│   │   ├── azure.tsx               # Azure AD integration section
│   │   ├── ai/                     # AI-specific components
│   │   │   ├── AIGoalSuggestions.tsx
│   │   │   ├── AIGoalRiskAnalysis.tsx
│   │   │   ├── AIPerformanceInsights.tsx
│   │   │   └── AIWritingAssistant.tsx
│   │   ├── animations/            # Framer Motion helpers
│   │   │   └── motion.tsx
│   │   ├── goals/                 # Goal-specific components
│   │   │   ├── GoalActivityTimeline.tsx
│   │   │   └── GoalProgressTracker.tsx
│   │   ├── layout/                # Layout components
│   │   │   └── DashboardLayout.tsx # Main dashboard shell
│   │   ├── shared/                # Cross-role reusable components
│   │   │   ├── GoalCard.tsx
│   │   │   ├── GoalFormModal.tsx
│   │   │   ├── GoalsTable.tsx
│   │   │   ├── GoalDetailModal.tsx
│   │   │   ├── DeleteConfirmationModal.tsx
│   │   │   ├── NotificationsDropdown.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── PageContainer.tsx
│   │   │   ├── FilterBadge.tsx
│   │   │   ├── StandardCard.tsx
│   │   │   ├── BulkGoalFormModal.tsx
│   │   │   ├── BulkGoalTemplates.tsx
│   │   │   ├── AIGoalSuggestions.tsx
│   │   │   └── GoalTemplates.tsx
│   │   └── ui/                    # Shadcn/Radix UI primitives
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── textarea.tsx
│   │       ├── select.tsx
│   │       ├── card.tsx
│   │       ├── badge.tsx
│   │       ├── alert.tsx
│   │       ├── dialog.tsx
│   │       ├── label.tsx
│   │       ├── progress.tsx
│   │       ├── tabs.tsx
│   │       └── chart.tsx
│   │
│   ├── dashboard/                   # 📊 Role-based dashboards
│   │   ├── page.tsx                # ⚡ Dashboard redirect (role → specific)
│   │   ├── admin/                  # Admin dashboard
│   │   │   ├── page.tsx            # Admin overview
│   │   │   ├── components/         # Admin-specific components
│   │   │   ├── users/              # User management page
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   ├── all-goals/          # All goals management
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   └── review-cycles/      # Review cycle management
│   │   │       ├── page.tsx
│   │   │       └── components/
│   │   ├── manager/                # Manager dashboard
│   │   │   ├── page.tsx            # Team overview
│   │   │   ├── components/         # Manager-specific components
│   │   │   ├── goals/
│   │   │   │   ├── approve-goals/  # Goal approval workflow
│   │   │   │   └── setgoals/       # Set goals for employees
│   │   │   └── rate-employees/     # Rate employee goals
│   │   │       ├── page.tsx
│   │   │       └── components/
│   │   ├── employee/               # Employee dashboard
│   │   │   ├── page.tsx            # Personal dashboard
│   │   │   ├── components/         # Employee-specific components
│   │   │   ├── goals/
│   │   │   │   └── create/         # Create new goal
│   │   │   └── self-rating/        # Self-rate goals
│   │   │       ├── page.tsx
│   │   │       └── components/
│   │   └── analytics/              # Analytics (all roles)
│   │       ├── page.tsx
│   │       └── components/
│   │
│   ├── constants/                   # Application constants
│   │   ├── designations.ts         # 60 job designations
│   │   └── jobCategories.ts        # Job categories
│   │
│   ├── error/                       # Error pages
│   │   ├── page.tsx                # Auth error display
│   │   └── loading.tsx             # Loading spinner
│   │
│   ├── hooks/                       # React hooks
│   │   └── useRoleAccess.ts        # Client-side role validation
│   │
│   ├── lib/                         # App-level utilities
│   │   └── utils.ts                # cn() class merger
│   │
│   ├── login/                       # Login page
│   │   └── page.tsx                # Azure AD sign-in
│   │
│   └── utils/                       # Utility functions
│       ├── roleAccess.ts           # Role-based access control
│       ├── pdfGenerator.ts         # PDF report generation
│       └── toast.ts                # Toast notifications (disabled)
│
├── lib/                             # 🔧 Core library (cross-cutting concerns)
│   ├── auth.ts                     # NextAuth configuration (Azure AD + Credentials)
│   ├── prisma.ts                   # Prisma client singleton
│   ├── openai.ts                   # OpenAI API integration
│   ├── logger.ts                   # Centralized logging + App Insights
│   ├── env.ts                      # Environment variable validation
│   ├── pagination.ts               # Pagination utilities
│   ├── rateLimit.ts                # Rate limiting middleware
│   ├── validation.ts               # Input validation (password, email)
│   └── utils.ts                    # cn() utility
│
├── prisma/                          # 🗄️ Database layer
│   ├── schema.prisma               # Database schema (5 models, 5 enums)
│   ├── seed.ts                     # Test data seeding (3 users)
│   ├── tsconfig.json               # Prisma TypeScript config
│   └── migrations/                 # Schema migration history
│       ├── 20250408092204_add_notifications/
│       ├── 20250410024224_update_feedback_model/
│       ├── 20250410044946_add_user_activity_fields/
│       ├── 20250410060836_add_system_settings/
│       └── 20250620173158_fix_goal_relation/
│
├── types/                           # TypeScript type definitions
│   └── next-auth.d.ts              # NextAuth type extensions (role)
│
├── public/                          # Static assets
│
├── infra/                           # ☁️ Infrastructure as Code (Pulumi)
│   ├── index.ts                    # Azure resources (App Service, PostgreSQL)
│   ├── Pulumi.yaml                 # Pulumi project config
│   ├── Pulumi.dev.yaml             # Dev stack config
│   ├── package.json                # Pulumi dependencies
│   └── tsconfig.json               # Pulumi TypeScript config
│
├── scripts/                         # 🔨 Utility scripts
│   ├── db-manage.bat               # Windows DB management
│   ├── db-manage.sh                # Linux/Mac DB management
│   └── regenerate-prisma.js        # Prisma client regeneration
│
├── .github/                         # CI/CD
│   └── workflows/
│       └── azure-appservice.yml    # GitHub Actions → Azure deploy
│
├── middleware.ts                    # ⚡ NextAuth route protection middleware
├── next.config.js                  # Next.js configuration (webpack, env)
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
├── Dockerfile                      # Multi-stage Docker build
├── docker-compose.yml              # Local PostgreSQL + pgAdmin
├── docker-compose.migration.yml    # Azure DB migration runner
└── README.md                       # Project documentation
```

## Critical Folders Summary

| Folder | Purpose | Key Files |
|---|---|---|
| `app/api/` | All backend logic (13 route domains) | ~30 route.ts files |
| `app/components/shared/` | Reusable UI components | 15 components |
| `app/components/ui/` | Base UI primitives | 12 components |
| `app/dashboard/` | Role-based pages | 4 dashboard types |
| `lib/` | Cross-cutting utilities | auth, prisma, openai, logger |
| `prisma/` | Database schema + migrations | schema.prisma, 5 migrations |
| `infra/` | Azure infrastructure (Pulumi) | index.ts |

## Entry Points

| Entry Point | File | Purpose |
|---|---|---|
| Application | `app/layout.tsx` | Root HTML shell |
| Landing Page | `app/page.tsx` | Public landing |
| Login | `app/login/page.tsx` | Authentication |
| Dashboard | `app/dashboard/page.tsx` | Role-based redirect |
| API | `app/api/*/route.ts` | REST endpoints |
| Middleware | `middleware.ts` | Route protection |
| Docker | `Dockerfile` → `server.js` | Production server |
