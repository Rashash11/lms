import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import dotenv from 'dotenv';

const ROOT_DIR = process.cwd();
const WEB_DIR = path.join(ROOT_DIR, 'apps', 'web');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PORT = new URL(BASE_URL).port || '3000';
const HEALTH_URL = `${BASE_URL}/api/health`;

const seedFixturesPath = path.join(ROOT_DIR, 'tests', 'e2e', 'fixtures', 'seed.json');
const storageDir = path.join(ROOT_DIR, 'tests', 'e2e', 'storage');
const readyFilePath = path.join(WEB_DIR, '.e2e-ready');

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function waitForPort(host: string, port: number, timeoutMs: number) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const ok = await new Promise<boolean>((resolve) => {
            const socket = net.connect({ host, port });
            socket.once('connect', () => {
                socket.end();
                resolve(true);
            });
            socket.once('error', () => {
                resolve(false);
            });
            socket.setTimeout(1000, () => {
                socket.destroy();
                resolve(false);
            });
        });
        if (ok) return;
        await sleep(500);
    }
    throw new Error(`Timed out waiting for ${host}:${port}`);
}

async function ensureDockerDeps() {
    const dbUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
    let dbPort = 5433;
    let dbHost = 'localhost';
    if (dbUrl) {
        try {
            const parsed = new URL(dbUrl);
            dbHost = parsed.hostname || dbHost;
            dbPort = parsed.port ? Number(parsed.port) : 5432;
        } catch {
        }
    }
    try {
        await waitForPort(dbHost, dbPort, 2000);
        return;
    } catch {
    }

    try {
        execSync('docker compose up -d postgres redis', { stdio: 'inherit', cwd: ROOT_DIR });
    } catch {
        execSync('docker-compose up -d postgres redis', { stdio: 'inherit', cwd: ROOT_DIR });
    }

    await waitForPort(dbHost, dbPort, 120_000);
}

async function waitForHealthy(url: string, timeoutMs: number) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(url, { method: 'GET' });
            if (res.ok) return;
        } catch {
        }
        await sleep(500);
    }
    throw new Error(`Timed out waiting for server health at ${url}`);
}

function hasValidStorageStates(seedMtimeMs: number) {
    const required = ['admin', 'super-instructor', 'instructor', 'learner', 'learner-b', 'admin-b'];
    if (!fs.existsSync(storageDir)) return false;
    for (const role of required) {
        const p = path.join(storageDir, `${role}.json`);
        if (!fs.existsSync(p)) return false;
        const stat = fs.statSync(p);
        if (stat.mtimeMs < seedMtimeMs) return false;
    }
    return true;
}

async function main() {
    dotenv.config({ path: '.env.test' });
    dotenv.config({ path: '.env.local' });
    dotenv.config();

    if (fs.existsSync(readyFilePath)) fs.rmSync(readyFilePath);

    await ensureDockerDeps();

    const shouldSeed = process.env.E2E_SKIP_SEED !== '1';
    if (shouldSeed) {
        execSync('npm run test:setup', { stdio: 'inherit', cwd: ROOT_DIR });
    } else if (!fs.existsSync(seedFixturesPath)) {
        execSync('npm run test:setup', { stdio: 'inherit', cwd: ROOT_DIR });
    }

    const seedMtimeMs = fs.statSync(seedFixturesPath).mtimeMs;

    const dbUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
    const nextEnv = {
        ...process.env,
        PORT,
        ...(dbUrl ? { DATABASE_URL: dbUrl } : {}),
    };

    const server = spawn('npx', ['next', 'dev', '-p', PORT], {
        cwd: WEB_DIR,
        env: nextEnv,
        stdio: 'inherit',
        shell: true,
    });

    try {
        await waitForHealthy(HEALTH_URL, 180_000);
    } catch (e) {
        server.kill();
        throw e;
    }

    if (shouldSeed || !hasValidStorageStates(seedMtimeMs)) {
        execSync('npm run test:auth-states', { stdio: 'inherit', cwd: ROOT_DIR, env: { ...process.env, BASE_URL } });
    }

    fs.writeFileSync(readyFilePath, new Date().toISOString(), 'utf-8');

    await new Promise<void>((resolve, reject) => {
        server.on('exit', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`E2E webserver exited with code ${code}`));
        });
        server.on('error', reject);
    });
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
