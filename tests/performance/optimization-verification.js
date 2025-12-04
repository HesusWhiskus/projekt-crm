import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend } from 'k6/metrics'

// Custom metrics for optimization verification
const paginationResponseTime = new Trend('pagination_response_time')
const listResponseTime = new Trend('list_response_time')

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    pagination_response_time: ['p(95)<200'], // Pagination should be fast
    list_response_time: ['p(95)<300'], // List endpoints should be fast
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export default function () {
  // Test pagination performance
  const paginatedResponse = http.get(`${BASE_URL}/api/clients?page=1&limit=50`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  check(paginatedResponse, {
    'pagination works correctly': (r) => {
      if (r.status === 200) {
        const body = JSON.parse(r.body)
        return body.pagination && body.data
      }
      return r.status === 401 // Unauthorized is acceptable
    },
    'pagination response time < 200ms': (r) => r.timings.duration < 200,
  })

  paginationResponseTime.add(paginatedResponse.timings.duration)

  sleep(1)

  // Test list endpoint performance (should use pagination)
  const listResponse = http.get(`${BASE_URL}/api/tasks?page=1&limit=20`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  check(listResponse, {
    'list endpoint works correctly': (r) => r.status === 200 || r.status === 401,
    'list response time < 300ms': (r) => r.timings.duration < 300,
  })

  listResponseTime.add(listResponse.timings.duration)

  sleep(1)

  // Test search endpoint performance
  const searchResponse = http.get(`${BASE_URL}/api/clients/search?search=test`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  check(searchResponse, {
    'search endpoint works correctly': (r) => r.status === 200 || r.status === 401,
    'search response time < 400ms': (r) => r.timings.duration < 400,
  })

  sleep(1)
}








