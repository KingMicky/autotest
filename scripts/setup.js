const fs = require('fs-extra');
const path = require('path');

async function setup() {
  console.log('🚀 Setting up automated performance testing environment...');
  
  try {
    // Create required directories
    const directories = [
      'reports',
      'config',
      'logs',
      'temp'
    ];
    
    for (const dir of directories) {
      await fs.ensureDir(path.join(__dirname, '..', dir));
      console.log(`✅ Created directory: ${dir}`);
    }
    
    // Create environment configuration
    const envConfig = `# Performance Testing Configuration
BASE_URL=https://httpbin.org
TARGET_URL=https://httpbin.org
API_URL=https://jsonplaceholder.typicode.com

# Test Configuration
DEFAULT_VUS=10
DEFAULT_DURATION=5m
MAX_VUS=100

# Monitoring
INFLUXDB_URL=http://localhost:8086
INFLUXDB_DATABASE=k6
GRAFANA_URL=http://localhost:3000

# CI/CD
SLACK_WEBHOOK_URL=
TEAMS_WEBHOOK_URL=
EMAIL_NOTIFICATIONS=true

# Performance Budgets
BUDGET_P95_MS=800
BUDGET_P99_MS=1500
BUDGET_ERROR_RATE=1
BUDGET_MIN_THROUGHPUT=50`;

    await fs.writeFile(path.join(__dirname, '..', '.env.example'), envConfig);
    console.log('✅ Created .env.example file');
    
    // Create gitignore
    const gitignore = `# Dependencies
node_modules/
npm-debug.log*

# Reports and logs
reports/*.json
reports/*.jtl
reports/*.html
logs/
temp/

# Environment
.env

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json
.idea/

# Test results
*.log
*.tmp`;

    await fs.writeFile(path.join(__dirname, '..', '.gitignore'), gitignore);
    console.log('✅ Created .gitignore file');
    
    // Create basic configuration file
    const config = {
      performance: {
        thresholds: {
          responseTime: {
            p95: 800,
            p99: 1500
          },
          errorRate: 1,
          throughput: {
            min: 50
          }
        },
        tools: {
          k6: {
            enabled: true,
            outputFormat: 'json'
          },
          artillery: {
            enabled: true,
            outputFormat: 'json'
          },
          jmeter: {
            enabled: false,
            outputFormat: 'jtl'
          }
        }
      },
      reporting: {
        formats: ['html', 'json'],
        destinations: ['local', 'artifactory'],
        retention: {
          days: 30
        }
      },
      monitoring: {
        realtime: true,
        dashboard: 'grafana',
        alerts: {
          enabled: true,
          channels: ['email', 'slack']
        }
      }
    };
    
    await fs.writeJson(path.join(__dirname, '..', 'config', 'default.json'), config, { spaces: 2 });
    console.log('✅ Created default configuration');
    
    // Create sample test data
    const testData = {
      users: [
        { username: 'testuser1', email: 'test1@example.com' },
        { username: 'testuser2', email: 'test2@example.com' },
        { username: 'testuser3', email: 'test3@example.com' }
      ],
      products: [
        { id: 1, name: 'Product A', price: 29.99 },
        { id: 2, name: 'Product B', price: 49.99 },
        { id: 3, name: 'Product C', price: 19.99 }
      ]
    };
    
    await fs.writeJson(path.join(__dirname, '..', 'config', 'test-data.json'), testData, { spaces: 2 });
    console.log('✅ Created test data configuration');
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Copy .env.example to .env and configure your settings');
    console.log('2. Install dependencies: npm install');
    console.log('3. Start monitoring stack: npm run monitor:start');
    console.log('4. Run your first test: npm run test:performance');
    console.log('\nFor more information, check the README.md file.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  setup();
}

module.exports = { setup };
