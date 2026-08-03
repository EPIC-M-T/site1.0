import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const sourceDir = join(root, '.epic-source');
const outputDir = join(root, 'dist');

const chunks = [];
for (let index = 0; index < 100; index += 1) {
  const path = join(root, 'bootstrap', `source.chunk${String(index).padStart(2, '0')}`);
  try {
    chunks.push(await readFile(path, 'utf8'));
  } catch {
    break;
  }
}

if (!chunks.length) throw new Error('EPIC source package chunks were not found.');

const archivePath = join(root, '.epic-source.tar.gz');
await writeFile(archivePath, Buffer.from(chunks.join('').replace(/\s+/g, ''), 'base64'));
await rm(sourceDir, { recursive: true, force: true });
await mkdir(sourceDir, { recursive: true });

const extract = spawnSync('tar', ['-xzf', archivePath, '-C', sourceDir], { stdio: 'inherit' });
if (extract.status !== 0) throw new Error('Unable to extract the EPIC source package.');

const urls = JSON.parse(await readFile(join(root, 'hero-urls.json'), 'utf8'));
if (!/^https:\/\//.test(urls.desktop) || !/^https:\/\//.test(urls.mobile)) {
  throw new Error('hero-urls.json must contain valid HTTPS desktop and mobile URLs.');
}

const sitePath = join(sourceDir, 'src', 'data', 'site.mjs');
let site = await readFile(sitePath, 'utf8');
site = site
  .replace(/heroVideoDesktop:\s*"[^"]*"/, `heroVideoDesktop: "${urls.desktop}"`)
  .replace(/heroVideoMobile:\s*"[^"]*"/, `heroVideoMobile: "${urls.mobile}"`);
await writeFile(sitePath, site, 'utf8');

for (const script of ['build.mjs', 'check.mjs']) {
  const result = spawnSync(process.execPath, [join(sourceDir, 'scripts', script)], {
    cwd: sourceDir,
    stdio: 'inherit',
    env: process.env
  });
  if (result.status !== 0) throw new Error(`${script} failed.`);
}

await rm(outputDir, { recursive: true, force: true });
await cp(join(sourceDir, 'dist'), outputDir, { recursive: true });
console.log('EPIC Models & Talent production site built from the GitHub source package.');
