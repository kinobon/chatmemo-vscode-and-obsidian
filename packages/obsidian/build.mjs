import { execSync } from 'child_process';
import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import builtins from 'builtin-modules';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiDir = path.resolve(__dirname, '../ui');
const rootDir = path.resolve(__dirname, '../..');

// 0. Ensure output directories exist
fs.mkdirSync(path.join(uiDir, 'out'), { recursive: true });

// 1. Generate Panda CSS artifacts from ui package
execSync('npx panda codegen', { stdio: 'inherit', cwd: uiDir });
execSync('npx panda cssgen --outfile out/panda.css', { stdio: 'inherit', cwd: uiDir });

// 2. Build plugin (single bundle, CJS)
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
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'main.js',
  external: [
    'obsidian',
    'electron',
    '@codemirror/autocomplete',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/common',
    '@lezer/highlight',
    '@lezer/lr',
    ...builtins,
  ],
  format: 'cjs',
  platform: 'node',
  target: 'es2018',
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

// 3. Assemble styles.css: panda.css + theme.css (fallback) + theme-obsidian.css (override) + markdown.css
const pandaCss = fs.readFileSync(path.join(uiDir, 'out/panda.css'), 'utf8');
const uiThemeCss = fs.readFileSync(path.join(uiDir, 'src/theme.css'), 'utf8');
const themeCss = fs.readFileSync('src/theme-obsidian.css', 'utf8');
const markdownCss = fs.readFileSync(path.join(uiDir, 'src/markdown.css'), 'utf8');
fs.writeFileSync('styles.css', [pandaCss, uiThemeCss, themeCss, markdownCss].join('\n'));

console.log('Build complete!');
