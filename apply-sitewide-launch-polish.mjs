import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const stylesPath = join(dist, 'assets', 'styles.css');
const assetVersion = '20260809-sitewide-polish-v1';
const mobileModelsImage = 'https://avd0q6zau931hwsb.public.blob.vercel-storage.com/mobile-homepage-models.png';

const centerContent = `<div class="preloader-center preloader-center-split"><div class="preloader-mark">E</div><p>EPIC</p><span>LAS VEGAS MODELS &amp; TALENT</span></div>`;
const splitPreloader = `<div class="preloader split-preloader" data-preloader aria-hidden="true"><div class="preloader-curtain preloader-left preloader-half">${centerContent}</div><div class="preloader-curtain preloader-right preloader-half">${centerContent}</div></div>`;
const originalPreloader = '<div class="preloader" data-preloader aria-hidden="true"><div class="preloader-curtain preloader-left"></div><div class="preloader-curtain preloader-right"></div><div class="preloader-center"><div class="preloader-mark">E</div><p>EPIC</p><span>LAS VEGAS MODELS &amp; TALENT</span></div></div>';

const liquidIntro = `<div class="epic-liquid-intro epic-split-intro" data-epic-liquid-intro aria-hidden="true">
    <svg class="epic-liquid-curtain" viewBox="0 0 1440 1000" preserveAspectRatio="none" aria-hidden="true"><path data-epic-curtain-path d="M0 0H1440V835C1125 760 890 965 610 885C355 812 192 908 0 858Z"></path></svg>
    <div class="preloader-half preloader-left">${centerContent}</div>
    <div class="preloader-half preloader-right">${centerContent}</div>
  </div>`;

const htmlFiles = (await readdir(dist)).filter((name) => name.endsWith('.html'));
if (!htmlFiles.length) throw new Error('No generated HTML pages were found.');

let removedNumberCount = 0;
let homeLinkCount = 0;

for (const file of htmlFiles) {
  const path = join(dist, file);
  let html = await readFile(path, 'utf8');

  // Give every mobile dropdown an explicit Home destination.
  const homeLink = file === 'index.html'
    ? '<a class="nav-link is-active" href="/" aria-current="page">Home</a>'
    : '<a class="nav-link" href="/">Home</a>';
  if (!html.includes('aria-label="Mobile navigation"><a class="nav-link') && !html.includes('aria-label="Mobile navigation">\n<a class="nav-link')) {
    throw new Error(`Mobile navigation was not found in ${file}.`);
  }
  html = html.replace(
    /(<nav aria-label="Mobile navigation">)(?!\s*<a[^>]+href="\/"[^>]*>Home<\/a>)/,
    `$1${homeLink}`
  );
  if (html.includes(homeLink)) homeLinkCount += 1;

  // Replace the decorative loader with two true viewport halves. The duplicated
  // center treatment is clipped by each half, so logo and text physically split.
  html = html.replace(originalPreloader, splitPreloader);

  if (file === 'index.html') {
    const liquidPattern = /<div class="epic-liquid-intro"[\s\S]*?<div class="epic-liquid-logo">[\s\S]*?<\/div>\s*<\/div>/;
    if (!liquidPattern.test(html)) throw new Error('Homepage liquid intro was not found.');
    html = html.replace(liquidPattern, liquidIntro);

    html = html.replace('Book Exceptional Talent', 'Book Talent');
    html = html.replace('/images/homepage-models-mobile.webp', mobileModelsImage);
    html = html.replace(/<p class="eyebrow">\s*Answers, Clearly\s*<\/p>/g, '');
  }

  html = html.replace(/<p class="eyebrow">\s*Client Notes\s*<\/p>/g, '');
  html = html.replace(
    /<h2>Make the moment<br><em>impossible to ignore\.<\/em><\/h2>/g,
    '<h2>Make it flawless.<br><em>Make it EPIC.</em></h2>'
  );

  // Remove standalone decorative sequence labels such as 01, 02 and 03 while
  // preserving meaningful numbers in copy, prices, dates, counters and names.
  html = html.replace(/<(span|b)([^>]*)>\s*0[1-9]\s*<\/\1>/g, (match) => {
    removedNumberCount += 1;
    return '';
  });

  // Version the shared assets on every page, not only the homepage.
  html = html.replace(/href="\/assets\/styles\.css(?:\?v=[^"]+)?"/, `href="/assets/styles.css?v=${assetVersion}"`);
  html = html.replace(/src="\/assets\/app\.js(?:\?v=[^"]+)?"/, `src="/assets/app.js?v=${assetVersion}"`);

  await writeFile(path, html, 'utf8');
}

