import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputDir = join(process.cwd(), 'dist');
const homepagePath = join(outputDir, 'index.html');
const stylesPath = join(outputDir, 'assets', 'styles.css');

const posts = [
  { url: 'https://www.instagram.com/p/DaSwksAlF2T/?img_index=1', shortcode: 'DaSwksAlF2T' },
  { url: 'https://www.instagram.com/p/DbScVFgJWmd/', shortcode: 'DbScVFgJWmd' },
  { url: 'https://www.instagram.com/p/DbFYvYwHL2E/?img_index=1', shortcode: 'DbFYvYwHL2E' },
  { url: 'https://www.instagram.com/p/DbOAUooiFvr/?img_index=1', shortcode: 'DbOAUooiFvr' },
  { url: 'https://www.instagram.com/p/Da0f5xKxZ0m/', shortcode: 'Da0f5xKxZ0m' },
  { url: 'https://www.instagram.com/p/DagtYx7xa2D/', shortcode: 'DagtYx7xa2D' }
];

function embedUrl(shortcode) {
  return `https://www.instagram.com/p/${shortcode}/embed/`;
}

let homepage = await readFile(homepagePath, 'utf8');
const musePattern = /<section class="section-pad muse-section">[\s\S]*?<\/section>/;
if (!musePattern.test(homepage)) {
  throw new Error('Homepage Muse Wall section was not found.');
}

const embeds = posts.map((post, index) => {
  const number = String(index + 1).padStart(2, '0');
  return `
        <article class="instagram-native-card reveal-card">
          <div class="instagram-native-label" aria-hidden="true">
            <span><i>✦</i> EPIC SOCIAL</span>
            <b>${number}</b>
          </div>
          <div class="instagram-native-frame-shell">
            <span class="instagram-native-corner corner-tl" aria-hidden="true"></span>
            <span class="instagram-native-corner corner-tr" aria-hidden="true"></span>
            <span class="instagram-native-corner corner-bl" aria-hidden="true"></span>
            <span class="instagram-native-corner corner-br" aria-hidden="true"></span>
            <iframe
              class="instagram-native-frame"
              src="${embedUrl(post.shortcode)}"
              title="EPIC Instagram post ${index + 1}"
              loading="eager"
              frameborder="0"
              scrolling="no"
              allowtransparency="true"
              referrerpolicy="strict-origin-when-cross-origin"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowfullscreen>
            </iframe>
          </div>
          <a class="instagram-native-open" href="${post.url}" target="_blank" rel="noopener">
            <span>@epicmodelsandtalent</span>
            <strong>Open Post on Instagram</strong>
            <b aria-hidden="true">↗</b>
          </a>
        </article>`;
}).join('');

const section = `<section class="section-pad muse-section instagram-section instagram-native-section">
  <div class="container">
    <div class="section-heading split-heading">
      <div><p class="eyebrow">The Muse Wall</p><h2>Follow the work.<br><em>Feel the energy.</em></h2></div>
      <a class="text-link" href="https://www.instagram.com/epicmodelsandtalent/" target="_blank" rel="noopener">@epicmodelsandtalent ↗</a>
    </div>
    <div class="instagram-native-grid" aria-label="Featured EPIC Instagram posts">${embeds}
    </div>
  </div>
</section>`;

homepage = homepage.replace(musePattern, section);

// Use six isolated native Instagram /embed/ iframes. This is the same endpoint
// structure that successfully rendered DbScVFgJWmd on the production homepage.
homepage = homepage.replace(/\s*<script[^>]+src="https:\/\/www\.instagram\.com\/embed\.js"[^>]*><\/script>/g, '');

for (const post of posts) {
  if (!homepage.includes(`src="${embedUrl(post.shortcode)}"`)) {
    throw new Error(`Native Instagram iframe was not installed: ${post.shortcode}`);
  }
  if (!homepage.includes(`href="${post.url}"`)) {
    throw new Error(`Instagram post link was not installed: ${post.url}`);
  }
}
if ((homepage.match(/class="instagram-native-frame"/g) || []).length !== posts.length) {
  throw new Error('Homepage does not contain exactly six native Instagram iframes.');
}
if (homepage.includes('/media/?size=') || homepage.includes('data-fallback=')) {
  throw new Error('An Instagram replacement-image fallback remains on the homepage.');
}
if (homepage.includes('instagram-vip-card') || homepage.includes('instagram-luxury-card')) {
  throw new Error('A prior text-only or replacement-image Instagram card remains.');
}

