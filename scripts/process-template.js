#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function processTemplate(templatePath, outputPath, env = process.env) {
    try {
        console.log(`📝 Processing template: ${templatePath}`);
        
        let content = fs.readFileSync(templatePath, 'utf8');
        
        // Replace environment variables in the format ${VAR_NAME:-default}
        content = content.replace(/\$\{([^}]+)\}/g, (match, varExpr) => {
            const [varName, defaultValue] = varExpr.split(':-');
            const value = env[varName.trim()];
            
            if (value !== undefined) {
                console.log(`🔄 Replacing ${varName} with: ${value}`);
                return value;
            } else if (defaultValue !== undefined) {
                console.log(`🔄 Using default for ${varName}: ${defaultValue}`);
                return defaultValue;
            } else {
                console.log(`⚠️  No value found for ${varName}, keeping as-is`);
                return match;
            }
        });
        
        fs.writeFileSync(outputPath, content);
        console.log(`✅ Template processed successfully: ${outputPath}`);
        return true;
    } catch (error) {
        console.error(`❌ Error processing template: ${error.message}`);
        return false;
    }
}

// Main execution
if (require.main === module) {
    const templatePath = process.argv[2];
    const outputPath = process.argv[3];
    
    if (!templatePath || !outputPath) {
        console.error('Usage: node process-template.js <template-file> <output-file>');
        process.exit(1);
    }
    
    const success = processTemplate(templatePath, outputPath);
    process.exit(success ? 0 : 1);
}

module.exports = { processTemplate };
