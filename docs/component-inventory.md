# Component Inventory — Bistec AspireHub

## Summary

| Category | Count |
|----------|-------|
| UI Primitives | 17 components + 2 style constants + 5 table utilities + 2 hooks |
| Shared Components | 18 components + types + constants |
| AI Components | 4 |
| Event Components | 5 |
| Goal Sub-components | 2 |
| Page-Specific Components | 16 |
| Landing/Global Components | 6 |
| Custom Hooks | 7 |
| Utility Modules | 6 |
| Pages | 19 routes |

---

## UI Primitives (`app/components/ui/`)

| Component | File | Category | Key Props | Dependencies |
|-----------|------|----------|-----------|-------------|
| Button | `ui/button.tsx` | Form | `variant` (default/destructive/outline/secondary/ghost/link), `size` (default/sm/lg/icon), `asChild` | Radix Slot, CVA |
| Input | `ui/input.tsx` | Form | Standard HTML input attributes | -- |
| Textarea | `ui/textarea.tsx` | Form | Standard HTML textarea attributes | -- |
| Label | `ui/label.tsx` | Form | HTML label + variant props | CVA |
| Select (full set) | `ui/select.tsx` | Form | `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectValue`, `SelectLabel`, `SelectSeparator` | Radix Select, Lucide |
| Badge | `ui/badge.tsx` | Display | `variant` (default/secondary/destructive/outline) | CVA |
| Card (full set) | `ui/card.tsx` | Display | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | -- |
| Dialog (full set) | `ui/dialog.tsx` | Modal | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogOverlay`, `DialogClose` | Radix Dialog, Lucide |
| Alert | `ui/alert.tsx` | Display | `variant` (default/destructive) | CVA |
| Progress | `ui/progress.tsx` | Display | Radix Progress with value-based indicator | Radix Progress |
| Tabs (full set) | `ui/tabs.tsx` | Navigation | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Radix Tabs |
| ChartContainer | `ui/chart.tsx` | Chart | `config: ChartConfig`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent` | Recharts, React Context |
| ThemeToggle | `ui/ThemeToggle.tsx` | Navigation | No props (uses `useTheme()`) | Framer Motion |

### Form Primitives (`ui/form-primitives.tsx`)

| Export | Type | Description |
|--------|------|-------------|
| `FORM_STYLES` | Style constant | `label`, `input`, `textarea`, `select`, `btnPrimary`, `btnSecondary`, `btnDanger` |
| `ModalShell` | Component | `{ open, onClose, title, icon?, maxWidth?, footer?, children }` — animated overlay + content |
| `FormField` | Component | `{ label, required?, error?, children }` — field wrapper |
| `FormActions` | Component | `{ onCancel, submitLabel?, loading?, disabled?, danger?, formId? }` — form buttons |

### Table Primitives (`ui/table-primitives.tsx`)

| Export | Type | Description |
|--------|------|-------------|
| `TABLE_STYLES` | Style constant | `thead`, `th`, `thSortable`, `td`, `tdPrimary`, `tdSecondary`, `row`, `rowSelected` |
| `SortIcon` | Component | `{ column, sortKey, sortDir }` |
| `CheckboxHeader` | Component | `{ isAllSelected, isPartialSelected, onToggle }` |
| `CheckboxCell` | Component | `{ checked, onToggle }` |
| `SelectionBanner` | Component | `{ count, onBulkDelete?, onClear }` |
| `TableEmptyState` | Component | `{ colSpan, icon, title, subtitle? }` |
| `useTableSelection()` | Hook | Returns `{ selectedIds, toggleSelect, toggleSelectAll, clearSelection, isAllSelected }` |
| `useSorting()` | Hook | Returns `{ sorted, sortKey, sortDir, handleSort }` |

---

## Shared Components (`app/components/shared/`)

