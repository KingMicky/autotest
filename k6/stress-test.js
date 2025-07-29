import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 20 },   // Ramp up to 20 users
    { duration: '5m', target: 20 },   // Stay at 20 users
    { duration: '2m', target: 30 },   // Ramp up to 30 users
    { duration: '5m', target: 30 },   // Stay at 30 users
    { duration: '2m', target: 40 },   // Ramp up to 40 users
    { duration: '5m', target: 40 },   // Stay at 40 users
    { duration: '10m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://httpbin.org';

export default function() {
  let response = http.get(`${BASE_URL}/get`);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time under stress': (r) => r.timings.duration < 2000,
  });

  // Simulate heavier load with multiple requests
  http.batch([
    ['GET', `${BASE_URL}/get?id=1`],
    ['GET', `${BASE_URL}/get?id=2`],
    ['GET', `${BASE_URL}/get?id=3`],
  ]);

  sleep(1);
}
