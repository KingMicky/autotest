import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://httpbin.org';

export default function() {
  // Quick smoke test - just verify the system is working
  let response = http.get(`${BASE_URL}/get`);
  
  check(response, {
    'smoke test - status is 200': (r) => r.status === 200,
    'smoke test - response time OK': (r) => r.timings.duration < 2000,
  });
}
