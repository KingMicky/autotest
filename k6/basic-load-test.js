import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export let options = {
  stages: [
    { duration: '1m', target: 5 },   // Ramp up to 5 users
    { duration: '3m', target: 10 },  // Stay at 10 users
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
    errors: ['rate<0.01'],            // Custom error rate
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'https://httpbin.org';

export default function() {
  // Debug: Log the BASE_URL being used
  if (__ITER == 0) {
    console.log(`Testing against: ${BASE_URL}`);
  }
  
  // Test homepage
  let response = http.get(`${BASE_URL}/get`);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'content type is json': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    'response body exists': (r) => r.body && r.body.length > 0,
  }) || errorRate.add(1);

  // Test with query parameters
  response = http.get(`${BASE_URL}/get?test=k6&user=${__VU}`);
  
  check(response, {
    'query params work': (r) => r.status === 200,
    'query response has content': (r) => r.body && r.body.length > 0,
  }) || errorRate.add(1);

  // Test POST request
  const payload = JSON.stringify({
    name: `user-${__VU}`,
    timestamp: new Date().toISOString(),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  response = http.post(`${BASE_URL}/post`, payload, params);
  
  // Debug: Log response details if there are issues
  if (response.status !== 200) {
    console.log(`POST request failed. Status: ${response.status}, Body: ${response.body.substring(0, 200)}`);
  }
  
  check(response, {
    'POST status is 200': (r) => r.status === 200,
    'POST response contains data': (r) => {
      try {
        // Check if response is JSON and contains expected data
        if (r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json')) {
          const responseData = r.json();
          return responseData && responseData.json && responseData.json.name && responseData.json.name.includes('user-');
        }
        return false;
      } catch (e) {
        console.error('Error parsing JSON response:', e.message);
        console.log('Response status:', r.status);
        console.log('Content-Type:', r.headers['Content-Type']);
        console.log('Response body (first 200 chars):', r.body.substring(0, 200));
        return false;
      }
    },
    'POST content type is json': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
  }) || errorRate.add(1);

  // Simulate user think time
  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/k6-summary.html': htmlReport(data),
    'reports/k6-summary.json': JSON.stringify(data),
  };
}

function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>K6 Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; border-left: 4px solid #007acc; background: #f5f5f5; }
        .pass { border-left-color: #28a745; }
        .fail { border-left-color: #dc3545; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>K6 Performance Test Report</h1>
    <h2>Test Summary</h2>
    <div class="metric">
        <strong>Test Duration:</strong> ${data.state.testRunDurationMs / 1000}s
    </div>
    <div class="metric">
        <strong>Virtual Users:</strong> ${data.options.stages ? 'Variable' : data.options.vus || 1}
    </div>
    
    <h2>Key Metrics</h2>
    <table>
        <tr><th>Metric</th><th>Value</th><th>Threshold</th><th>Status</th></tr>
        <tr>
            <td>HTTP Request Duration (95th percentile)</td>
            <td>${data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2)}ms</td>
            <td>&lt; 500ms</td>
            <td class="${data.metrics.http_req_duration?.values?.['p(95)'] < 500 ? 'pass' : 'fail'}">
                ${data.metrics.http_req_duration?.values?.['p(95)'] < 500 ? 'PASS' : 'FAIL'}
            </td>
        </tr>
        <tr>
            <td>HTTP Request Failure Rate</td>
            <td>${(data.metrics.http_req_failed?.values?.rate * 100)?.toFixed(2)}%</td>
            <td>&lt; 1%</td>
            <td class="${data.metrics.http_req_failed?.values?.rate < 0.01 ? 'pass' : 'fail'}">
                ${data.metrics.http_req_failed?.values?.rate < 0.01 ? 'PASS' : 'FAIL'}
            </td>
        </tr>
        <tr>
            <td>Total Requests</td>
            <td>${data.metrics.http_reqs?.values?.count}</td>
            <td>-</td>
            <td>-</td>
        </tr>
        <tr>
            <td>Requests per Second</td>
            <td>${data.metrics.http_reqs?.values?.rate?.toFixed(2)}</td>
            <td>-</td>
            <td>-</td>
        </tr>
    </table>
    
    <h2>Detailed Metrics</h2>
    <pre>${JSON.stringify(data.metrics, null, 2)}</pre>
</body>
</html>`;
}
