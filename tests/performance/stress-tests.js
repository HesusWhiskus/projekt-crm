import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users (stress test)
    { duration: '2m', target: 200 },   // Spike to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // More lenient for stress test
    http_req_failed: ['rate<0.05'], // Allow up to 5% errors under stress
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export default function () {
  // Stress test: Multiple concurrent requests
  const endpoints = [
    '/api/clients',
    '/api/tasks',
    '/api/contacts',
    '/api/clients/search?search=test',
  ]

  endpoints.forEach((endpoint) => {
    const response = http.get(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    check(response, {
      [`${endpoint} status is acceptable`]: (r) => 
        r.status === 200 || r.status === 401 || r.status === 429,
    })

    sleep(0.5)
  })
}







