# Bistec AspireHub

A comprehensive performance management system built with Next.js 14, Prisma, and PostgreSQL.

## Features

- **Authentication** — NextAuth.js with Azure AD and Credentials providers
- **Role-Based Access Control** — Admin, Manager, and Employee roles
- **Goal Management** — Full lifecycle: Draft → Pending → Approved → In Progress → Completed
- **Performance Ratings** — Self and manager ratings with feedback
- **AI Insights** — OpenAI-powered goal suggestions and analytics
- **Analytics Dashboard** — Recharts-based performance visualizations
- **Dark Mode** — Full theme support with semantic design tokens
- **Notifications** — Real-time in-app notification system
- **Review Cycles** — Configurable review periods with import/export

## Tech Stack

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| Framework    | Next.js 14 (App Router), React 18, TypeScript |
| Database     | PostgreSQL + Prisma ORM                 |
| Auth         | NextAuth.js (Azure AD + Credentials)    |
| UI           | TailwindCSS, Radix UI, Framer Motion   |
| Charts       | Recharts                                |
| AI           | OpenAI (gpt-4o-mini)                    |
| Testing      | Vitest                                  |
| Infra        | Docker, Pulumi (Azure)                  |

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (or local PostgreSQL)

### Installation

```bash
git clone <repository-url>
cd hearts-app
npm install
cp .env.example .env   # Edit with your configuration
```

### Database Setup

**Using Docker (recommended):**

```bash
scripts\db-manage.bat start     # Start PostgreSQL + pgAdmin
scripts\db-manage.bat migrate   # Run Prisma migrations
scripts\db-manage.bat seed      # Seed initial data
```

pgAdmin is available at http://localhost:5050 (admin@example.com / admin).

**Using Local PostgreSQL:**

```bash
npx prisma migrate dev
npx prisma db seed
```

### Running

```bash
npm run dev           # Dev server → http://localhost:3000
npm run build:clean   # Production build
npm test              # Run Vitest
npm run lint          # ESLint
```

## Project Structure

```
app/
├── api/                  # API routes (Next.js Route Handlers)
├── components/           # Shared and feature-specific components
│   ├── shared/           # Reusable UI components
│   ├── goals/            # Goal management components
│   ├── events/           # Event components
│   └── ui/               # Base UI primitives (form-primitives, ModalShell)
├── dashboard/            # Dashboard pages (admin, manager, employee, analytics)
├── utils/                # Utility functions (badgeConfigs, pdfGenerator)
├── globals.css           # Design token system
└── layout.tsx            # Root layout
lib/
├── auth.ts               # NextAuth configuration
├── prisma.ts             # Prisma client
├── validation.ts         # Zod schemas
├── rateLimit.ts          # Rate limiting
├── securityUtils.ts      # Input sanitization
└── logger.ts             # Logging
prisma/
├── schema.prisma         # Database schema
└── migrations/           # Migration history
infra/                    # Pulumi infrastructure (Azure)
__tests__/                # Vitest test suites
```

## Database Management

```bash
scripts\db-manage.bat start     # Start containers
scripts\db-manage.bat stop      # Stop containers
scripts\db-manage.bat restart   # Restart containers
scripts\db-manage.bat status    # Container status
scripts\db-manage.bat logs      # View logs
scripts\db-manage.bat reset     # Reset database
scripts\db-manage.bat migrate   # Run migrations
scripts\db-manage.bat seed      # Seed data
```

## Infrastructure (Azure via Pulumi)

```bash
cd infra && npm install
pulumi login
pulumi stack init <stack-name>
pulumi config set azure:location <location>
pulumi config set dbAdminUser <username>
pulumi config set dbAdminPassword <password> --secret
pulumi up
```

## License

MIT
