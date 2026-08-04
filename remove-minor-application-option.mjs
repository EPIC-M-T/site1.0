import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const applicationPath = join(process.cwd(), 'dist', 'become-talent', 'index.html');
let html = await readFile(applicationPath, 'utf8');
const option = '<option>Kids & Teens</option>';

if (!html.includes(option)) {
  throw new Error('Kids & Teens application option was not found for removal.');
}

html = html.replace(option, '');
await writeFile(applicationPath, html, 'utf8');

if (/kids\s*(?:&amp;|&|and)\s*teens|kids-and-teens/i.test(html)) {
  throw new Error('Kids & Teens still appears on the Become Talent page.');
}

console.log('Kids & Teens application category removed.');
