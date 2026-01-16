const fs = require('fs');
const content = fs.readFileSync('E:/lms/prisma/schema.prisma', 'utf8');
const models = content.split('model ').slice(1);
const results = [];

for (const modelBlock of models) {
    const lines = modelBlock.split('\n');
    const modelName = lines[0].split('{')[0].trim();
    if (!modelBlock.includes('tenantId')) {
        results.push(modelName);
    }
}

console.log('Models without tenantId:', results);
