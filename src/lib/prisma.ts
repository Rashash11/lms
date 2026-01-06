import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Parse and log DATABASE_URL on startup (sanitized - no password)
function logDatabaseConnection() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
        try {
            const url = new URL(dbUrl);
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    DATABASE CONNECTION                       ║
╠══════════════════════════════════════════════════════════════╣
║  Host:     ${url.hostname.padEnd(47)}║
║  Port:     ${url.port.padEnd(47)}║
║  Database: ${url.pathname.slice(1).padEnd(47)}║
║  User:     ${url.username.padEnd(47)}║
╚══════════════════════════════════════════════════════════════╝
`);
        } catch (e) {
            console.warn('[Prisma] Could not parse DATABASE_URL');
        }
    } else {
        console.warn('[Prisma] DATABASE_URL not set');
    }
}

// Log on first import
if (process.env.NODE_ENV !== 'production') {
    logDatabaseConnection();
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['error', 'warn'] // Reduce noise in development
        : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
