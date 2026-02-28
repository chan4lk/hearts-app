# Bistec AspireHub - Deployment Guide

**Generated:** 2026-02-28

## Deployment Architecture

```
GitHub (develop branch)
    │ push trigger
    ▼
GitHub Actions
    │
    ├── Build Docker image
    ├── Push to GHCR (ghcr.io)
    │
    ├── Azure Login (OIDC)
    └── Deploy to Azure App Service
         │
         ├── Docker container (Node.js 20)
         │   └── Next.js standalone (server.js)
         │
         └── Azure PostgreSQL (Flexible Server)
```

## Docker Build

### Multi-Stage Dockerfile

The application uses a 4-stage Docker build:

| Stage | Base Image | Purpose |
|---|---|---|
| `base` | node:20-slim | Shared base with openssl |
| `deps` | base | Install npm dependencies + Prisma generate |
| `builder` | base | Build Next.js application |
| `runner` | base | Production-optimized runtime |

### Build Locally

```bash
# Build Docker image
docker build -t hearts-app:local .

# Run locally
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret" \
  hearts-app:local
```

### Key Docker Features
- **Standalone output** (`next.config.js: output: 'standalone'`) for minimal image
- **Non-root user** (`nextjs:nodejs`) for security
- **Multi-stage build** reduces final image size
- **OpenSSL** included for Prisma PostgreSQL support

## CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/azure-appservice.yml`
**Trigger:** Push to `develop` branch

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Create `.env` from GitHub Secrets
4. Login to GitHub Container Registry (GHCR)
5. Build Docker image (tagged with commit SHA)
6. Push image to GHCR
7. Azure Login (OIDC - federated credentials)
8. Deploy to Azure Web App via Docker image

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Production URL |
| `NEXTAUTH_SECRET` | Auth secret key |
| `NEXTAUTH_DOMAIN` | Auth domain |
| `AZURE_CLIENT_ID` | Azure AD app client ID |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `AZURE_WEBAPP_NAME` | Azure App Service name |

## Azure Infrastructure (Pulumi)

### Prerequisites
- Pulumi CLI installed
- Azure CLI logged in (`az login`)
- Node.js and npm

### Setup

```bash
cd infra
npm install
pulumi login
pulumi stack init dev
```

### Configure Stack

```bash
pulumi config set azure:location southeastasia
pulumi config set dbAdminUser pgadmin
pulumi config set dbAdminPassword <password> --secret
```

### Deploy

```bash
# Preview changes
pulumi preview

# Apply infrastructure
pulumi up

# Destroy (when needed)
pulumi destroy
```

### Provisioned Resources

| Resource | Type | Configuration |
|---|---|---|
| Resource Group | `rg-hearts-app` | Southeast Asia |
| App Service Plan | Linux | Basic B1 tier |
| Web App | Docker container | Node.js 18 LTS, HTTPS only |
| PostgreSQL Server | Flexible Server | Standard_B1ms, 32GB storage |
| Firewall Rule | PostgreSQL | Allow Azure services |

### Outputs
- `endpoint` - HTTPS URL to the web application
- `dbConnectionString` - PostgreSQL connection string

## Database Migration (Production)

### Using Docker Compose

```bash
# Run migrations against Azure PostgreSQL
docker compose -f docker-compose.migration.yml up
```

This uses the `docker-compose.migration.yml` to run:
1. `npm install`
2. `npx prisma migrate deploy`

### Manual Migration

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Deploy migrations (non-interactive)
npx prisma migrate deploy
```

## Local Docker Development

### Start Full Stack

```bash
# Start database
docker compose up -d

# Start application
npm run dev
```

### Docker Compose Services

| Service | Port | Purpose |
|---|---|---|
| `postgres` | 5434 → 5432 | PostgreSQL 15 database |
| `pgadmin` | 5050 → 80 | pgAdmin web interface |

### pgAdmin Access
- URL: http://localhost:5050
- Email: admin@example.com
- Password: admin
- Server: postgres:5432 (internal network)

## Environment Configuration

### Required Variables

| Variable | Example | Required In |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5434/performance_management` | All |
| `NEXTAUTH_URL` | `https://yourapp.azurewebsites.net` | All |
| `NEXTAUTH_SECRET` | (random 32-byte base64) | All |
| `AZURE_AD_CLIENT_ID` | (UUID) | Production |
| `AZURE_AD_CLIENT_SECRET` | (secret) | Production |
| `AZURE_AD_TENANT_ID` | (UUID) | Production |

### Optional Variables

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | AI features |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Azure monitoring |
| `NEXTAUTH_DOMAIN` | Auth domain restriction |

## Health Monitoring

- **Health Endpoint:** `GET /api/health` → `{ status: "ok" }`
- **Application Insights:** Azure APM (if configured)
- **Logging:** Sanitized server-side logging with severity levels
