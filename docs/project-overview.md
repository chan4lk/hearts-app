# Bistec AspireHub - Project Overview

**Generated:** 2026-02-28 | **Scan Level:** Deep | **Project Type:** Web Application

## Executive Summary

Bistec AspireHub (hearts-app) is a comprehensive **Performance Management System** built with Next.js 14, designed to help organizations manage employee goals, performance reviews, and analytics. The system features role-based dashboards for Admins, Managers, and Employees, with AI-powered goal suggestions and risk analysis powered by OpenAI.

## Project Identity

| Property | Value |
|---|---|
| **Project Name** | Bistec AspireHub (hearts-app) |
| **Package Name** | performance-management-system |
| **Version** | 0.1.0 |
| **License** | MIT |
| **Repository Type** | Monolith |
| **Architecture** | Layered / Component-based (Next.js App Router) |

## Technology Stack Summary

| Category | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 14.1.0 |
| **Language** | TypeScript | 5.3.3 |
| **UI Library** | React | 18.2.0 |
| **Styling** | Tailwind CSS | 3.4.1 |
| **Component Library** | Radix UI | Various |
| **Animations** | Framer Motion | 10.18.0 |
| **ORM** | Prisma | 6.10.1 |
| **Database** | PostgreSQL | 15 (Docker) |
| **Authentication** | NextAuth.js | 4.24.11 |
| **Identity Provider** | Azure Active Directory | - |
| **AI Integration** | OpenAI API | 4.96.0 |
| **Charts** | Recharts | 3.0.2 |
| **PDF Generation** | jsPDF + autoTable | 3.0.4 / 5.0.2 |
| **Excel Import** | xlsx (SheetJS) | 0.18.5 |
| **Monitoring** | Azure Application Insights | 3.7.0 |
| **Infrastructure** | Pulumi (Azure) | - |
| **Containerization** | Docker | Multi-stage |
| **CI/CD** | GitHub Actions → Azure App Service | - |

## Core Features

### Goal Management
- Create, edit, delete goals with categories (Professional, Technical, Leadership, Personal, Training, KPI)
- Goal approval workflow: DRAFT → PENDING → APPROVED/REJECTED → IN_PROGRESS → COMPLETED
- Progress tracking (0-100%) with visual progress bars
- Priority levels: URGENT, HIGH, MEDIUM, LOW
- Department-based organization
- Bulk goal creation and goal templates

### Performance Ratings
- Employee self-rating (1-5 stars with comments)
- Manager rating of employee goals (1-5 stars with feedback)
- Rating labels: Needs Improvement → Outstanding

### AI-Powered Features
- Personalized goal suggestions based on role and profile
- Goal description enhancement
- Risk analysis with completion probability
- Performance insights and trend analysis
- Writing assistant for constructive feedback

### Analytics & Reporting
- Role-aware analytics dashboard (Admin sees all, Manager sees team, Employee sees self)
- Breakdowns by status, category, priority, department
- Monthly trend analysis
- Employee performance rankings
- PDF report generation (dashboard, performance, goals reports)
- JSON data export

### User Management (Admin)
- User CRUD with role assignment (ADMIN, MANAGER, EMPLOYEE)
- Manager-employee relationship management
- Department management
- Review cycle management with Excel import
- Active/inactive user status

### Authentication & Security
- Azure AD Single Sign-On (SSO)
- Credentials-based login (fallback)
- Role-based access control (RBAC)
- Route-level middleware protection
- Rate limiting (strict, standard, moderate, lenient, bulk)
- Input validation and sanitization
- Bcrypt password hashing

### Notifications
- Real-time notification system with 5-second polling
- Event types: goal created/updated/approved/rejected/completed/deleted, rating received, review cycle events

## Architecture Overview

The application follows a **Next.js App Router** pattern with:
- **Server-side API routes** (`app/api/`) for backend logic
- **Client-side React components** with role-based dashboards
- **Prisma ORM** for type-safe database access
- **NextAuth.js middleware** for authentication and authorization
- **Centralized utilities** in `lib/` for cross-cutting concerns

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment (copy and edit .env)
cp .env.example .env

# Start database (Docker)
docker compose up -d

# Run migrations and seed
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
# → http://localhost:3000
```

## Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | admin123 |
| Manager | manager@example.com | manager123 |
| Employee | employee@example.com | employee123 |

## Links to Detailed Documentation

- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [API Contracts](./api-contracts.md)
- [Data Models](./data-models.md)
- [Component Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)
