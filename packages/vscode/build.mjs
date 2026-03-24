import { execSync } from 'child_process';
import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiDir = path.resolve(__dirname, '../ui');
const rootDir = path.resolve(__dirname, '../..');

// 0. Ensure output directories exist
fs.mkdirSync('out', { recursive: true });
fs.mkdirSync(path.join(uiDir, 'out'), { recursive: true });

// 1. Generate Panda CSS artifacts from ui package
execSync('npx panda codegen', { stdio: 'inherit', cwd: uiDir });
execSync('npx panda cssgen --outfile out/panda.css', { stdio: 'inherit', cwd: uiDir });

// Move panda.css to vscode out/
fs.copyFileSync(path.join(uiDir, 'out/panda.css'), 'out/panda.css');

// 2. Build extension (Node.js)
await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  sourcemap: true,
  target: 'node18',
  alias: {
    '@chatmemo/core': path.resolve(__dirname, '../core/src'),
  },
  resolveExtensions: ['.ts', '.tsx', '.js', '.json'],
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
  entryPoints: ['src/webview.tsx'],
  bundle: true,
  outfile: 'out/webview.js',
  format: 'iife',
  platform: 'browser',
  sourcemap: true,
  target: 'es2020',
  jsx: 'automatic',
  alias: {
    '@chatmemo/core': path.resolve(__dirname, '../core/src'),
    '@chatmemo/ui': path.resolve(__dirname, '../ui/src'),
    'styled-system': path.resolve(uiDir, 'styled-system'),
  },
  resolveExtensions: ['.mjs', '.js', '.ts', '.tsx', '.jsx', '.json'],
  nodePaths: [path.join(rootDir, 'node_modules')],
  plugins: [cssIgnorePlugin],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

// 4. Assemble webview.css: panda.css + theme.css (fallback) + theme-vscode.css (override) + markdown.css
const pandaCss = fs.readFileSync('out/panda.css', 'utf8');
const uiThemeCss = fs.readFileSync(path.join(uiDir, 'src/theme.css'), 'utf8');
const themeCss = fs.readFileSync('src/theme-vscode.css', 'utf8');
const markdownCss = fs.readFileSync(path.join(uiDir, 'src/markdown.css'), 'utf8');
fs.writeFileSync('out/webview.css', [pandaCss, uiThemeCss, themeCss, markdownCss].join('\n'));

console.log('Build complete!');
