import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const assetVersion = '20260809-sitewide-polish-v1';

const centerContent = `<div class="preloader-center preloader-center-split"><div class="preloader-mark">E</div><p>EPIC</p><span>LAS VEGAS MODELS &amp; TALENT</span></div>`;
const splitPreloader = `<div class="preloader split-preloader" data-preloader aria-hidden="true"><div class="preloader-curtain preloader-left preloader-half">${centerContent}</div><div class="preloader-curtain preloader-right preloader-half">${centerContent}</div></div>`;
const originalPreloader = '<div class="preloader" data-preloader aria-hidden="true"><div class="preloader-curtain preloader-left"></div><div class="preloader-curtain preloader-right"></div><div class="preloader-center"><div class="preloader-mark">E</div><p>EPIC</p><span>LAS VEGAS MODELS &amp; TALENT</span></div></div>';

async function findHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await findHtml(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

const allHtml = await findHtml(dist);
const nestedHtml = allHtml.filter((path) => relative(dist, path).includes('/'));
if (nestedHtml.length < 5) throw new Error(`Expected nested generated pages, found ${nestedHtml.length}.`);

let homeLinks = 0;
let removedNumbers = 0;

for (const path of nestedHtml) {
  const page = relative(dist, path).replaceAll('\\', '/');
  let html = await readFile(path, 'utf8');

  html = html.replace(
    /(<nav aria-label="Mobile navigation">)(?!\s*<a[^>]+href="\/"[^>]*>Home<\/a>)/,
    '$1<a class="nav-link" href="/">Home</a>'
  );
  if (html.includes('<a class="nav-link" href="/">Home</a>')) homeLinks += 1;

  html = html.replace(originalPreloader, splitPreloader);
  html = html.replace(/<p class="eyebrow">\s*Client Notes\s*<\/p>/g, '');
  html = html.replace(
    /<h2>Make the moment<br><em>impossible to ignore\.<\/em><\/h2>/g,
    '<h2>Make it flawless.<br><em>Make it EPIC.</em></h2>'
  );
  html = html.replace(/<(span|b)([^>]*)>\s*0[1-9]\s*<\/\1>/g, () => {
    removedNumbers += 1;
    return '';
  });

  html = html.replace(/href="\/assets\/styles\.css(?:\?v=[^"]+)?"/, `href="/assets/styles.css?v=${assetVersion}"`);
  html = html.replace(/src="\/assets\/app\.js(?:\?v=[^"]+)?"/, `src="/assets/app.js?v=${assetVersion}"`);

  if (html.includes(originalPreloader)) throw new Error(`Legacy preloader remains in ${page}.`);
  if (!html.includes('Make it flawless.')) throw new Error(`Footer tagline was not updated in ${page}.`);
  await writeFile(path, html, 'utf8');
}

if (homeLinks !== nestedHtml.length) throw new Error(`Installed ${homeLinks} nested Home links for ${nestedHtml.length} pages.`);
if (removedNumbers < 10) throw new Error(`Only ${removedNumbers} nested decorative number labels were removed.`);

console.log(`Applied nested sitewide polish to ${nestedHtml.length} pages; removed ${removedNumbers} decorative number labels and installed ${homeLinks} Home links.`);
