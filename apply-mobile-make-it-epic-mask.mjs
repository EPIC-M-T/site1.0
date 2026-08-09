import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const stylesPath = join(dist, 'assets', 'styles.css');
const assetVersion = '20260809-mobile-make-it-epic-v3';

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

/* Mobile-only MAKE / IT / EPIC knockout mask. The portrait canvas and three
   measured baselines keep the type large, balanced, and safe across narrow and
   short phones while leaving the desktop hero completely untouched. */
const mobileMakeItEpicMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 1440'%3E%3Cg text-anchor='middle' font-family='Arial%20Black,Arial,sans-serif' font-weight='900'%3E%3Ctext x='360' y='408' font-size='245' letter-spacing='-14'%3EMAKE%3C/text%3E%3Ctext x='360' y='820' font-size='250' letter-spacing='-10'%3EIT%3C/text%3E%3Ctext x='360' y='1255' font-size='270' letter-spacing='-18'%3EEPIC%3C/text%3E%3C/g%3E%3C/svg%3E")`;

const htmlFiles = await findHtml(dist);
for (const path of htmlFiles) {
  let html = await readFile(path, 'utf8');
  html = html.replace(/href="\/assets\/styles\.css(?:\?v=[^"]+)?"/, `href="/assets/styles.css?v=${assetVersion}"`);
  html = html.replace(/src="\/assets\/app\.js(?:\?v=[^"]+)?"/, `src="/assets/app.js?v=${assetVersion}"`);
  await writeFile(path, html, 'utf8');
}

let styles = await readFile(stylesPath, 'utf8');
styles += `\n\n/* EPIC mobile MAKE IT EPIC mask tuning v3 — 25% spacing restored */\n
@media (max-width:780px){
  .epic-mask-video{
    -webkit-mask-image:${mobileMakeItEpicMask}!important;
    mask-image:${mobileMakeItEpicMask}!important;
    -webkit-mask-repeat:no-repeat!important;
    mask-repeat:no-repeat!important;
    -webkit-mask-size:min(97vw,50svh) auto!important;
    mask-size:min(97vw,50svh) auto!important;
    -webkit-mask-position:center 50%!important;
    mask-position:center 50%!important;
    object-position:center center!important;
    transform-origin:center center!important;
  }
}

/* Give very narrow phones slightly more usable letter area without allowing
   the portrait mask to clip vertically. */
@media (max-width:360px){
  .epic-mask-video{
    -webkit-mask-size:min(98vw,49.5svh) auto!important;
    mask-size:min(98vw,49.5svh) auto!important;
  }
}

/* Short mobile viewports are height-constrained first, preserving all three
   lines and keeping the composition vertically centered. */
@media (max-width:780px) and (max-height:620px){
  .epic-mask-video{
    -webkit-mask-size:min(95vw,49svh) auto!important;
    mask-size:min(95vw,49svh) auto!important;
    -webkit-mask-position:center 50%!important;
    mask-position:center 50%!important;
  }
}
`;

await writeFile(stylesPath, styles, 'utf8');

if (!styles.includes("viewBox='0 0 720 1440'")) throw new Error('MAKE IT EPIC mobile mask was not installed.');
if (!styles.includes("%3EMAKE%3C/text%3E")) throw new Error('MAKE line is missing from the mobile mask.');
if (!styles.includes("%3EIT%3C/text%3E")) throw new Error('IT line is missing from the mobile mask.');
if (!styles.includes("%3EEPIC%3C/text%3E")) throw new Error('EPIC line is missing from the mobile mask.');
if (!styles.includes("y='408' font-size='245'")) throw new Error('MAKE baseline is not using the restored spacing.');
if (!styles.includes("y='1255' font-size='270'")) throw new Error('EPIC baseline is not using the restored spacing.');
if (!styles.includes('min(97vw,50svh)')) throw new Error('Primary mobile mask sizing was not installed.');
if (!styles.includes('min(98vw,49.5svh)')) throw new Error('Narrow-phone mask tuning was not installed.');

console.log(`Applied the tuned MAKE / IT / EPIC mobile hero mask across ${htmlFiles.length} generated pages; desktop hero remains unchanged.`);
