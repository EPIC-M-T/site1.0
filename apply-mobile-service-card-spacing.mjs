import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const servicesPath = join(dist, 'services', 'index.html');
const stylesPath = join(dist, 'assets', 'styles.css');
const assetVersion = '20260809-mobile-services-brief-v1';
const marker = '/* EPIC mobile Services card action spacing v1 */';

let services = await readFile(servicesPath, 'utf8');
const briefCount = (services.match(/>Build a brief →<\/a>/g) || []).length;
if (briefCount !== 6) {
  throw new Error(`Expected 6 Services card links, found ${briefCount}.`);
}
services = services
  .replace(/href="\/assets\/styles\.css(?:\?v=[^"]+)?"/, `href="/assets/styles.css?v=${assetVersion}"`)
  .replace(/src="\/assets\/app\.js(?:\?v=[^"]+)?"/, `src="/assets/app.js?v=${assetVersion}"`);
await writeFile(servicesPath, services, 'utf8');

let styles = await readFile(stylesPath, 'utf8');
if (styles.includes(marker)) throw new Error('Mobile Services card spacing has already been applied.');
styles += `\n\n${marker}

/* Keep each mobile card action in normal document flow so longer descriptions
   can never collide with the Build a Brief link. Desktop retains the anchored
   card-action treatment. */
@media (max-width:780px){
  .service-card{
    min-height:auto!important;
    padding-bottom:clamp(34px,9vw,52px)!important;
  }
  .service-card>a{
    position:static!important;
    display:inline-flex;
    width:max-content;
    max-width:100%;
    margin-top:clamp(22px,6vw,32px);
    align-items:center;
  }
}
`;
await writeFile(stylesPath, styles, 'utf8');

const finalServices = await readFile(servicesPath, 'utf8');
if (!finalServices.includes(`/assets/styles.css?v=${assetVersion}`)) {
  throw new Error('Services stylesheet version was not updated.');
}
if (!styles.includes('.service-card>a{\n    position:static!important;')) {
  throw new Error('Mobile Services card action spacing was not installed.');
}

console.log('Moved all six mobile Services card actions into collision-safe document flow.');