| Component | File | Category | Key Props |
|-----------|------|----------|-----------|
| PageContainer | `shared/PageContainer.tsx` | Layout | `{ children }` — full-page wrapper with grid background |
| PageHeader | `shared/PageHeader.tsx` | Layout | `{ title, description?, children? }` — animated heading with action slot |
| PageToolbar | `shared/PageToolbar.tsx` | Layout | `{ searchValue?, onSearchChange?, actions?, children?, onClearFilters?, hasActiveFilters? }` |
| FilterSelect | `shared/PageToolbar.tsx` | Form | `{ value, onChange, options, placeholder?, label? }` |
| Pagination | `shared/Pagination.tsx` | Navigation | `{ page, limit, total, totalPages, hasNext, hasPrev, onPageChange, onLimitChange? }` |
| StatsSection | `shared/StatsSection.tsx` | Display | `{ stats: StatItem[] }` — responsive stat card grid |
| StandardCard | `shared/StandardCard.tsx` | Display | `{ children, className?, hover? }` — animated card with gradient |
| FilterBadge | `shared/FilterBadge.tsx` | Display | `{ icon?, children, className? }` |
| Filters | `shared/Filters.tsx` | Form | Date range, user/employee/department/status/priority/category selects, export/refresh/clear |
| GoalCard | `shared/GoalCard.tsx` | Display | `{ goal, onClick, onEdit?, onDelete?, showActions?, showEmployee? }` |
| GoalDetailModal | `shared/GoalDetailModal.tsx` | Modal | `{ goal, onClose, onSubmitGoal?, onEdit?, onDelete?, onApprove?, onReject? }` — includes AI risk, activity timeline |
| GoalFormModal | `shared/GoalFormModal.tsx` | Modal/Form | `{ isOpen, onClose, onSubmit, assignedEmployees, loading, formData, ... }` |
| GoalsTable | `shared/GoalsTable.tsx` | Display | `{ goals, onGoalClick?, onEdit?, onDelete?, onStatusUpdate?, onPriorityUpdate?, onRatingChange?, ... }` |
| GoalListWithTable | `shared/GoalListWithTable.tsx` | Layout | `{ children, className? }` |
| GoalTemplates | `shared/GoalTemplates.tsx` | Display | `{ onSelect }` — 18 templates picker grid |
| AIGoalSuggestions | `shared/AIGoalSuggestions.tsx` | AI/Form | `{ category, onSuggestionSelect, context? }` |
| BulkGoalFormModal | `shared/BulkGoalFormModal.tsx` | Modal/Form | `{ isOpen, onClose, onSubmit, assignedEmployees, loading }` |
| BulkGoalTemplates | `shared/BulkGoalTemplates.tsx` | Display | `{ assignedEmployees, onApplyTemplate }` |
| DeleteConfirmationModal | `shared/DeleteConfirmationModal.tsx` | Modal | `{ isOpen, onClose, onConfirm, title?, message? }` |
| NotificationsDropdown | `shared/NotificationsDropdown.tsx` | Navigation | `{ userId? }` — bell icon with real-time notifications |
| RatingGoalCard | `shared/RatingGoalCard.tsx` | Display/Form | `{ goal, onRatingChange, submitting?, viewMode?, variant? }` — 5-star system |

### Shared Data Files

- **`shared/types.ts`** — 20+ TypeScript interfaces: `Goal`, `User`, `Rating`, `GoalWithRating`, `GoalWithRatingExtended`, `GoalStats`, `DashboardStats`, `FormData`, etc.
- **`shared/constants.ts`** — `CATEGORIES`, `DEPARTMENTS`, `PRIORITIES`, `GOAL_TEMPLATES` (18), `RATING_LABELS`, `RATING_DESCRIPTIONS`, `DESIGNATIONS` (40+), `JOB_CATEGORIES`, `EVENT_CATEGORIES`, `TOASTMASTER_ROLES`, `HEARTS_TALK_ROLES`, `EVENT_STATUS_OPTIONS`, `THEME_COLORS`

