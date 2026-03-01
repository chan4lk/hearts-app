# Bistec AspireHub - Project Documentation Index

**Generated:** 2026-03-01 | **Workflow:** initial_scan (deep) | **Version:** 2.0.0

## Project Overview

- **Type:** Monolith (single cohesive codebase)
- **Primary Language:** TypeScript
- **Architecture:** Layered / Component-based (Next.js App Router)
- **Project Name:** Bistec AspireHub (hearts-app / performance-management-system)

## Quick Reference

- **Framework:** Next.js 14 (App Router) + React 18
- **Database:** PostgreSQL 17 (Prisma ORM)
- **Auth:** NextAuth.js (Azure AD SSO + Credentials)
- **AI:** OpenAI (GPT-3.5-turbo, GPT-4o-mini)
- **Styling:** Tailwind CSS + Radix UI + Framer Motion
- **Deployment:** Docker → Azure App Service (via GitHub Actions)
- **Infrastructure:** Pulumi (Azure)
- **Entry Point:** `app/layout.tsx` (root) / `middleware.ts` (auth)

## Generated Documentation

- [Project Overview](./project-overview.md) - Executive summary, tech stack, features
- [Architecture](./architecture.md) - System architecture, patterns, security, deployment
- [Source Tree Analysis](./source-tree-analysis.md) - Annotated directory tree with critical folders
- [API Contracts](./api-contracts.md) - All REST API endpoints with request/response schemas
- [Data Models](./data-models.md) - Database schema, entities, relationships, enums
- [Component Inventory](./component-inventory.md) - All React components and pages by role
- [Development Guide](./development-guide.md) - Setup, scripts, debugging, common tasks
- [Deployment Guide](./deployment-guide.md) - Docker, CI/CD, Azure, Pulumi infrastructure

## Existing Documentation

- [README.md](../README.md) - Original project README with setup instructions

## Getting Started

### Quick Setup
```bash
npm install                    # Install dependencies
cp .env.example .env           # Configure environment
docker compose up -d           # Start PostgreSQL
npx prisma migrate dev         # Apply schema
npx prisma db seed             # Seed test data
npm run dev                    # Start dev server → http://localhost:3000
```

### Test Accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | admin123 |
| Manager | manager@example.com | manager123 |
| Employee | employee@example.com | employee123 |

### Key Paths
| Path | Purpose |
|---|---|
| `/` | Landing page |
| `/login` | Authentication |
| `/dashboard/admin` | Admin dashboard |
| `/dashboard/manager` | Manager dashboard |
| `/dashboard/employee` | Employee dashboard |
| `/dashboard/analytics` | Analytics (all roles) |
| `/dashboard/manager/feedback` | 360 Feedback (manager) |
| `/dashboard/manager/meetings` | Meeting Minutes (manager) |
| `/dashboard/manager/exit-interviews` | Exit Interviews (manager) |
| `/dashboard/employee/survey` | Employee Survey |
| `/dashboard/feedback/review/[id]` | Submit Feedback Review |
| `/api/health` | Health check |

## For AI-Assisted Development

When working with this codebase, reference:
1. **For features:** Start with [Architecture](./architecture.md) for system context
2. **For API work:** Reference [API Contracts](./api-contracts.md) for endpoint patterns
3. **For UI work:** Reference [Component Inventory](./component-inventory.md) for existing components
4. **For database changes:** Reference [Data Models](./data-models.md) for schema
5. **For deployment:** Reference [Deployment Guide](./deployment-guide.md) for CI/CD
