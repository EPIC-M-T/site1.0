import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputDir = join(process.cwd(), 'dist');
const homepagePath = join(outputDir, 'index.html');
const stylesPath = join(outputDir, 'assets', 'styles.css');

const posts = [
  {
    url: 'https://www.instagram.com/p/DaSwksAlF2T/?img_index=1',
    shortcode: 'DaSwksAlF2T',
    fallback: 'https://assets.cdn.filesafe.space/YzjwmP6zpvDUp28hrM1o/media/68817373e69c95db19218b3e.png'
  },
  {
    url: 'https://www.instagram.com/p/DbScVFgJWmd/',
    shortcode: 'DbScVFgJWmd',
    fallback: 'https://assets.cdn.filesafe.space/YzjwmP6zpvDUp28hrM1o/media/687fffa39a4c2df3fb98a1fb.png'
  },
  {
    url: 'https://www.instagram.com/p/DbFYvYwHL2E/?img_index=1',
    shortcode: 'DbFYvYwHL2E',
    fallback: 'https://assets.cdn.filesafe.space/YzjwmP6zpvDUp28hrM1o/media/688ce5df7834ac6a1e590f19.jpeg'
  },
  {
    url: 'https://www.instagram.com/p/DbOAUooiFvr/?img_index=1',
    shortcode: 'DbOAUooiFvr',
    fallback: 'https://assets.cdn.filesafe.space/YzjwmP6zpvDUp28hrM1o/media/6882545d5828573a6892b0df.jpeg'
  },
  {
    url: 'https://www.instagram.com/p/Da0f5xKxZ0m/',
    shortcode: 'Da0f5xKxZ0m',
    fallback: 'https://assets.cdn.filesafe.space/YzjwmP6zpvDUp28hrM1o/media/448c9720-62e7-45e4-ade0-68e24ff593f0.jpeg'
  },
  {
    url: 'https://www.instagram.com/p/DagtYx7xa2D/',
    shortcode: 'DagtYx7xa2D',
    fallback: '/images/epic-after-dark-image-homepage.webp'
  }
];

function mediaUrl(shortcode) {
  return `https://www.instagram.com/p/${shortcode}/media/?size=l`;
}

let homepage = await readFile(homepagePath, 'utf8');
const musePattern = /<section class="section-pad muse-section">[\s\S]*?<\/section>/;
if (!musePattern.test(homepage)) {
  throw new Error('Homepage Muse Wall section was not found.');
}

const cards = posts.map((post, index) => `
        <article class="instagram-luxury-card reveal-card">
          <a class="instagram-luxury-link" href="${post.url}" target="_blank" rel="noopener" aria-label="Open EPIC Instagram post ${index + 1}">
            <div class="instagram-luxury-media">
              <span class="instagram-gold-corner corner-tl" aria-hidden="true"></span>
              <span class="instagram-gold-corner corner-tr" aria-hidden="true"></span>
              <span class="instagram-gold-corner corner-bl" aria-hidden="true"></span>
              <span class="instagram-gold-corner corner-br" aria-hidden="true"></span>
              <img
                class="instagram-post-cover"
                src="${mediaUrl(post.shortcode)}"
                data-fallback="${post.fallback}"
                alt="EPIC Models & Talent Instagram post ${index + 1}"
                loading="${index < 3 ? 'eager' : 'lazy'}"
                decoding="async"
                referrerpolicy="no-referrer">
              <div class="instagram-luxury-sheen" aria-hidden="true"></div>
              <div class="instagram-vip-badge" aria-hidden="true"><span>✦</span> EPIC SOCIAL</div>
              <div class="instagram-luxury-overlay">
                <div>
                  <span class="instagram-handle">@epicmodelsandtalent</span>
                  <strong>View Instagram Post</strong>
                </div>
                <span class="instagram-open-icon" aria-hidden="true">↗</span>
              </div>
            </div>
          </a>
        </article>`).join('');

