# Docker Configuration for Performance Testing

This directory contains Docker configurations for containerized performance testing.

## Files

- `docker-compose.yml` - Docker Compose configuration for running K6 with InfluxDB

## Usage

### Start K6 with InfluxDB backend
```bash
docker-compose -f docker/docker-compose.yml up --build
```

### Run specific test
```bash
docker-compose -f docker/docker-compose.yml run k6 run /scripts/stress-test.js
```

### Clean up
```bash
docker-compose -f docker/docker-compose.yml down -v
```

## Services

- **k6**: K6 load testing tool
- **influxdb**: Time-series database for storing test metrics

## Data Persistence

- InfluxDB data is persisted in a Docker volume `influxdb-data`
- Test scripts are mounted from the local `k6/` directory
- Reports are saved to the local `reports/` directory

## Network

All services run on the `performance-testing` network.
