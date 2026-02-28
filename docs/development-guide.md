# Bistec AspireHub - Development Guide

**Generated:** 2026-02-28

## Prerequisites

| Requirement | Version | Purpose |
|---|---|---|
| Node.js | 18+ (20 recommended) | Runtime |
| npm | 9+ | Package management |
| Docker | Latest | PostgreSQL database |
| Docker Compose | Latest | Container orchestration |
| Git | Latest | Version control |

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/performance-management-system.git
cd performance-management-system
```

### 2. Install Dependencies

```bash
npm install
```

This will automatically run `prisma generate` via the `postinstall` script.

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Required
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/performance_management
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-here-use-openssl-rand-base64-32

# Azure AD (for SSO - optional for local dev with credentials auth)
AZURE_AD_CLIENT_ID=your-azure-ad-client-id
AZURE_AD_CLIENT_SECRET=your-azure-ad-client-secret
AZURE_AD_TENANT_ID=your-azure-ad-tenant-id

# Optional
OPENAI_API_KEY=your-openai-api-key-here  # For AI features
```

### 4. Start Database

Using Docker Compose:
```bash
docker compose up -d
```

This starts:
- **PostgreSQL 15** on port `5434`
- **pgAdmin** on port `5050` (admin@example.com / admin)

Alternative: Use the DB management script:
```bash
# Linux/Mac
./scripts/db-manage.sh start

# Windows
scripts\db-manage.bat start
```

### 5. Run Migrations & Seed

```bash
# Apply database schema
npx prisma migrate dev

# Seed test data (3 users)
npx prisma db seed
```

### 6. Start Development Server

```bash
npm run dev
```

Application available at: **http://localhost:3000**

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start dev server on port 3000 (127.0.0.1) |
| `build` | `npm run build` | Production build |
| `start` | `npm start` | Start production server |
| `lint` | `npm run lint` | Run ESLint |
| `prisma:generate` | `npm run prisma:generate` | Regenerate Prisma client |
| `prisma:migrate` | `npm run prisma:migrate` | Create and apply migrations |
| `prisma:seed` | `npm run prisma:seed` | Seed database with test data |

## Database Management

### Docker Scripts

```bash
# Linux/Mac
./scripts/db-manage.sh [command]

# Windows
scripts\db-manage.bat [command]
```

| Command | Action |
|---|---|
| `start` | Start PostgreSQL + pgAdmin containers |
| `stop` | Stop containers |
| `restart` | Restart containers |
| `status` | Show container status |
| `logs` | View container logs |
| `reset` | Reset database (delete all data) |
| `migrate` | Run Prisma migrations |
| `seed` | Seed test data |

### Prisma Commands

```bash
# Open Prisma Studio (visual DB browser)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name <description>

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (drops and recreates)
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate
```

## Test Accounts

| Role | Email | Password | Dashboard |
|---|---|---|---|
| Admin | admin@example.com | admin123 | /dashboard/admin |
| Manager | manager@example.com | manager123 | /dashboard/manager |
| Employee | employee@example.com | employee123 | /dashboard/employee |

## Project Structure

```
app/          → Next.js App Router (pages, API routes, components)
lib/          → Core utilities (auth, prisma, openai, logger)
prisma/       → Database schema and migrations
types/        → TypeScript type definitions
public/       → Static assets
infra/        → Pulumi infrastructure (Azure)
scripts/      → Database management scripts
```

## Key Development Patterns

### API Route Pattern
```typescript
// app/api/[domain]/route.ts
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... business logic with Prisma
  return NextResponse.json({ data });
}
```

### Component Pattern
```typescript
// Dashboard pages follow this pattern:
// page.tsx → Main page component
// components/HeroSection.tsx → Page header
// components/StatsSection.tsx → Statistics cards
// components/Filters.tsx → Filter controls
// components/[ContentSection].tsx → Main content area
```

### Role-Based Access
```typescript
// Middleware checks role at route level
// API routes check session.user.role
// Components use useRoleAccess() hook
```

## Common Development Tasks

### Adding a New API Route
1. Create `app/api/[domain]/route.ts`
2. Import `getServerSession` and `authOptions` for auth
3. Import `prisma` from `@/lib/prisma` for database
4. Add rate limiting from `@/lib/rateLimit` if needed
5. Use pagination from `@/lib/pagination`

### Adding a New Dashboard Page
1. Create `app/dashboard/[role]/[page]/page.tsx`
2. Wrap with `<DashboardLayout type="[role]">`
3. Add navigation entry in `app/utils/roleAccess.ts`
4. Create sub-components in `components/` folder

### Modifying the Database Schema
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>`
3. Prisma client auto-regenerates
4. Update API routes and components accordingly

### Adding AI Features
1. Create API route in `app/api/ai/`
2. Import helper functions from `@/lib/openai.ts`
3. Create corresponding React component in `app/components/ai/`
4. Available models: gpt-3.5-turbo (basic), gpt-4o-mini (advanced)

## Debugging

### Database Issues
```bash
# Check database connection
npx prisma db pull

# View current schema
npx prisma studio

# Check migration status
npx prisma migrate status
```

### Auth Issues
- Check `.env` variables (NEXTAUTH_URL, NEXTAUTH_SECRET)
- Verify Azure AD configuration
- Check middleware.ts matcher patterns
- Review NextAuth callbacks in `lib/auth.ts`

### Environment Variables
- Required vars validated at startup by `lib/env.ts`
- Missing vars will log warnings
- Azure AD vars required for SSO (optional for credentials-only)
