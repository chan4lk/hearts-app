# Shared Components & Architecture – Complete System

This document defines the **single source of truth** for constants and types, the **shared component structure**, and how **all dashboard pages (Employee, Admin, Manager)** use them for a **consistent look** and **easy maintenance**. No existing files are removed; all pages import from these shared locations.

---

## 1. Single source: constants and types (one place each)

### 1.1 Constants – one file

**Path:** `app/components/shared/constants.ts`

**Use this file for all app-wide constants.** Do not duplicate these in page or feature folders.

| Export | Purpose | Used by |
|--------|---------|--------|
| `CATEGORIES` | Goal categories (PROFESSIONAL, TECHNICAL, etc.) | GoalFormModal, BulkGoalFormModal, GoalCard, setgoals, goals/create, rate-employees, self-rating |
| `GOAL_TEMPLATES` | Template definitions for bulk/create | BulkGoalFormModal, GoalTemplates, BulkGoalTemplates |
| `DEPARTMENTS` | Department options | GoalFormModal, BulkGoalFormModal |
| `PRIORITIES` | Priority options (LOW, MEDIUM, HIGH, URGENT) | GoalFormModal, BulkGoalFormModal, Filters |
| `RATING_COLORS` | Rating 1–5 colors | rate-employees GoalCard, self-rating GoalCard |
| `RATING_LABELS` | Rating 1–5 labels | Employee page, rate-employees, self-rating |
| `RATING_DESCRIPTIONS` | Rating descriptions | rate-employees GoalCard, self-rating GoalCard |
| `RATING_HOVER_COLORS` | Rating hover styles | Rating UI |
| `STATUS_COLORS` | Goal status badge colors | Status badges |
| `getStatusBadge` | Badge variant by status | Badge component |
| `GOAL_STATUS_BADGE_CONFIG` | Status badge bg/text for tables | GoalsTable, AdminGoalsTable (optional) |
| `DESIGNATIONS` | Employee designations list | ReviewCycleForm, admin review-cycles |
| `JOB_CATEGORIES` | Job categories (Executive, etc.) | ReviewCycleForm, admin review-cycles |
| `getDesignations` / `searchDesignations` | Designation helpers | ReviewCycleForm |
| `getJobCategories` / `searchJobCategories` | Job category helpers | ReviewCycleForm |
| `THEME_COLORS` | UI theme (primary, background, border, text) | Manager setgoals, any page needing shared theme |

**Import rule for developers:**

```ts
import { CATEGORIES, DEPARTMENTS, PRIORITIES, GOAL_TEMPLATES, RATING_LABELS } from '@/app/components/shared/constants';
```

**Single constants file:** All constants above (including designations and job categories) live in **one file**: `app/components/shared/constants.ts`. The `app/constants/` folder was removed; all code imports from `@/app/components/shared/constants`.

**Other config (keep; do not remove):**

- `app/components/shared/filterConfig.ts` – Filter presets, hero gradients (HERO_GRADIENTS), stat item config (STAT_ITEMS), grid columns. Used by Filters and dashboard pages. Keep this file.

---

### 1.2 Types – one file

**Path:** `app/components/shared/types.ts`

**Use this file for all shared TypeScript types and interfaces.** Do not redefine these in page or feature folders.

| Export | Purpose | Used by |
|--------|---------|--------|
| `Designation` | Designation literal type (from DESIGNATIONS) | Review cycles, forms |
| `JobCategory` | Job category literal type (from JOB_CATEGORIES) | Review cycles, forms |
| `User` | User with role, department, manager | GoalFormModal, Admin users, ManagerSelector, BulkGoalFormModal |
| `UserManager` | Manager subset | ManagerSelector |
| `UserFilters` / `Filters` | Filter state (role, manager, status) | Admin users page |
| `Employee` | Employee record | Admin, reports |
| `EmployeeStats` | Employee + goal stats | Manager dashboard, rate-employees, approve-goals |
| `Goal` | Goal entity (full shape) | GoalsTable, GoalCard, GoalDetailModal, all goal pages |
| `GoalFormData` | Create/Edit goal form | CreateGoalModal, BulkGoalFormModal, setgoals page |
| `GoalStats` | Aggregated goal counts | Manager, Employee dashboards, setgoals |
| `GoalWithRating` | Goal + rating (self-rating) | Employee self-rating GoalCard |
| `GoalWithRatingExtended` | Goal + rating + employee (manager rating) | Manager rate-employees GoalCard, approve-goals |
| `Rating` | Rating entity | Goal, GoalWithRating, GoalWithRatingExtended |
| `ProgressStatus` | Progress status enum | Goal, GoalCard |
| `DashboardStats` | Dashboard stat shape | Manager dashboard |
| `NewGoal` | Minimal new goal | Employee goals/create |
| `FormData` / `PasswordData` | User form types | Admin users |
| `ViewMode`, `FilterStatus`, `RatingStatus`, `FilterRating` | UI filter/view types | Filters, rating views |

