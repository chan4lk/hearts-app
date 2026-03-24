# Bistec AspireHub — Project Standards

## Tech Stack
- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (Azure AD + Credentials)
- **UI:** TailwindCSS, Radix UI, Framer Motion, Recharts
- **AI:** OpenAI (gpt-4o-mini)
- **Testing:** Vitest
- **Monitoring:** Azure Application Insights (optional)

## Design System
All UI must use the semantic token system defined in `app/globals.css`.

### Colors — NEVER hardcode Tailwind colors
```
✓ bg-accent, text-accent, bg-accent-muted
✓ text-success, bg-success-muted, text-error, bg-error-muted
✓ text-warning, bg-warning-muted, text-info, bg-info-muted
✓ bg-surface-primary, bg-surface-secondary, bg-surface-elevated
✓ text-primary, text-secondary, text-tertiary
✓ border-theme, shadow-theme-sm/md/lg/xl

✗ bg-indigo-600, text-red-500, bg-emerald-50
✗ text-white (use text-[rgb(var(--color-text-inverse))])
✗ shadow-2xl (use shadow-theme-lg)
```

### Focus States
Use `.focus-ring` utility class on ALL interactive elements.
Never use `focus:ring-indigo-500` or similar inline focus patterns.

### Font Sizes
Use Tailwind scale only: `text-2xs`, `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, etc.
Never use `text-[13px]` or other pixel values.

### Forms & Modals
All forms use `FORM_STYLES` from `app/components/ui/form-primitives.tsx`.
All modals use `ModalShell` component.

### Status Badges
Use `getStatusConfig()` from `app/utils/badgeConfigs.ts`.
Never define inline status color configs.

## Architecture
- API routes use `getServerSession(authOptions)` for auth
- Input validation via Zod schemas in `lib/validation.ts`
- Notification messages sanitized via `sanitizeInput()` from `lib/securityUtils.ts`
- Session auth cached for 10s to reduce DB queries (`lib/auth.ts`)
- Rate limiting via `lib/rateLimit.ts` (in-memory, use Redis for production scale)

## Goal Status State Machine
```
DRAFT → PENDING → APPROVED → IN_PROGRESS → COMPLETED
                → REJECTED → DRAFT (revise)
                → MODIFIED → PENDING (resubmit)
                           → ON_HOLD / BLOCKED → IN_PROGRESS
```

## Commands
```bash
npm run dev          # Dev server (localhost:3000)
npm run build:clean  # Clean + production build
npm test             # Run Vitest
npm run test:watch   # Vitest watch mode
npm run lint         # ESLint
```

## Testing
Tests live in `__tests__/`. Run with `npm test`.
- `validation.test.ts` — Zod schema tests (29 cases)
- `security.test.ts` — XSS sanitization tests (6 cases)
