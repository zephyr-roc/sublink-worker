import { build } from 'esbuild';
import fs from 'node:fs/promises';

await fs.mkdir('cloud-functions/_shared', { recursive: true });

await build({
    entryPoints: ['src/runtime/edgeoneHandler.js'],
    outfile: 'cloud-functions/_shared/app.mjs',
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    jsx: 'automatic',
    jsxImportSource: 'hono/jsx',
    external: ['@edgeone/pages-blob'],
    minify: process.env.NODE_ENV === 'production',
    logLevel: 'info'
});

console.log('EdgeOne Makers cloud function bundle ready');
