# JMeter Performance Tests

This directory contains JMeter test plans for performance testing.

## Prerequisites

1. **Install JMeter**:
   - Download from: https://jmeter.apache.org/download_jmeter.cgi
   - Extract to a directory and add the `bin` folder to your PATH
   - Verify installation: `jmeter --version`

## Test Plans

- `load-test.jmx` - Basic load testing plan

## Running Tests

### GUI Mode (for test development)
```bash
jmeter -t jmeter/load-test.jmx
```

### Command Line Mode (for CI/CD)
```bash
jmeter -n -t jmeter/load-test.jmx -l reports/jmeter-results.jtl -e -o reports/jmeter-html
```

### With Custom Properties
```bash
jmeter -n -t jmeter/load-test.jmx -l reports/jmeter-results.jtl -JBASE_URL=https://your-api.com
```

## Test Plan Variables

- `BASE_URL` - Target URL for testing (default: https://httpbin.org)
- Can be overridden via command line: `-JBASE_URL=https://example.com`

## Reports

HTML reports are generated in the `reports/jmeter-html` directory when using the `-e -o` flags.
