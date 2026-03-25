# Development Guide — Bistec AspireHub

## Prerequisites

- **Node.js** 20+
- **PostgreSQL** 15 (or Docker)
- **Docker** (optional, for local database)
- **npm** (included with Node.js)

## Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Configure required environment variables:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5434/performance_management
   NEXTAUTH_SECRET=your-secret-min-16-chars
   NEXTAUTH_URL=http://localhost:3000
   AZURE_AD_CLIENT_ID=your-azure-client-id
   AZURE_AD_CLIENT_SECRET=your-azure-client-secret
   AZURE_AD_TENANT_ID=your-azure-tenant-id
   ```

3. Optional environment variables:
   ```
   OPENAI_API_KEY=sk-...          # Required for AI features
   APPLICATIONINSIGHTS_CONNECTION_STRING=...  # Azure monitoring
   JWT_SECRET=your-jwt-secret     # Falls back to NEXTAUTH_SECRET
   ```

## Local Database

Start PostgreSQL and pgAdmin via Docker Compose:
```bash
docker-compose up -d
```

- **PostgreSQL:** localhost:5434 (user: postgres, password: postgres, db: performance_management)
- **pgAdmin:** localhost:5050 (admin@admin.com / admin)

## Installation

```bash
npm install
```

This automatically runs `prisma generate` as a postinstall hook.

## Database Setup

```bash
# Run all migrations
npx prisma migrate dev

# Seed with test data (3 users: admin/manager/employee)
npx prisma db seed
```

**Default seed credentials:**
- admin@example.com / admin123 (ADMIN)
- manager@example.com / manager123 (MANAGER)
- employee@example.com / employee123 (EMPLOYEE)

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (localhost:3000) |
| `npm run build` | Production build |
| `npm run build:clean` | Clean .next + production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm test` | Run Vitest (single run) |
| `npm run test:watch` | Vitest watch mode |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Run migrations (dev) |
| `npm run prisma:migrate:deploy` | Run migrations (production) |
| `npm run prisma:seed` | Seed database |
| `npm run db:migrate` | Run event migration script |

## Testing

Tests are in `__tests__/` and run with Vitest:

- **`validation.test.ts`** — 29 test cases covering all Zod schemas (createGoal, statusUpdate, progressUpdate, ratingSubmit, approveReject, validatePassword)
- **`security.test.ts`** — 6 test cases for XSS sanitization (HTML tags, special chars, truncation, non-string inputs)

```bash
npm test              # Single run
npm run test:watch    # Watch mode
```

## Code Conventions

### Design System
- **NEVER hardcode Tailwind colors** — use semantic tokens from `globals.css`
  - `bg-accent`, `text-accent`, `bg-accent-muted` (not `bg-indigo-600`)
  - `text-success`, `bg-success-muted`, `text-error` (not `text-green-500`)
  - `bg-surface-primary`, `text-primary` (not `bg-white`, `text-gray-900`)
  - `shadow-theme-sm/md/lg/xl` (not `shadow-2xl`)
- Use `text-[rgb(var(--color-text-inverse))]` instead of `text-white`
- Use Tailwind font scale: `text-2xs`, `text-xs`, `text-sm`, etc. (never `text-[13px]`)

### Focus States
- Use `.focus-ring` utility class on ALL interactive elements
- Never use `focus:ring-indigo-500` or similar inline focus patterns

### Forms & Modals
- All forms use `FORM_STYLES` from `app/components/ui/form-primitives.tsx`
- All modals use `ModalShell` component
- Use `FormField` for labeled inputs with error display
- Use `FormActions` for submit/cancel buttons

### Tables
- Use `TABLE_STYLES` from `app/components/ui/table-primitives.tsx`
- Use `useTableSelection()` hook for multi-row selection
- Use `useSorting()` hook for client-side sorting

### Status Badges
- Use `getStatusConfig()` from `app/utils/badgeConfigs.ts`
- Never define inline status color configs

### API Routes
- Always use `getServerSession(authOptions)` for authentication
- Input validation via Zod schemas in `lib/validation.ts`
- Sanitize notification messages via `sanitizeInput()` from `lib/securityUtils.ts`
- Use `rateLimiters` from `lib/rateLimit.ts` for rate-sensitive endpoints

### Components
- All pages are client components (`'use client'`)
- Data fetching via client-side `fetch()` to `/api/*` routes
- State management via local `useState` hooks (no global state library)
- Optimistic updates: update UI immediately, reconcile with server, rollback on error

## Troubleshooting

### Prisma Type Issues
```bash
npm run prisma:generate
# Or for deeper issues:
node scripts/regenerate-prisma.js
```

### Database Recovery
Multiple recovery scripts are available in `scripts/`:
```bash
node scripts/recover-db.js       # Via Prisma
node scripts/recover-db-v2.js    # Via hardcoded SQL
node scripts/run-recovery.js     # Via pg driver
```

Or via SQL directly:
```bash
# PowerShell
./scripts/fix-db.ps1
# Windows batch
./scripts/fix-db.bat
```

### Docker Compose Management
```bash
# Linux/Mac
./scripts/db-manage.sh start|stop|restart|migrate|seed|reset

# Windows
scripts\db-manage.bat start|stop|restart|migrate|seed|reset
```
