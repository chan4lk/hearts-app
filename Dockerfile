# syntax=docker.io/docker/dockerfile:1

FROM node:20-slim AS base

# 1. Install dependencies only when needed
FROM base AS deps

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 2. Rebuild the source code only when needed
FROM base AS builder
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy environment file and generate Prisma client
COPY .env .env

# Set required environment variables for build
ENV NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=your-secret-key

# Generate Prisma client and build the application
RUN npm run prisma:generate && \
    npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=your-secret-key

RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]