**Import rule for developers:**

```ts
import { Goal, User, GoalFormData, GoalStats, GoalWithRating, GoalWithRatingExtended } from '@/app/components/shared/types';
```

**Single types file:** All shared types (including `Designation` and `JobCategory` derived from shared constants) live in **one file**: `app/components/shared/types.ts`. Do not remove any existing file that re-exports from here; new code should import from `@/app/components/shared/types` only.

---

## 2. Shared components – full structure

All shared UI lives under `app/components/shared/`. Pages must use these components (and the shared constants/types above) so the system has a **consistent look** and **one place to maintain** behavior and styling.

### 2.1 File tree – shared folder

```
app/components/shared/
├── constants.ts           ← Single source for constants (see §1.1)
├── types.ts               ← Single source for types (see §1.2)
├── filterConfig.ts        ← Filter/hero/stat config (keep; used by Filters)
│
├── GoalsSection.tsx       ← Two-tab layout (Assigned / Created) + children
├── GoalsTable.tsx         ← Main goal table (all roles)
├── GoalListWithTable.tsx  ← Card wrapper for table + pagination (no tabs)
├── RatingGoalCard.tsx     ← Goal card with rating stars (self-rating & manager rating)
├── GoalCard.tsx           ← Generic goal card (view/detail)
├── GoalFormModal.tsx      ← Create/Edit single goal
├── BulkGoalFormModal.tsx  ← Bulk create goals
├── GoalDetailModal.tsx    ← View goal details
├── GoalTemplates.tsx      ← Template picker (single)
├── BulkGoalTemplates.tsx  ← Template picker (bulk)
│
├── HeroSection.tsx        ← Page hero (title, subtitle)
├── StatsSection.tsx       ← Stat cards row
├── Filters.tsx            ← Status / employee / priority filters
├── Pagination.tsx         ← Table pagination
├── BackgroundElements.tsx  ← Decorative background blurs (self-rating, etc.)
│
├── DeleteConfirmationModal.tsx
├── FilterBadge.tsx
├── NotificationsDropdown.tsx
├── PageContainer.tsx
├── PageHeader.tsx
├── StandardCard.tsx
├── AIGoalSuggestions.tsx
```

No files in this list are removed; all are part of the shared system.

---

## 3. Which pages use which shared files

All dashboard pages use **only** shared components, shared constants, and shared types (plus role-specific wrappers where noted). This keeps the system consistent and easy to maintain.

### 3.1 Employee

| Page | Shared components | Shared constants | Shared types |
|------|-------------------|------------------|--------------|
| `dashboard/employee/page.tsx` | HeroSection, StatsSection, Filters, **GoalsSection** (wrapper), GoalFormModal, GoalDetailModal, Pagination | RATING_LABELS | Goal, GoalStats |
| `dashboard/employee/goals/create/page.tsx` | HeroSection, StatsSection, Filters, GoalFormModal, GoalDetailModal, **GoalsList** (uses **GoalListWithTable** + GoalsTable + Pagination) | CATEGORIES | Goal, NewGoal |
| `dashboard/employee/self-rating/page.tsx` | HeroSection, StatsSection, Filters, **RatingGoalCard** (variant=self), BackgroundElements | CATEGORIES, RATING_* | GoalWithRating |

Employee **GoalsSection** wrapper: `dashboard/employee/components/GoalsSection.tsx` – imports shared `GoalsSection` + `GoalsTable` + `Pagination`, passes employee-specific props. **Do not remove**; it is the adapter for the shared layout.

### 3.2 Manager

