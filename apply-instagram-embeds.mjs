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

let homepage = await readFile(homepagePath, 'utf8');
const musePattern = /<section class="section-pad muse-section">[\s\S]*?<\/section>/;
if (!musePattern.test(homepage)) {
  throw new Error('Homepage Muse Wall section was not found.');
}

const cards = posts.map((post, index) => {
  const number = String(index + 1).padStart(2, '0');
  return `
        <article class="instagram-vip-card reveal-card">
          <a class="instagram-vip-link" href="${post.url}" target="_blank" rel="noopener" aria-label="Open EPIC Instagram post ${index + 1}">
            <div class="instagram-vip-surface">
              <span class="instagram-vip-corner corner-tl" aria-hidden="true"></span>
              <span class="instagram-vip-corner corner-tr" aria-hidden="true"></span>
              <span class="instagram-vip-corner corner-bl" aria-hidden="true"></span>
              <span class="instagram-vip-corner corner-br" aria-hidden="true"></span>
              <div class="instagram-vip-topline">
                <span><i>✦</i> EPIC SOCIAL</span>
                <b>${number}</b>
              </div>
              <div class="instagram-vip-center">
                <span class="instagram-vip-instagram">INSTAGRAM</span>
                <strong>EPIC</strong>
                <small>MODELS &amp; TALENT</small>
              </div>
              <div class="instagram-vip-footer">
                <div>
                  <span>@epicmodelsandtalent</span>
                  <strong>View Actual Post</strong>
                  <small>${post.shortcode}</small>
                </div>
                <b aria-hidden="true">↗</b>
              </div>
              <div class="instagram-vip-sheen" aria-hidden="true"></div>
            </div>
          </a>
        </article>`;
}).join('');

const section = `<section class="section-pad muse-section instagram-section">
  <div class="container">
    <div class="section-heading split-heading">
      <div><p class="eyebrow">The Muse Wall</p><h2>Follow the work.<br><em>Feel the energy.</em></h2></div>
      <a class="text-link" href="https://www.instagram.com/epicmodelsandtalent/" target="_blank" rel="noopener">@epicmodelsandtalent ↗</a>
    </div>
    <div class="instagram-vip-grid" aria-label="Featured EPIC Instagram posts">${cards}
    </div>
  </div>
</section>`;

homepage = homepage.replace(musePattern, section);

// Remove all previous Instagram iframe/script implementations and direct media
// fallbacks. These six cards never display unrelated imagery or white error panels.
homepage = homepage
  .replace(/\s*<script[^>]+src="https:\/\/www\.instagram\.com\/embed\.js"[^>]*><\/script>/g, '')
  .replace(/<iframe[\s\S]*?instagram[\s\S]*?<\/iframe>/gi, '');

for (const post of posts) {
  if (!homepage.includes(`href="${post.url}"`)) {
    throw new Error(`Instagram post link was not installed: ${post.url}`);
  }
}
if ((homepage.match(/class="instagram-vip-card reveal-card"/g) || []).length !== posts.length) {
  throw new Error('Homepage does not contain exactly six Instagram VIP cards.');
}
if (homepage.includes('/media/?size=') || homepage.includes('data-fallback=')) {
  throw new Error('An incorrect Instagram media fallback remains on the homepage.');
}
if (homepage.includes('instagram-embed-frame') || homepage.includes('class="instagram-media"')) {
  throw new Error('A legacy Instagram embed remains on the homepage.');
}

await writeFile(homepagePath, homepage, 'utf8');

