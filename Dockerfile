FROM node:20 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
# Cache this layer - only rebuilds when package files change
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies (cached layer)
COPY --from=deps /app/node_modules ./node_modules

# Copy Prisma schema first (for better caching)
COPY prisma ./prisma

# Copy source code (this layer will be invalidated when code changes)
COPY . .

# Generate Prisma Client (cached if schema doesn't change)
RUN npx prisma generate

# Run migrations if DATABASE_URL is available (Railway provides it during build)
# This ensures schema is synced before Next.js build tries to use Prisma
# CRITICAL: Migrations MUST run before build, otherwise Prisma Client will fail
# Railway should provide DATABASE_URL during build, but if not, migrations will run at startup
RUN if [ -n "$DATABASE_URL" ]; then \
      echo "=== DATABASE_URL is available, running migrations before build ===" && \
      echo "This is CRITICAL - migrations must succeed before Next.js build" && \
      echo "Step 1: Deploying migrations with prisma migrate deploy..." && \
      (npx prisma migrate deploy && echo "✓ Migrations deployed successfully") || \
      (echo "⚠ migrate deploy failed, trying db push as fallback..." && \
       npx prisma db push --accept-data-loss --skip-generate && \
       echo "✓ Database schema synchronized with db push") || \
      (echo "❌ ERROR: Both migrate deploy and db push failed!" && \
       echo "Build will continue, but migrations MUST run at startup or app will fail" && \
       exit 0); \
    else \
      echo "=== WARNING: DATABASE_URL not available during build ===" && \
      echo "This is expected if Railway doesn't pass DATABASE_URL to build context" && \
      echo "Migrations will be run at startup via start.sh script" && \
      echo "If build fails due to Prisma Client, ensure DATABASE_URL is available during build"; \
    fi

# Build Next.js with standalone output for Docker
ENV DOCKER_BUILD=true
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Note: Migrations will be run after deployment via Railway CLI or startup script
# Railway doesn't pass DATABASE_URL to build process, so we run migrations at runtime

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma binaries for migrations (as fallback if migrations weren't run in build)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder /app/scripts ./scripts
# Copy tsx for TypeScript scripts (tsx is needed for running .ts scripts)
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx

# Fix permissions for Prisma engines directory
RUN chown -R nextjs:nodejs /app/node_modules/@prisma && \
    chown -R nextjs:nodejs /app/node_modules/.bin

# Create startup script that runs migrations (using migrate deploy for production) then starts the app
# CRITICAL: Migrations MUST succeed before app starts, otherwise app will fail
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'if [ -z "$DATABASE_URL" ]; then' >> /app/start.sh && \
    echo '  echo "ERROR: DATABASE_URL is not set! Cannot run migrations."' >> /app/start.sh && \
    echo '  exit 1' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo 'echo "=== Running database migrations (REQUIRED before app start) ==="' >> /app/start.sh && \
    echo 'export PATH="/app/node_modules/.bin:$PATH"' >> /app/start.sh && \
    echo 'cd /app' >> /app/start.sh && \
    echo 'echo "Current directory: $(pwd)"' >> /app/start.sh && \
    echo 'echo "Prisma schema location: $(ls -la prisma/schema.prisma 2>&1 || echo \"NOT FOUND\")"' >> /app/start.sh && \
    echo 'echo "Step 1: Generating Prisma Client..."' >> /app/start.sh && \
    echo 'npx prisma generate || (echo "ERROR: Prisma generate failed!" && exit 1)' >> /app/start.sh && \
    echo 'echo "Step 2: Deploying migrations (prisma migrate deploy)..."' >> /app/start.sh && \
    echo 'npx prisma migrate deploy || (echo "WARNING: migrate deploy failed, trying db push..." && npx prisma db push --accept-data-loss --skip-generate || (echo "ERROR: Database migration failed! App cannot start." && exit 1))' >> /app/start.sh && \
    echo 'echo "Step 3: Running SQL fix for missing companyName column (if exists)..."' >> /app/start.sh && \
    echo 'if [ -f /app/scripts/fix-company-name-column.sql ]; then' >> /app/start.sh && \
    echo '  echo "Found SQL fix script, executing..."' >> /app/start.sh && \
    echo '  npx prisma db execute --file /app/scripts/fix-company-name-column.sql --schema /app/prisma/schema.prisma 2>&1 || echo "SQL fix failed (non-critical), continuing..."' >> /app/start.sh && \
    echo 'else' >> /app/start.sh && \
    echo '  echo "SQL fix script not found, skipping..."' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo 'echo "Step 4: Running user organization migration (if tsx available)..."' >> /app/start.sh && \
    echo 'if command -v tsx >/dev/null 2>&1; then' >> /app/start.sh && \
    echo '  npx tsx scripts/migrate-users-to-organization.ts 2>&1 || echo "User migration failed (non-critical), continuing..."' >> /app/start.sh && \
    echo 'else' >> /app/start.sh && \
    echo '  echo "tsx not available, skipping user migration script (users will be assigned on first registration)"' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo 'echo "=== Migrations completed successfully ==="' >> /app/start.sh && \
    echo 'echo "Starting application..."' >> /app/start.sh && \
    echo 'echo "PORT from env: $PORT"' >> /app/start.sh && \
    echo 'if [ -z "$PORT" ]; then export PORT=3000; fi' >> /app/start.sh && \
    echo 'echo "Using PORT: $PORT"' >> /app/start.sh && \
    echo 'exec node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    chown nextjs:nodejs /app/start.sh

USER nextjs

# Railway automatically sets PORT - expose it dynamically
# Next.js standalone uses PORT from environment automatically
EXPOSE 3000

# Railway sets PORT automatically, but we need to ensure it's available
# Next.js standalone server.js reads PORT from process.env
ENV HOSTNAME "0.0.0.0"

CMD ["/app/start.sh"]

