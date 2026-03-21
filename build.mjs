import { execSync } from 'child_process';
import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 0. Ensure output directory exists
fs.mkdirSync('out', { recursive: true });

// 1. Generate Panda CSS artifacts + output CSS
execSync('npx panda codegen', { stdio: 'inherit' });
execSync('npx panda cssgen --outfile out/panda.css', { stdio: 'inherit' });

// 2. Build extension (Node.js)
await esbuild.build({
  entryPoints: ['src/extension/index.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  sourcemap: true,
  target: 'node18',
});

// 3. Build webview (browser) — ignore .css imports (handled separately)
const cssIgnorePlugin = {
  name: 'css-ignore',
  setup(build) {
    build.onResolve({ filter: /\.css$/ }, () => ({
      path: 'css-stub',
      namespace: 'css-stub',
    }));
    build.onLoad({ filter: /.*/, namespace: 'css-stub' }, () => ({
      contents: '',
      loader: 'js',
    }));
  },
};

await esbuild.build({
  entryPoints: ['src/webview/index.tsx'],
  bundle: true,
  outfile: 'out/webview.js',
  format: 'iife',
  platform: 'browser',
  sourcemap: true,
  target: 'es2020',
  jsx: 'automatic',
  alias: {
    'styled-system': path.resolve(__dirname, 'styled-system'),
  },
  resolveExtensions: ['.mjs', '.js', '.ts', '.tsx', '.jsx', '.json'],
  plugins: [cssIgnorePlugin],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

// 4. Copy panda CSS as webview.css + append markdown styles
fs.copyFileSync('out/panda.css', 'out/webview.css');
fs.appendFileSync('out/webview.css', '\n' + fs.readFileSync('src/webview/markdown.css', 'utf8'));

console.log('Build complete!');
