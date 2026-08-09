import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const homepagePath = join(process.cwd(), 'dist', 'index.html');
let homepage = await readFile(homepagePath, 'utf8');

// Vercel serves static assets with a long immutable cache lifetime. The source
// site uses stable filenames, so add a deployment-specific query key to ensure
// browsers receive the current hero CSS and application runtime immediately.
const assetVersion = '20260809-hero-v3';
homepage = homepage.replace(
  'href="/assets/styles.css"',
  `href="/assets/styles.css?v=${assetVersion}"`
);
homepage = homepage.replace(
  'src="/assets/app.js"',
  `src="/assets/app.js?v=${assetVersion}"`
);

homepage = homepage.replace(
  /\s*<script async src="https:\/\/www\.instagram\.com\/embed\.js"><\/script>\s*<script data-epic-instagram-loader>[\s\S]*?<\/script>/,
  ''
);

const lazyInstagramLoader = `
  <script data-epic-instagram-loader>
    (() => {
      const wall = document.querySelector('.instagram-native-section');
      if (!wall) return;

      let loading = false;
      let loaded = false;

      const processEmbeds = () => {
        if (!window.instgrm || !window.instgrm.Embeds) return false;
        window.instgrm.Embeds.process();
        return true;
      };

      const loadInstagram = () => {
        if (loading || loaded) {
          if (loaded) processEmbeds();
          return;
        }
        loading = true;
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.instagram.com/embed.js';
        script.onload = () => {
          loaded = true;
          let attempts = 0;
          const processWithRetry = () => {
            attempts += 1;
            if (!processEmbeds() && attempts < 12) {
              window.setTimeout(processWithRetry, 350);
            }
          };
          processWithRetry();
        };
        script.onerror = () => { loading = false; };
        document.head.appendChild(script);
      };

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.disconnect();
          loadInstagram();
        }, { rootMargin: '900px 0px' });
        observer.observe(wall);
      } else {
        window.setTimeout(loadInstagram, 3200);
      }

      window.addEventListener('pageshow', () => {
        if (loaded) processEmbeds();
      });
    })();
  </script>`;

if (!homepage.includes('</body>')) {
  throw new Error('Homepage closing body tag was not found.');
}
homepage = homepage.replace('</body>', `${lazyInstagramLoader}\n</body>`);

if ((homepage.match(/www\.instagram\.com\/embed\.js/g) || []).length !== 1) {
  throw new Error('Deferred Instagram loader must contain exactly one embed.js source.');
}
if (homepage.includes('<script async src="https://www.instagram.com/embed.js"')) {
  throw new Error('Instagram embed.js still loads eagerly.');
}
if (!homepage.includes(`/assets/styles.css?v=${assetVersion}`)) {
  throw new Error('Homepage stylesheet cache busting was not applied.');
}
if (!homepage.includes(`/assets/app.js?v=${assetVersion}`)) {
  throw new Error('Homepage application cache busting was not applied.');
}

await writeFile(homepagePath, homepage, 'utf8');
console.log('Deferred Instagram and versioned homepage CSS/JS to prevent stale immutable-cache assets.');
