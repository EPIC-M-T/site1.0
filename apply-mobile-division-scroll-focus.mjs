import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const homepagePath = join(dist, 'index.html');
const stylesPath = join(dist, 'assets', 'styles.css');
const assetVersion = '20260809-mobile-division-focus-v1';
const marker = '/* EPIC mobile Division scroll focus v1 */';

const mobileDivisionFocusScript = `<script data-epic-mobile-division-focus>
  (() => {
    const init = () => {
      const cards = [...document.querySelectorAll('.divisions-section .division-strip')];
      if (!cards.length) return;

      const mobile = window.matchMedia('(max-width: 780px)');
      let frame = 0;

      const clear = () => cards.forEach((card) => card.classList.remove('is-mobile-scroll-focus'));
      const update = () => {
        frame = 0;
        if (!mobile.matches) {
          clear();
          return;
        }

        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const focusLine = viewportHeight * 0.52;
        let focusedCard = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        cards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const isInFocusArea = rect.bottom > viewportHeight * 0.18 && rect.top < viewportHeight * 0.84;
          if (!isInFocusArea) return;
          const distance = Math.abs(rect.top + rect.height / 2 - focusLine);
          if (distance < closestDistance) {
            closestDistance = distance;
            focusedCard = card;
          }
        });

        cards.forEach((card) => card.classList.toggle('is-mobile-scroll-focus', card === focusedCard));
      };

      const requestUpdate = () => {
        if (frame) return;
        frame = requestAnimationFrame(update);
      };

      update();
      addEventListener('scroll', requestUpdate, { passive: true });
      addEventListener('resize', requestUpdate, { passive: true });
      addEventListener('pageshow', requestUpdate);
      mobile.addEventListener?.('change', requestUpdate);
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
  })();
</script>`;

let homepage = await readFile(homepagePath, 'utf8');
if (!homepage.includes('class="section-pad divisions-section"')) {
  throw new Error('Homepage Divisions section was not found.');
}
if (!homepage.includes('data-epic-mobile-division-focus')) {
  homepage = homepage.replace('</body>', `${mobileDivisionFocusScript}\n</body>`);
}
homepage = homepage.replace(/href="\/assets\/styles\.css(?:\?v=[^"]+)?"/, `href="/assets/styles.css?v=${assetVersion}"`);
homepage = homepage.replace(/src="\/assets\/app\.js(?:\?v=[^"]+)?"/, `src="/assets/app.js?v=${assetVersion}"`);
await writeFile(homepagePath, homepage, 'utf8');

let styles = await readFile(stylesPath, 'utf8');
if (styles.includes(marker)) throw new Error('Mobile Division scroll focus has already been applied.');
styles += `\n\n${marker}\n
/* As each Division crosses the mobile reading line, gently lift the image and
   restore its color and luminosity. The card and copy remain fixed, keeping the
   layout stable while the photography receives the visual focus. */
@media (max-width:780px){
  .divisions-section .division-strip img{
    transition:filter .62s ease,transform .7s cubic-bezier(.2,.75,.2,1)!important;
    will-change:filter,transform;
  }
  .divisions-section .division-strip .division-overlay{
    transition:opacity .62s ease!important;
  }
  .divisions-section .division-strip.is-mobile-scroll-focus img{
    filter:grayscale(.06) saturate(1.08) brightness(1.16) contrast(1.02)!important;
  }
  .divisions-section .division-strip.is-mobile-scroll-focus .division-overlay{
    opacity:.8;
  }
}
@media (max-width:780px) and (prefers-reduced-motion:no-preference){
  .divisions-section .division-strip img{
    transform:translate3d(0,3px,0) scale(1.01);
  }
  .divisions-section .division-strip.is-mobile-scroll-focus img{
    transform:translate3d(0,-9px,0) scale(1.035)!important;
  }
}
@media (max-width:780px) and (prefers-reduced-motion:reduce){
  .divisions-section .division-strip img{
    transition-duration:.01ms!important;
  }
}
`;
await writeFile(stylesPath, styles, 'utf8');

const finalHomepage = await readFile(homepagePath, 'utf8');
if (!finalHomepage.includes('data-epic-mobile-division-focus')) throw new Error('Mobile Division focus runtime was not installed.');
if (!finalHomepage.includes(`/assets/styles.css?v=${assetVersion}`)) throw new Error('Homepage stylesheet version was not updated.');
if (!styles.includes('.division-strip.is-mobile-scroll-focus img')) throw new Error('Mobile Division focus styling was not installed.');

console.log('Installed mobile-only scroll focus for all five homepage Division images.');
