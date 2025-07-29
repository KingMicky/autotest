const fs = require('fs');
const path = require('path');

function generateHTMLReport(resultsPath, outputPath) {
    try {
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        const aggregate = results.aggregate;
        
        // Calculate key metrics
        const totalRequests = aggregate.counters['http.requests'] || 0;
        const successfulRequests = aggregate.counters['http.codes.200'] || 0;
        const failedRequests = aggregate.counters['vusers.failed'] || 0;
        const totalVUsers = aggregate.counters['vusers.created'] || 0;
        const completedVUsers = aggregate.counters['vusers.completed'] || 0;
        const errorRate = totalRequests > 0 ? ((failedRequests / totalRequests) * 100).toFixed(2) : 0;
        const successRate = totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(2) : 0;
        
        const responseTime = aggregate.summaries['http.response_time'] || {};
        const requestRate = aggregate.rates['http.request_rate'] || 0;
        
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Artillery Load Test Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1, h2 {
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #4CAF50;
        }
        .metric-title {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .error { border-left-color: #f44336; }
        .warning { border-left-color: #ff9800; }
        .success { border-left-color: #4CAF50; }
        .info { border-left-color: #2196F3; }
        
        .response-time-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .response-time-table th,
        .response-time-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .response-time-table th {
            background-color: #4CAF50;
            color: white;
        }
        .response-time-table tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        
        .status-codes {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        
        .timestamp {
            color: #666;
            font-size: 14px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Artillery Load Test Report</h1>
        <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
        
        <h2>📊 Summary Metrics</h2>
        <div class="metrics-grid">
            <div class="metric-card success">
                <div class="metric-title">Total Requests</div>
                <div class="metric-value">${totalRequests.toLocaleString()}</div>
            </div>
            <div class="metric-card success">
                <div class="metric-title">Successful Requests (200)</div>
                <div class="metric-value">${successfulRequests.toLocaleString()}</div>
            </div>
            <div class="metric-card info">
                <div class="metric-title">Success Rate</div>
                <div class="metric-value">${successRate}%</div>
            </div>
            <div class="metric-card ${errorRate > 5 ? 'error' : errorRate > 1 ? 'warning' : 'success'}">
                <div class="metric-title">Error Rate</div>
                <div class="metric-value">${errorRate}%</div>
            </div>
            <div class="metric-card info">
                <div class="metric-title">Request Rate</div>
                <div class="metric-value">${requestRate}/sec</div>
            </div>
            <div class="metric-card info">
                <div class="metric-title">Total Virtual Users</div>
                <div class="metric-value">${totalVUsers.toLocaleString()}</div>
            </div>
            <div class="metric-card success">
                <div class="metric-title">Completed VUsers</div>
                <div class="metric-value">${completedVUsers.toLocaleString()}</div>
            </div>
            <div class="metric-card ${failedRequests > 0 ? 'error' : 'success'}">
                <div class="metric-title">Failed VUsers</div>
                <div class="metric-value">${failedRequests.toLocaleString()}</div>
            </div>
        </div>
        
        <h2>⏱️ Response Time Statistics</h2>
        <table class="response-time-table">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Value (ms)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Minimum</td>
                    <td>${responseTime.min || 'N/A'}</td>
                    <td>✅ Excellent</td>
                </tr>
                <tr>
                    <td>Mean</td>
                    <td>${responseTime.mean ? responseTime.mean.toFixed(1) : 'N/A'}</td>
                    <td>${responseTime.mean < 1000 ? '✅ Good' : responseTime.mean < 2000 ? '⚠️ Acceptable' : '❌ Poor'}</td>
                </tr>
                <tr>
                    <td>Median (50th percentile)</td>
                    <td>${responseTime.median ? responseTime.median.toFixed(1) : 'N/A'}</td>
                    <td>${responseTime.median < 1000 ? '✅ Good' : responseTime.median < 2000 ? '⚠️ Acceptable' : '❌ Poor'}</td>
                </tr>
                <tr>
                    <td>95th Percentile</td>
                    <td>${responseTime.p95 ? responseTime.p95.toFixed(1) : 'N/A'}</td>
                    <td>${responseTime.p95 < 2000 ? '✅ Good' : responseTime.p95 < 5000 ? '⚠️ Acceptable' : '❌ Poor'}</td>
                </tr>
                <tr>
                    <td>99th Percentile</td>
                    <td>${responseTime.p99 ? responseTime.p99.toFixed(1) : 'N/A'}</td>
                    <td>${responseTime.p99 < 5000 ? '✅ Good' : responseTime.p99 < 10000 ? '⚠️ Acceptable' : '❌ Poor'}</td>
                </tr>
                <tr>
                    <td>Maximum</td>
                    <td>${responseTime.max || 'N/A'}</td>
                    <td>${responseTime.max < 10000 ? '✅ Acceptable' : '❌ High'}</td>
                </tr>
            </tbody>
        </table>
        
        <h2>📈 HTTP Status Codes</h2>
        <div class="status-codes">
            <div class="metrics-grid">
                <div class="metric-card success">
                    <div class="metric-title">200 (Success)</div>
                    <div class="metric-value">${aggregate.counters['http.codes.200'] || 0}</div>
                </div>
                <div class="metric-card error">
                    <div class="metric-title">502 (Bad Gateway)</div>
                    <div class="metric-value">${aggregate.counters['http.codes.502'] || 0}</div>
                </div>
                <div class="metric-card error">
                    <div class="metric-title">503 (Service Unavailable)</div>
                    <div class="metric-value">${aggregate.counters['http.codes.503'] || 0}</div>
                </div>
                <div class="metric-card error">
                    <div class="metric-title">Timeouts</div>
                    <div class="metric-value">${aggregate.counters['errors.ETIMEDOUT'] || 0}</div>
                </div>
            </div>
        </div>
        
        <h2>🎯 Test Scenarios</h2>
        <div class="metrics-grid">
            <div class="metric-card info">
                <div class="metric-title">Get Requests</div>
                <div class="metric-value">${aggregate.counters['vusers.created_by_name.Get requests'] || 0}</div>
            </div>
            <div class="metric-card info">
                <div class="metric-title">Post Requests</div>
                <div class="metric-value">${aggregate.counters['vusers.created_by_name.Post requests'] || 0}</div>
            </div>
            <div class="metric-card info">
                <div class="metric-title">API Workflow</div>
                <div class="metric-value">${aggregate.counters['vusers.created_by_name.API workflow'] || 0}</div>
            </div>
        </div>
        
        <h2>📋 Performance Assessment</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3>Overall Result: ${errorRate < 1 && responseTime.p95 < 2000 ? '✅ PASSED' : errorRate < 5 && responseTime.p95 < 5000 ? '⚠️ WARNING' : '❌ FAILED'}</h3>
            <ul>
                <li><strong>Thresholds Status:</strong></li>
                <li>P95 Response Time: ${responseTime.p95 ? responseTime.p95.toFixed(1) : 'N/A'}ms ${responseTime.p95 < 500 ? '(✅ < 500ms target)' : responseTime.p95 < 1000 ? '(⚠️ > 500ms target)' : '(❌ > 1000ms target)'}</li>
                <li>P99 Response Time: ${responseTime.p99 ? responseTime.p99.toFixed(1) : 'N/A'}ms ${responseTime.p99 < 1000 ? '(✅ < 1000ms target)' : '(❌ > 1000ms target)'}</li>
                <li>Error Rate: ${errorRate}% ${errorRate < 1 ? '(✅ < 1% target)' : '(❌ > 1% target)'}</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
        
        fs.writeFileSync(outputPath, html);
        console.log(`✅ HTML report generated successfully: ${outputPath}`);
        return true;
    } catch (error) {
        console.error('❌ Error generating report:', error.message);
        return false;
    }
}

// Main execution
if (require.main === module) {
    const resultsPath = process.argv[2] || 'reports/artillery-results.json';
    const outputPath = process.argv[3] || 'reports/artillery-report.html';
    
    console.log(`📊 Generating Artillery HTML report...`);
    console.log(`📁 Input: ${resultsPath}`);
    console.log(`📁 Output: ${outputPath}`);
    
    const success = generateHTMLReport(resultsPath, outputPath);
    process.exit(success ? 0 : 1);
}

module.exports = { generateHTMLReport };
