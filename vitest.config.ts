import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.{test,spec}.ts'],
        exclude: ['tests/e2e/**'],
    },
    resolve: {
        alias: [
            { find: /^@\/lib\/(.*)$/, replacement: path.resolve(__dirname, './apps/web/src/server/$1') },
            { find: /^@\/hooks\/(.*)$/, replacement: path.resolve(__dirname, './apps/web/src/shared/hooks/$1') },
            { find: /^@\/types\/(.*)$/, replacement: path.resolve(__dirname, './apps/web/src/shared/types/$1') },
            { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, './apps/web/src/$1') },
            { find: /^@shared\/(.*)$/, replacement: path.resolve(__dirname, './apps/web/src/shared/$1') },
            { find: /^@modules\/(.*)$/, replacement: path.resolve(__dirname, './apps/web/src/modules/$1') },
            { find: /^@server\/(.*)$/, replacement: path.resolve(__dirname, './apps/web/src/server/$1') },
        ],
    },
});
