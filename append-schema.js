const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const part2Path = path.join(__dirname, 'prisma', 'schema-part2.prisma');

try {
    const part2Content = fs.readFileSync(part2Path, 'utf8');
    fs.appendFileSync(schemaPath, part2Content);
    console.log('Successfully appended part 2 to schema.prisma');
} catch (error) {
    console.error('Error appending schema:', error);
    process.exit(1);
}
