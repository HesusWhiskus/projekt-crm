/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * Pagination metadata returned in API responses
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

/**
 * Helper function to calculate pagination values
 */
export function calculatePagination(page?: number, limit?: number, defaultLimit: number = 50) {
  const validPage = page && page > 0 ? page : 1
  const validLimit = limit && limit > 0 && limit <= 100 ? limit : defaultLimit // Max 100 items per page
  const skip = (validPage - 1) * validLimit

  return {
    page: validPage,
    limit: validLimit,
    skip,
  }
}

