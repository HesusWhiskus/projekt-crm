// This file has been refactored to use DDD architecture
// New implementation is in src/presentation/api/clients/[id]/route.ts
// This file is kept for backward compatibility but delegates to the new implementation

export { GET, PATCH, DELETE } from "@/presentation/api/clients/[id]/route"

