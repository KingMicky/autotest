const fs = require('fs-extra');
const path = require('path');

async function generateReport() {
  console.log('Generating performance test report...');
  
  const reportsDir = path.join(__dirname, '..', 'reports');
  const summaryFile = path.join(reportsDir, 'summary.json');
  
  // Ensure reports directory exists
  await fs.ensureDir(reportsDir);
  
  let summary = {
    timestamp: new Date().toISOString(),
    avgResponseTime: 0,
    p95: 0,
    p99: 0,
    errorRate: 0,
    throughput: 0,
    status: 'UNKNOWN',
    tests: []
  };
  
  try {
    // Process K6 results
    const k6ResultsPath = path.join(reportsDir, 'k6-results.json');
    if (await fs.pathExists(k6ResultsPath)) {
      console.log('Processing K6 results...');
      const k6Data = await processK6Results(k6ResultsPath);
      summary.tests.push(k6Data);
      
      // Update overall summary
      if (k6Data.metrics) {
        summary.avgResponseTime = k6Data.metrics.http_req_duration?.values?.avg || 0;
        summary.p95 = k6Data.metrics.http_req_duration?.values?.['p(95)'] || 0;
        summary.p99 = k6Data.metrics.http_req_duration?.values?.['p(99)'] || 0;
        summary.errorRate = (k6Data.metrics.http_req_failed?.values?.rate || 0) * 100;
        summary.throughput = k6Data.metrics.http_reqs?.values?.rate || 0;
      }
    }
    
    // Process Artillery results
    const artilleryResultsPath = path.join(reportsDir, 'artillery-results.json');
    if (await fs.pathExists(artilleryResultsPath)) {
      console.log('Processing Artillery results...');
      const artilleryData = await processArtilleryResults(artilleryResultsPath);
      summary.tests.push(artilleryData);
      
      // Update overall summary if no K6 data
      if (summary.tests.length === 1) {
        summary.avgResponseTime = artilleryData.summary?.mean || 0;
        summary.p95 = artilleryData.summary?.p95 || 0;
        summary.p99 = artilleryData.summary?.p99 || 0;
        summary.errorRate = ((artilleryData.counters?.['http.codes.400'] || 0) + 
                            (artilleryData.counters?.['http.codes.500'] || 0)) / 
                           (artilleryData.counters?.['http.requests'] || 1) * 100;
        summary.throughput = artilleryData.rates?.['http.request_rate'] || 0;
      }
    }
    
    // Determine overall status based on thresholds
    summary.status = checkThresholds(summary);
    
    // Save summary
    await fs.writeJson(summaryFile, summary, { spaces: 2 });
    
    // Generate HTML report
    await generateHtmlReport(summary, reportsDir);
    
    console.log('Report generation completed successfully!');
    console.log(`Summary saved to: ${summaryFile}`);
    
  } catch (error) {
    console.error('Error generating report:', error);
    process.exit(1);
  }
}

async function processK6Results(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.trim().split('\n');
  
  let metrics = {};
  let testInfo = {
    tool: 'K6',
    timestamp: new Date().toISOString(),
    metrics: {}
  };
  
  // Process each line (K6 outputs NDJSON)
  for (const line of lines) {
    try {
      const data = JSON.parse(line);
      
      if (data.type === 'Point' && data.metric) {
        if (!metrics[data.metric]) {
          metrics[data.metric] = { values: {} };
        }
        
        if (data.data.tags) {
          // Handle tagged metrics
          const tag = Object.keys(data.data.tags)[0];
          if (!metrics[data.metric].values[tag]) {
            metrics[data.metric].values[tag] = {};
          }
          metrics[data.metric].values[tag] = data.data.value;
        } else {
          metrics[data.metric].values = { ...metrics[data.metric].values, ...data.data };
        }
      }
    } catch (e) {
      // Skip invalid JSON lines
    }
  }
  
  testInfo.metrics = metrics;
  return testInfo;
}

async function processArtilleryResults(filePath) {
  const data = await fs.readJson(filePath);
  
  return {
    tool: 'Artillery',
    timestamp: new Date().toISOString(),
    summary: data.aggregate,
    counters: data.counters,
    rates: data.rates,
    histograms: data.histograms
  };
}

