import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { basename, extname, join, relative } from 'node:path';

const root = process.cwd();
const archiveName = 'homepage-division-images.zip';
const archivePath = join(root, archiveName);
const tempDir = join(root, '.homepage-division-images');
const outputDir = join(root, 'dist');
const outputImages = join(outputDir, 'images');

try {
  const archiveStats = await stat(archivePath);
  if (archiveStats.size < 1024) throw new Error(`${archiveName} is unexpectedly small.`);
} catch (error) {
  if (error?.code === 'ENOENT') throw new Error(`${archiveName} is missing from the production branch.`);
  throw error;
}

await rm(tempDir, { recursive: true, force: true });
await mkdir(tempDir, { recursive: true });
await mkdir(outputImages, { recursive: true });

const unzip = spawnSync('unzip', ['-oq', archivePath, '-d', tempDir], { stdio: 'inherit' });
if (unzip.status !== 0) throw new Error(`Unable to extract ${archiveName}.`);

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(entryPath));
    else files.push(entryPath);
  }
  return files;
}

const supported = new Set(['.avif', '.jpeg', '.jpg', '.png', '.webp']);
const candidates = (await listFiles(tempDir)).filter((file) => {
  const rel = relative(tempDir, file);
  return supported.has(extname(file).toLowerCase()) &&
    !rel.includes('__MACOSX') &&
    !basename(file).startsWith('._');
});
if (!candidates.length) throw new Error(`${archiveName} contains no supported images.`);

function labelFor(file) {
  return relative(tempDir, file)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function detectVariant(label) {
  if (/\b(mobile|phone|portrait|vertical|mob)\b/.test(label) || /\b1080\b.*\b1440\b/.test(label)) return 'mobile';
  if (/\b(desktop|desk|landscape|horizontal|wide|pc)\b/.test(label) || /\b2880\b.*\b1200\b/.test(label)) return 'desktop';
  return null;
}

function detectCategory(label) {
  if (/\bdesktop homepage models 2\b/.test(label) || /\bmobile homepage talent\b/.test(label)) return null;
  if (/\bbrand\b.*\bambassadors?\b|\batmosphere\b/.test(label)) return 'brand-ambassadors';
  if (/\bevent\b.*\btalent\b|\bevent\b.*\bhosts?\b|\bhosts?\b.*\bvip\b/.test(label)) return 'event-talent';
  if (/\bspecialty\b|\bspeciality\b/.test(label)) return 'specialty-talent';
  if (/\bcreators?\b|\binfluencers?\b|\bugc\b/.test(label)) return 'creators';
  if (/\bmodels?\b|\bfashion\b|\bcommercial\b|\bswim\b/.test(label)) return 'models';
  return null;
}

const detected = new Map();
const ignored = [];
for (const file of candidates) {
  const label = labelFor(file);
  const category = detectCategory(label);
  const variant = detectVariant(label);
  if (!category || !variant) {
    ignored.push(relative(tempDir, file));
    continue;
  }
  const key = `${category}:${variant}`;
  if (detected.has(key)) {
    throw new Error(`Multiple files matched ${key}: ${relative(tempDir, detected.get(key))}, ${relative(tempDir, file)}`);
  }
  detected.set(key, file);
}

const divisions = [
  { key: 'models', alt: 'Models division' },
  { key: 'event-talent', alt: 'Event Talent division' },
  { key: 'creators', alt: 'Creators division' },
  { key: 'brand-ambassadors', alt: 'Brand Ambassadors division' },
  { key: 'specialty-talent', alt: 'Specialty Talent division' }
];

const missing = [];
for (const division of divisions) {
  for (const variant of ['desktop', 'mobile']) {
    if (!detected.has(`${division.key}:${variant}`)) missing.push(`${division.key}:${variant}`);
  }
}
if (missing.length) {
  const available = candidates.map((file) => relative(tempDir, file)).join(', ');
  const ignoredText = ignored.length ? ` Ignored: ${ignored.join(', ')}.` : '';
  throw new Error(`Could not match all responsive homepage images. Missing: ${missing.join(', ')}. Available: ${available}.${ignoredText}`);
}

const responsive = {};
for (const division of divisions) {
  responsive[division.key] = {};
  for (const variant of ['desktop', 'mobile']) {
    const source = detected.get(`${division.key}:${variant}`);
    const destination = `homepage-${division.key}-${variant}${extname(source).toLowerCase()}`;
    await cp(source, join(outputImages, destination));
    responsive[division.key][variant] = destination;
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const homepagePath = join(outputDir, 'index.html');
let homepage = await readFile(homepagePath, 'utf8');
for (const division of divisions) {
  const imagePattern = new RegExp(`<img\\s+src="[^"]+"\\s+alt="${escapeRegex(division.alt)}"\\s+loading="lazy"(?:\\s+decoding="async")?>`);
  if (!imagePattern.test(homepage)) throw new Error(`Homepage division image tag not found for ${division.alt}.`);
  const files = responsive[division.key];
  const picture = `<picture><source media="(max-width: 780px)" srcset="/images/${files.mobile}"><img src="/images/${files.desktop}" alt="${division.alt}" loading="lazy" decoding="async"></picture>`;
  homepage = homepage.replace(imagePattern, picture);
}
await writeFile(homepagePath, homepage, 'utf8');

for (const division of divisions) {
  await stat(join(outputImages, responsive[division.key].desktop));
  await stat(join(outputImages, responsive[division.key].mobile));
}

const summary = divisions.map((division) => {
  const desktop = relative(tempDir, detected.get(`${division.key}:desktop`));
  const mobile = relative(tempDir, detected.get(`${division.key}:mobile`));
  return `${division.key}=[${desktop} | ${mobile}]`;
}).join('; ');
console.log(`Responsive homepage division images installed: ${summary}`);
