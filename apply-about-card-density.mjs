import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const aboutPath = join(dist, 'about', 'index.html');
const stylesPath = join(dist, 'assets', 'styles.css');
const assetVersion = '20260809-about-card-density-v1';
const marker = '/* EPIC About Us card density v1 */';

let about = await readFile(aboutPath, 'utf8');
const valueCount = (about.match(/<div class="value-grid">[\s\S]*?<\/div>/g) || []).length;
const valueCardCount = (about.match(/<article><h3>(?:Talent First|Client Ready|Las Vegas Fluent|Long-Term Thinking)<\/h3>/g) || []).length;
if (valueCount !== 1 || valueCardCount !== 4) {
  throw new Error(`Expected one four-card About value grid; found ${valueCount} grid and ${valueCardCount} cards.`);
}
about = about
  .replace(/href="\/assets\/styles\.css(?:\?v=[^"]+)?"/, `href="/assets/styles.css?v=${assetVersion}"`)
  .replace(/src="\/assets\/app\.js(?:\?v=[^"]+)?"/, `src="/assets/app.js?v=${assetVersion}"`);
await writeFile(aboutPath, about, 'utf8');

let styles = await readFile(stylesPath, 'utf8');
if (styles.includes(marker)) throw new Error('About Us card density has already been applied.');
styles += `\n\n${marker}

/* Let the four About value cards size to their content. The restrained padding
   keeps the bordered grid substantial without the former empty vertical field. */
.value-grid article{
  min-height:0!important;
  display:flex;
  flex-direction:column;
  justify-content:flex-start!important;
  gap:clamp(12px,1.4vw,18px)!important;
  padding:clamp(26px,2.8vw,40px)!important;
}
.value-grid article h3{margin:0!important}
.value-grid article p{margin:0!important}

@media (max-width:780px){
  .value-grid article{
    padding:clamp(24px,7vw,34px)!important;
    gap:12px!important;
  }
}
`;
await writeFile(stylesPath, styles, 'utf8');

const finalAbout = await readFile(aboutPath, 'utf8');
if (!finalAbout.includes(`/assets/styles.css?v=${assetVersion}`)) {
  throw new Error('About stylesheet version was not updated.');
}
if (!styles.includes('.value-grid article{\n  min-height:0!important;')) {
  throw new Error('About card density styling was not installed.');
}

console.log('Tightened all four About Us value cards on mobile and desktop.');
