// Copies the runtime files Vite does not know about into the export:
//   ../data   -> ../dist/data     (bundled issues: index.json, <date>/data.json, issue.md, media/)
//   config.json -> ../dist/config.json
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const web = path.resolve(here, '..');
const root = path.resolve(web, '..');
const dist = path.join(root, 'dist');

fs.mkdirSync(dist, { recursive: true });
fs.rmSync(path.join(dist, 'data'), { recursive: true, force: true });
fs.cpSync(path.join(root, 'data'), path.join(dist, 'data'), { recursive: true });
fs.copyFileSync(path.join(web, 'config.json'), path.join(dist, 'config.json'));

const count = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(dir, e.name)) : 1), 0);
console.log(`copied data/ (${count(path.join(dist, 'data'))} files) and config.json into dist/`);
