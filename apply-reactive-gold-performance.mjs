import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const indexPath = join(dist, 'index.html');
const appPath = join(dist, 'assets', 'app.js');
const stylesPath = join(dist, 'assets', 'styles.css');
const assetVersion = '20260809-reactive-gold-performance-v3';
const styleMarker = '/* EPIC reactive gold and performance pass v3 */';
const scriptMarker = 'data-epic-gold-inlay-reactive';

const imageDeliveryUrl = (url, width, quality) =>
  `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;

const originalMedia = {
  heroMobile: 'https://avd0q6zau931hwsb.public.blob.vercel-storage.com/epic-models-%26-talent/hero-epic-mobile-newest.png',
  heroDesktop: 'https://avd0q6zau931hwsb.public.blob.vercel-storage.com/epic-models-%26-talent/epic-hero-desktop.png',
  modelsMobile: 'https://avd0q6zau931hwsb.public.blob.vercel-storage.com/mobile-homepage-models.png'
};

const deliveredMedia = {
  heroMobile: imageDeliveryUrl(originalMedia.heroMobile, 1080, 92),
  heroDesktop: imageDeliveryUrl(originalMedia.heroDesktop, 1920, 92),
  modelsMobile: imageDeliveryUrl(originalMedia.modelsMobile, 1080, 90)
};

let homepage = await readFile(indexPath, 'utf8');
if (!homepage.includes('<body class="home-page" id="top">')) {
  throw new Error('Homepage body hook was not found.');
}

const mediaReplacements = [
  [originalMedia.heroMobile, deliveredMedia.heroMobile],
  [originalMedia.heroDesktop, deliveredMedia.heroDesktop],
  [originalMedia.modelsMobile, deliveredMedia.modelsMobile]
];

for (const [from, to] of mediaReplacements) {
  if (!homepage.includes(from)) throw new Error(`Expected production media URL was not found: ${from}`);
  homepage = homepage.replaceAll(from, to);
}

homepage = homepage.replace(
  '<img src="https://assets.cdn.filesafe.space/YzjwmP6zpvDUp28hrM1o/media/6a653081847bbd8a6438ad3a.webp" alt="EPIC Bikini Contest at Tailgate Beach Club during Las Vegas Swim Week" loading="lazy" decoding="async">',
  '<img src="https://assets.cdn.filesafe.space/YzjwmP6zpvDUp28hrM1o/media/6a653081847bbd8a6438ad3a.webp" alt="EPIC Bikini Contest at Tailgate Beach Club during Las Vegas Swim Week" width="1440" height="1440" loading="lazy" decoding="async">'
);

const fontPreconnect = '  <link rel="preconnect" href="https://fonts.googleapis.com">';
const mediaPreconnects = `  <link rel="preconnect" href="https://avd0q6zau931hwsb.public.blob.vercel-storage.com" crossorigin>\n  <link rel="preconnect" href="https://assets.cdn.filesafe.space" crossorigin>`;
if (!homepage.includes(mediaPreconnects)) {
  if (!homepage.includes(fontPreconnect)) throw new Error('Font preconnect anchor was not found.');
  homepage = homepage.replace(fontPreconnect, `${mediaPreconnects}\n${fontPreconnect}`);
}

homepage = homepage
  .replace(/href="\/assets\/styles\.css(?:\?v=[^"]+)?"/, `href="/assets/styles.css?v=${assetVersion}"`)
  .replace(/src="\/assets\/app\.js(?:\?v=[^"]+)?"/, `src="/assets/app.js?v=${assetVersion}"`);

const staticLoadNeedle = `        staticLoadStarted = true;\n        if (staticMobileSource) staticMobileSource.srcset = staticHero.dataset.mobileStatic;\n        staticImage.src = mobile ? staticHero.dataset.mobileStatic : staticHero.dataset.desktopStatic;`;
const staticLoadReplacement = `        staticLoadStarted = true;\n        staticImage.loading = 'eager';\n        staticImage.fetchPriority = 'low';\n        if (staticMobileSource) staticMobileSource.srcset = staticHero.dataset.mobileStatic;\n        staticImage.src = mobile ? staticHero.dataset.mobileStatic : staticHero.dataset.desktopStatic;`;
if (!homepage.includes(staticLoadNeedle)) throw new Error('Static hero preload runtime was not found.');
homepage = homepage.replace(staticLoadNeedle, staticLoadReplacement);

const freezeFallbackNeedle = `        window.setTimeout(() => finishFreeze(Boolean(staticImage && staticImage.complete && staticImage.naturalWidth > 0)), 1800);`;
const freezeFallbackReplacement = `        window.setTimeout(() => {\n          const staticReady = Boolean(staticImage && staticImage.complete && staticImage.naturalWidth > 0);\n          if (staticReady) {\n            finishFreeze(true);\n          } else if (fullVideo.readyState >= 2) {\n            finishFreeze(false);\n          } else {\n            // Never pause both hero layers before either fallback can paint.\n            settled = true;\n          }\n        }, 1800);`;
if (!homepage.includes(freezeFallbackNeedle)) throw new Error('Hero freeze fallback was not found.');
homepage = homepage.replace(freezeFallbackNeedle, freezeFallbackReplacement);

const finishFreezeNeedle = `        const finishFreeze = (hasStaticImage) => {\n          if (settled) return;\n          settled = true;\n          maskVideo.pause();`;
const finishFreezeReplacement = `        const finishFreeze = (hasStaticImage) => {\n          if (settled) return;\n          const heroBounds = hero.getBoundingClientRect();\n          const heroIsVisible = heroBounds.bottom > 0 && heroBounds.top < window.innerHeight;\n          if (heroIsVisible) {\n            settled = true;\n            resetHeroForReturn();\n            return;\n          }\n          settled = true;\n          maskVideo.pause();`;
if (!homepage.includes(finishFreezeNeedle)) throw new Error('Hero finish-freeze runtime was not found.');
homepage = homepage.replace(finishFreezeNeedle, finishFreezeReplacement);

const freezeObserverNeedle = `        const freezeObserver = new IntersectionObserver((entries) => {\n          if (!entries.some((entry) => entry.isIntersecting)) return;\n          freezeObserver.disconnect();\n          freezeHero();\n        }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });\n        freezeObserver.observe(bikiniSection);`;
const freezeObserverReplacement = `        const freezeObserver = new IntersectionObserver((entries) => {\n          if (!entries.some((entry) => entry.isIntersecting)) return;\n          freezeHero();\n        }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });\n        freezeObserver.observe(bikiniSection);\n\n        // A rapid return to the hero must always reactivate a paintable video\n        // layer instead of leaving a paused frame waiting on the lazy still.\n        const heroReturnObserver = new IntersectionObserver((entries) => {\n          const returning = entries.some((entry) => entry.isIntersecting);\n          if (returning && hero.classList.contains('is-static')) resetHeroForReturn();\n        }, { threshold: 0.03 });\n        heroReturnObserver.observe(hero);`;
if (!homepage.includes(freezeObserverNeedle)) throw new Error('Hero freeze observer was not found.');
homepage = homepage.replace(freezeObserverNeedle, freezeObserverReplacement);

const resizeNeedle = `      window.addEventListener('resize', () => window.ScrollTrigger.refresh(), { passive: true });`;
const resizeReplacement = `      let refreshTimer = 0;\n      window.addEventListener('resize', () => {\n        window.clearTimeout(refreshTimer);\n        refreshTimer = window.setTimeout(() => window.ScrollTrigger.refresh(), 140);\n      }, { passive: true });`;
if (!homepage.includes(resizeNeedle)) throw new Error('Hero resize refresh handler was not found.');
homepage = homepage.replace(resizeNeedle, resizeReplacement);

const reactiveRuntime = `<script ${scriptMarker}>\n  (() => {\n    const init = () => {\n      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;\n      const targets = [...document.querySelectorAll('main > section, .site-footer')];\n      if (!targets.length || !('IntersectionObserver' in window)) return;\n\n      let current = null;\n      let settleTimer = 0;\n      const pulse = (target) => {\n        if (target === current) return;\n        current = target;\n        window.clearTimeout(settleTimer);\n        document.body.classList.remove('epic-gold-inlay-pulse');\n        requestAnimationFrame(() => {\n          document.body.classList.add('epic-gold-inlay-pulse');\n          settleTimer = window.setTimeout(() => {\n            document.body.classList.remove('epic-gold-inlay-pulse');\n          }, 900);\n        });\n      };\n\n      const observer = new IntersectionObserver((entries) => {\n        const entering = entries.find((entry) => entry.isIntersecting);\n        if (entering) pulse(entering.target);\n      }, { threshold: 0, rootMargin: '-18% 0px -62% 0px' });\n      targets.forEach((target) => observer.observe(target));\n    };\n\n    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });\n    else init();\n  })();\n</script>`;
if (homepage.includes(scriptMarker)) throw new Error('Reactive gold runtime has already been installed.');
homepage = homepage.replace('</body>', `${reactiveRuntime}\n</body>`);

await writeFile(indexPath, homepage, 'utf8');

let app = await readFile(appPath, 'utf8');
const headerNeedle = `  update();\n  addEventListener('scroll', update, { passive: true });`;
const headerReplacement = `  let updateFrame = 0;\n  const requestUpdate = () => {\n    if (updateFrame) return;\n    updateFrame = requestAnimationFrame(() => {\n      updateFrame = 0;\n      update();\n    });\n  };\n  update();\n  addEventListener('scroll', requestUpdate, { passive: true });`;
if (!app.includes(headerNeedle)) throw new Error('Header scroll handler was not found.');
app = app.replace(headerNeedle, headerReplacement);

const cursorPattern = /function initCursor\(\) \{[\s\S]*?\n\}\n\nfunction initMagnetic\(\) \{/;
if (!cursorPattern.test(app)) throw new Error('Custom cursor runtime was not found.');
const cursorReplacement = `function initCursor() {\n  if (coarsePointer || reducedMotion) return;\n  const cursor = $('.custom-cursor');\n  const label = $('.custom-cursor span');\n  if (!cursor) return;\n  let x = -100, y = -100, tx = -100, ty = -100, frame = 0;\n  const render = () => {\n    frame = 0;\n    if (document.hidden) return;\n    x += (tx - x) * 0.18;\n    y += (ty - y) * 0.18;\n    cursor.style.transform = \`translate3d(\${x}px,\${y}px,0) translate(-50%,-50%)\`;\n    if (Math.abs(tx - x) > .12 || Math.abs(ty - y) > .12) frame = requestAnimationFrame(render);\n  };\n  const requestRender = () => { if (!frame) frame = requestAnimationFrame(render); };\n  addEventListener('mousemove', event => {\n    tx = event.clientX; ty = event.clientY; cursor.style.opacity = '1'; requestRender();\n  }, { passive: true });\n  addEventListener('mouseleave', () => {\n    cursor.style.opacity = '0';\n    if (frame) cancelAnimationFrame(frame);\n    frame = 0;\n  });\n  document.addEventListener('visibilitychange', () => {\n    if (document.hidden && frame) cancelAnimationFrame(frame);\n    frame = 0;\n  });\n  $$('.interactive-hover, .button, .talent-card').forEach(el => {\n    el.addEventListener('mouseenter', () => {\n      cursor.style.width = '74px'; cursor.style.height = '74px'; cursor.style.background = '#f9f6f0';\n      if (label) label.style.opacity = '1';\n    });\n    el.addEventListener('mouseleave', () => {\n      cursor.style.width = '12px'; cursor.style.height = '12px'; cursor.style.background = '#d4af37';\n      if (label) label.style.opacity = '0';\n    });\n  });\n}\n\nfunction initMagnetic() {`;
app = app.replace(cursorPattern, cursorReplacement);
await writeFile(appPath, app, 'utf8');

let styles = await readFile(stylesPath, 'utf8');
if (styles.includes(styleMarker)) throw new Error('Reactive gold performance styles already exist.');
styles += `\n\n${styleMarker}\n/* The inlay is a touch brighter at rest, then receives a short compositor-only\n   opacity lift as each homepage section reaches the same reveal band used by\n   the footer line. No background-position animation or scroll painting. */\nbody.home-page .noise::after{\n  opacity:.052;\n  transition:opacity .78s cubic-bezier(.22,.7,.25,1);\n  will-change:opacity;\n}\nbody.home-page.epic-gold-inlay-pulse .noise::after{opacity:.084}\n@media (max-width:780px){\n  body.home-page .noise::after{opacity:.045}\n  body.home-page.epic-gold-inlay-pulse .noise::after{opacity:.072}\n}\n@media (prefers-reduced-motion:reduce){\n  body.home-page .noise::after{opacity:.052;transition:none;will-change:auto}\n}\n`;
await writeFile(stylesPath, styles, 'utf8');

const finalHomepage = await readFile(indexPath, 'utf8');
const finalApp = await readFile(appPath, 'utf8');
const finalStyles = await readFile(stylesPath, 'utf8');
const requiredHomepageChecks = [
  `/assets/styles.css?v=${assetVersion}`,
  `/assets/app.js?v=${assetVersion}`,
  deliveredMedia.heroMobile,
  deliveredMedia.heroDesktop,
  deliveredMedia.modelsMobile,
  'width="1440" height="1440" loading="lazy" decoding="async"',
  'heroReturnObserver',
  scriptMarker
];
for (const check of requiredHomepageChecks) {
  if (!finalHomepage.includes(check)) throw new Error(`Final homepage is missing: ${check}`);
}
if (!finalApp.includes('let updateFrame = 0') || !finalApp.includes('Math.abs(tx - x) > .12')) {
  throw new Error('Runtime performance throttles were not installed.');
}
if (!finalStyles.includes(styleMarker) || !finalStyles.includes('epic-gold-inlay-pulse')) {
  throw new Error('Reactive gold styles were not installed.');
}

console.log('Installed reactive gold inlay, resilient hero return state, responsive image delivery, and mobile/desktop runtime throttles.');
