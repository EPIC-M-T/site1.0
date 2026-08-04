import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputDir = join(process.cwd(), 'dist');
const homepagePath = join(outputDir, 'index.html');
const stylesPath = join(outputDir, 'assets', 'styles.css');

const posts = [
  'https://www.instagram.com/p/DaSwksAlF2T/',
  'https://www.instagram.com/p/DbScVFgJWmd/',
  'https://www.instagram.com/p/DbFYvYwHL2E/',
  'https://www.instagram.com/p/DbOAUooiFvr/',
  'https://www.instagram.com/p/Da0f5xKxZ0m/',
  'https://www.instagram.com/p/DagtYx7xa2D/'
];

let homepage = await readFile(homepagePath, 'utf8');
const musePattern = /<section class="section-pad muse-section">[\s\S]*?<\/section>/;
if (!musePattern.test(homepage)) {
  throw new Error('Homepage Muse Wall section was not found.');
}

const embeds = posts.map((url, index) => `
        <article class="instagram-embed-card reveal-card">
          <blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14">
            <a class="instagram-embed-fallback" href="${url}" target="_blank" rel="noopener">View EPIC Instagram post ${index + 1}</a>
          </blockquote>
        </article>`).join('');

const section = `<section class="section-pad muse-section instagram-section">
  <div class="container">
    <div class="section-heading split-heading">
      <div><p class="eyebrow">The Muse Wall</p><h2>Follow the work.<br><em>Feel the energy.</em></h2></div>
      <a class="text-link" href="https://www.instagram.com/epicmodelsandtalent/" target="_blank" rel="noopener">@epicmodelsandtalent ↗</a>
    </div>
    <div class="instagram-embed-grid" aria-label="Recent EPIC Instagram posts">${embeds}
    </div>
  </div>
</section>`;

homepage = homepage.replace(musePattern, section);

const embedScript = '<script async src="https://www.instagram.com/embed.js"></script>';
if (!homepage.includes('https://www.instagram.com/embed.js')) {
  if (!homepage.includes('</body>')) throw new Error('Homepage closing body tag was not found.');
  homepage = homepage.replace('</body>', `  ${embedScript}\n</body>`);
}

for (const url of posts) {
  if (!homepage.includes(`data-instgrm-permalink="${url}"`)) {
    throw new Error(`Instagram embed was not installed: ${url}`);
  }
}
if ((homepage.match(/class="instagram-media"/g) || []).length !== posts.length) {
  throw new Error('Homepage does not contain exactly six Instagram embeds.');
}

await writeFile(homepagePath, homepage, 'utf8');

let styles = await readFile(stylesPath, 'utf8');
const marker = '/* EPIC Instagram embeds */';
if (!styles.includes(marker)) {
  styles += `\n\n${marker}\n.instagram-section{overflow:hidden}\n.instagram-embed-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(18px,2vw,30px);align-items:start;margin-top:clamp(28px,4vw,56px)}\n.instagram-embed-card{min-width:0;overflow:hidden;border:1px solid rgba(198,166,100,.22);border-radius:18px;background:rgba(255,255,255,.035);box-shadow:0 24px 70px rgba(0,0,0,.28)}\n.instagram-embed-card .instagram-media,.instagram-embed-card .instagram-media-rendered,.instagram-embed-card iframe{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;margin:0!important}\n.instagram-embed-fallback{display:flex;min-height:420px;align-items:center;justify-content:center;padding:32px;color:#d7bd82;text-align:center;text-decoration:none;letter-spacing:.08em;text-transform:uppercase;font-size:.78rem}\n@media(max-width:1050px){.instagram-embed-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}\n@media(max-width:680px){.instagram-embed-grid{grid-template-columns:1fr;gap:20px}.instagram-embed-card{border-radius:14px}.instagram-embed-fallback{min-height:360px}}\n`;
}
await writeFile(stylesPath, styles, 'utf8');

console.log(`Installed ${posts.length} official EPIC Instagram embeds on the homepage Muse Wall.`);
