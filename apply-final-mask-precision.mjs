import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const dist = join(process.cwd(), 'dist');
const stylesPath = join(dist, 'assets', 'styles.css');
const assetVersion = '20260809-final-polish-v6';
const brandLogo = 'https://assets.cdn.filesafe.space/YzjwmP6zpvDUp28hrM1o/media/6877effcc00dfc571e6a416c.png';

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

/* A dedicated desktop curtain is independent of the hero video's original
   liquid-intro lifecycle. The duplicated full-width logo is clipped by each
   half, so the complete gold mark physically separates at the center seam. */
const desktopBrandCurtain = `<div class="epic-desktop-brand-curtain" data-epic-desktop-brand-curtain aria-hidden="true">
  <div class="epic-brand-curtain-half epic-brand-curtain-left"><div class="epic-brand-curtain-content"></div></div>
  <div class="epic-brand-curtain-half epic-brand-curtain-right"><div class="epic-brand-curtain-content"></div></div>
  <div class="epic-brand-curtain-seam" aria-hidden="true"></div>
</div>`;

const desktopCurtainSafety = `<script data-epic-desktop-curtain-safety>
  (() => {
    if (window.matchMedia('(max-width: 780px)').matches) return;

    const curtain = document.querySelector('[data-epic-desktop-brand-curtain]');
    if (!curtain) return;

    const startedAt = performance.now();
    let released = false;

    const unlock = () => {
      document.documentElement.classList.remove('is-loading');
      document.body && document.body.classList.remove('is-loading');
      document.documentElement.style.removeProperty('overflow');
      if (document.body) document.body.style.removeProperty('overflow');
    };

    const release = () => {
      if (released) return;
      released = true;
      unlock();
      curtain.classList.add('is-open');
      document.documentElement.classList.add('epic-video-ready');
      window.setTimeout(() => curtain.remove(), 1200);
    };

    const requestRelease = () => {
      const elapsed = performance.now() - startedAt;
      window.setTimeout(release, Math.max(0, 950 - elapsed));
    };

    const video = document.querySelector('[data-epic-mask-video]');
    if (video) {
      video.addEventListener('loadeddata', requestRelease, { once: true });
      video.addEventListener('canplay', requestRelease, { once: true });
      if (video.readyState >= 2) requestRelease();
    }

    if (document.readyState === 'complete') requestRelease();
    else window.addEventListener('load', requestRelease, { once: true });

    window.setTimeout(release, 1900);
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) release();
    }, { once: true });
  })();
</script>`;

const htmlFiles = await findHtml(dist);
let homepageUpdated = false;