await writeFile(homepagePath, homepage, 'utf8');

let styles = await readFile(stylesPath, 'utf8');
const marker = '/* EPIC native Instagram embeds v4 */';
if (!styles.includes(marker)) {
  styles += `\n\n${marker}\n.instagram-native-section{position:relative;overflow:hidden;background:radial-gradient(circle at 50% 2%,rgba(213,171,54,.085),transparent 34%)}\n.instagram-native-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(24px,2.4vw,38px);align-items:start;margin-top:clamp(34px,4vw,62px)}\n.instagram-native-card{position:relative;min-width:0;padding:1px;border-radius:24px;background:linear-gradient(145deg,#fff0a8 0%,#8c6419 18%,#e5bf52 38%,#4d350b 61%,#d6ad3d 82%,#fff0a7 100%);box-shadow:0 30px 86px rgba(0,0,0,.58),0 0 0 1px rgba(255,225,129,.13),0 0 38px rgba(202,156,34,.1);transition:transform .45s cubic-bezier(.2,.8,.2,1),box-shadow .45s ease}\n.instagram-native-card:hover{transform:translateY(-8px);box-shadow:0 42px 106px rgba(0,0,0,.68),0 0 0 1px rgba(255,228,135,.24),0 0 58px rgba(202,156,34,.17)}\n.instagram-native-label{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 18px;border-radius:23px 23px 0 0;background:linear-gradient(115deg,#17130a,#050505 68%,#171007);color:#e8c965;font-size:.67rem;letter-spacing:.18em}\n.instagram-native-label span{display:flex;align-items:center;gap:8px}.instagram-native-label i{color:#fff2b3;font-style:normal}.instagram-native-label b{color:rgba(255,238,174,.72);font-size:.7rem}\n.instagram-native-frame-shell{position:relative;overflow:hidden;background:#fff;border-left:8px solid #070707;border-right:8px solid #070707}\n.instagram-native-frame{display:block;width:100%;height:720px;border:0;background:#fff}\n.instagram-native-open{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:17px 18px;border-radius:0 0 23px 23px;background:linear-gradient(115deg,#17130a,#050505 68%,#171007);color:#fff;text-decoration:none}\n.instagram-native-open>span{color:#d7b54d;font-size:.64rem;letter-spacing:.08em}.instagram-native-open>strong{margin-left:auto;font-family:"Playfair Display",serif;font-size:.96rem;font-weight:500}.instagram-native-open>b{display:grid;place-items:center;flex:0 0 36px;width:36px;height:36px;border:1px solid rgba(255,224,119,.54);border-radius:50%;color:#edcd69;transition:transform .3s ease,background .3s ease,color .3s ease}\n.instagram-native-open:hover>b{transform:rotate(8deg) scale(1.06);background:#d7b548;color:#070707}\n.instagram-native-corner{position:absolute;z-index:4;width:24px;height:24px;pointer-events:none}.instagram-native-corner:before,.instagram-native-corner:after{content:"";position:absolute;background:linear-gradient(90deg,#fff1a9,#8b6418)}.instagram-native-corner:before{width:24px;height:1px}.instagram-native-corner:after{width:1px;height:24px}.instagram-native-frame-shell .corner-tl{top:10px;left:10px}.instagram-native-frame-shell .corner-tr{top:10px;right:10px;transform:rotate(90deg)}.instagram-native-frame-shell .corner-br{right:10px;bottom:10px;transform:rotate(180deg)}.instagram-native-frame-shell .corner-bl{left:10px;bottom:10px;transform:rotate(270deg)}\n@media(max-width:1050px){.instagram-native-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.instagram-native-frame{height:740px}}\n@media(max-width:680px){.instagram-native-grid{grid-template-columns:1fr;gap:26px}.instagram-native-card{border-radius:20px}.instagram-native-label{border-radius:19px 19px 0 0}.instagram-native-open{border-radius:0 0 19px 19px}.instagram-native-frame{height:700px}.instagram-native-open>span{display:none}}\n`;
}
await writeFile(stylesPath, styles, 'utf8');

console.log(`Installed ${posts.length} native Instagram /embed/ iframes using the proven DbScVFgJWmd implementation.`);