function checkThresholds(summary) {
  const thresholds = {
    avgResponseTime: 500,
    p95: 1000,
    p99: 2000,
    errorRate: 1,
    minThroughput: 10
  };
  
  if (summary.p95 > thresholds.p95) return 'FAIL';
  if (summary.errorRate > thresholds.errorRate) return 'FAIL';
  if (summary.avgResponseTime > thresholds.avgResponseTime) return 'WARN';
  if (summary.throughput < thresholds.minThroughput) return 'WARN';
  
  return 'PASS';
}

async function generateHtmlReport(summary, reportsDir) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; border-radius: 8px; padding: 20px; border-left: 4px solid #007acc; }
        .metric-value { font-size: 2em; font-weight: bold; color: #333; }
        .metric-label { color: #666; font-size: 0.9em; margin-top: 5px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; }
        .status-pass { background: #d4edda; color: #155724; }
        .status-warn { background: #fff3cd; color: #856404; }
        .status-fail { background: #f8d7da; color: #721c24; }
        .test-details { margin-top: 30px; }
        .test-card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 10px 0; }
        .timestamp { color: #666; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f2f2f2; font-weight: 600; }
        .chart-placeholder { background: #f8f9fa; border: 2px dashed #ddd; height: 200px; display: flex; align-items: center; justify-content: center; color: #666; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Performance Test Report</h1>
            <p class="timestamp">Generated: ${summary.timestamp}</p>
            <span class="status-badge status-${summary.status.toLowerCase()}">${summary.status}</span>
        </div>
        
        <div class="content">
            <h2>Key Metrics</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value">${summary.avgResponseTime.toFixed(2)}ms</div>
                    <div class="metric-label">Average Response Time</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${summary.p95.toFixed(2)}ms</div>
                    <div class="metric-label">95th Percentile</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${summary.p99.toFixed(2)}ms</div>
                    <div class="metric-label">99th Percentile</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${summary.errorRate.toFixed(2)}%</div>
                    <div class="metric-label">Error Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${summary.throughput.toFixed(2)}</div>
                    <div class="metric-label">Requests per Second</div>
                </div>
            </div>
            
            <div class="chart-placeholder">
                📊 Response Time Chart<br>
                <small>Integrate with Chart.js or D3.js for visualizations</small>
            </div>
            
            <div class="test-details">
                <h2>Test Details</h2>
                ${summary.tests.map(test => `
                    <div class="test-card">
                        <h3>${test.tool} Test Results</h3>
                        <p class="timestamp">${test.timestamp}</p>
                        <table>
                            <tr><th>Metric</th><th>Value</th></tr>
                            ${Object.entries(test.metrics || {}).slice(0, 10).map(([key, value]) => `
                                <tr>
                                    <td>${key}</td>
                                    <td>${JSON.stringify(value).substring(0, 100)}...</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                `).join('')}
            </div>
            
            <div class="test-details">
                <h2>Performance Thresholds</h2>
                <table>
                    <tr><th>Metric</th><th>Threshold</th><th>Actual</th><th>Status</th></tr>
                    <tr>
                        <td>95th Percentile Response Time</td>
                        <td>&lt; 1000ms</td>
                        <td>${summary.p95.toFixed(2)}ms</td>
                        <td><span class="status-badge status-${summary.p95 < 1000 ? 'pass' : 'fail'}">${summary.p95 < 1000 ? 'PASS' : 'FAIL'}</span></td>
                    </tr>
                    <tr>
                        <td>Error Rate</td>
                        <td>&lt; 1%</td>
                        <td>${summary.errorRate.toFixed(2)}%</td>
                        <td><span class="status-badge status-${summary.errorRate < 1 ? 'pass' : 'fail'}">${summary.errorRate < 1 ? 'PASS' : 'FAIL'}</span></td>
                    </tr>
                    <tr>
                        <td>Average Response Time</td>
                        <td>&lt; 500ms</td>
                        <td>${summary.avgResponseTime.toFixed(2)}ms</td>
                        <td><span class="status-badge status-${summary.avgResponseTime < 500 ? 'pass' : 'warn'}">${summary.avgResponseTime < 500 ? 'PASS' : 'WARN'}</span></td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</body>
</html>`;

  await fs.writeFile(path.join(reportsDir, 'performance-report.html'), htmlContent);
}

if (require.main === module) {
  generateReport();
}

module.exports = { generateReport };