for (const path of htmlFiles) {
  let html = await readFile(path, 'utf8');
  html = html.replace(/href="\/assets\/styles\.css(?:\?v=[^"]+)?"/, `href="/assets/styles.css?v=${assetVersion}"`);
  html = html.replace(/src="\/assets\/app\.js(?:\?v=[^"]+)?"/, `src="/assets/app.js?v=${assetVersion}"`);

  if (relative(dist, path).replaceAll('\\', '/') === 'index.html') {
    if (!html.includes('data-epic-desktop-brand-curtain')) {
      html = html.replace(/(<body[^>]*class="[^"]*home-page[^"]*"[^>]*>)/, `$1\n${desktopBrandCurtain}`);
    }
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

/* The previous SVG canvas was narrower than the rendered Arial Black word,
   so the C could be clipped inside the mask image before CSS positioning was
   applied. This wider canvas preserves the near-edge-to-edge impact while
   giving both outer glyphs real internal clearance. */
const desktopMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 270'%3E%3Ctext x='352' y='238' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-size='300' font-weight='900' letter-spacing='-22'%3EEPIC%3C/text%3E%3C/svg%3E")`;

/* Mobile remains the approved evenly balanced 2x2 field while the user decides
   whether to refine that composition further. */
const mobileMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 560 1080'%3E%3Cg text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-size='400' font-weight='900'%3E%3Ctext x='145' y='460'%3EE%3C/text%3E%3Ctext x='415' y='460'%3EP%3C/text%3E%3Ctext x='145' y='970'%3EI%3C/text%3E%3Ctext x='415' y='970'%3EC%3C/text%3E%3C/g%3E%3C/svg%3E")`;

let styles = await readFile(stylesPath, 'utf8');
styles += `\n\n/* EPIC final hero precision v6 */\n
@media (min-width:781px){
  .epic-mask-video{
    -webkit-mask-image:${desktopMask}!important;
    mask-image:${desktopMask}!important;
    -webkit-mask-size:min(99vw,250svh) auto!important;
    mask-size:min(99vw,250svh) auto!important;
    -webkit-mask-position:center center!important;
    mask-position:center center!important;
  }

  /* Retire the two competing legacy homepage loaders on desktop. The dedicated
     branded curtain below is the single visible and independently released
     loading experience. */
  body.home-page .epic-liquid-intro,
  body.home-page .preloader.split-preloader{
    display:none!important;
  }

  .epic-desktop-brand-curtain{
    position:fixed!important;
    inset:0!important;
    z-index:100000!important;
    overflow:hidden!important;
    pointer-events:none!important;
    background:#030303!important;
  }
  .epic-brand-curtain-half{
    position:absolute!important;
    top:0!important;
    bottom:0!important;
    width:50%!important;
    overflow:hidden!important;
    background:#030303!important;
    transition:transform 1.05s cubic-bezier(.76,0,.24,1)!important;
    will-change:transform!important;
  }
  .epic-brand-curtain-left{left:0!important}
  .epic-brand-curtain-right{right:0!important}
  .epic-brand-curtain-content{
    position:absolute!important;
    top:50%!important;
    width:100vw!important;
    height:min(180px,22vw)!important;
    transform:translateY(-50%)!important;
    background-image:url('${brandLogo}')!important;
    background-position:center!important;
    background-repeat:no-repeat!important;
    background-size:contain!important;
    filter:drop-shadow(0 0 24px rgba(212,175,55,.28))!important;
  }
  .epic-brand-curtain-left .epic-brand-curtain-content{left:0!important}
  .epic-brand-curtain-right .epic-brand-curtain-content{right:0!important}
  .epic-brand-curtain-seam{
    position:absolute!important;
    top:0!important;
    bottom:0!important;
    left:50%!important;
    width:1px!important;
    background:linear-gradient(to bottom,transparent 0%,rgba(212,175,55,.72) 18%,rgba(212,175,55,.72) 82%,transparent 100%)!important;
    box-shadow:0 0 18px rgba(212,175,55,.32)!important;
    transition:opacity .22s ease!important;
  }
  .epic-desktop-brand-curtain.is-open .epic-brand-curtain-left{transform:translateX(-101%)!important}
  .epic-desktop-brand-curtain.is-open .epic-brand-curtain-right{transform:translateX(101%)!important}
  .epic-desktop-brand-curtain.is-open .epic-brand-curtain-seam{opacity:0!important}

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
  .epic-desktop-brand-curtain{display:none!important}

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

if (!homepageUpdated) throw new Error('Homepage curtain system was not installed.');
if (!styles.includes("viewBox='0 0 720 270'")) throw new Error('Widened desktop mask canvas was not installed.');
if (!styles.includes('min(99vw,250svh)')) throw new Error('Desktop mask sizing was not installed.');
if (!styles.includes('.epic-desktop-brand-curtain')) throw new Error('Dedicated branded desktop curtain styles were not installed.');
if (!styles.includes("background-image:url('https://assets.cdn.filesafe.space")) throw new Error('Gold EPIC curtain logo was not installed.');
if (!styles.includes("viewBox='0 0 560 1080'")) throw new Error('Mobile 2x2 EPIC mask was not preserved.');
if (!styles.includes('.bikini-prize-ribbon>strong:last-child')) throw new Error('Final prize divider was not preserved.');

console.log(`Restored a visible gold desktop curtain, widened the desktop EPIC mask canvas, and preserved the approved mobile hero across ${htmlFiles.length} generated pages.`);
