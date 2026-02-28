# Bistec AspireHub - Architecture Document

**Generated:** 2026-02-28 | **Project Type:** Web (Next.js 14)

## 1. Executive Summary

Bistec AspireHub is a full-stack performance management system built as a Next.js 14 monolith using the App Router pattern. The architecture leverages server-side API routes for backend logic, Prisma ORM for database access, and a role-based dashboard system for three user types (Admin, Manager, Employee).

## 2. Architecture Pattern

**Pattern:** Layered Monolith with Component-Based UI

```
┌────────────────────────────────────────────────────┐
│                  Client Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Admin   │  │ Manager  │  │    Employee      │ │
│  │Dashboard │  │Dashboard │  │    Dashboard     │ │
│  └────┬─────┘  └────┬─────┘  └───────┬──────────┘ │
│       └──────────────┼────────────────┘             │
│                      │                              │
│  ┌───────────────────┴──────────────────────────┐  │
│  │         Shared Components Layer              │  │
│  │  GoalCard, GoalFormModal, GoalsTable,        │  │
│  │  Pagination, NotificationsDropdown, etc.     │  │
│  └──────────────────┬───────────────────────────┘  │
│                     │                               │
│  ┌──────────────────┴───────────────────────────┐  │
│  │         UI Component Library (Radix-based)   │  │
│  │  Button, Input, Dialog, Card, Badge, etc.    │  │
│  └──────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────┤
│              Middleware Layer                        │
│  ┌──────────────────────────────────────────────┐  │
│  │  NextAuth Middleware (route protection)       │  │
│  │  Role-based access control                   │  │
│  │  Rate limiting                               │  │
│  └──────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────┤
│                 API Layer (app/api/)                │
│  ┌─────────┐ ┌──────┐ ┌───────┐ ┌──────────────┐ │
│  │  Goals  │ │ Auth │ │ Admin │ │  Analytics   │ │
│  │  CRUD   │ │  +   │ │ Users │ │  + Reports   │ │
│  │  API    │ │ SSO  │ │ Mgmt  │ │  + AI        │ │
│  └────┬────┘ └──┬───┘ └───┬───┘ └──────┬───────┘ │
│       └─────────┴─────────┴─────────────┘          │
├────────────────────────────────────────────────────┤
│              Service / Library Layer                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐ │
│  │  Auth  │ │ OpenAI │ │ Logger │ │  Rate      │ │
│  │ Config │ │ Client │ │  +AI   │ │  Limiter   │ │
│  └────────┘ └────────┘ └────────┘ └────────────┘ │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐ │
│  │Prisma  │ │Pagina- │ │Valida- │ │  Env       │ │
│  │Client  │ │tion    │ │tion    │ │  Config    │ │
│  └────────┘ └────────┘ └────────┘ └────────────┘ │
├────────────────────────────────────────────────────┤
│              Data Layer                             │
│  ┌──────────────────────────────────────────────┐  │
│  │  PostgreSQL 15 (via Prisma ORM)              │  │
│  │  Tables: User, Goal, Rating, Notification,   │  │
│  │          ReviewCycle                          │  │
│  └──────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────┤
│              External Services                      │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │ Azure AD │ │  OpenAI  │ │ App Insights       │ │
│  │  (SSO)   │ │  (AI)    │ │ (Monitoring)       │ │
│  └──────────┘ └──────────┘ └────────────────────┘ │
└────────────────────────────────────────────────────┘
```

## 3. Technology Stack

| Category | Technology | Version | Justification |
|---|---|---|---|
| Framework | Next.js (App Router) | 14.1.0 | Full-stack React framework with SSR/SSG, API routes, middleware |
| Language | TypeScript | 5.3.3 | Type safety, better DX, Prisma type generation |
| UI Library | React | 18.2.0 | Component-based UI, ecosystem support |
| Styling | Tailwind CSS | 3.4.1 | Utility-first CSS, rapid UI development |
| Component Primitives | Radix UI | Various | Accessible, unstyled component primitives |
| Animations | Framer Motion | 10.18.0 | Declarative React animations |
| ORM | Prisma | 6.10.1 | Type-safe database access, migrations, schema-first |
| Database | PostgreSQL | 15 | Reliable RDBMS, rich feature set |
| Authentication | NextAuth.js | 4.24.11 | Multi-provider auth, session management |
| Identity | Azure AD | - | Enterprise SSO, organizational directory |
| AI | OpenAI | 4.96.0 | Goal suggestions, risk analysis, performance insights |
| Monitoring | Application Insights | 3.7.0 | Azure-native APM and logging |
| Charts | Recharts | 3.0.2 | React-based chart library |
| PDF | jsPDF + autoTable | 3.0.4 | Client-side PDF generation |
| Excel | xlsx (SheetJS) | 0.18.5 | Excel file parsing for bulk import |
| Validation | Zod | 3.22.4 | Runtime type validation |
| Forms | React Hook Form | 7.50.1 | Performant form management |

## 4. Authentication & Authorization Architecture

### Authentication Flow

