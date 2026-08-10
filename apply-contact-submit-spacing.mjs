import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const contactPath = join(dist, 'contact', 'index.html');
const stylesPath = join(dist, 'assets', 'styles.css');
const assetVersion = '20260809-contact-submit-spacing-v1';
const marker = '/* EPIC Contact submit spacing v1 */';

let contact = await readFile(contactPath, 'utf8');
if (!contact.includes('<button class="button button-gold magnetic" type="submit"><span>Send Casting Brief</span></button>')) {
  throw new Error('Send Casting Brief button was not found on the Contact page.');
}
contact = contact
  .replace(/href="\/assets\/styles\.css(?:\?v=[^"]+)?"/, `href="/assets/styles.css?v=${assetVersion}"`)
  .replace(/src="\/assets\/app\.js(?:\?v=[^"]+)?"/, `src="/assets/app.js?v=${assetVersion}"`);
await writeFile(contactPath, contact, 'utf8');

let styles = await readFile(stylesPath, 'utf8');
if (styles.includes(marker)) throw new Error('Contact submit spacing has already been applied.');
styles += `\n\n${marker}

/* Separate the primary Contact action from the consent copy at every viewport. */
.client-form>button[type="submit"]{
  margin-top:clamp(30px,4vw,44px)!important;
}
`;
await writeFile(stylesPath, styles, 'utf8');

const finalContact = await readFile(contactPath, 'utf8');
if (!finalContact.includes(`/assets/styles.css?v=${assetVersion}`)) {
  throw new Error('Contact stylesheet version was not updated.');
}
if (!styles.includes('.client-form>button[type="submit"]{\n  margin-top:clamp(30px,4vw,44px)!important;')) {
  throw new Error('Contact submit spacing was not installed.');
}

console.log('Added responsive clearance above the Contact page Send Casting Brief button.');
