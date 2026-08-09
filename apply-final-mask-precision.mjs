import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const stylesPath = join(dist, 'assets', 'styles.css');
const assetVersion = '20260809-final-polish-v3';

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

const htmlFiles = await findHtml(dist);
for (const path of htmlFiles) {
  let html = await readFile(path, 'utf8');
  html = html.replace(/href="\/assets\/styles\.css(?:\?v=[^"]+)?"/, `href="/assets/styles.css?v=${assetVersion}"`);
  html = html.replace(/src="\/assets\/app\.js(?:\?v=[^"]+)?"/, `src="/assets/app.js?v=${assetVersion}"`);
  await writeFile(path, html, 'utf8');
}

const desktopMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 660 260'%3E%3Ctext x='330' y='228' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-size='300' font-weight='900' letter-spacing='-22'%3EEPIC%3C/text%3E%3C/svg%3E")`;
const mobileMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 460 1500'%3E%3Cg font-family='Arial Black,Arial,sans-serif' font-size='270' font-weight='900'%3E%3Ctext x='230' y='350' text-anchor='middle'%3EE%3C/text%3E%3Ctext x='230' y='650' text-anchor='middle'%3EP%3C/text%3E%3Ctext x='178' y='950' text-anchor='middle'%3EI%3C/text%3E%3Ctext x='230' y='1250' text-anchor='middle'%3EC%3C/text%3E%3C/g%3E%3C/svg%3E")`;

let styles = await readFile(stylesPath, 'utf8');
styles += `\n\n/* EPIC measured mask precision v3 */\n@media (min-width:781px){\n  .epic-mask-video{\n    -webkit-mask-image:${desktopMask}!important;\n    mask-image:${desktopMask}!important;\n    -webkit-mask-size:min(98vw,250svh) auto!important;\n    mask-size:min(98vw,250svh) auto!important;\n  }\n}\n@media (max-width:780px){\n  .epic-mask-video{\n    -webkit-mask-image:${mobileMask}!important;\n    mask-image:${mobileMask}!important;\n  }\n}\n`;
await writeFile(stylesPath, styles, 'utf8');

console.log(`Applied measured EPIC mask bounds and versioned assets across ${htmlFiles.length} generated pages.`);