```
User → Login Page → Azure AD OAuth / Credentials
                         │
                    NextAuth.js
                    ┌────┴────┐
                    │ SignIn   │ → Prisma User Lookup/Create
                    │ Callback │ → Role Fetch from DB
                    ├─────────┤
                    │ JWT      │ → Role embedded in token
                    │ Callback │
                    ├─────────┤
                    │ Session  │ → Role exposed to client
                    │ Callback │
                    └─────────┘
                         │
              Middleware (route protection)
              ┌──────────┴──────────┐
              │ hasAccess(role,path) │
              │ Role-based redirect  │
              └─────────────────────┘
```

### Role Permissions Matrix

| Path | ADMIN | MANAGER | EMPLOYEE |
|---|---|---|---|
| /dashboard/admin/* | Full access | No access | No access |
| /dashboard/manager/* | Full access | Full access | No access |
| /dashboard/employee/* | Full access | Full access | Full access |
| /dashboard/analytics/* | Full access | Full access | Full access |
| /api/* | Full access | Scoped to team | Scoped to self |

## 5. Data Architecture

See [Data Models](./data-models.md) for full schema documentation.

### Core Entities
- **User** - Employees, managers, admins with self-referencing manager relationship
- **Goal** - Performance goals with status workflow, categories, priorities
- **Rating** - 1:1 with Goal, dual scoring (self + manager)
- **Notification** - Event-driven notifications tied to goals
- **ReviewCycle** - Periodic review scheduling per user

### Key Relationships
```
User (1) ──manages──> (N) User (employees)
User (1) ──creates──> (N) Goal
User (1) ──owns────> (N) Goal (as employee)
Goal (1) ──has──────> (1) Rating
Goal (1) ──triggers─> (N) Notification
User (1) ──has──────> (1) ReviewCycle
```

## 6. API Design

See [API Contracts](./api-contracts.md) for full endpoint documentation.

### API Route Structure
All API routes use Next.js App Router conventions (`app/api/[domain]/route.ts`).

| Domain | Purpose | Auth Required |
|---|---|---|
| `/api/auth/*` | NextAuth authentication | No (public) |
| `/api/goals/*` | Goal CRUD + workflow | Yes |
| `/api/admin/*` | User/system management | Yes (ADMIN) |
| `/api/ai/*` | AI-powered features | Yes |
| `/api/analytics/*` | Dashboard analytics | Yes |
| `/api/ratings/*` | Goal ratings | Yes |
| `/api/reports/*` | Report generation | Yes |
| `/api/employees/*` | Employee data | Yes (MANAGER+) |
| `/api/notifications/*` | User notifications | Yes |
| `/api/health` | Health check | No |

## 7. State Management

The application uses a lightweight state management approach:

- **Server State:** NextAuth.js session (role, user data) via JWT
- **Client State:** React useState/useEffect hooks (local component state)
- **Form State:** React Hook Form with Zod validation
- **UI State:** Framer Motion for animation state
- **Settings:** React Context (dark theme, system name via Providers)
- **No global state library** (no Redux, Zustand, etc.) - data fetched per-page via API calls

## 8. Security Architecture

| Layer | Mechanism | Details |
|---|---|---|
| Transport | HTTPS | Enforced in production |
| Authentication | NextAuth.js + Azure AD | OAuth 2.0 / Credentials |
| Authorization | Middleware RBAC | Route-level role checks |
| Session | JWT | 30-day max age, httpOnly cookies |
| Passwords | bcryptjs | 12 salt rounds |
| Rate Limiting | In-memory store | Per-IP, configurable per-endpoint |
| Input Validation | Zod + custom | Password strength, email, request size |
| Logging | Sanitized | PII/secrets redacted before logging |
| Cookies | Secure | httpOnly, sameSite: lax |

## 9. Deployment Architecture

```
GitHub (develop branch)
    │
    ▼ (push trigger)
GitHub Actions CI/CD
    │
    ├── Build Docker image
    ├── Push to GHCR (ghcr.io)
    └── Deploy to Azure
         │
         ▼
Azure App Service (Linux)
    │
    ├── Docker container (Node.js 20)
    │   └── Next.js standalone server
    │
    └── Azure PostgreSQL (Flexible Server)
         └── Prisma managed schema

Infrastructure (Pulumi):
    ├── Resource Group (Southeast Asia)
    ├── App Service Plan (Basic B1)
    ├── Web App (Node.js 18 LTS)
    └── PostgreSQL Server (Standard_B1ms, 32GB)
```

## 10. Testing Strategy

- **No test framework currently configured** (no Jest, Vitest, Cypress, etc.)
- Test file patterns defined but no test files found
- Validation logic exists in `lib/validation.ts` (unit-testable)
- API routes have error handling (integration-testable)

## 11. Performance Considerations

- **Standalone output** for optimized Docker builds
- **Webpack chunk splitting** (20KB min, 244KB max)
- **Lazy Prisma connection** (connects on first query)
- **Batched database queries** in analytics (reduces connection pool usage)
- **Server-side pagination** with configurable limits
- **Rate limiting** to prevent abuse
- **Application Insights** for performance monitoring