| Page | Shared components | Shared constants | Shared types |
|------|-------------------|------------------|--------------|
| `dashboard/manager/page.tsx` | HeroSection, StatsSection, Filters, **GoalsSection** (wrapper), GoalDetailModal | – | Goal, EmployeeStats, DashboardStats |
| `dashboard/manager/goals/setgoals/page.tsx` | HeroSection, StatsSection, Filters, CreateGoalModal, BulkGoalFormModal, GoalDetailModal, **GoalList** (uses **GoalListWithTable** + GoalsTable + Pagination), GoalTemplates | CATEGORIES | GoalFormData, GoalStats, User, Goal |
| `dashboard/manager/goals/approve-goals/page.tsx` | HeroSection, StatsSection, Filters, GoalDetailModal, **GoalsTable** (or list) | – | Goal, GoalWithRatingExtended, EmployeeStats |
| `dashboard/manager/rate-employees/page.tsx` | HeroSection, StatsSection, Filters, GoalsTable (rating) | CATEGORIES, RATING_* | GoalWithRatingExtended, EmployeeStats |

Manager **GoalsSection** wrapper: `dashboard/manager/components/GoalsSection.tsx` – imports shared `GoalsSection` + `GoalsTable` + `Pagination`, passes manager-specific props. **Do not remove**.

Setgoals **GoalList**: `dashboard/manager/goals/setgoals/components/sections/GoalList.tsx` – uses shared **GoalListWithTable** + `GoalsTable` + `Pagination`. File kept; no remove.

### 3.3 Admin

| Page | Shared components | Shared constants | Shared types |
|------|-------------------|------------------|--------------|
| `dashboard/admin/page.tsx` | HeroSection, StatsSection, Filters, **AdminGoalsTable** (or goal list) | – | Goal, User |
| `dashboard/admin/all-goals/page.tsx` | HeroSection, StatsSection, Filters, **AdminGoalsTable** | – | Goal, User |
| `dashboard/admin/users/page.tsx` | HeroSection, StatsSection, Filters, UserTable, ManagerSelector | – | User, UserFilters |

**AdminGoalsTable** is admin-specific (bulk delete, sort) but uses shared type `Goal`. It stays; optionally later it can be replaced by extending shared `GoalsTable` with admin props.

---

## 4. Consistency and maintenance rules

### 4.1 Consistency (look and behavior)

- **Layout:** All dashboard pages use the same chrome: **HeroSection** → **StatsSection** → **Filters** (where applicable) → main content (table/cards) → **Pagination** when needed.
- **Goals table:** All goal list/table views use **GoalsTable** (or AdminGoalsTable for admin) so columns, status badges, and actions look the same.
- **Goals two-tab view:** Employee and Manager use the shared **GoalsSection** layout (card + two tabs); only labels and data differ via wrappers.
- **Modals:** Create/Edit goal → **GoalFormModal**. Bulk create → **BulkGoalFormModal**. View goal → **GoalDetailModal**. Delete confirm → **DeleteConfirmationModal**.
- **Constants:** All category, department, priority, rating, and status options come from **constants.ts** so labels and options are identical everywhere.
- **Types:** All goal, user, and form types come from **types.ts** so the same shape is used across API, modals, and tables.

### 4.2 Easy maintenance (developer rules)

1. **Constants**  
   - Add or change options (categories, departments, priorities, ratings, status labels) only in `app/components/shared/constants.ts`.  
   - Other files (including `filterConfig.ts`) may re-export or reference these; do not duplicate the same lists elsewhere.

2. **Types**  
   - Add or change shared interfaces/types only in `app/components/shared/types.ts`.  
   - All pages and shared components should import from `@/app/components/shared/types`.  
   - Do not remove existing files that only re-export these types.

3. **Shared components**  
   - New reusable UI (tables, cards, modals, filters, pagination) should live in `app/components/shared/`.  
   - Dashboard pages should use these components instead of duplicating markup or logic.  
   - Role-specific wrappers (e.g. Employee/Manager GoalsSection) are allowed and should only pass props and render shared components.

4. **Styling**  
   - Reuse the same wrapper/card classes used in **GoalsSection** and **GoalListWithTable** (e.g. `bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border ...`) for new list/card sections so the look stays consistent.

5. **No file removal**  
   - Do not delete the shared files listed in §2.1.  
   - Do not remove the Employee/Manager **GoalsSection** wrapper files; they are the intended adapters for the shared layout.

---

## 5. Quick reference – import paths

Use these in all new and updated code:

