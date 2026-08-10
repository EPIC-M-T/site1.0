import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const stylesPath = join(dist, 'assets', 'styles.css');
const assetVersion = '20260809-final-polish-v3';
const marker = '/* EPIC final hero and mobile polish v3 */';

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

const placeholder = (slot) => `<div class="instagram-native-placeholder" role="img" aria-label="EPIC Instagram feature placeholder">
              <span class="instagram-placeholder-mark" aria-hidden="true">✦</span>
              <strong>EPIC SOCIAL</strong>
              <p>Featured content coming soon.</p>
              <small>Use the link below to visit EPIC on Instagram.</small>
            </div>`;

const mobileMenuRevealScript = `<script data-epic-mobile-menu-reveal>
  (() => {
    const init = () => {
      const hero = document.querySelector('[data-epic-mask-hero]');
      if (!hero) return;
      const mobile = window.matchMedia('(max-width: 1100px)');
      let ticking = false;
      const update = () => {
        ticking = false;
        if (!mobile.matches) {
          document.body.classList.add('epic-hero-cleared');
          return;
        }
        const cleared = hero.getBoundingClientRect().bottom <= 1;
        document.body.classList.toggle('epic-hero-cleared', cleared);
      };
      const requestUpdate = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      };
      update();
      addEventListener('scroll', requestUpdate, { passive: true });
      addEventListener('resize', requestUpdate, { passive: true });
      mobile.addEventListener?.('change', requestUpdate);
      addEventListener('pageshow', requestUpdate);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
  })();
</script>`;

const htmlFiles = await findHtml(dist);
if (htmlFiles.length < 9) throw new Error(`Expected at least nine generated HTML pages, found ${htmlFiles.length}.`);

let homepageUpdated = false;
let versionedPages = 0;

for (const path of htmlFiles) {
  const page = relative(dist, path).replaceAll('\\', '/');
  let html = await readFile(path, 'utf8');

  html = html.replace(/href="\/assets\/styles\.css(?:\?v=[^"]+)?"/, `href="/assets/styles.css?v=${assetVersion}"`);
  html = html.replace(/src="\/assets\/app\.js(?:\?v=[^"]+)?"/, `src="/assets/app.js?v=${assetVersion}"`);
  if (html.includes(assetVersion)) versionedPages += 1;

  if (page === 'index.html') {
    const cardMarker = '<article class="instagram-native-card reveal-card">';
    const chunks = html.split(cardMarker);
    if (chunks.length !== 7) throw new Error(`Expected six Instagram cards, found ${chunks.length - 1}.`);

    const relabelCard = (card, position) => {
      const label = String(position).padStart(2, '0');
      return card
        .replace(/(<div class="instagram-native-label"[\s\S]*?<b>)\d{2}(<\/b>)/, `$1${label}$2`)
        .replace(/Loading EPIC Instagram post \d{2}…/, `Loading EPIC Instagram post ${label}…`);
    };

    // The two embeds proven to render reliably were source positions 02 and 05.
    // Promote those exact cards to the first two visible positions, then follow
    // them with the four intentional placeholders on every responsive layout.
    const liveCards = [chunks[2], chunks[5]];
    const placeholderCards = [chunks[1], chunks[3], chunks[4], chunks[6]].map((card, index) => {
      const blockquotePattern = /<blockquote[\s\S]*?<\/blockquote>/;
      if (!blockquotePattern.test(card)) throw new Error(`Instagram placeholder source ${index + 1} was not found.`);
      return card.replace(blockquotePattern, placeholder(index + 3));
    });
    const orderedCards = [...liveCards, ...placeholderCards].map((card, index) => relabelCard(card, index + 1));
    html = chunks[0] + orderedCards.map((card) => `${cardMarker}${card}`).join('');

    const remainingEmbeds = (html.match(/class="instagram-media instagram-native-embed"/g) || []).length;
    if (remainingEmbeds !== 2) throw new Error(`Expected exactly two working Instagram embeds, found ${remainingEmbeds}.`);
    if (!orderedCards[0].includes('instagram-media instagram-native-embed') || !orderedCards[1].includes('instagram-media instagram-native-embed')) {
      throw new Error('The two working Instagram embeds were not promoted to positions 1 and 2.');
    }
    if (orderedCards.slice(2).some((card) => card.includes('instagram-media instagram-native-embed'))) {
      throw new Error('A live Instagram embed remains below the first two positions.');
    }

    if (!html.includes('data-epic-mobile-menu-reveal')) {
      html = html.replace('</body>', `${mobileMenuRevealScript}\n</body>`);
    }
    homepageUpdated = true;
  }

  await writeFile(path, html, 'utf8');
}

