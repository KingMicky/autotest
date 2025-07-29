# K6 Performance Testing

K6 is a modern load testing tool for developers and testers.

## Installation

K6 can be installed via:
- Windows: `choco install k6` or download from [k6.io](https://k6.io/docs/getting-started/installation/)
- macOS: `brew install k6`
- Linux: Use package manager or download binary

## Test Files

- `basic-load-test.js` - Basic load test with 10 virtual users
- `stress-test.js` - Stress test to find breaking point
- `spike-test.js` - Spike test for sudden traffic increases
- `api-test.js` - API endpoint testing
- `smoke-test.js` - Quick smoke test for CI/CD

## Running Tests

```bash
# Basic load test
k6 run basic-load-test.js

# With custom options
k6 run --vus 50 --duration 5m basic-load-test.js

# Output to InfluxDB
k6 run --out influxdb=http://localhost:8086/mydb basic-load-test.js
```

## Thresholds

Tests include performance thresholds:
- Response time < 500ms for 95% of requests
- Error rate < 1%
- Request rate > 100 req/s
