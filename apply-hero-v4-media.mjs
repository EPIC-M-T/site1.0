import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const homepagePath = join(root, 'dist', 'index.html');
const stylesPath = join(root, 'dist', 'assets', 'styles.css');
const heroUrls = JSON.parse(await readFile(join(root, 'hero-urls.json'), 'utf8'));

for (const key of ['desktop', 'desktopType', 'desktopStatic', 'mobile', 'mobileType', 'mobileStatic']) {
  if (!heroUrls[key]) throw new Error(`Missing hero media configuration: ${key}`);
}

let homepage = await readFile(homepagePath, 'utf8');

// The original cinematic builder used MP4 for both source tags. Correct the
// mobile MIME type now that the final mobile asset is WebM.
const mobileSourcePattern = new RegExp(
  `<source media="\\(max-width: 767px\\)" src="${heroUrls.mobile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" type="video/mp4">`
);
homepage = homepage.replace(
  mobileSourcePattern,
  `<source media="(max-width: 767px)" src="${heroUrls.mobile}" type="${heroUrls.mobileType}">`
);

const breakoutTag = `<video class="epic-breakout-video" muted loop playsinline preload="none" aria-hidden="true" data-epic-full-video data-mobile-src="${heroUrls.mobile}" data-desktop-src="${heroUrls.desktop}"></video>`;
if (!homepage.includes(breakoutTag)) {
  throw new Error('Final hero breakout video tag was not found.');
}

const staticPicture = `${breakoutTag}\n      <picture class="epic-static-hero" data-epic-static-hero aria-hidden="true" data-mobile-static="${heroUrls.mobileStatic}" data-desktop-static="${heroUrls.desktopStatic}">\n        <source media="(max-width: 780px)" data-epic-static-mobile>\n        <img alt="" width="1920" height="1080" decoding="async" loading="lazy" data-epic-static-image>\n      </picture>`;
homepage = homepage.replace(breakoutTag, staticPicture);

const declarationsNeedle = `      const bikiniSection = document.querySelector('.bikini-feature');`;
const declarationsReplacement = `${declarationsNeedle}\n      const staticHero = document.querySelector('[data-epic-static-hero]');\n      const staticImage = staticHero && staticHero.querySelector('[data-epic-static-image]');\n      const staticMobileSource = staticHero && staticHero.querySelector('[data-epic-static-mobile]');`;
if (!homepage.includes(declarationsNeedle)) {
  throw new Error('Hero runtime declarations were not found for static media wiring.');
}
homepage = homepage.replace(declarationsNeedle, declarationsReplacement);

const playNeedle = `      const safePlay = (video) => video.play().catch(() => {});\n      safePlay(maskVideo);`;
const playReplacement = `      const safePlay = (video) => video.play().catch(() => {});\n\n      let staticLoadStarted = false;\n      const loadStaticHero = () => {\n        if (staticLoadStarted || !staticHero || !staticImage) return;\n        staticLoadStarted = true;\n        if (staticMobileSource) staticMobileSource.srcset = staticHero.dataset.mobileStatic;\n        staticImage.src = mobile ? staticHero.dataset.mobileStatic : staticHero.dataset.desktopStatic;\n      };\n\n      // Use the matching still as the initial poster while the first video frame\n      // decodes, without forcing the full-size fallback to download twice.\n      maskVideo.poster = mobile ? staticHero?.dataset.mobileStatic || '' : staticHero?.dataset.desktopStatic || '';\n      safePlay(maskVideo);`;
if (!homepage.includes(playNeedle)) {
  throw new Error('Hero safePlay initialization was not found.');
}
homepage = homepage.replace(playNeedle, playReplacement);