```ts
// Constants (one file)
import { CATEGORIES, DEPARTMENTS, PRIORITIES, GOAL_TEMPLATES, RATING_LABELS, THEME_COLORS } from '@/app/components/shared/constants';

// Types (one file)
import { Goal, User, GoalFormData, GoalStats, GoalWithRating, GoalWithRatingExtended, EmployeeStats, UserFilters } from '@/app/components/shared/types';

// Shared layout & goals
import GoalsSection from '@/app/components/shared/GoalsSection';
import GoalsTable from '@/app/components/shared/GoalsTable';
import GoalListWithTable from '@/app/components/shared/GoalListWithTable';
import RatingGoalCard from '@/app/components/shared/RatingGoalCard';
import GoalCard from '@/app/components/shared/GoalCard';
import GoalFormModal from '@/app/components/shared/GoalFormModal';
import BulkGoalFormModal from '@/app/components/shared/BulkGoalFormModal';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';

// Page chrome
import HeroSection from '@/app/components/shared/HeroSection';
import StatsSection from '@/app/components/shared/StatsSection';
import Filters from '@/app/components/shared/Filters';
import Pagination from '@/app/components/shared/Pagination';
import BackgroundElements from '@/app/components/shared/BackgroundElements';
```

---

## 6. Summary

| Item | Location | Rule |
|------|----------|------|
| **Constants** | `app/components/shared/constants.ts` | Single file; all pages use it; no duplicate option lists. |
| **Types** | `app/components/shared/types.ts` | Single file; all pages and components use it. |
| **Shared UI** | `app/components/shared/*.tsx` | All dashboard pages use these for consistency. |
| **Role wrappers** | e.g. `employee/components/GoalsSection.tsx`, `manager/components/GoalsSection.tsx` | Keep; they adapt shared GoalsSection for each role. |
| **Files** | All listed above | Do not remove; structure remains for consistency and easy maintenance. |

This gives the project a **complete, consistent system**: one constants file, one types file, and one set of shared components used across all Employee, Admin, and Manager pages, with no files removed.

---

## 7. Steps completed (step-by-step consolidation)

The following steps were completed so all pages use shared components and the system is consistent and easy to maintain.

| Step | What was done | Files touched |
|------|----------------|---------------|
| **1** | Manager setgoals **GoalList** uses shared **GoalListWithTable** | Created `GoalListWithTable.tsx`; refactored `setgoals/.../GoalList.tsx` to use it. |
| **2** | Employee goals/create **GoalsList** uses shared **GoalListWithTable** | Refactored `goals/create/.../GoalsList.tsx` to use `GoalListWithTable` + `paginationBorderClass`. |
| **3** | Shared **RatingGoalCard** for self-rating | Created `RatingGoalCard.tsx` (variant: `self` \| `manager`). Employee self-rating page now uses it directly; wrapper GoalCards removed. |
| **4** | Status badge config in one place for tables | Added **GOAL_STATUS_BADGE_CONFIG** to `constants.ts` for consistent status badge styles; GoalsTable/AdminGoalsTable can import and use it. |
| **5** | Documentation updated | This section and §2.1 / §3 updated to reflect GoalListWithTable, RatingGoalCard, and GOAL_STATUS_BADGE_CONFIG. |

**Result:** All listed pages use shared layout (GoalListWithTable, RatingGoalCard), shared constants (including GOAL_STATUS_BADGE_CONFIG, THEME_COLORS), and shared types.

---

## 8. Duplicate code removed (consolidation)

The following duplicate or unused files were removed so admin, employee, and manager pages use shared components only.

| Removed | Reason | Now used instead |
|--------|--------|-------------------|
| `app/dashboard/employee/self-rating/components/BackgroundElements.tsx` | Duplicate | `app/components/shared/BackgroundElements.tsx` |
| `app/dashboard/admin/users/components/BackgroundElements.tsx` | Unused duplicate | (page did not use it); shared `BackgroundElements` available |
| `app/dashboard/manager/goals/setgoals/components/styles/colors.ts` | Single-use theme | `THEME_COLORS` in `app/components/shared/constants.ts` |
| `app/dashboard/analytics/components/HeroSection.tsx` | Unused (analytics uses shared) | `app/components/shared/HeroSection` |
| `app/dashboard/analytics/components/Filters.tsx` | Unused (analytics uses shared) | `app/components/shared/Filters` |
| `app/dashboard/analytics/components/StatsSection.tsx` | Unused (analytics uses shared) | `app/components/shared/StatsSection` |
| `app/dashboard/employee/self-rating/components/GoalCard.tsx` | Thin wrapper | Page uses `RatingGoalCard` from shared with `variant="self"` |
| `app/dashboard/manager/rate-employees/components/GoalCard.tsx` | Unused (page uses GoalsTable) | Removed; rate-employees uses `GoalsTable` with rating only |

**Shared additions:** `BackgroundElements.tsx`, `THEME_COLORS` in constants. Admin, employee, and manager pages are now wired to the single constants file, single types file, and shared components; duplicate and unused files have been removed.
