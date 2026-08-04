import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const homepagePath = join(process.cwd(), 'dist', 'index.html');
let homepage = await readFile(homepagePath, 'utf8');

const iframePattern = /<iframe\s+class="instagram-native-frame"[\s\S]*?<\/iframe>/g;
const iframes = homepage.match(iframePattern) || [];

if (iframes.length !== 6) {
  throw new Error(`Expected exactly six Instagram iframe blocks, found ${iframes.length}.`);
}

const postOneIframe = iframes[0];
const postTwoIframe = iframes[1];

if (!postTwoIframe.includes('https://www.instagram.com/p/DbScVFgJWmd/embed/')) {
  throw new Error('Could not locate the known-working post #2 iframe URL.');
}

const clonedPostOneIframe = postTwoIframe
  .replace('https://www.instagram.com/p/DbScVFgJWmd/embed/', 'https://www.instagram.com/p/DaSwksAlF2T/embed/')
  .replace('title="EPIC Instagram post 2"', 'title="EPIC Instagram post 1"');

homepage = homepage.replace(postOneIframe, clonedPostOneIframe);

if (!homepage.includes('https://www.instagram.com/p/DaSwksAlF2T/embed/')) {
  throw new Error('Post #1 did not receive the cloned post #2 iframe structure.');
}
if (homepage.includes('utm_source=ig_web_copy_link') || homepage.includes('igsh=')) {
  throw new Error('A copied-link tracking token still remains in the post #1 iframe.');
}

await writeFile(homepagePath, homepage, 'utf8');
console.log('Post #1 now uses a literal clone of the working post #2 iframe markup; only shortcode and title differ.');
