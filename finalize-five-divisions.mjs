import { readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const outputDir = join(process.cwd(), 'dist');

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else files.push(path);
  }
  return files;
}

const oldMarker = '<span class="division-index">06</span><div class="division-copy"><p>Dancers · Athletes · Specialty Acts</p>';
const newMarker = '<span class="division-index">05</span><div class="division-copy"><p>Dancers · Athletes · Specialty Acts</p>';

for (const file of (await listFiles(outputDir)).filter((path) => extname(path).toLowerCase() === '.html')) {
  const html = await readFile(file, 'utf8');
  const updated = html.replaceAll(oldMarker, newMarker);
  if (updated !== html) await writeFile(file, updated, 'utf8');
}

const homepage = await readFile(join(outputDir, 'index.html'), 'utf8');
if (!homepage.includes(newMarker) || homepage.includes(oldMarker)) {
  throw new Error('Specialty Talent division was not renumbered to 05.');
}

console.log('Five homepage divisions numbered sequentially from 01 through 05.');
