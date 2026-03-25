# Bistec AspireHub — Project Overview

## Executive Summary

A comprehensive performance management platform for Bistec Global, enabling goal setting, tracking, AI-powered insights, performance reviews, event management, and analytics. Built with Next.js 14 (App Router), PostgreSQL via Prisma ORM, NextAuth.js (Azure AD + Credentials), and OpenAI integration.

## Project Identity

- **Name:** Bistec AspireHub (package name: performance-management-system)
- **Version:** 0.1.0
- **Repository Type:** Monolith
- **Project Type:** Web Application (Full-Stack)

## Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.21 |
| Language | TypeScript | 5.3.3 |
| Runtime | Node.js | 20 |
| UI Library | React | 18.2.0 |
| Database | PostgreSQL | 15 |
| ORM | Prisma | 6.10.1 |
| Auth | NextAuth.js | 4.24.11 |
| Identity | Azure AD (SSO) + Credentials | -- |
| CSS | TailwindCSS | 3.4.1 |
| UI Components | Radix UI (Dialog, Select, Progress, Tabs) | Latest |
| Animation | Framer Motion | 10.18.0 |
| Charts | Recharts | 3.0.2 |
| AI | OpenAI (gpt-4o-mini, gpt-3.5-turbo) | 4.96.0 |
| PDF | jsPDF + jspdf-autotable | 3.0.4 / 5.0.2 |
| Excel | xlsx | 0.18.5 |
| Validation | Zod | 3.22.4 |
| Testing | Vitest | 4.1.1 |
| Monitoring | Azure Application Insights | 3.7.0 |
| Infrastructure | Pulumi (Azure) | 3.0.0 |
| Containerization | Docker (multi-stage build) | -- |

## Architecture Pattern

- **Style:** Monolithic full-stack web application
- **Rendering:** All pages are client components (`'use client'`) — no SSR data loading
- **Data Fetching:** Client-side `fetch()` to internal `/api/*` routes
- **State Management:** Local React `useState`/`useEffect` hooks (no Redux/Zustand/Context for state)
- **Auth Pattern:** JWT-based sessions with 10-second in-memory cache to reduce DB queries
- **Design System:** Semantic CSS custom properties (RGB triplet format) with light/dark theme support
- **API Pattern:** Next.js Route Handlers with `getServerSession(authOptions)` for auth

## Core Features

1. **Goal Management** — Full lifecycle: DRAFT -> PENDING -> APPROVED -> IN_PROGRESS -> COMPLETED (with REJECTED, MODIFIED, ON_HOLD, BLOCKED states)
2. **Role-Based Access** — ADMIN, MANAGER, EMPLOYEE with route-level and resource-level authorization
3. **Performance Ratings** — Dual rating system: self-assessment (1-5) + manager rating (1-5)
4. **AI-Powered Features** — Goal suggestions, risk analysis, performance insights, feedback improvement, automated reviews
5. **Analytics Dashboard** — Role-scoped metrics, charts (Recharts), PDF export
6. **Event Management** — Organization events (Toastmasters, Code Crunch, workshops, etc.) with participation tracking
7. **Review Cycles** — Employee review timeline management with Excel import/export
8. **Notifications** — In-app notification system for goal lifecycle events
9. **Bulk Operations** — Bulk goal creation (up to 50), batch ratings

## User Roles & Access

| Feature | ADMIN | MANAGER | EMPLOYEE |
|---------|-------|---------|----------|
| System Dashboard | Full system stats | Team overview | Personal goals |
| User Management | Full CRUD | -- | -- |
| Goal Creation | All employees | Direct reports | Self |
| Goal Approval | All goals | Direct reports | -- |
| Ratings | All goals | Direct reports | Self only |
| Analytics | All data | Team data | Own data |
| Events | Full CRUD | View/Register | View/Register |
| Review Cycles | Full CRUD | -- | -- |

## Key Integrations

- **Azure AD** — SSO authentication, auto-provisioning users on first login
- **OpenAI** — 7 AI features using gpt-4o-mini and gpt-3.5-turbo
- **Azure Application Insights** — Optional telemetry/monitoring with PII redaction
- **Azure App Service** — Production hosting (Pulumi IaC)
- **Azure PostgreSQL Flexible Server** — Production database

## Links to Documentation

- [Architecture](./architecture.md)
- [API Contracts](./api-contracts.md)
- [Data Models](./data-models.md)
- [Component Inventory](./component-inventory.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)
