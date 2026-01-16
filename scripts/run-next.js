const { spawnSync } = require('node:child_process');
const path = require('node:path');

const cmd = process.argv[2];
if (!cmd) {
    console.error('Usage: node scripts/run-next.js <dev|build|start|lint> [args...]');
    process.exit(1);
}

const webDir = path.join(process.cwd(), 'apps', 'web');
const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');

const result = spawnSync(
    process.execPath,
    [nextBin, cmd, ...process.argv.slice(3)],
    { cwd: webDir, stdio: 'inherit', env: process.env }
);

if (result.error) {
    console.error(result.error);
    process.exit(1);
}

process.exit(result.status ?? 1);
