# Deployment Guide — Bistec AspireHub

## Docker Build

### Multi-Stage Dockerfile

The project uses a 3-stage Docker build for minimal production images:

1. **deps** — `node:20-slim` + OpenSSL, installs dependencies with Prisma schema
2. **builder** — Copies source, generates Prisma client, runs `npm run build`
3. **runner** — Production image with standalone Next.js output

```bash
# Build the image
docker build -t aspirehub .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e NEXTAUTH_SECRET=... \
  -e NEXTAUTH_URL=https://your-domain.com \
  aspirehub
```

**Key details:**
- Uses Next.js standalone output mode for minimal image size
- Runs as non-root `nextjs` user (UID 1001)
- Exposes port 3000
- Static files and public assets copied into standalone

## Local Development (Docker Compose)

```bash
docker-compose up -d
```

**Services:**
| Service | Image | Port | Credentials |
|---------|-------|------|-------------|
| postgres | PostgreSQL 15 | 5434:5432 | postgres / postgres |
| pgadmin | pgAdmin 4 | 5050:80 | admin@admin.com / admin |

**Database:** `performance_management`

## Azure Infrastructure (Pulumi IaC)

Infrastructure is defined in `infra/` using Pulumi with TypeScript.

### Resources Provisioned

| Resource | Type | Configuration |
|----------|------|---------------|
| Resource Group | `rg-hearts-app` | Southeast Asia region |
| App Service Plan | Linux | B1 tier, Node.js 18 LTS |
| PostgreSQL Flexible Server | Standard_B1ms | 32GB storage, 7-day backup, no geo-redundancy |
| Firewall Rule | Azure-internal | Allows 0.0.0.0 - 0.0.0.0 (Azure services) |

### Deployment

```bash
cd infra
npm install
pulumi up
```

**Outputs:**
- `endpoint` — HTTPS application URL
- `dbConnectionString` — PostgreSQL connection string

## Environment Variables (Production)

### Required
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Session encryption key (min 16 chars) |
| `NEXTAUTH_URL` | Application base URL (e.g., https://aspirehub.example.com) |
| `AZURE_AD_CLIENT_ID` | Azure AD application client ID |
| `AZURE_AD_CLIENT_SECRET` | Azure AD application client secret |
| `AZURE_AD_TENANT_ID` | Azure AD tenant ID |

### Optional
| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (required for AI features) |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Azure Application Insights |
| `JWT_SECRET` | JWT signing secret (falls back to NEXTAUTH_SECRET) |

## Database Migration (Production)

### Option 1: Docker Compose Migration Runner
```bash
docker-compose -f docker-compose.migration.yml up
```
Runs `npm install && npx prisma migrate deploy` against the production database.

### Option 2: Direct Migration
```bash
npx prisma migrate deploy
```

### Option 3: Event Migration Script
```bash
npm run db:migrate
```
Applies event management migrations via `$executeRawUnsafe`.

## Health Check

The application exposes a health endpoint:

```
GET /api/health
```

**Response (healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-25T14:00:00.000Z",
  "checks": {
    "database": {
      "status": "connected",
      "responseTime": 12
    }
  }
}
```

**Response (unhealthy):** HTTP 503 with database error details.

Use this endpoint for load balancer health checks and uptime monitoring.

## Monitoring

### Azure Application Insights (Optional)

Set `APPLICATIONINSIGHTS_CONNECTION_STRING` to enable:
- Request tracing with severity levels
- Exception tracking (always logged to console)
- Custom event tracking
- Metric collection (query performance, API latency)
- Dependency tracking

**PII Redaction:** The logger automatically redacts keys containing: password, token, secret, authorization, auth, cookie, session, userId, email, id.

### Performance Monitoring

Built-in performance tracking via `lib/performanceMonitor.ts`:
- Query metrics: duration tracking, slow query detection (>5s threshold)
- API metrics: endpoint latency, status code tracking
- Percentile reporting: p50, p95, p99
- `withPerformanceTracking()` HOF adds `X-Response-Time` headers

## Security Headers

Applied via `next.config.js` on all routes:

| Header | Value |
|--------|-------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| X-XSS-Protection | 1; mode=block |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), ... |

## Production Checklist

- [ ] Set all required environment variables
- [ ] Run database migrations (`npx prisma migrate deploy`)
- [ ] Verify health endpoint (`/api/health`)
- [ ] Configure Azure AD application (redirect URIs, permissions)
- [ ] Set NEXTAUTH_SECRET to a strong random value (min 16 chars)
- [ ] Configure OPENAI_API_KEY if AI features needed
- [ ] Set up Application Insights if monitoring needed
- [ ] Verify rate limiting is appropriate for expected traffic
- [ ] Consider Redis for rate limiting and session caching at scale
