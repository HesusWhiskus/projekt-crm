#!/bin/bash
# Script to run tests in Railway environment
cd /app
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:miDmaWxAovDwZxSkXPabjErKYPosfTyk@postgres.railway.internal:5432/railway}"
npx vitest run src/__tests__/security --config vitest.config.ts