const section = `<section class="section-pad muse-section instagram-section">
  <div class="container">
    <div class="section-heading split-heading">
      <div><p class="eyebrow">The Muse Wall</p><h2>Follow the work.<br><em>Feel the energy.</em></h2></div>
      <a class="text-link" href="https://www.instagram.com/epicmodelsandtalent/" target="_blank" rel="noopener">@epicmodelsandtalent ↗</a>
    </div>
    <div class="instagram-luxury-grid" aria-label="Featured EPIC Instagram posts">${cards}
    </div>
  </div>
  <script>
    document.querySelectorAll('.instagram-post-cover').forEach(function (image) {
      image.addEventListener('error', function () {
        if (image.dataset.fallbackApplied === 'true') return;
        image.dataset.fallbackApplied = 'true';
        image.src = image.dataset.fallback;
        var card = image.closest('.instagram-luxury-card');
        if (card) card.classList.add('uses-local-fallback');
      });
    });
  </script>
</section>`;

homepage = homepage.replace(musePattern, section);

// Remove every prior Instagram embed implementation. The luxury cards link to the
// exact posts but do not rely on Instagram's unreliable iframe or embed.js renderer.
homepage = homepage
  .replace(/\s*<script[^>]+src="https:\/\/www\.instagram\.com\/embed\.js"[^>]*><\/script>/g, '')
  .replace(/<iframe[\s\S]*?instagram[\s\S]*?<\/iframe>/gi, '');

for (const post of posts) {
  if (!homepage.includes(`href="${post.url}"`)) {
    throw new Error(`Instagram post link was not installed: ${post.url}`);
  }
  if (!homepage.includes(`src="${mediaUrl(post.shortcode)}"`)) {
    throw new Error(`Instagram post cover was not installed: ${post.shortcode}`);
  }
}
if ((homepage.match(/class="instagram-luxury-card reveal-card"/g) || []).length !== posts.length) {
  throw new Error('Homepage does not contain exactly six luxury Instagram cards.');
}
if (homepage.includes('instagram-embed-frame') || homepage.includes('class="instagram-media"')) {
  throw new Error('A legacy Instagram embed remains on the homepage.');
}

await writeFile(homepagePath, homepage, 'utf8');