let styles = await readFile(stylesPath, 'utf8');
const marker = '/* EPIC sitewide launch polish v1 */';
if (styles.includes(marker)) throw new Error('Sitewide launch polish was already applied.');

const desktopMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 300'%3E%3Ctext x='500' y='250' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-size='300' font-weight='900' letter-spacing='-22'%3EEPIC%3C/text%3E%3C/svg%3E")`;
const mobileMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 460 1500'%3E%3Cg text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-size='270' font-weight='900'%3E%3Ctext x='230' y='350'%3EE%3C/text%3E%3Ctext x='230' y='650'%3EP%3C/text%3E%3Ctext x='230' y='950'%3EI%3C/text%3E%3Ctext x='230' y='1250'%3EC%3C/text%3E%3C/g%3E%3C/svg%3E")`;

styles += `\n\n${marker}\n
/* Hero refinements */
.epic-mask-scroll-cue{display:none!important}
.epic-static-hero{background:#030303!important}
.epic-static-hero img{width:100%!important;height:100%!important;object-fit:contain!important;object-position:center center!important}

@media (min-width:781px){
  .epic-mask-video{
    -webkit-mask-image:${desktopMask}!important;
    mask-image:${desktopMask}!important;
    -webkit-mask-size:min(96vw,285svh) auto!important;
    mask-size:min(96vw,285svh) auto!important;
    -webkit-mask-position:center center!important;
    mask-position:center center!important;
  }
}

@media (max-width:780px){
  .epic-mask-video{
    -webkit-mask-image:${mobileMask}!important;
    mask-image:${mobileMask}!important;
    -webkit-mask-size:auto min(108svh,900px)!important;
    mask-size:auto min(108svh,900px)!important;
    -webkit-mask-position:center center!important;
    mask-position:center center!important;
  }
  .epic-hero-copy-section h1{display:flex!important;flex-direction:column!important;gap:.16em!important;line-height:.96!important}
  .epic-hero-copy-section h1 span,.epic-hero-copy-section h1 em{display:block!important}
}

/* Conversion-focused button system: preserve the gold-bar design while making
   every label legible, balanced and safe on narrow screens. */
button,.button{font-family:Inter,Arial,sans-serif!important}
.button{
  min-height:48px!important;
  max-width:100%!important;
  padding:13px 26px!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:.45em!important;
  font-size:clamp(16px,1.05vw,17px)!important;
  font-weight:600!important;
  line-height:1.2!important;
  letter-spacing:.025em!important;
  text-transform:none!important;
  text-align:center!important;
  white-space:normal!important;
  overflow-wrap:anywhere!important;
}
.button>span{display:inline-flex;align-items:center;justify-content:center;max-width:100%;font:inherit!important;letter-spacing:inherit!important;text-transform:none!important;text-align:center!important}
.button-sm{min-height:48px!important;padding:12px 22px!important;font-size:16px!important}
.epic-hero-copy-actions .button,.page-hero .button{min-height:54px!important;padding:15px 30px!important;font-size:clamp(17px,1.2vw,19px)!important}
.button-row{gap:12px!important;align-items:stretch!important;flex-wrap:wrap!important}
.button-row:has(>.button:nth-child(2):last-child)>.button{min-width:0!important}

/* Remove sequence-label whitespace from every numbered card family. */
.difference-card,.service-card,.value-grid article{justify-content:center!important;gap:14px!important;padding-top:clamp(34px,4vw,58px)!important;padding-bottom:clamp(34px,4vw,58px)!important}
.difference-card h3,.service-card h2,.value-grid article h3{margin-top:0!important}
.process-list li{grid-template-columns:minmax(0,1fr)!important;gap:0!important;padding-block:clamp(24px,3vw,42px)!important}
.instagram-native-label{justify-content:flex-start!important}
.division-index{display:none!important}

/* Homepage section alignment and compact mobile prize presentation. */
.divisions-section .section-heading,.divisions-section .section-heading>div{width:100%!important;text-align:center!important;justify-items:center!important}
.divisions-section .eyebrow{margin-inline:auto!important;text-align:center!important}
@media (max-width:780px){
  .button-row{justify-content:center!important}
  .button-row .button{width:min(100%,320px)!important}
  .bikini-prize-ribbon{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important;padding:10px 8px!important;align-items:center!important}
  .bikini-prize-ribbon>span{grid-column:1/-1!important;margin:0!important;font-size:10px!important;line-height:1.1!important;text-align:center!important}
  .bikini-prize-ribbon>strong{margin:0!important;padding:2px!important;font-size:11px!important;line-height:1.15!important;text-align:center!important;white-space:nowrap!important}
  .bikini-prize-ribbon>strong b{display:block!important;margin-bottom:2px!important;font-size:9px!important}
}

/* Footer and dual CTA alignment on every page. */
.footer-brand{display:flex!important;flex-direction:column!important;align-items:center!important;text-align:center!important}
.footer-logo{display:block!important;margin-left:auto!important;margin-right:auto!important;object-position:center!important}
.footer-brand h2,.footer-brand p{text-align:center!important}
.cta-panel>div{width:100%!important;display:flex!important;flex-direction:column!important;align-items:center!important;text-align:center!important}
.cta-panel .eyebrow,.cta-panel h2,.cta-panel .button{text-align:center!important;margin-left:auto!important;margin-right:auto!important}

/* True split-curtain preloaders. Each half contains a clipped copy of the full
   center composition, so every mark and line of text separates at the seam. */
.split-preloader,.epic-split-intro{position:fixed!important;inset:0!important;overflow:hidden!important;background:transparent!important;pointer-events:none!important}
.preloader-half{position:absolute!important;top:0!important;bottom:0!important;width:50%!important;overflow:hidden!important;background:#050505!important;transition:transform .9s cubic-bezier(.76,0,.24,1)!important;will-change:transform!important}
.preloader-left{left:0!important}
.preloader-right{right:0!important}
.preloader-half .preloader-center-split{position:absolute!important;top:50%!important;width:100vw!important;display:flex!important;flex-direction:column!important;align-items:center!important;transform:translateY(-50%)!important;text-align:center!important}
.preloader-left .preloader-center-split{left:0!important}
.preloader-right .preloader-center-split{right:0!important}
.split-preloader.is-finished .preloader-left,html.epic-video-ready .epic-split-intro .preloader-left{transform:translateX(-101%)!important}
.split-preloader.is-finished .preloader-right,html.epic-video-ready .epic-split-intro .preloader-right{transform:translateX(101%)!important}
.epic-split-intro{transform:none!important;background:transparent!important}
.epic-split-intro .epic-liquid-curtain{display:none!important}
.epic-split-intro .preloader-center-split{color:#fff!important}
.epic-split-intro .preloader-center-split p{font-family:Inter,Arial,sans-serif!important;font-size:clamp(4rem,10vw,10rem)!important;font-weight:600!important;line-height:.82!important;letter-spacing:-.055em!important}
.epic-split-intro .preloader-center-split span{margin-top:1.1rem!important;font-family:Inter,Arial,sans-serif!important;font-size:clamp(.62rem,.9vw,.86rem)!important;font-weight:500!important;letter-spacing:.42em!important}
.epic-split-intro .preloader-mark{color:#fff!important}

/* Mobile dropdown Home link follows the existing navigation rhythm. */
.mobile-menu nav .nav-link:first-child{margin-top:0!important}
`;

await writeFile(stylesPath, styles, 'utf8');

if (homeLinkCount !== htmlFiles.length) throw new Error(`Expected Home links on ${htmlFiles.length} pages, installed ${homeLinkCount}.`);
if (removedNumberCount < 10) throw new Error(`Only ${removedNumberCount} decorative number labels were removed; expected a sitewide set.`);
if (!styles.includes('min(96vw,285svh)')) throw new Error('Responsive desktop EPIC mask fitting was not installed.');
if (!styles.includes('True split-curtain preloaders')) throw new Error('Split-curtain styles were not installed.');

console.log(`Applied sitewide launch polish to ${htmlFiles.length} pages; removed ${removedNumberCount} decorative number labels and added ${homeLinkCount} Home menu links.`);
