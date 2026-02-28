# Bistec AspireHub - Component Inventory

**Generated:** 2026-02-28 | **Total Components:** 41 files | **Total Pages:** 16 files

## Component Architecture

The UI is organized in a layered component hierarchy:

```
UI Primitives (Radix-based)
    └── Shared Components (cross-role reusable)
        └── Dashboard-specific Components (per-role)
            └── Page Components (route-level)
```

## Base UI Components (`app/components/ui/`)

Shadcn/ui-style primitives built on Radix UI:

| Component | File | Description |
|---|---|---|
| Button | `ui/button.tsx` | Styled button with variants (default, destructive, outline, etc.) |
| Input | `ui/input.tsx` | Text input field |
| Textarea | `ui/textarea.tsx` | Multi-line text input |
| Select | `ui/select.tsx` | Dropdown select (Radix Select) |
| Card | `ui/card.tsx` | Card container (CardHeader, CardTitle, CardContent) |
| Badge | `ui/badge.tsx` | Badge/label with variants |
| Alert | `ui/alert.tsx` | Alert message component |
| Dialog | `ui/dialog.tsx` | Modal dialog (Radix Dialog) |
| Label | `ui/label.tsx` | Form label |
| Progress | `ui/progress.tsx` | Progress bar (Radix Progress) |
| Tabs | `ui/tabs.tsx` | Tab navigation (Radix Tabs) |
| Chart | `ui/chart.tsx` | Chart visualization wrapper |

## Layout Components (`app/components/layout/`)

| Component | File | Description |
|---|---|---|
| DashboardLayout | `layout/DashboardLayout.tsx` | Main dashboard wrapper with sidebar navigation, header, user menu. Accepts `type` prop (admin/manager/employee) for role-specific navigation. Mobile-responsive with collapsible sidebar. |

## Shared Components (`app/components/shared/`)

Reusable across all dashboard roles:

| Component | File | Description |
|---|---|---|
| PageHeader | `shared/PageHeader.tsx` | Page title and description header |
| PageContainer | `shared/PageContainer.tsx` | Main container with background grid pattern |
| GoalCard | `shared/GoalCard.tsx` | Goal display card with status, priority, progress. Props: goal, onClick, onEdit, onDelete, showActions, showEmployee |
| GoalFormModal | `shared/GoalFormModal.tsx` | Modal form for creating/editing goals with category, department, priority selectors |
| GoalsTable | `shared/GoalsTable.tsx` | Advanced table with sorting, filtering, inline editing of status/priority/date |
| GoalDetailModal | `shared/GoalDetailModal.tsx` | Full goal details with status, rating, employee info |
| DeleteConfirmationModal | `shared/DeleteConfirmationModal.tsx` | Reusable delete confirmation dialog |
| NotificationsDropdown | `shared/NotificationsDropdown.tsx` | Notification bell with 5s polling, mark as read |
| Pagination | `shared/Pagination.tsx` | Table pagination with page/limit controls |
| FilterBadge | `shared/FilterBadge.tsx` | Badge for active filter tags |
| StandardCard | `shared/StandardCard.tsx` | Base card wrapper with gradient backgrounds |
| BulkGoalFormModal | `shared/BulkGoalFormModal.tsx` | Modal for bulk creating multiple goals |
| BulkGoalTemplates | `shared/BulkGoalTemplates.tsx` | Pre-defined goal templates for bulk creation |
| AIGoalSuggestions | `shared/AIGoalSuggestions.tsx` | AI-powered goal suggestions from /api/ai/personalized-goals |
| GoalTemplates | `shared/GoalTemplates.tsx` | Library of goal templates by category |

## Goal-Specific Components (`app/components/goals/`)

| Component | File | Description |
|---|---|---|
| GoalActivityTimeline | `goals/GoalActivityTimeline.tsx` | Timeline view of goal progress updates |
| GoalProgressTracker | `goals/GoalProgressTracker.tsx` | Visual progress bar and completion tracking |

## AI Components (`app/components/ai/`)

| Component | File | Description |
|---|---|---|
| AIGoalSuggestions | `ai/AIGoalSuggestions.tsx` | AI-powered goal recommendation modal |
| AIGoalRiskAnalysis | `ai/AIGoalRiskAnalysis.tsx` | AI risk assessment with scoring |
| AIPerformanceInsights | `ai/AIPerformanceInsights.tsx` | AI analytics and performance insights |
| AIWritingAssistant | `ai/AIWritingAssistant.tsx` | AI text suggestion for goal descriptions |

## Landing Page Components (`app/components/`)

| Component | File | Description |
|---|---|---|
| Header | `Header.tsx` | Navigation header with logo, Azure login, mobile menu, scroll effects |
| Footer | `Footer.tsx` | Footer with social links (Twitter, LinkedIn, GitHub), company info |
| Features | `features.tsx` | Feature showcase with tabs per role (Employee/Manager/Admin) |
| AzureIntegration | `azure.tsx` | Azure AD integration benefits section |
| LoadingPage | `LoadingPage.tsx` | Animated loading spinner (Framer Motion) |
| ProgressUpdateForm | `ProgressUpdateForm.tsx` | Form for updating goal progress percentage and notes |