let styles = await readFile(stylesPath, 'utf8');
const marker = '/* EPIC luxury Instagram post cards */';
if (!styles.includes(marker)) {
  styles += `\n\n${marker}\n.instagram-section{position:relative;overflow:hidden;background:radial-gradient(circle at 50% 0,rgba(213,174,66,.08),transparent 38%)}\n.instagram-section:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(120deg,transparent 0 44%,rgba(255,220,125,.035) 50%,transparent 56%)}\n.instagram-luxury-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(22px,2.2vw,36px);align-items:stretch;margin-top:clamp(30px,4vw,58px)}\n.instagram-luxury-card{position:relative;min-width:0;padding:1px;border-radius:24px;background:linear-gradient(145deg,#f9dc7a 0%,#8d691f 22%,#f8e7a0 48%,#6f5016 72%,#dcb94d 100%);box-shadow:0 28px 80px rgba(0,0,0,.55),0 0 0 1px rgba(255,223,128,.12),0 0 34px rgba(201,157,40,.08);transform:translateZ(0);transition:transform .45s cubic-bezier(.2,.8,.2,1),box-shadow .45s ease}\n.instagram-luxury-card:before{content:"";position:absolute;inset:7px;border:1px solid rgba(255,231,159,.14);border-radius:18px;pointer-events:none;z-index:3}\n.instagram-luxury-card:hover{transform:translateY(-8px);box-shadow:0 38px 95px rgba(0,0,0,.62),0 0 0 1px rgba(255,223,128,.2),0 0 48px rgba(201,157,40,.15)}\n.instagram-luxury-link{display:block;color:inherit;text-decoration:none;border-radius:23px;overflow:hidden;background:#070707}\n.instagram-luxury-media{position:relative;aspect-ratio:4/5;overflow:hidden;border-radius:23px;background:linear-gradient(145deg,#15130d,#050505 58%,#171208)}\n.instagram-post-cover{display:block;width:100%;height:100%;object-fit:cover;object-position:center;filter:saturate(.94) contrast(1.03);transition:transform .8s cubic-bezier(.2,.8,.2,1),filter .45s ease}\n.instagram-luxury-card:hover .instagram-post-cover{transform:scale(1.045);filter:saturate(1.03) contrast(1.06)}\n.instagram-luxury-sheen{position:absolute;inset:0;pointer-events:none;background:linear-gradient(125deg,rgba(255,241,185,.16) 0%,transparent 20% 64%,rgba(222,174,52,.1) 82%,transparent 100%),linear-gradient(to top,rgba(0,0,0,.92) 0%,rgba(0,0,0,.22) 38%,transparent 62%)}\n.instagram-vip-badge{position:absolute;top:22px;left:22px;display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid rgba(255,226,132,.58);border-radius:999px;background:rgba(7,7,7,.78);backdrop-filter:blur(12px);color:#f3d878;font-size:.68rem;font-weight:600;letter-spacing:.18em;box-shadow:0 10px 30px rgba(0,0,0,.35)}\n.instagram-vip-badge span{font-size:.8rem;color:#fff1b4}\n.instagram-luxury-overlay{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding:64px 26px 27px;color:#fff}\n.instagram-luxury-overlay div{display:grid;gap:7px}\n.instagram-handle{color:#d9b84e;font-size:.7rem;letter-spacing:.13em;text-transform:uppercase}\n.instagram-luxury-overlay strong{font-family:"Playfair Display",serif;font-size:clamp(1.05rem,1.25vw,1.35rem);font-weight:500}\n.instagram-open-icon{display:grid;place-items:center;flex:0 0 44px;width:44px;height:44px;border:1px solid rgba(255,225,126,.55);border-radius:50%;background:rgba(10,10,10,.58);color:#f3d878;font-size:1.15rem;transition:transform .35s ease,background .35s ease,color .35s ease}\n.instagram-luxury-card:hover .instagram-open-icon{transform:rotate(8deg) scale(1.06);background:#d7b548;color:#070707}\n.instagram-gold-corner{position:absolute;z-index:4;width:28px;height:28px;pointer-events:none}\n.instagram-gold-corner:before,.instagram-gold-corner:after{content:"";position:absolute;background:linear-gradient(90deg,#f8e59b,#98701c)}\n.instagram-gold-corner:before{width:28px;height:1px}\n.instagram-gold-corner:after{width:1px;height:28px}\n.corner-tl{top:12px;left:12px}.corner-tr{top:12px;right:12px;transform:rotate(90deg)}.corner-br{right:12px;bottom:12px;transform:rotate(180deg)}.corner-bl{left:12px;bottom:12px;transform:rotate(270deg)}\n.instagram-luxury-card.uses-local-fallback:after{content:"EPIC SELECT";position:absolute;z-index:5;right:22px;top:24px;color:rgba(255,230,151,.78);font-size:.58rem;letter-spacing:.17em}\n@media(max-width:1050px){.instagram-luxury-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}\n@media(max-width:680px){.instagram-luxury-grid{grid-template-columns:1fr;gap:24px}.instagram-luxury-card{border-radius:20px}.instagram-luxury-link,.instagram-luxury-media{border-radius:19px}.instagram-luxury-overlay{padding:58px 22px 23px}.instagram-vip-badge{top:18px;left:18px}}\n`;
}
await writeFile(stylesPath, styles, 'utf8');

console.log(`Installed ${posts.length} luxury linked EPIC Instagram post cards with direct media covers and graceful local fallbacks.`);
