const fs = require('fs-extra');
const path = require('path');

const PERFORMANCE_BUDGETS = {
  responseTime: {
    p50: 300,    // 50th percentile should be < 300ms
    p95: 800,    // 95th percentile should be < 800ms
    p99: 1500    // 99th percentile should be < 1500ms
  },
  errorRate: 1,      // Error rate should be < 1%
  throughput: {
    min: 50          // Minimum requests per second
  },
  availability: 99.9  // 99.9% uptime
};

async function checkBudgets(reportsDir) {
  console.log('🔍 Checking performance budgets...');
  
  try {
    const summaryPath = path.join(reportsDir, 'summary.json');
    
    if (!await fs.pathExists(summaryPath)) {
      console.error('❌ Summary file not found. Run report generation first.');
      process.exit(1);
    }
    
    const summary = await fs.readJson(summaryPath);
    const results = [];
    let overallStatus = 'PASS';
    
    // Check response time budgets
    if (summary.p95 > PERFORMANCE_BUDGETS.responseTime.p95) {
      results.push({
        metric: 'Response Time (P95)',
        budget: `< ${PERFORMANCE_BUDGETS.responseTime.p95}ms`,
        actual: `${summary.p95.toFixed(2)}ms`,
        status: 'FAIL',
        impact: 'HIGH'
      });
      overallStatus = 'FAIL';
    } else {
      results.push({
        metric: 'Response Time (P95)',
        budget: `< ${PERFORMANCE_BUDGETS.responseTime.p95}ms`,
        actual: `${summary.p95.toFixed(2)}ms`,
        status: 'PASS',
        impact: 'NONE'
      });
    }
    
    if (summary.p99 > PERFORMANCE_BUDGETS.responseTime.p99) {
      results.push({
        metric: 'Response Time (P99)',
        budget: `< ${PERFORMANCE_BUDGETS.responseTime.p99}ms`,
        actual: `${summary.p99.toFixed(2)}ms`,
        status: 'FAIL',
        impact: 'MEDIUM'
      });
      if (overallStatus !== 'FAIL') overallStatus = 'WARN';
    } else {
      results.push({
        metric: 'Response Time (P99)',
        budget: `< ${PERFORMANCE_BUDGETS.responseTime.p99}ms`,
        actual: `${summary.p99.toFixed(2)}ms`,
        status: 'PASS',
        impact: 'NONE'
      });
    }
    
    // Check error rate budget
    if (summary.errorRate > PERFORMANCE_BUDGETS.errorRate) {
      results.push({
        metric: 'Error Rate',
        budget: `< ${PERFORMANCE_BUDGETS.errorRate}%`,
        actual: `${summary.errorRate.toFixed(2)}%`,
        status: 'FAIL',
        impact: 'CRITICAL'
      });
      overallStatus = 'FAIL';
    } else {
      results.push({
        metric: 'Error Rate',
        budget: `< ${PERFORMANCE_BUDGETS.errorRate}%`,
        actual: `${summary.errorRate.toFixed(2)}%`,
        status: 'PASS',
        impact: 'NONE'
      });
    }
    
    // Check throughput budget
    if (summary.throughput < PERFORMANCE_BUDGETS.throughput.min) {
      results.push({
        metric: 'Throughput',
        budget: `> ${PERFORMANCE_BUDGETS.throughput.min} req/s`,
        actual: `${summary.throughput.toFixed(2)} req/s`,
        status: 'FAIL',
        impact: 'HIGH'
      });
      overallStatus = 'FAIL';
    } else {
      results.push({
        metric: 'Throughput',
        budget: `> ${PERFORMANCE_BUDGETS.throughput.min} req/s`,
        actual: `${summary.throughput.toFixed(2)} req/s`,
        status: 'PASS',
        impact: 'NONE'
      });
    }
    
    // Generate budget report
    const budgetReport = {
      timestamp: new Date().toISOString(),
      overallStatus,
      budgets: PERFORMANCE_BUDGETS,
      results,
      summary: summary
    };
    
    await fs.writeJson(path.join(reportsDir, 'budget-check.json'), budgetReport, { spaces: 2 });
    
    // Generate budget HTML report
    await generateBudgetHtmlReport(budgetReport, reportsDir);
    
    // Console output
    console.log('\n📊 Performance Budget Results:');
    console.log('═'.repeat(80));
    
    results.forEach(result => {
      const statusIcon = result.status === 'PASS' ? '✅' : '❌';
      const impactColor = result.impact === 'CRITICAL' ? '\x1b[31m' : 
                         result.impact === 'HIGH' ? '\x1b[33m' : 
                         result.impact === 'MEDIUM' ? '\x1b[33m' : '\x1b[32m';
      
      console.log(`${statusIcon} ${result.metric}`);
      console.log(`   Budget: ${result.budget}`);
      console.log(`   Actual: ${result.actual}`);
      console.log(`   Impact: ${impactColor}${result.impact}\x1b[0m`);
      console.log('');
    });
    
    console.log('═'.repeat(80));
    console.log(`Overall Status: ${overallStatus === 'PASS' ? '✅ PASS' : overallStatus === 'WARN' ? '⚠️  WARN' : '❌ FAIL'}`);
    
    if (overallStatus === 'FAIL') {
      console.log('\n💡 Recommendations:');
      results.filter(r => r.status === 'FAIL').forEach(result => {
        switch (result.metric) {
          case 'Response Time (P95)':
            console.log('   • Optimize slow database queries');
            console.log('   • Implement caching strategies');
            console.log('   • Consider CDN for static assets');
            break;
          case 'Error Rate':
            console.log('   • Review error logs for root causes');
            console.log('   • Implement circuit breakers');
            console.log('   • Add retry mechanisms');
            break;
          case 'Throughput':
            console.log('   • Scale up infrastructure');
            console.log('   • Optimize application bottlenecks');
            console.log('   • Implement connection pooling');
            break;
        }
      });
    }
    
    // Exit with appropriate code
    if (overallStatus === 'FAIL') {
      process.exit(1);
    } else if (overallStatus === 'WARN') {
      process.exit(2);
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Error checking budgets:', error);
    process.exit(1);
  }
}

async function generateBudgetHtmlReport(budgetReport, reportsDir) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Budget Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-left: 10px; }
        .status-pass { background: #d4edda; color: #155724; }
        .status-warn { background: #fff3cd; color: #856404; }
        .status-fail { background: #f8d7da; color: #721c24; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f2f2f2; font-weight: 600; }
        .metric-pass { background: #d4edda; }
        .metric-fail { background: #f8d7da; }
        .impact-critical { color: #dc3545; font-weight: bold; }
        .impact-high { color: #fd7e14; font-weight: bold; }
        .impact-medium { color: #ffc107; font-weight: bold; }
        .impact-none { color: #28a745; }
        .recommendations { background: #e7f3ff; border-left: 4px solid #007acc; padding: 15px; margin: 20px 0; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Performance Budget Report</h1>
            <p class="timestamp">Generated: ${budgetReport.timestamp}</p>
            <span class="status-badge status-${budgetReport.overallStatus.toLowerCase()}">${budgetReport.overallStatus}</span>
        </div>
        
        <div class="content">
            <h2>Budget Check Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Budget</th>
                        <th>Actual</th>
                        <th>Status</th>
                        <th>Impact</th>
                    </tr>
                </thead>
                <tbody>
                    ${budgetReport.results.map(result => `
                        <tr class="metric-${result.status.toLowerCase()}">
                            <td>${result.metric}</td>
                            <td>${result.budget}</td>
                            <td>${result.actual}</td>
                            <td><strong>${result.status}</strong></td>
                            <td class="impact-${result.impact.toLowerCase()}">${result.impact}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            ${budgetReport.overallStatus !== 'PASS' ? `
            <div class="recommendations">
                <h3>💡 Recommendations</h3>
                <ul>
                    ${budgetReport.results.filter(r => r.status === 'FAIL').map(result => {
                        switch(result.metric) {
                            case 'Response Time (P95)':
                                return '<li>Optimize slow database queries and implement caching strategies</li>';
                            case 'Response Time (P99)':
                                return '<li>Review outlier requests and optimize worst-case scenarios</li>';
                            case 'Error Rate':
                                return '<li>Review error logs, implement circuit breakers and retry mechanisms</li>';
                            case 'Throughput':
                                return '<li>Scale infrastructure and optimize application bottlenecks</li>';
                            default:
                                return '<li>Review and optimize the failing metric</li>';
                        }
                    }).join('')}
                </ul>
            </div>
            ` : ''}
            
            <h2>Performance Budgets Configuration</h2>
            <table>
                <tr><th>Metric</th><th>Threshold</th></tr>
                <tr><td>Response Time (P95)</td><td>&lt; ${budgetReport.budgets.responseTime.p95}ms</td></tr>
                <tr><td>Response Time (P99)</td><td>&lt; ${budgetReport.budgets.responseTime.p99}ms</td></tr>
                <tr><td>Error Rate</td><td>&lt; ${budgetReport.budgets.errorRate}%</td></tr>
                <tr><td>Minimum Throughput</td><td>&gt; ${budgetReport.budgets.throughput.min} req/s</td></tr>
            </table>
        </div>
    </div>
</body>
</html>`;

  await fs.writeFile(path.join(reportsDir, 'budget-report.html'), htmlContent);
}

// Main execution
if (require.main === module) {
  const reportsDir = process.argv[2] || path.join(__dirname, '..', 'reports');
  checkBudgets(reportsDir);
}

module.exports = { checkBudgets, PERFORMANCE_BUDGETS };
