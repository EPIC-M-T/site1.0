import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const stylesPath = join(dist, 'assets', 'styles.css');
const pagePaths = [join(dist, 'index.html'), join(dist, '404.html')];
const assetVersion = '20260809-mobile-bikini-prize-pool-v2';
const marker = '/* EPIC mobile Bikini Contest prize-pool layout v2 */';
const prizePoolUrl = 'https://avd0q6zau931hwsb.public.blob.vercel-storage.com/epic-models-%26-talent/Prize-pool.webp';

const artFrameNeedle = `          <div class="bikini-art-scrim" aria-hidden="true"></div>\n        </div>\n        <div class="bikini-prize-ribbon" aria-label="Official prize pool">`;
const artFrameReplacement = `          <div class="bikini-art-scrim" aria-hidden="true"></div>\n        </div>\n        <img class="bikini-mobile-prize-pool" src="${prizePoolUrl}" alt="EPIC Bikini Contest prize pool" loading="lazy" decoding="async">\n        <div class="bikini-prize-ribbon" aria-label="Official prize pool">`;

for (const pagePath of pagePaths) {
  let html = await readFile(pagePath, 'utf8');
  if (!html.includes('class="bikini-feature section-pad"')) {
    throw new Error(`Bikini Contest section was not found in ${pagePath}.`);
  }
  if (html.includes('bikini-mobile-prize-pool')) {
    throw new Error(`Mobile prize-pool image was already installed in ${pagePath}.`);
  }
  if (!html.includes(artFrameNeedle)) {
    throw new Error(`Bikini motion-logo frame was not found in ${pagePath}.`);
  }

  html = html.replace(artFrameNeedle, artFrameReplacement);
  html = html
    .replace(/href="\/assets\/styles\.css(?:\?v=[^"]+)?"/, `href="/assets/styles.css?v=${assetVersion}"`)
    .replace(/src="\/assets\/app\.js(?:\?v=[^"]+)?"/, `src="/assets/app.js?v=${assetVersion}"`);
  await writeFile(pagePath, html, 'utf8');
}

let styles = await readFile(stylesPath, 'utf8');
if (styles.includes(marker)) throw new Error('Mobile Bikini Contest prize-pool layout has already been applied.');
styles += `\n\n${marker}

/* The supplied prize-pool artwork is a mobile-only companion to the animated
   contest logo. Desktop retains the established two-column section and prize
   ribbon. */
.bikini-mobile-prize-pool{display:none}

@media (max-width:780px){
  .bikini-feature-shell{
    display:flex!important;
    flex-direction:column!important;
  }
  .bikini-feature-art{
    order:-1!important;
    width:100%!important;
    margin:0 auto!important;
  }
  .bikini-feature-copy{order:0!important}
  .bikini-mobile-prize-pool{
    display:block;
    width:100%;
    height:auto;
    margin:14px auto 0;
    object-fit:contain;
  }
  .bikini-prize-ribbon{display:none!important}

  /* The supplied artwork now carries the complete mobile prize story, so the
     legacy highlight row—including Fan Vote / Meet the Girls—is omitted. */
  .bikini-facts{display:none!important}
}
`;
await writeFile(stylesPath, styles, 'utf8');

for (const pagePath of pagePaths) {
  const html = await readFile(pagePath, 'utf8');
  if (!html.includes(`class="bikini-mobile-prize-pool" src="${prizePoolUrl}"`)) {
    throw new Error(`Mobile prize-pool image verification failed for ${pagePath}.`);
  }
  if (!html.includes(`/assets/styles.css?v=${assetVersion}`)) {
    throw new Error(`Stylesheet version verification failed for ${pagePath}.`);
  }
}
if (!styles.includes('.bikini-feature-art{\n    order:-1!important;')) {
  throw new Error('Mobile Bikini Contest ordering was not installed.');
}
if (!styles.includes('.bikini-prize-ribbon{display:none!important}')) {
  throw new Error('Legacy mobile prize ribbon was not disabled.');
}
if (!styles.includes('.bikini-facts{display:none!important}')) {
  throw new Error('Legacy mobile contest highlight row was not disabled.');
}

console.log('Installed the mobile Bikini Contest logo-first layout, supplied prize-pool artwork, and removed the legacy highlight row.');
