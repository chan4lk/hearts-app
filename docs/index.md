# Bistec AspireHub — Project Documentation Index

## Project Overview

- **Type:** Monolith Web Application (Full-Stack)
- **Primary Language:** TypeScript
- **Architecture:** Next.js 14 App Router, Client-Rendered Pages, API Route Handlers

## Quick Reference

- **Tech Stack:** Next.js 14 + React 18 + TypeScript + PostgreSQL 15 + Prisma 6 + NextAuth.js + TailwindCSS + OpenAI
- **Entry Point:** `app/layout.tsx` (root), `app/page.tsx` (landing), `middleware.ts` (edge)
- **Architecture Pattern:** Monolithic full-stack with client-side rendering, JWT auth, in-memory caching

## Generated Documentation

- [Project Overview](./project-overview.md) — Executive summary, tech stack, features, roles
- [Architecture](./architecture.md) — System layers, auth, API, data, security, AI, infrastructure
- [API Contracts](./api-contracts.md) — 46 routes, 68 handlers, rate limits, Zod validation
- [Data Models](./data-models.md) — 7 models, 8 enums, relationships, migrations, state machine
- [Component Inventory](./component-inventory.md) — 68+ components, hooks, utilities, design system
- [Source Tree Analysis](./source-tree-analysis.md) — Annotated directory tree, critical folders
- [Development Guide](./development-guide.md) — Setup, commands, testing, code conventions
- [Deployment Guide](./deployment-guide.md) — Docker, Azure, Pulumi, monitoring, security

## Existing Documentation

- [CLAUDE.md](../CLAUDE.md) — AI assistant project standards and conventions
- [README.md](../README.md) — Project readme

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and configure variables
3. Run `docker-compose up -d` for local PostgreSQL
4. Run `npm install` (auto-generates Prisma client)
5. Run `npx prisma migrate dev` then `npx prisma db seed`
6. Run `npm run dev` — open http://localhost:3000
7. Login with admin@example.com / admin123

---

*Generated: 2026-03-25 | Scan Level: Exhaustive | Mode: Initial Scan*