let styles = await readFile(stylesPath, 'utf8');
if (styles.includes(marker)) throw new Error('Final polish layer has already been applied.');

const desktopMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 260'%3E%3Ctext x='360' y='228' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-size='300' font-weight='900' letter-spacing='-22'%3EEPIC%3C/text%3E%3C/svg%3E")`;
const mobileMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 460 1500'%3E%3Cg font-family='Arial Black,Arial,sans-serif' font-size='270' font-weight='900'%3E%3Ctext x='230' y='350' text-anchor='middle'%3EE%3C/text%3E%3Ctext x='230' y='650' text-anchor='middle'%3EP%3C/text%3E%3Ctext x='170' y='950' text-anchor='middle'%3EI%3C/text%3E%3Ctext x='230' y='1250' text-anchor='middle'%3EC%3C/text%3E%3C/g%3E%3C/svg%3E")`;

styles += `\n\n${marker}\n
/* Never allow transformed hero media, full-bleed sections, or mobile navigation
   to create a sideways document canvas. */
html,body{width:100%;max-width:100%;overflow-x:hidden!important;overscroll-behavior-x:none}
.site-header,.mobile-menu,.epic-mask-hero,.epic-mask-pin,.epic-hero-copy-section,.bikini-feature,.instagram-native-section{max-width:100vw!important}
.epic-mask-hero,.epic-mask-pin,.epic-hero-copy-section,.bikini-feature,.instagram-native-section{overflow-x:clip!important}

/* Desktop EPIC now uses a tightly cropped mask canvas. The lettering consumes
   essentially the entire usable viewport while the height cap prevents runoff. */
@media (min-width:781px){
  .epic-mask-video{
    -webkit-mask-image:${desktopMask}!important;
    mask-image:${desktopMask}!important;
    -webkit-mask-size:min(98vw,270svh) auto!important;
    mask-size:min(98vw,270svh) auto!important;
    -webkit-mask-position:center center!important;
    mask-position:center center!important;
  }
}

/* Align the narrow I with the common left edge of E, P and C. Preserve the same
   true split-curtain treatment used throughout the rest of the site. */
@media (max-width:780px){
  .epic-mask-video{
    -webkit-mask-image:${mobileMask}!important;
    mask-image:${mobileMask}!important;
    -webkit-mask-size:auto min(108svh,900px)!important;
    mask-size:auto min(108svh,900px)!important;
    -webkit-mask-position:center center!important;
    mask-position:center center!important;
  }
  body.home-page .epic-split-intro{display:block!important}
}

/* On the homepage the mobile menu control intentionally stays out of the hero.
   It appears only after the pinned hero has fully cleared, then remains fixed. */
@media (max-width:1100px){
  .site-header>.desktop-book{display:none!important}
  body.home-page .menu-toggle{
    opacity:0!important;
    visibility:hidden!important;
    pointer-events:none!important;
    transform:translateY(-12px) scale(.92)!important;
    transition:opacity .28s ease,transform .32s cubic-bezier(.2,.75,.2,1),visibility 0s .32s!important;
  }
  body.home-page.epic-hero-cleared .menu-toggle,
  body.home-page.menu-open .menu-toggle{
    opacity:1!important;
    visibility:visible!important;
    pointer-events:auto!important;
    transform:translateY(0) scale(1)!important;
    transition:opacity .28s ease,transform .32s cubic-bezier(.2,.75,.2,1),visibility 0s!important;
  }
}

/* Classier editorial button typography without sacrificing legibility. */
.button,.button>span{
  font-family:var(--serif)!important;
  font-weight:600!important;
  letter-spacing:.012em!important;
  line-height:1.12!important;
}
.button{font-size:clamp(16px,1.05vw,18px)!important}
.button-sm{font-size:16px!important}
.epic-hero-copy-actions .button,.page-hero .button{font-size:clamp(17px,1.2vw,19px)!important}

/* Keep the complete mobile prize pool on one balanced row, restore every divider,
   and enlarge the labels without allowing the third prize to wrap below. */
@media (max-width:620px){
  .bikini-prize-ribbon{
    width:calc(100% - 12px)!important;
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:0!important;
    padding:0!important;
    align-items:stretch!important;
  }
  .bikini-prize-ribbon>span{
    grid-column:1/-1!important;
    padding:10px 5px!important;
    margin:0!important;
    border-bottom:1px solid rgba(212,175,55,.28)!important;
    font-size:11px!important;
    line-height:1.15!important;
  }
  .bikini-prize-ribbon>strong,
  .bikini-prize-ribbon>strong:last-child{
    grid-column:auto!important;
    margin:0!important;
    padding:11px 2px!important;
    border:0!important;
    border-bottom:0!important;
    color:var(--cream)!important;
    font-size:clamp(13px,4.2vw,16px)!important;
    line-height:1.1!important;
    white-space:nowrap!important;
  }
  .bikini-prize-ribbon>strong+strong{border-left:1px solid rgba(212,175,55,.28)!important}
  .bikini-prize-ribbon>strong b{
    display:block!important;
    margin:0 0 4px!important;
    font-size:10px!important;
    line-height:1!important;
  }
}
@media (max-width:300px){
  .bikini-prize-ribbon>strong,.bikini-prize-ribbon>strong:last-child{font-size:12px!important;padding-inline:1px!important}
  .bikini-prize-ribbon>strong b{font-size:9px!important}
}

/* The two working embeds from source cards 2 and 5 occupy visible positions 1
   and 2. The remaining luxury frames are deliberate, stable placeholders. */
.instagram-native-placeholder{
  width:100%;
  height:720px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  padding:34px;
  background:
    radial-gradient(circle at 50% 34%,rgba(212,175,55,.16),transparent 28%),
    linear-gradient(145deg,#151108,#050505 58%,#110c05);
  color:var(--cream);
  text-align:center;
}
.instagram-placeholder-mark{
  display:grid;
  place-items:center;
  width:70px;
  height:70px;
  margin-bottom:25px;
  border:1px solid rgba(235,202,98,.62);
  transform:rotate(45deg);
  color:#eccd67;
  font-size:30px;
  box-shadow:0 0 42px rgba(212,175,55,.14),inset 0 0 20px rgba(212,175,55,.05);
}
.instagram-native-placeholder strong{font-family:var(--serif);font-size:clamp(28px,3vw,43px);font-weight:500;letter-spacing:.06em}
.instagram-native-placeholder p{margin:14px 0 4px;color:#d8c89a;font-size:15px}
.instagram-native-placeholder small{max-width:280px;color:#8f8778;font-size:12px;line-height:1.55}
@media(max-width:1050px){.instagram-native-placeholder{height:740px}}
@media(max-width:680px){.instagram-native-placeholder{height:700px;padding:26px}}
`;

await writeFile(stylesPath, styles, 'utf8');

if (!homepageUpdated) throw new Error('Homepage final polish was not applied.');
if (versionedPages !== htmlFiles.length) throw new Error(`Versioned ${versionedPages} of ${htmlFiles.length} pages.`);
if (!styles.includes('min(98vw,270svh)')) throw new Error('Large responsive desktop EPIC mask was not installed.');
if (!styles.includes('body.home-page.epic-hero-cleared')) throw new Error('Mobile hero menu reveal was not installed.');
if (!styles.includes('grid-template-columns:repeat(3,minmax(0,1fr))')) throw new Error('Three-column prize ribbon correction was not installed.');

console.log(`Applied final EPIC polish to ${htmlFiles.length} pages: full-scale hero, aligned mobile I, hero-aware menu, ornate buttons, fixed prize grid, horizontal overflow guardrails, working Instagram posts promoted to positions 1 and 2, and four stable placeholders.`);
