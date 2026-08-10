import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const indexPath = join(dist, 'index.html');
const stylesPath = join(dist, 'assets', 'styles.css');
const assetVersion = '20260809-homepage-gold-inlay-v1';
const marker = '/* EPIC homepage subtle gold inlay v1 */';

let index = await readFile(indexPath, 'utf8');
if (!index.includes('<body class="home-page" id="top">')) {
  throw new Error('Homepage body hook was not found.');
}
index = index
  .replace(/href="\/assets\/styles\.css(?:\?v=[^"]+)?"/, `href="/assets/styles.css?v=${assetVersion}"`)
  .replace(/src="\/assets\/app\.js(?:\?v=[^"]+)?"/, `src="/assets/app.js?v=${assetVersion}"`);
await writeFile(indexPath, index, 'utf8');

let styles = await readFile(stylesPath, 'utf8');
if (styles.includes(marker)) throw new Error('Homepage gold inlay has already been applied.');
styles += `\n\n${marker}

/* Keep the existing cinematic grain, then float an exceptionally light Art
   Deco diamond lattice across the homepage. The treatment is decorative only
   and remains quiet enough that photography, video, and copy retain priority. */
body.home-page .noise{
  opacity:1;
  background:none;
}
body.home-page .noise::before,
body.home-page .noise::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
}
body.home-page .noise::before{
  opacity:.035;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.95' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E");
}
body.home-page .noise::after{
  opacity:.038;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Cg fill='none' stroke='%23d4af37' stroke-linecap='square'%3E%3Cpath d='M150 -34 334 150 150 334 -34 150Z' stroke-width='.9' stroke-opacity='.72'/%3E%3Cpath d='M150 26 274 150 150 274 26 150Z' stroke-width='.65' stroke-opacity='.54'/%3E%3Cpath d='M150 88 212 150 150 212 88 150Z' stroke-width='.5' stroke-opacity='.42'/%3E%3Cpath d='M0 0 300 300M300 0 0 300' stroke-width='.38' stroke-opacity='.28'/%3E%3C/g%3E%3C/svg%3E");
  background-position:center top;
  background-size:300px 300px;
  mix-blend-mode:screen;
}
@media (max-width:780px){
  body.home-page .noise::after{
    opacity:.032;
    background-size:220px 220px;
  }
}
`;
await writeFile(stylesPath, styles, 'utf8');

const finalIndex = await readFile(indexPath, 'utf8');
if (!finalIndex.includes(`/assets/styles.css?v=${assetVersion}`)) {
  throw new Error('Homepage stylesheet version was not updated.');
}
if (!styles.includes(marker) || !styles.includes('body.home-page .noise::after')) {
  throw new Error('Homepage gold inlay styles were not installed.');
}

console.log('Added a very light gold Art Deco inlay across the homepage on desktop and mobile.');
