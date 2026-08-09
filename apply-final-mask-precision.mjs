import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const dist = join(process.cwd(), 'dist');
const stylesPath = join(dist, 'assets', 'styles.css');
const assetVersion = '20260809-final-polish-v5';

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

/* Desktop receives an independent release path that does not depend on the hero
   video's loadeddata/canplay events. This prevents the homepage curtain from
   ever remaining over the hero when autoplay, decoding, or a browser extension
   delays those media events. */
const desktopCurtainSafety = `<script data-epic-desktop-curtain-safety>
  (() => {
    if (window.matchMedia('(max-width: 780px)').matches) return;

    let released = false;
    const release = () => {
      if (released) return;
      released = true;

      document.documentElement.classList.add('epic-video-ready');
      const intro = document.querySelector('[data-epic-liquid-intro]');
      if (!intro) return;

      intro.setAttribute('aria-hidden', 'true');
      window.setTimeout(() => intro.remove(), 1050);
    };

    const schedule = () => window.setTimeout(release, 900);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', schedule, { once: true });
    } else {
      schedule();
    }

    window.setTimeout(release, 2100);
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
    if (!html.includes('data-epic-desktop-curtain-safety')) {
      html = html.replace('</body>', `${desktopCurtainSafety}\n</body>`);
    }
    homepageUpdated = true;
  }

  await writeFile(path, html, 'utf8');
}

/* Preserve the measured desktop glyph canvas while moving the complete word a
   fraction left and reducing it by one additional percentage point. This uses
   the available left-side breathing room to protect the C on wide displays. */
const desktopMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 660 260'%3E%3Ctext x='330' y='228' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-size='300' font-weight='900' letter-spacing='-22'%3EEPIC%3C/text%3E%3C/svg%3E")`;

/* Mobile remains the approved evenly balanced 2x2 field while the user decides
   whether to refine that composition further. */
const mobileMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 560 1080'%3E%3Cg text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-size='400' font-weight='900'%3E%3Ctext x='145' y='460'%3EE%3C/text%3E%3Ctext x='415' y='460'%3EP%3C/text%3E%3Ctext x='145' y='970'%3EI%3C/text%3E%3Ctext x='415' y='970'%3EC%3C/text%3E%3C/g%3E%3C/svg%3E")`;

let styles = await readFile(stylesPath, 'utf8');
styles += `\n\n/* EPIC final hero precision v5 */\n
@media (min-width:781px){
  .epic-mask-video{
    -webkit-mask-image:${desktopMask}!important;
    mask-image:${desktopMask}!important;
    -webkit-mask-size:min(95.5vw,242svh) auto!important;
    mask-size:min(95.5vw,242svh) auto!important;
    -webkit-mask-position:calc(50% - .9vw) center!important;
    mask-position:calc(50% - .9vw) center!important;
  }

  /* The desktop homepage curtain is deliberately graphic and minimal. Remove
     the white EPIC composition and let the two matte-black halves separate. */
  body.home-page .epic-split-intro .preloader-center-split{
    display:none!important;
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

if (!homepageUpdated) throw new Error('Homepage curtain safety was not installed.');
if (!styles.includes('min(95.5vw,242svh)')) throw new Error('Desktop mask clearance was not installed.');
if (!styles.includes('calc(50% - .9vw)')) throw new Error('Desktop mask recentering was not installed.');
if (!styles.includes('body.home-page .epic-split-intro .preloader-center-split')) throw new Error('Desktop white loader content was not removed.');
if (!styles.includes('viewBox=\'0 0 560 1080\'')) throw new Error('Mobile 2x2 EPIC mask was not preserved.');
if (!styles.includes('.bikini-prize-ribbon>strong:last-child')) throw new Error('Final prize divider was not preserved.');

console.log(`Applied desktop curtain fail-safe, removed white loader content, cleared the C edge, and preserved the approved mobile hero across ${htmlFiles.length} generated pages.`);