const freezePattern = /      const freezeHero = \(\) => \{[\s\S]*?      const resetHeroForReturn = \(\) => \{[\s\S]*?      \};/;
if (!freezePattern.test(homepage)) {
  throw new Error('Hero freeze/reset runtime was not found.');
}

const freezeReplacement = `      const freezeHero = () => {\n        if (hero.classList.contains('is-static')) return;\n        loadStaticHero();\n        loadBreakout();\n\n        let settled = false;\n        const finishFreeze = (hasStaticImage) => {\n          if (settled) return;\n          settled = true;\n          maskVideo.pause();\n          fullVideo.pause();\n          hero.classList.toggle('has-static-image', Boolean(hasStaticImage));\n          hero.classList.add('is-static');\n        };\n\n        if (staticImage && staticImage.complete && staticImage.naturalWidth > 0) {\n          finishFreeze(true);\n          return;\n        }\n\n        if (staticImage) {\n          staticImage.addEventListener('load', () => finishFreeze(true), { once: true });\n          staticImage.addEventListener('error', () => finishFreeze(false), { once: true });\n        }\n        window.setTimeout(() => finishFreeze(Boolean(staticImage && staticImage.complete && staticImage.naturalWidth > 0)), 1800);\n      };\n\n      const resetHeroForReturn = () => {\n        hero.classList.remove('is-static', 'has-static-image');\n        safePlay(maskVideo);\n        if (breakoutLoaded) safePlay(fullVideo);\n      };`;
homepage = homepage.replace(freezePattern, freezeReplacement);

const observerNeedle = `      if (bikiniSection && 'IntersectionObserver' in window) {\n        const freezeObserver = new IntersectionObserver((entries) => {`;
const observerReplacement = `      if (bikiniSection && 'IntersectionObserver' in window) {\n        // Prime the still shortly before the Bikini Contest section arrives so\n        // the video-to-image handoff is immediate and does not compete at boot.\n        const staticPreloadObserver = new IntersectionObserver((entries) => {\n          if (!entries.some((entry) => entry.isIntersecting)) return;\n          staticPreloadObserver.disconnect();\n          loadStaticHero();\n        }, { rootMargin: '1100px 0px' });\n        staticPreloadObserver.observe(bikiniSection);\n\n        const freezeObserver = new IntersectionObserver((entries) => {`;
if (!homepage.includes(observerNeedle)) {
  throw new Error('Bikini observer was not found for static-image preloading.');
}
homepage = homepage.replace(observerNeedle, observerReplacement);

await writeFile(homepagePath, homepage, 'utf8');

let styles = await readFile(stylesPath, 'utf8');
const marker = '/* EPIC hero v4 final production media */';
if (styles.includes(marker)) {
  throw new Error('EPIC hero v4 media marker already exists.');
}

styles += `\n\n${marker}\n.epic-static-hero{position:absolute;inset:0;z-index:2;display:block;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .36s ease;overflow:hidden;background:#030303}\n.epic-static-hero img{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;object-position:center center}\n.epic-mask-hero.is-static.has-static-image .epic-static-hero{opacity:1;visibility:visible}\n.epic-mask-hero.is-static.has-static-image .epic-breakout-video{opacity:0!important}\n.epic-mask-hero.is-static:not(.has-static-image) .epic-breakout-video{opacity:1!important}\n@media (max-width:780px){.epic-static-hero img{object-position:center center}}\n`;

await writeFile(stylesPath, styles, 'utf8');

const checks = [
  heroUrls.desktop,
  heroUrls.mobile,
  heroUrls.desktopStatic,
  heroUrls.mobileStatic,
  `type="${heroUrls.mobileType}"`,
  'data-epic-static-hero',
  "hero.classList.add('is-static')"
];
for (const check of checks) {
  if (!homepage.includes(check)) throw new Error(`Final hero output is missing: ${check}`);
}
if (!styles.includes('.epic-mask-hero.is-static.has-static-image .epic-static-hero')) {
  throw new Error('Static hero visibility styling was not installed.');
}

console.log('Installed final desktop/mobile hero videos, responsive still images, WebM MIME handling, lazy still preloading, and visit-long static handoff.');
