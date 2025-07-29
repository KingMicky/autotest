import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '10s', target: 10 },  // Normal load
    { duration: '1m', target: 10 },   // Stay at normal load
    { duration: '20s', target: 50 },  // Spike to 50 users
    { duration: '3m', target: 50 },   // Stay at spike
    { duration: '20s', target: 10 },  // Scale down to normal
    { duration: '3m', target: 10 },   // Recovery at normal load
    { duration: '10s', target: 0 },   // Ramp down to zero
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],  // 95% of requests must complete below 800ms
    http_req_failed: ['rate<0.02'],    // Error rate must be below 2%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://httpbin.org';

export default function() {
  let response = http.get(`${BASE_URL}/get`);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'spike test response time': (r) => r.timings.duration < 1000,
  });

  sleep(Math.random() * 2); // Random sleep between 0-2 seconds
}
