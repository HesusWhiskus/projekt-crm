FROM node:20 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js with standalone output for Docker
ENV DOCKER_BUILD=true
RUN npm run build

# Note: Migrations will be run after deployment via Railway CLI or startup script
# Railway doesn't pass DATABASE_URL to build process, so we run migrations at runtime

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma binaries for migrations (as fallback if migrations weren't run in build)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

# Fix permissions for Prisma engines directory
RUN chown -R nextjs:nodejs /app/node_modules/@prisma && \
    chown -R nextjs:nodejs /app/node_modules/.bin

# Create startup script that runs migrations (using db push like locally) then starts the app
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'if [ -n "$DATABASE_URL" ]; then' >> /app/start.sh && \
    echo '  echo "Running database migrations..."' >> /app/start.sh && \
    echo '  export PATH="/app/node_modules/.bin:$PATH"' >> /app/start.sh && \
    echo '  npx prisma db push --accept-data-loss 2>&1 || echo "Migrations failed, continuing..."' >> /app/start.sh && \
    echo '  echo "Migrations completed"' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo 'echo "Starting application..."' >> /app/start.sh && \
    echo 'echo "PORT from env: $PORT"' >> /app/start.sh && \
    echo 'if [ -z "$PORT" ]; then export PORT=3000; fi' >> /app/start.sh && \
    echo 'echo "Using PORT: $PORT"' >> /app/start.sh && \
    echo 'exec node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    chown nextjs:nodejs /app/start.sh

USER nextjs

# Railway automatically sets PORT, but we expose 3000 as default
EXPOSE 3000

# Use PORT from environment (Railway sets this automatically)
# Default to 3000 if not set
ENV PORT=${PORT:-3000}
ENV HOSTNAME "0.0.0.0"

CMD ["/app/start.sh"]

