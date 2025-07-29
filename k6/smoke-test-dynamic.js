import http from 'k6/http';
import { check } from 'k6';

// Environment-based configuration
const isProduction = __ENV.ENVIRONMENT === 'production';
const isPublicAPI = (__ENV.BASE_URL || 'https://httpbin.org').includes('httpbin.org');

// Dynamic thresholds based on environment
const getThresholds = () => {
  if (isPublicAPI) {
    // Relaxed thresholds for public testing APIs
    return {
      http_req_duration: ['p(95)<15000'], // 15s for public APIs
      http_req_failed: ['rate<0.10'],     // 10% error rate acceptable
    };
  } else if (isProduction) {
    // Strict thresholds for production
    return {
      http_req_duration: ['p(95)<2000'],  // 2s for production
      http_req_failed: ['rate<0.01'],     // 1% error rate
    };
  } else {
    // Medium thresholds for staging/test environments
    return {
      http_req_duration: ['p(95)<5000'],  // 5s for staging
      http_req_failed: ['rate<0.05'],     // 5% error rate
    };
  }
};

export let options = {
  vus: 1,
  duration: '30s',
  thresholds: getThresholds(),
};

const BASE_URL = __ENV.BASE_URL || 'https://httpbin.org';

export default function() {
  // Quick smoke test - just verify the system is working
  let response = http.get(`${BASE_URL}/get`);
  
  // Dynamic response time check based on environment
  const maxResponseTime = isPublicAPI ? 15000 : (isProduction ? 2000 : 5000);
  
  check(response, {
    'smoke test - status is 200': (r) => r.status === 200,
    'smoke test - response time OK': (r) => r.timings.duration < maxResponseTime,
  });
}
