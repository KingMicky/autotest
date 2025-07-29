# Automated Performance Testing in DevOps

This project provides a comprehensive automated performance testing framework integrated with DevOps practices.

## Overview

This setup includes:
- **K6** for modern JavaScript-based performance testing
- **Artillery** for HTTP/WebSocket load testing
- **JMeter** integration for GUI-based test creation
- **Docker** containers for consistent test environments
- **CI/CD** pipeline integration (GitHub Actions, Jenkins, Azure DevOps)
- **Monitoring & Reporting** with Grafana dashboards
- **Performance budgets** and thresholds

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run a basic performance test:
   ```bash
   npm run test:performance
   ```

3. Generate performance report:
   ```bash
   npm run test:report
   ```

## Project Structure

```
testauto/
├── k6/                     # K6 performance tests
├── artillery/              # Artillery load tests
├── jmeter/                 # JMeter test plans
├── docker/                 # Docker configurations
├── ci-cd/                  # CI/CD pipeline configurations
├── monitoring/             # Grafana dashboards and configs
├── scripts/                # Utility scripts
├── reports/                # Generated test reports
└── config/                 # Configuration files
```

## Features

- **Multi-tool Support**: K6, Artillery, and JMeter integration
- **Containerized Testing**: Docker support for consistent environments
- **CI/CD Integration**: Ready-to-use pipeline configurations
- **Real-time Monitoring**: Grafana dashboards for live metrics
- **Performance Budgets**: Automated threshold checking
- **Report Generation**: HTML, JSON, and PDF reports
- **Scalable Architecture**: Distributed testing capabilities

## Getting Started

See individual tool directories for specific setup instructions and examples.
