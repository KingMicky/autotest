# Getting Started Guide

Welcome to the Automated Performance Testing framework! This guide will help you get started quickly.

## Prerequisites

- **Node.js** (v16 or higher)
- **K6** load testing tool
- **Docker** (for monitoring stack)
- **Git** (for version control)

## Quick Setup

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd testauto
   npm install
   ```

2. **Initial Setup**
   ```bash
   npm run setup
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your specific settings
   ```

4. **Install K6**
   - Windows: `choco install k6`
   - macOS: `brew install k6`
   - Linux: [K6 Installation Guide](https://k6.io/docs/getting-started/installation/)

## Running Your First Test

### Smoke Test (Quick Validation)
```bash
npm run test:k6 -- k6/smoke-test.js
```

### Basic Load Test
```bash
npm run test:performance
```

### Stress Test
```bash
k6 run k6/stress-test.js
```

## Monitoring Setup

1. **Start Monitoring Stack**
   ```bash
   npm run monitor:start
   ```

2. **Access Dashboards**
   - Grafana: http://localhost:3000 (admin/admin)
   - InfluxDB: http://localhost:8086
   - Prometheus: http://localhost:9090

3. **Run Test with Monitoring**
   ```bash
   k6 run --out influxdb=http://localhost:8086/k6 k6/basic-load-test.js
   ```

## CI/CD Integration

### GitHub Actions
- Copy `.github/workflows/performance-tests.yml` to your repository
- Set up secrets for notifications
- Customize test triggers and thresholds

### Jenkins
- Use the provided `Jenkinsfile`
- Configure build parameters
- Set up email notifications

### Azure DevOps
- Import `azure-pipelines.yml`
- Configure variable groups
- Set up approval processes

## Performance Budgets

Edit `scripts/check-budgets.js` to customize your performance thresholds:

```javascript
const PERFORMANCE_BUDGETS = {
  responseTime: {
    p95: 800,    // 95th percentile < 800ms
    p99: 1500    // 99th percentile < 1500ms
  },
  errorRate: 1,  // Error rate < 1%
  throughput: {
    min: 50      // Minimum 50 req/s
  }
};
```

## Test Types

### 1. Smoke Tests
- **Purpose**: Quick validation
- **Duration**: 30 seconds
- **Load**: 1 user
- **Use**: CI/CD pipeline, post-deployment

### 2. Load Tests
- **Purpose**: Normal expected load
- **Duration**: 5-10 minutes
- **Load**: 10-50 users
- **Use**: Regular testing, performance baselines

### 3. Stress Tests
- **Purpose**: Find breaking point
- **Duration**: 10-30 minutes
- **Load**: Gradually increasing
- **Use**: Capacity planning

### 4. Spike Tests
- **Purpose**: Sudden traffic increases
- **Duration**: 5-10 minutes
- **Load**: Sudden spikes
- **Use**: Auto-scaling validation

## Best Practices

### Test Design
- Start with smoke tests
- Use realistic test data
- Include think time between requests
- Test critical user journeys

### Environment Management
- Use environment variables for configuration
- Keep test and production environments separate
- Use consistent test data

### Monitoring
- Set up real-time monitoring
- Define clear SLAs and thresholds
- Create alerts for critical failures

### Reporting
- Generate reports after each test run
- Track trends over time
- Share results with stakeholders

## Troubleshooting

### Common Issues

1. **K6 Installation Issues**
   ```bash
   # Verify installation
   k6 version
   
   # Reinstall if needed
   choco uninstall k6
   choco install k6
   ```

2. **Docker Connection Issues**
   ```bash
   # Check Docker status
   docker ps
   
   # Restart monitoring stack
   npm run monitor:stop
   npm run monitor:start
   ```

3. **Permission Issues (Linux/macOS)**
   ```bash
   # Fix npm permissions
   sudo chown -R $(whoami) ~/.npm
   ```

### Getting Help

- Check the tool-specific README files in each directory
- Review sample test files for examples
- Check the [K6 Documentation](https://k6.io/docs/)
- Check the [Artillery Documentation](https://artillery.io/docs/)

## Next Steps

1. **Customize Tests**: Modify the sample tests for your specific application
2. **Set Up Monitoring**: Configure Grafana dashboards for your metrics
3. **Integrate CI/CD**: Add performance testing to your deployment pipeline
4. **Define Budgets**: Set performance budgets that align with your SLAs
5. **Schedule Tests**: Set up automated test execution

Happy performance testing! 🚀
