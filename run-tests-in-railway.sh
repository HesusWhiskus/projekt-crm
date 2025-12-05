#!/bin/bash
cd /app
export DATABASE_URL="postgresql://postgres:miDmaWxAovDwZxSkXPabjErKYPosfTyk@postgres.railway.internal:5432/railway"

if [ ! -d "src/__tests__/security" ]; then
  echo "ERROR: Test files not found in Railway"
  echo "You need to deploy the code first with: git push"
  exit 1
fi

echo "Installing test dependencies..."
npm install vitest @vitest/ui @vitest/coverage-v8 @vitejs/plugin-react --save-dev --legacy-peer-deps 2>&1 | tail -5

echo "Running security tests..."
npx vitest run src/__tests__/security --config vitest.config.ts 2>&1 | tail -60