---

## AI Components (`app/components/ai/`)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| AIGoalSuggestions | `ai/AIGoalSuggestions.tsx` | `{ onSelectGoal?, className?, autoGenerate?, showTriggerButton? }` | Personalized AI goal generation |
| AIGoalRiskAnalysis | `ai/AIGoalRiskAnalysis.tsx` | `{ goalId, className? }` | Risk assessment with completion probability |
| AIPerformanceInsights | `ai/AIPerformanceInsights.tsx` | `{ userId?, autoLoad?, className? }` | Categorized insights (success/warning/risk/opportunity) |
| AIWritingAssistant | `ai/AIWritingAssistant.tsx` | `{ text, type, onImprove, className? }` | Tone-aware text improvement |

---

## Event Components (`app/components/events/`)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| EventDetailsModal | `events/EventDetailsModal.tsx` | `{ isOpen, event, onClose }` | Event detail view |
| EventFormModal | `events/EventFormModal.tsx` | `{ isOpen, onClose, onSubmit, initialData?, isLoading? }` | Create/edit events |
| EventsTable | `events/EventsTable.tsx` | `{ events, onEdit, onDelete, onView, onBulkDelete?, isLoading? }` | Event table with selection |
| EventParticipationCard | `events/EventParticipationCard.tsx` | `{ participation, onUpdateStatus, onUpdateRole?, onAddFeedback, isLoading? }` | Participation management |
| FeedbackModal | `events/FeedbackModal.tsx` | `{ isOpen, onClose, onSubmit, initialData?, isLoading? }` | Hours + feedback form |

---

## Goal Sub-components (`app/components/goals/`)

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| GoalActivityTimeline | `goals/GoalActivityTimeline.tsx` | `{ activities: ActivityEvent[] }` | Vertical timeline of goal events |
| GoalProgressTracker | `goals/GoalProgressTracker.tsx` | `{ goalId, currentProgress, currentStatus, onProgressUpdate, isEmployee }` | Progress slider + status selector |

---

## Animation Helpers (`app/components/animations/`)

| Export | Description |
|--------|-------------|
| `MotionDiv` | Pre-wrapped `motion.div` |
| `container` | Stagger animation variant (staggerChildren: 0.1) |
| `item` | Fade-up variant (opacity:0/y:20 -> opacity:1/y:0) |

---

## Landing Page Components

| Component | File | Description |
|-----------|------|-------------|
| Header | `components/Header.tsx` | Fixed header with scroll detection, mobile menu, theme toggle |
| Footer | `components/Footer.tsx` | Links grid, social icons, status indicator |
| Features | `components/features.tsx` | 6 feature cards grid with icons/stats |
| AzureIntegration | `components/azure.tsx` | Azure AD integration showcase with animation |
| LoadingComponent | `components/LoadingPage.tsx` | Orbital spinner with animated dots |
| ProgressUpdateForm | `components/ProgressUpdateForm.tsx` | Simple progress + notes form |

---

## DashboardLayout (`app/components/layout/DashboardLayout.tsx`)

The shared layout wrapping all dashboard pages.

**Props:** `{ children, type: 'employee' | 'manager' | 'admin' }`

**Features:**
- Sidebar navigation with role-based items
- Header with user menu, portal switching, notifications dropdown
- Mobile drawer for responsive navigation
- Theme toggle integration
- Uses `hasAccess()` for nav item visibility

---

## Page-Specific Components

### Admin
- `AdminGoalsTable` — Bulk selection/delete for admin goal management
- `UserTable` — Inline role/status/manager editing
- `ManagerSelector` — Searchable manager dropdown
- `StatsCard` — Small stat card with progress bar
- `ReviewCycleForm` — Review cycle CRUD form
- `ReviewCycleTable` — Sortable review cycle table
- `ImportExcelModal` — Excel file upload/parse for bulk import

