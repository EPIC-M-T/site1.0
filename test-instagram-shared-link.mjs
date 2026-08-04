import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const homepagePath = join(process.cwd(), 'dist', 'index.html');
const original = 'https://www.instagram.com/p/DaSwksAlF2T/embed/';
const sharedLinkEmbed = 'https://www.instagram.com/p/DaSwksAlF2T/embed/?utm_source=ig_web_copy_link&amp;igsh=NTc4MTIwNjQ2YQ%3D%3D';

let homepage = await readFile(homepagePath, 'utf8');
const occurrences = homepage.split(original).length - 1;

if (occurrences !== 1) {
  throw new Error(`Expected exactly one post #1 embed URL, found ${occurrences}.`);
}

homepage = homepage.replace(original, sharedLinkEmbed);

if (!homepage.includes(sharedLinkEmbed)) {
  throw new Error('The copied-link Instagram embed test was not installed.');
}

await writeFile(homepagePath, homepage, 'utf8');
console.log('Testing copied Instagram share token on post #1 only; layout and posts #2–#6 unchanged.');
