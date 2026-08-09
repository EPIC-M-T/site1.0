import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const dist = join(process.cwd(), 'dist');
const stylesPath = join(dist, 'assets', 'styles.css');
const assetVersion = '20260809-final-polish-v4';

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

const mobilePreloaderSafety = `<script data-epic-mobile-preloader-safety>
  (() => {
    if (!window.matchMedia('(max-width: 780px)').matches) return;
    const finish = () => {
      const preloader = document.querySelector('[data-preloader]');
      if (preloader) preloader.classList.add('is-finished');
    };
    if (document.readyState === 'complete') window.setTimeout(finish, 280);
    else window.addEventListener('load', () => window.setTimeout(finish, 280), { once: true });
    window.setTimeout(finish, 2200);
  })();
</script>`;

const htmlFiles = await findHtml(dist);
let homepageUpdated = false;

for (const path of htmlFiles) {
  let html = await readFile(path, 'utf8');
  html = html.replace(/href="\/assets\/styles\.css(?:\?v=[^"]+)?"/, `href="/assets/styles.css?v=${assetVersion}"`);
  html = html.replace(/src="\/assets\/app\.js(?:\?v=[^"]+)?"/, `src="/assets/app.js?v=${assetVersion}"`);

  if (relative(dist, path).replaceAll('\\', '/') === 'index.html') {
    if (!html.includes('data-epic-mobile-preloader-safety')) {
      html = html.replace('</body>', `${mobilePreloaderSafety}\n</body>`);
    }
    homepageUpdated = true;
  }

  await writeFile(path, html, 'utf8');
}

/* The desktop canvas keeps the measured glyph crop but steps the visible word
   down by roughly 1.5%, enough to protect the C on very wide displays while
   retaining the nearly edge-to-edge impact. */
const desktopMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 660 260'%3E%3Ctext x='330' y='228' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-size='300' font-weight='900' letter-spacing='-22'%3EEPIC%3C/text%3E%3C/svg%3E")`;

/* Mobile becomes an evenly balanced 2x2 field. The SVG uses a phone-shaped
   canvas so the four letters consume almost the entire viewport without
   clipping or creating large empty bands. */
const mobileMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 560 1080'%3E%3Cg text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-size='400' font-weight='900'%3E%3Ctext x='145' y='460'%3EE%3C/text%3E%3Ctext x='415' y='460'%3EP%3C/text%3E%3Ctext x='145' y='970'%3EI%3C/text%3E%3Ctext x='415' y='970'%3EC%3C/text%3E%3C/g%3E%3C/svg%3E")`;

let styles = await readFile(stylesPath, 'utf8');
styles += `\n\n/* EPIC final hero precision v4 */\n
@media (min-width:781px){
  .epic-mask-video{
    -webkit-mask-image:${desktopMask}!important;
    mask-image:${desktopMask}!important;
    -webkit-mask-size:min(96.5vw,245svh) auto!important;
    mask-size:min(96.5vw,245svh) auto!important;
    -webkit-mask-position:center center!important;
    mask-position:center center!important;
  }

  /* Fill the hero canvas completely when the visit-long static fallback takes
     over. The landscape source remains centered and no side gutters remain. */
  .epic-static-hero,
  .epic-static-hero img{
    width:100%!important;
    height:100%!important;
  }
  .epic-static-hero img{
    object-fit:cover!important;
    object-position:center center!important;
  }
}

@media (max-width:780px){
  .epic-mask-video{
    -webkit-mask-image:${mobileMask}!important;
    mask-image:${mobileMask}!important;
    -webkit-mask-size:min(96vw,52svh) auto!important;
    mask-size:min(96vw,52svh) auto!important;
    -webkit-mask-position:center center!important;
    mask-position:center center!important;
    object-position:center center!important;
  }

  /* Use the same gold split-curtain loader as the interior page transitions.
     The separate white cinematic logo layer is omitted on mobile. */
  body.home-page .epic-liquid-intro{
    display:none!important;
  }
  body.home-page .preloader.split-preloader{
    display:grid!important;
  }

  /* Preserve a full-bleed static fallback on mobile as well. */
  .epic-static-hero img{
    object-fit:cover!important;
    object-position:center center!important;
  }

  /* The prior last-child reset had greater specificity than strong+strong.
     Explicitly restore the divider between second and third place. */
  .bikini-prize-ribbon>strong:last-child{
    border-left:1px solid rgba(212,175,55,.38)!important;
  }
}
`;
await writeFile(stylesPath, styles, 'utf8');

if (!homepageUpdated) throw new Error('Homepage mobile preloader safety was not installed.');
if (!styles.includes('min(96.5vw,245svh)')) throw new Error('Desktop mask reduction was not installed.');
if (!styles.includes('viewBox=\'0 0 560 1080\'')) throw new Error('Mobile 2x2 EPIC mask was not installed.');
if (!styles.includes('body.home-page .preloader.split-preloader')) throw new Error('Mobile split preloader was not restored.');
if (!styles.includes('.bikini-prize-ribbon>strong:last-child')) throw new Error('Final prize divider was not restored.');

console.log(`Applied final EPIC hero precision, mobile 2x2 mask, split loader, static cover fill, and prize divider across ${htmlFiles.length} generated pages.`);