let styles = await readFile(stylesPath, 'utf8');
const marker = '/* EPIC Instagram VIP link cards v3 */';
if (!styles.includes(marker)) {
  styles += `\n\n${marker}\n.instagram-section{position:relative;overflow:hidden;background:radial-gradient(circle at 50% 4%,rgba(216,174,58,.09),transparent 34%)}\n.instagram-section:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(118deg,transparent 0 43%,rgba(255,229,147,.035) 50%,transparent 57%)}\n.instagram-vip-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(22px,2.2vw,36px);margin-top:clamp(34px,4vw,62px)}\n.instagram-vip-card{position:relative;min-width:0;padding:1px;border-radius:24px;background:linear-gradient(145deg,#fff0a7 0%,#8d6519 20%,#e8c35a 39%,#4f360c 61%,#d7ae3c 82%,#fff1aa 100%);box-shadow:0 30px 85px rgba(0,0,0,.58),0 0 0 1px rgba(255,225,129,.12),0 0 38px rgba(202,156,34,.1);transition:transform .45s cubic-bezier(.2,.8,.2,1),box-shadow .45s ease}\n.instagram-vip-card:hover{transform:translateY(-9px);box-shadow:0 42px 105px rgba(0,0,0,.68),0 0 0 1px rgba(255,228,135,.24),0 0 56px rgba(202,156,34,.18)}\n.instagram-vip-link{display:block;color:inherit;text-decoration:none;border-radius:23px;overflow:hidden;background:#050505}\n.instagram-vip-surface{position:relative;display:flex;flex-direction:column;min-height:520px;overflow:hidden;border-radius:23px;padding:26px;background:radial-gradient(circle at 72% 18%,rgba(224,178,55,.2),transparent 25%),radial-gradient(circle at 18% 78%,rgba(155,104,19,.17),transparent 28%),linear-gradient(145deg,#17140c 0%,#050505 46%,#100c05 100%)}\n.instagram-vip-surface:before{content:"";position:absolute;inset:9px;border:1px solid rgba(255,232,158,.17);border-radius:17px;pointer-events:none}\n.instagram-vip-surface:after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.34;background-image:radial-gradient(rgba(255,230,151,.16) .6px,transparent .6px);background-size:7px 7px;mix-blend-mode:screen}\n.instagram-vip-topline{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;color:#e9cb6d;font-size:.67rem;letter-spacing:.18em}\n.instagram-vip-topline span{display:flex;align-items:center;gap:8px}.instagram-vip-topline i{color:#fff1b4;font-style:normal}.instagram-vip-topline b{font-size:.72rem;color:rgba(255,239,180,.72)}\n.instagram-vip-center{position:relative;z-index:2;display:grid;place-items:center;align-content:center;flex:1;text-align:center;padding:52px 12px}\n.instagram-vip-instagram{margin-bottom:18px;color:#cfae45;font-size:.68rem;letter-spacing:.28em}\n.instagram-vip-center strong{font-family:"Playfair Display",serif;font-size:clamp(4rem,7vw,6.5rem);line-height:.82;font-weight:500;letter-spacing:.015em;background:linear-gradient(180deg,#fff4bc 0%,#d4aa36 44%,#7a5514 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 12px 40px rgba(218,169,45,.12)}\n.instagram-vip-center small{margin-top:19px;color:#f6e5a5;font-size:.64rem;letter-spacing:.32em}\n.instagram-vip-footer{position:relative;z-index:2;display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding-top:22px;border-top:1px solid rgba(235,198,89,.24)}\n.instagram-vip-footer div{display:grid;gap:6px}.instagram-vip-footer div>span{color:#d7b54d;font-size:.67rem;letter-spacing:.12em}.instagram-vip-footer div>strong{color:#fff;font-family:"Playfair Display",serif;font-size:1.22rem;font-weight:500}.instagram-vip-footer div>small{color:rgba(255,255,255,.48);font-size:.58rem;letter-spacing:.18em;text-transform:uppercase}\n.instagram-vip-footer>b{display:grid;place-items:center;flex:0 0 48px;width:48px;height:48px;border:1px solid rgba(255,224,119,.58);border-radius:50%;background:rgba(255,255,255,.035);color:#edcd69;font-size:1.2rem;transition:transform .35s ease,background .35s ease,color .35s ease}\n.instagram-vip-card:hover .instagram-vip-footer>b{transform:rotate(8deg) scale(1.07);background:#d7b548;color:#070707}\n.instagram-vip-sheen{position:absolute;inset:-35% -65%;z-index:1;pointer-events:none;transform:translateX(-38%) rotate(18deg);background:linear-gradient(90deg,transparent 42%,rgba(255,241,186,.14) 50%,transparent 58%);transition:transform 1s cubic-bezier(.2,.8,.2,1)}\n.instagram-vip-card:hover .instagram-vip-sheen{transform:translateX(38%) rotate(18deg)}\n.instagram-vip-corner{position:absolute;z-index:4;width:29px;height:29px;pointer-events:none}.instagram-vip-corner:before,.instagram-vip-corner:after{content:"";position:absolute;background:linear-gradient(90deg,#fff1a9,#8b6418)}.instagram-vip-corner:before{width:29px;height:1px}.instagram-vip-corner:after{width:1px;height:29px}.corner-tl{top:13px;left:13px}.corner-tr{top:13px;right:13px;transform:rotate(90deg)}.corner-br{right:13px;bottom:13px;transform:rotate(180deg)}.corner-bl{left:13px;bottom:13px;transform:rotate(270deg)}\n@media(max-width:1050px){.instagram-vip-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.instagram-vip-surface{min-height:500px}}\n@media(max-width:680px){.instagram-vip-grid{grid-template-columns:1fr;gap:24px}.instagram-vip-card{border-radius:20px}.instagram-vip-link,.instagram-vip-surface{border-radius:19px}.instagram-vip-surface{min-height:460px;padding:22px}.instagram-vip-center strong{font-size:4.5rem}.instagram-vip-footer div>strong{font-size:1.1rem}}\n`;
}
await writeFile(stylesPath, styles, 'utf8');

console.log(`Installed ${posts.length} accurate EPIC Instagram VIP link cards with no unrelated image fallbacks.`);