## Animation Components

| Component | File | Description |
|---|---|---|
| motion | `animations/motion.tsx` | Framer Motion helpers (staggered containers, item animations) |

---

## Dashboard Pages

### Admin Dashboard (`app/dashboard/admin/`)

| Page/Component | File | Description |
|---|---|---|
| AdminDashboard | `admin/page.tsx` | Main admin overview with user stats, role distribution |
| HeroSection | `admin/components/HeroSection.tsx` | Welcome header |
| StatsSection | `admin/components/StatsSection.tsx` | Total users, employees, admins, managers stats |
| Filters | `admin/components/Filters.tsx` | Filter by user, status, priority, category |
| AdminGoalsTable | `admin/components/AdminGoalsTable.tsx` | All goals with employee/manager info |
| **Users Management** | `admin/users/page.tsx` | Manage all system users |
| UserTable | `admin/users/components/UserTable.tsx` | User list with role assignment |
| ManagerSelector | `admin/users/components/ManagerSelector.tsx` | Assign managers to employees |
| UsersFilters | `admin/users/components/Filters.tsx` | Filter by role, status, department |
| **All Goals** | `admin/all-goals/page.tsx` | View and manage all goals |
| AllGoalsHeroSection | `admin/all-goals/components/HeroSection.tsx` | Header |
| AllGoalsFilters | `admin/all-goals/components/Filters.tsx` | Filter all goals |
| **Review Cycles** | `admin/review-cycles/page.tsx` | Create and manage review cycles |
| ReviewCycleForm | `admin/review-cycles/components/ReviewCycleForm.tsx` | Create review cycle form |
| ReviewCycleTable | `admin/review-cycles/components/ReviewCycleTable.tsx` | Active review cycles |
| ImportExcelModal | `admin/review-cycles/components/ImportExcelModal.tsx` | Bulk import from Excel |

### Manager Dashboard (`app/dashboard/manager/`)

| Page/Component | File | Description |
|---|---|---|
| ManagerDashboard | `manager/page.tsx` | Team overview with goals, stats |
| StatsDisplay | `manager/components/StatsDisplay.tsx` | Team goal stats |
| Filters | `manager/components/Filters.tsx` | Filter by employee, status, priority |
| GoalsSection | `manager/components/GoalsSection.tsx` | Team goals grid/table |
| GoalsGrid | `manager/components/GoalsGrid.tsx` | Grid layout of team goals |
| **Approve Goals** | `manager/goals/approve-goals/page.tsx` | Approve/reject submitted goals |
| **Set Goals** | `manager/goals/setgoals/page.tsx` | Create goals for team members |
| CreateGoalModal | `manager/goals/setgoals/components/modals/CreateGoalModal.tsx` | Modal for creating goal for employee |
| **Rate Employees** | `manager/rate-employees/page.tsx` | Rate completed goals |
| EmployeeFilter | `manager/rate-employees/components/EmployeeFilter.tsx` | Select employee to rate |

### Employee Dashboard (`app/dashboard/employee/`)

| Page/Component | File | Description |
|---|---|---|
| EmployeeDashboard | `employee/page.tsx` | Personal goals overview, quick actions |
| HeroSection | `employee/components/HeroSection.tsx` | Welcome with motivational message |
| StatsSection | `employee/components/StatsSection.tsx` | Goal counts, achievement score |
| GoalsSection | `employee/components/GoalsSection.tsx` | Grid/card view of own goals |
| ManagerRatingBadge | `employee/components/ManagerRatingBadge.tsx` | Badge showing manager's rating |
| **Create Goal** | `employee/goals/create/page.tsx` | Create new goal with AI suggestions |
| **Self Rating** | `employee/self-rating/page.tsx` | Self-rate completed goals |
| SelfRatingGoalCard | `employee/self-rating/components/GoalCard.tsx` | Goal card with rating selector |

### Analytics Dashboard (`app/dashboard/analytics/`)

| Page/Component | File | Description |
|---|---|---|
| AnalyticsPage | `analytics/page.tsx` | Context-aware analytics (admin/manager/employee view) |
| HeroSection | `analytics/components/HeroSection.tsx` | Analytics header |
| Filters | `analytics/components/Filters.tsx` | Date range, employee, department filters |
| StatsSection | `analytics/components/StatsSection.tsx` | Key metrics and charts |

## UI Patterns

- **Dark Theme:** Consistent gradient backgrounds (#0f1117, #1a1b1e)
- **Framer Motion:** Staggered animations, hover effects, smooth transitions
- **Real-time Updates:** 5-second notification polling
- **Responsive Design:** Mobile sidebar, desktop layout
- **Modal-based CRUD:** Create/edit/view in modals, delete confirmation
- **Inline Editing:** Status/priority/date editing directly in tables
- **Server-side Pagination:** Configurable page sizes
