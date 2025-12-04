import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const responseTime = new Trend('response_time')

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },     // Stay at 20 users
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1000ms
    http_req_failed: ['rate<0.01'], // Error rate < 1%
    http_reqs: ['rate>100'], // Throughput > 100 req/s
    errors: ['rate<0.01'], // Custom error rate < 1%
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// Note: In real tests, you'd need to authenticate first
// This is a placeholder structure

export default function () {
  // Test GET /api/clients
  const clientsResponse = http.get(`${BASE_URL}/api/clients`, {
    headers: {
      'Content-Type': 'application/json',
      // Add auth headers if needed
    },
  })

  check(clientsResponse, {
    'clients status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'clients response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1)

  responseTime.add(clientsResponse.timings.duration)

  sleep(1)

  // Test GET /api/tasks
  const tasksResponse = http.get(`${BASE_URL}/api/tasks`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  check(tasksResponse, {
    'tasks status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'tasks response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1)

  responseTime.add(tasksResponse.timings.duration)

  sleep(1)

  // Test GET /api/contacts
  const contactsResponse = http.get(`${BASE_URL}/api/contacts`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  check(contactsResponse, {
    'contacts status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'contacts response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1)

  responseTime.add(contactsResponse.timings.duration)

  sleep(1)
}








