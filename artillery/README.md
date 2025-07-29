# Artillery Load Testing

Artillery is a modern, powerful & easy-to-use load testing toolkit.

## Installation

```bash
npm install -g artillery
```

## Test Files

- `basic-load-test.yml` - Basic HTTP load test
- `api-test.yml` - REST API testing
- `websocket-test.yml` - WebSocket load testing
- `scenarios.yml` - Multiple test scenarios

## Running Tests

```bash
# Basic test
artillery run basic-load-test.yml

# Quick test
artillery quick --count 10 --num 5 http://localhost:3000

# With custom target
artillery run -t http://example.com basic-load-test.yml

# Generate HTML report
artillery run basic-load-test.yml --output report.json
artillery report report.json
```

## Features

- HTTP/HTTPS testing
- WebSocket testing
- Socket.io testing
- Multiple test phases
- Custom metrics
- Built-in reporting
