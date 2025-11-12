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

# Generate Prisma Client (cached if schema doesn't change)
RUN npx prisma generate

# Copy source code (this layer will be invalidated when code changes)
COPY . .

# Run migrations if DATABASE_URL is available (Railway provides it during build)
# This ensures schema is synced before Next.js build tries to use Prisma
RUN if [ -n "$DATABASE_URL" ]; then \
      echo "DATABASE_URL is available, running migrations before build..." && \
      npx prisma db push --accept-data-loss --skip-generate || \
      echo "Migration failed, but continuing build (migrations will run at startup)"; \
    else \
      echo "DATABASE_URL not available during build, skipping migrations (will run at startup)"; \
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
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'if [ -n "$DATABASE_URL" ]; then' >> /app/start.sh && \
    echo '  echo "=== Running database migrations ==="' >> /app/start.sh && \
    echo '  export PATH="/app/node_modules/.bin:$PATH"' >> /app/start.sh && \
    echo '  cd /app' >> /app/start.sh && \
    echo '  echo "Current directory: $(pwd)"' >> /app/start.sh && \
    echo '  echo "Prisma schema location: $(ls -la prisma/schema.prisma 2>&1 || echo \"NOT FOUND\")"' >> /app/start.sh && \
    echo '  echo "Step 1: Generating Prisma Client..."' >> /app/start.sh && \
    echo '  npx prisma generate 2>&1 || echo "Prisma generate failed, continuing..."' >> /app/start.sh && \
    echo '  echo "Step 2: Running SQL fix for missing companyName column..."' >> /app/start.sh && \
    echo '  if [ -f /app/scripts/fix-company-name-column.sql ]; then' >> /app/start.sh && \
    echo '    cat /app/scripts/fix-company-name-column.sql | npx prisma db execute --stdin --schema /app/prisma/schema.prisma 2>&1 && echo "SQL fix executed successfully" || echo "SQL fix failed, trying db push..."' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo '  echo "Step 2b: Synchronizing database schema with db push..."' >> /app/start.sh && \
    echo '  npx prisma db push --accept-data-loss --skip-generate 2>&1 && echo "Database push succeeded" || echo "Database push failed, but continuing..."' >> /app/start.sh && \
    echo '  echo "Step 3: Applying pending migrations (if any)..."' >> /app/start.sh && \
    echo '  npx prisma migrate deploy 2>&1 && echo "Migrations deploy succeeded" || echo "No pending migrations or migrate deploy failed, but continuing..."' >> /app/start.sh && \
    echo '  echo "Step 4: Running user organization migration..."' >> /app/start.sh && \
    echo '  if command -v tsx >/dev/null 2>&1; then' >> /app/start.sh && \
    echo '    npx tsx scripts/migrate-users-to-organization.ts 2>&1 || echo "User migration failed, continuing..."' >> /app/start.sh && \
    echo '  else' >> /app/start.sh && \
    echo '    echo "tsx not available, skipping user migration script (users will be assigned on first registration)"' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo '  echo "=== Migrations completed ==="' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
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