### Analytics
- `AnalyticsCharts` — Recharts bar/pie/line charts
- `ChartCard` — Animated chart wrapper
- `PerformanceTable` — Employee performance ranking

### Employee
- `GoalsSection` — Employee dashboard goals tab
- `GoalsList` — Employee goal creation list view

### Manager
- `GoalsGrid` — Manager dashboard goal cards
- `GoalsSection` — Manager dashboard goals section
- `CreateGoalModal` — Wraps GoalFormModal with manager logic
- `GoalList` — Wraps GoalsTable + Pagination

---

## Custom Hooks

| Hook | File | Returns | Description |
|------|------|---------|-------------|
| `useTheme()` | `app/providers.tsx` | `{ theme, resolvedTheme, setTheme }` | Light/dark/system theme switching |
| `useSettings()` | `app/providers.tsx` | `{ settings, loading }` | App name and configuration |
| `useAnalyticsData()` | `app/hooks/useAnalyticsData.ts` | `{ analyticsData, loading, error, filters, actions }` | Analytics with filters, auto-retry, debounce |
| `useRoleAccess()` | `app/hooks/useRoleAccess.ts` | `{ isLoading, role, hasAccess, navItems }` | Route authorization, auto-redirect |
| `useTableSelection()` | `ui/table-primitives.tsx` | `{ selectedIds, toggleSelect, toggleSelectAll, clearSelection }` | Multi-row table selection |
| `useSorting()` | `ui/table-primitives.tsx` | `{ sorted, sortKey, sortDir, handleSort }` | Client-side table sorting |
| `useChart()` | `ui/chart.tsx` | Chart context | Recharts config within ChartContainer |

---

## Utility Modules

| Module | File | Key Exports |
|--------|------|-------------|
| Badge Configs | `app/utils/badgeConfigs.ts` | `getStatusConfig()`, `getPriorityConfig()`, `getDepartmentConfig()` |
| Goal Helpers | `app/utils/goalHelpers.ts` | `isSelfCreatedGoal()`, `isOwnGoal()`, `isAssignedByUser()`, `formatStatus()` |
| PDF Generator | `app/utils/pdfGenerator.ts` | `generatePDFReport(data, title)` |
| Role Access | `app/utils/roleAccess.ts` | `hasAccess()`, `getDefaultRedirectPath()`, `getNavItemsByRole()` |
| Class Merger | `app/lib/utils.ts` | `cn()` — clsx + tailwind-merge |
| Manager Styles | `dashboard/manager/utils.ts` | `STATUS_STYLES`, `getStatusStyle()` |

---

## Application Routes (19 pages)

| Route | Dashboard Type | Key Feature |
|-------|---------------|-------------|
| `/` | Landing | Marketing page with features showcase |
| `/login` | Auth | Azure AD SSO + credentials login |
| `/error` | Error | Auth error display |
| `/dashboard` | Redirect | Role-based redirect |
| `/dashboard/admin` | Admin | System control panel with stats |
| `/dashboard/admin/users` | Admin | People directory with inline editing |
| `/dashboard/admin/all-goals` | Admin | Goals explorer with filters |
| `/dashboard/admin/events` | Admin | Events hub with CRUD |
| `/dashboard/admin/review-cycles` | Admin | Review cycle management |
| `/dashboard/manager` | Manager | Team command center |
| `/dashboard/manager/goals/setgoals` | Manager | Goal assignment for team |
| `/dashboard/manager/goals/approve-goals` | Manager | Decision panel for approvals |
| `/dashboard/manager/rate-employees` | Manager | Evaluation studio |
| `/dashboard/employee` | Employee | Personal goals dashboard |
| `/dashboard/employee/goals/create` | Employee | My goals management |
| `/dashboard/employee/self-rating` | Employee | Self-assessment |
| `/dashboard/employee/events` | Employee | My event participations |
| `/dashboard/employee/events/browse` | Employee | Discover events |
| `/dashboard/analytics` | Shared | Role-scoped analytics |
