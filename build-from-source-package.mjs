import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const sourceDir = join(root, '.epic-source');
const outputDir = join(root, 'dist');
const sourceParts = [
  'source.chunk00', 'source.chunk01', 'source.chunk02a', 'source.chunk02b',
  'source.chunk03', 'source.chunk04', 'source.chunk05', 'source.chunk06',
  'source.chunk07a', 'source.chunk07b'
];

const chunks = await Promise.all(sourceParts.map((file) => readFile(join(root, 'bootstrap', file), 'utf8')));
const encoded = chunks.join('').replace(/\s+/g, '');
const encodedHash = createHash('sha256').update(encoded).digest('hex');
if (encoded.length !== 62752) throw new Error(`Unexpected EPIC source length: ${encoded.length}`);
if (encodedHash !== 'acdeda443a5e4157d229f3ce9cceb26f201abf62dcb818dc622b7ec7aa7b67e6') throw new Error(`EPIC source package checksum mismatch: ${encodedHash}`);

const archive = Buffer.from(encoded, 'base64');
const archiveHash = createHash('sha256').update(archive).digest('hex');
if (archiveHash !== '5c5f45bd9d970667d06467636dd98f48a46f80be40f2a35f6f72f85cb8f71192') throw new Error(`EPIC archive checksum mismatch: ${archiveHash}`);

const archivePath = join(root, '.epic-source.tar.gz');
await writeFile(archivePath, archive);
await rm(sourceDir, { recursive: true, force: true });
await mkdir(sourceDir, { recursive: true });
const extract = spawnSync('tar', ['-xzf', archivePath, '-C', sourceDir], { stdio: 'inherit' });
if (extract.status !== 0) throw new Error('Unable to extract the EPIC source package.');

const urls = JSON.parse(await readFile(join(root, 'hero-urls.json'), 'utf8'));
if (!/^https:\/\//.test(urls.desktop) || !/^https:\/\//.test(urls.mobile)) throw new Error('hero-urls.json must contain valid HTTPS desktop and mobile URLs.');

const sitePath = join(sourceDir, 'src', 'data', 'site.mjs');
let site = await readFile(sitePath, 'utf8');
site = site
  .replace(/heroVideoDesktop:\s*"[^"]*"/, `heroVideoDesktop: "${urls.desktop}"`)
  .replace(/heroVideoMobile:\s*"[^"]*"/, `heroVideoMobile: "${urls.mobile}"`);
await writeFile(sitePath, site, 'utf8');

const layoutPath = join(sourceDir, 'src', 'components', 'layout.mjs');
let layout = await readFile(layoutPath, 'utf8');
layout = layout
  .replace('      <span class="brand-mark">E</span>\n      <span class="brand-copy"><strong>EPIC</strong><small>MODELS &amp; TALENT · LAS VEGAS</small></span>', '      <img class="brand-logo" src="${site.currentAssets.logo}" alt="EPIC Models &amp; Talent">')
  .replace('        <span class="brand-mark brand-mark-lg">E</span>', '        <img class="footer-logo" src="${site.currentAssets.logo}" alt="EPIC Models &amp; Talent">');
await writeFile(layoutPath, layout, 'utf8');

const sectionsPath = join(sourceDir, 'src', 'components', 'sections.mjs');
let sections = await readFile(sectionsPath, 'utf8');
sections = sections
  .replace('    <div class="hero-asset-label">VIDEO PLACEHOLDER: Replace with a 10–15 second, 4K cinematic Las Vegas model reel featuring backstage, resort, convention, nightlife, and editorial moments.</div>\n', '')
  .replace('          <div class="bikini-event-stamp"><span>${contest.date}</span><strong>${contest.venue}</strong></div>\n', '');
await writeFile(sectionsPath, sections, 'utf8');

const stylesPath = join(sourceDir, 'src', 'styles', 'styles.css');
let styles = await readFile(stylesPath, 'utf8');
if (!styles.includes('/* EPIC production logo assets */')) {
  styles += '\n/* EPIC production logo assets */\n.brand-logo{display:block;width:clamp(170px,15vw,250px);height:58px;object-fit:contain;object-position:left center}\n.footer-logo{display:block;width:min(300px,100%);height:auto;margin:0 0 28px}\n@media (max-width:780px){.brand-logo{width:155px;height:48px}.footer-logo{width:min(260px,86vw)}}\n';
}
await writeFile(stylesPath, styles, 'utf8');

for (const script of ['build.mjs', 'check.mjs']) {
  const result = spawnSync(process.execPath, [join(sourceDir, 'scripts', script)], { cwd: sourceDir, stdio: 'inherit', env: process.env });
  if (result.status !== 0) throw new Error(`${script} failed.`);
}

await rm(outputDir, { recursive: true, force: true });
await cp(join(sourceDir, 'dist'), outputDir, { recursive: true });

const imageMap = JSON.parse(await readFile(join(root, 'image-map.json'), 'utf8'));
const siteImageArchive = join(root, imageMap.archive.file);
let archiveStats;
try {
  archiveStats = await stat(siteImageArchive);
} catch {
  throw new Error(`${imageMap.archive.file} is missing from the production branch.`);
}
if (archiveStats.size !== imageMap.archive.bytes) {
  throw new Error(`Unexpected ${imageMap.archive.file} size: ${archiveStats.size}`);
}
const siteImageBytes = await readFile(siteImageArchive);
const siteImageHash = createHash('sha256').update(siteImageBytes).digest('hex');
if (siteImageHash !== imageMap.archive.sha256) {
  throw new Error(`${imageMap.archive.file} checksum mismatch: ${siteImageHash}`);
}

const imageTemp = join(root, '.epic-site-images');
await rm(imageTemp, { recursive: true, force: true });
await mkdir(imageTemp, { recursive: true });
const unzip = spawnSync('unzip', ['-oq', siteImageArchive, '-d', imageTemp], { stdio: 'inherit' });
if (unzip.status !== 0) throw new Error(`Unable to extract ${imageMap.archive.file}.`);

async function findNamedFile(directory, fileName) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await findNamedFile(entryPath, fileName);
      if (nested) return nested;
    } else if (entry.name === fileName) {
      return entryPath;
    }
  }
  return null;
}

const outputImages = join(outputDir, 'images');
await mkdir(outputImages, { recursive: true });
for (const fileName of imageMap.archive.files) {
  const sourceImage = await findNamedFile(imageTemp, fileName);
  if (!sourceImage) throw new Error(`Required labeled image not found in ZIP: ${fileName}`);
  await cp(sourceImage, join(outputImages, fileName));
}

for (const page of imageMap.pages) {
  const pagePath = join(outputDir, page.file);
  let html = await readFile(pagePath, 'utf8');
  for (const replacement of page.replacements) {
    if (!html.includes(replacement.from)) {
      throw new Error(`Expected image placeholder was not found in ${page.file}: ${replacement.from.slice(0, 100)}`);
    }
    html = html.replace(replacement.from, replacement.to);
  }
  await writeFile(pagePath, html, 'utf8');
}

for (const fileName of imageMap.archive.files) {
  await stat(join(outputImages, fileName));
}

console.log(`EPIC Models & Talent built with ${imageMap.archive.files.length} labeled site images. Desktop: ${urls.desktop} Mobile: ${urls.mobile}`);
