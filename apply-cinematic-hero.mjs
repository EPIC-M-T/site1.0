import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const homepagePath = join(root, 'dist', 'index.html');
const stylesPath = join(root, 'dist', 'assets', 'styles.css');
const heroUrls = JSON.parse(await readFile(join(root, 'hero-urls.json'), 'utf8'));

const maskSources = `
        <source media="(max-width: 767px)" src="${heroUrls.mobile}" type="video/mp4">
        <source src="${heroUrls.desktop}" type="video/mp4">`;

const cinematicHero = `<section class="epic-mask-hero" aria-label="EPIC Models and Talent cinematic introduction" data-epic-mask-hero>
    <div class="epic-mask-pin" data-epic-mask-pin>
      <video class="epic-breakout-video" muted loop playsinline preload="none" aria-hidden="true" data-epic-full-video data-mobile-src="${heroUrls.mobile}" data-desktop-src="${heroUrls.desktop}"></video>
      <div class="epic-mask-word" data-epic-mask-word aria-hidden="true">
        <video class="epic-mask-video" autoplay muted loop playsinline preload="metadata" data-epic-mask-video>${maskSources}
        </video>
      </div>
      <div class="epic-mask-vignette" aria-hidden="true"></div>
      <div class="epic-mask-grain" aria-hidden="true"></div>
      <div class="epic-mask-scroll-cue" aria-hidden="true"><i></i><i></i></div>
    </div>
  </section>
  <section class="epic-hero-copy-section" aria-labelledby="hero-title" data-epic-hero-copy>
    <div class="container epic-hero-copy-inner">
      <p class="eyebrow epic-hero-copy-kicker">Las Vegas · Models · Talent · Experiences</p>
      <h1 id="hero-title"><span>Where Las Vegas Talent</span><em>Becomes Legend.</em></h1>
      <p class="epic-hero-copy-lede">A luxury modeling and talent agency built for brands, productions, conventions, nightlife, and unforgettable live moments.</p>
      <div class="button-row epic-hero-copy-actions">
        <a class="button button-gold magnetic" href="/contact"><span>Book Exceptional Talent</span></a>
        <a class="button button-ghost magnetic" href="/become-talent"><span>Become EPIC</span></a>
      </div>
    </div>
  </section>`;

const introCurtain = `<div class="epic-liquid-intro" data-epic-liquid-intro aria-hidden="true">
    <svg class="epic-liquid-curtain" viewBox="0 0 1440 1000" preserveAspectRatio="none" aria-hidden="true">
      <path data-epic-curtain-path d="M0 0H1440V835C1125 760 890 965 610 885C355 812 192 908 0 858Z"></path>
    </svg>
    <div class="epic-liquid-logo">
      <span>✦</span>
      <strong>EPIC</strong>
      <small>MODELS &amp; TALENT</small>
    </div>
  </div>`;

let homepage = await readFile(homepagePath, 'utf8');
const heroPattern = /<section class="hero"[\s\S]*?<\/section>(?=<section class="bikini-feature)/;
if (!heroPattern.test(homepage)) {
  throw new Error('The original homepage hero was not found for cinematic replacement.');
}
homepage = homepage.replace(heroPattern, cinematicHero);

// The original preloader used the is-loading class to lock page scrolling.
// The cinematic curtain replaces that loader, so the homepage must never ship
// with the legacy loading lock still attached to the body.
homepage = homepage.replace(
  '<body class="is-loading home-page" id="top">',
  '<body class="home-page" id="top">\n  ' + introCurtain
);

const runtime = `<script data-epic-cinematic-hero>
  (() => {
    const unlockPage = () => {
      document.documentElement.classList.remove('is-loading');
      document.body && document.body.classList.remove('is-loading');
      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow-y');
      if (document.body) {
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('overflow-y');
      }
    };

    const boot = () => {
      unlockPage();

      const hero = document.querySelector('[data-epic-mask-hero]');
      const pin = document.querySelector('[data-epic-mask-pin]');
      const maskWord = document.querySelector('[data-epic-mask-word]');
      const maskVideo = document.querySelector('[data-epic-mask-video]');
      const fullVideo = document.querySelector('[data-epic-full-video]');
      const intro = document.querySelector('[data-epic-liquid-intro]');
      const curtainPath = document.querySelector('[data-epic-curtain-path]');
      const copySection = document.querySelector('[data-epic-hero-copy]');
      if (!hero || !pin || !maskWord || !maskVideo || !fullVideo || !intro) {
        unlockPage();
        return;
      }

      const mobile = window.matchMedia('(max-width: 780px)').matches;
      const safePlay = (video) => video.play().catch(() => {});
      safePlay(maskVideo);

      let breakoutLoaded = false;
      const loadBreakout = () => {
        if (breakoutLoaded) return;
        breakoutLoaded = true;
        fullVideo.src = mobile ? fullVideo.dataset.mobileSrc : fullVideo.dataset.desktopSrc;
        fullVideo.load();
        fullVideo.addEventListener('loadeddata', () => {
          if (Number.isFinite(maskVideo.currentTime)) {
            try { fullVideo.currentTime = maskVideo.currentTime; } catch (_) {}
          }
          safePlay(fullVideo);
        }, { once: true });
        fullVideo.addEventListener('canplay', () => safePlay(fullVideo), { once: true });
      };

      const scheduleBreakout = () => {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(loadBreakout, { timeout: 900 });
        } else {
          window.setTimeout(loadBreakout, 350);
        }
      };

      const syncVideos = () => {
        if (!breakoutLoaded || fullVideo.readyState < 2) return;
        if (!Number.isFinite(maskVideo.currentTime) || !Number.isFinite(fullVideo.currentTime)) return;
        if (Math.abs(maskVideo.currentTime - fullVideo.currentTime) > 0.28) {
          try { fullVideo.currentTime = maskVideo.currentTime; } catch (_) {}
        }
      };
      maskVideo.addEventListener('playing', syncVideos);
      window.setInterval(syncVideos, 1400);

      let curtainOpened = false;
      const openCurtain = () => {
        if (curtainOpened) return;
        curtainOpened = true;
        unlockPage();
        scheduleBreakout();
        document.documentElement.classList.add('epic-video-ready');

        const gsapReady = window.gsap && typeof window.gsap.timeline === 'function';
        if (!gsapReady) {
          intro.classList.add('is-open');
          window.setTimeout(() => intro.remove(), 900);
          return;
        }

        const curtainTimeline = window.gsap.timeline({ onComplete: () => intro.remove() });
        curtainTimeline
          .to(curtainPath, {
            attr: { d: 'M0 0H1440V865C1130 1015 870 770 575 920C310 1053 150 840 0 980Z' },
            duration: 0.55,
            ease: 'power2.inOut'
          }, 0)
          .to(intro, {
            yPercent: 112,
            duration: 0.98,
            ease: 'power4.inOut'
          }, 0.12);
      };

      // A usable decoded frame is enough to reveal the experience. Waiting for
      // an entire looping video to buffer can take minutes on constrained links.
      maskVideo.addEventListener('loadeddata', () => window.setTimeout(openCurtain, 80), { once: true });
      maskVideo.addEventListener('canplay', openCurtain, { once: true });
      if (maskVideo.readyState >= 2) openCurtain();
      window.setTimeout(openCurtain, 1800);

      ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach((eventName) => {
        window.addEventListener(eventName, loadBreakout, { once: true, passive: eventName !== 'keydown' });
      });

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion || !window.gsap || !window.ScrollTrigger) {
        loadBreakout();
        fullVideo.addEventListener('loadeddata', () => {
          fullVideo.style.opacity = '1';
          maskWord.style.opacity = '0';
        }, { once: true });
        unlockPage();
        return;
      }

      window.gsap.registerPlugin(window.ScrollTrigger);
      const scaleTarget = mobile ? 10 : 16;
      const endDistance = mobile ? '+=105%' : '+=165%';
      const vignette = pin.querySelector('.epic-mask-vignette');
      const scrollCue = pin.querySelector('.epic-mask-scroll-cue');

      const maskTimeline = window.gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: endDistance,
          pin: pin,
          pinSpacing: true,
          scrub: mobile ? 0.55 : 0.8,
          anticipatePin: 1,
          fastScrollEnd: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (self.progress > 0.015) loadBreakout();
          },
          onLeave: unlockPage,
          onLeaveBack: unlockPage
        }
      });

      maskTimeline
        .to(scrollCue, { opacity: 0, duration: 0.08, ease: 'none' }, 0)
        .to(maskWord, {
          scale: scaleTarget,
          transformOrigin: mobile ? '72% 50%' : '73.5% 50%',
          ease: 'none',
          duration: 0.78
        }, 0)
        .to(fullVideo, {
          opacity: 1,
          ease: 'power1.in',
          duration: 0.24
        }, mobile ? 0.48 : 0.55)
        .to(maskWord, {
          opacity: 0,
          ease: 'power2.out',
          duration: 0.16
        }, mobile ? 0.73 : 0.79)
        .to(vignette, {
          opacity: 0.36,
          duration: 0.18,
          ease: 'none'
        }, mobile ? 0.7 : 0.76);

      if (copySection) {
        const copyItems = copySection.querySelectorAll('.epic-hero-copy-kicker, h1 span, h1 em, .epic-hero-copy-lede, .epic-hero-copy-actions');
        window.gsap.from(copyItems, {
          y: mobile ? 52 : 90,
          opacity: 0,
          duration: mobile ? 0.82 : 1.05,
          stagger: 0.08,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: copySection,
            start: 'top 78%',
            once: true
          }
        });
      }

      window.setTimeout(() => {
        unlockPage();
        window.ScrollTrigger.refresh();
      }, 120);
      window.addEventListener('pageshow', unlockPage);
      window.addEventListener('resize', () => window.ScrollTrigger.refresh(), { passive: true });
    };

    unlockPage();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
      boot();
    }
    window.setTimeout(unlockPage, 500);
    window.setTimeout(unlockPage, 2000);
  })();
</script>`;

homepage = homepage.replace('</body>', `${runtime}\n</body>`);

// The removed hero was the homepage's only Lottie target. Avoid downloading the
// global Lottie runtime when no data-lottie element remains in the document.
if (!homepage.includes('data-lottie=')) {
  homepage = homepage.replace(/\s*<script[^>]+src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/lottie-web\/[^"]+"[^>]*><\/script>/, '');
}

await writeFile(homepagePath, homepage, 'utf8');

let styles = await readFile(stylesPath, 'utf8');
const marker = '/* EPIC cinematic video-mask hero v2 performance */';
if (styles.includes(marker)) {
  throw new Error('The cinematic hero performance stylesheet marker already exists.');
}
styles += `

${marker}
html{overflow-y:auto!important}
body.home-page{overflow-x:hidden!important;overflow-y:auto!important}
body.home-page.is-loading{overflow-y:auto!important}
body.home-page .preloader{display:none!important}
.epic-liquid-intro{position:fixed;inset:0;z-index:12000;overflow:hidden;pointer-events:none;background:#050505;transition:transform .98s cubic-bezier(.76,0,.24,1)}
.epic-liquid-intro.is-open{transform:translateY(112%)}
.epic-liquid-curtain{position:absolute;inset:0;width:100%;height:112%;overflow:visible;filter:drop-shadow(0 26px 45px rgba(0,0,0,.75))}
.epic-liquid-curtain path{fill:#050505}
.epic-liquid-logo{position:absolute;left:50%;top:48%;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);color:#fff;text-align:center;letter-spacing:.14em}
.epic-liquid-logo span{font-size:clamp(1.4rem,2.5vw,2.3rem);line-height:1;margin-bottom:.25rem}
.epic-liquid-logo strong{font-family:Inter,Arial,sans-serif;font-size:clamp(4.2rem,10vw,10.5rem);font-weight:600;line-height:.82;letter-spacing:-.065em}
.epic-liquid-logo small{margin-top:1.25rem;font-family:Inter,Arial,sans-serif;font-size:clamp(.62rem,.9vw,.86rem);font-weight:500;letter-spacing:.52em}
.epic-mask-hero{position:relative;height:100svh;min-height:620px;background:#030303;overflow:hidden}
.epic-mask-pin{position:relative;width:100%;height:100svh;min-height:620px;overflow:hidden;background:#030303;isolation:isolate}
.epic-breakout-video,.epic-mask-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block}
.epic-breakout-video{z-index:1;opacity:0;filter:saturate(.92) contrast(1.04) brightness(.82);will-change:opacity}
.epic-mask-word{position:absolute;inset:0;z-index:3;will-change:transform,opacity;transform:translateZ(0);backface-visibility:hidden}
.epic-mask-video{-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 360'%3E%3Ctext x='600' y='294' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-size='330' font-weight='900' letter-spacing='-28'%3EEPIC%3C/text%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 360'%3E%3Ctext x='600' y='294' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-size='330' font-weight='900' letter-spacing='-28'%3EEPIC%3C/text%3E%3C/svg%3E");-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;-webkit-mask-size:clamp(1200px,160vw,3000px) auto;mask-size:clamp(1200px,160vw,3000px) auto;filter:saturate(1.08) contrast(1.08) brightness(.94)}
.epic-mask-vignette{position:absolute;inset:0;z-index:4;pointer-events:none;background:radial-gradient(circle at 50% 48%,transparent 34%,rgba(0,0,0,.18) 68%,rgba(0,0,0,.72) 112%);opacity:.7}
.epic-mask-grain{position:absolute;inset:-50%;z-index:5;pointer-events:none;opacity:.045;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.66'/%3E%3C/svg%3E");animation:epic-grain-shift .32s steps(2) infinite}
.epic-mask-scroll-cue{position:absolute;left:50%;bottom:clamp(32px,5vh,70px);z-index:7;width:34px;height:58px;transform:translateX(-50%);border:1px solid rgba(214,179,76,.52);border-radius:999px;opacity:.9}
.epic-mask-scroll-cue i:first-child{position:absolute;left:50%;top:11px;width:4px;height:4px;border-radius:50%;background:#d9b549;transform:translateX(-50%);animation:epic-scroll-dot 1.65s ease-in-out infinite}
.epic-mask-scroll-cue i:last-child{position:absolute;left:50%;bottom:-18px;width:1px;height:14px;background:linear-gradient(#d9b549,transparent);transform:translateX(-50%)}
.epic-hero-copy-section{position:relative;z-index:2;overflow:hidden;background:#080808;padding:clamp(110px,15vw,220px) 0 clamp(105px,13vw,190px);border-top:1px solid rgba(215,178,70,.18)}
.epic-hero-copy-section:before{content:"";position:absolute;inset:-20% -10%;pointer-events:none;background:radial-gradient(circle at 18% 42%,rgba(185,139,37,.12),transparent 34%),linear-gradient(115deg,transparent 0 48%,rgba(255,255,255,.018) 49% 51%,transparent 52%);transform:skewY(-4deg)}
.epic-hero-copy-inner{position:relative;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);grid-template-areas:"kicker kicker" "title lede" "title actions";column-gap:clamp(50px,8vw,150px);align-items:end}
.epic-hero-copy-kicker{grid-area:kicker;margin-bottom:clamp(32px,5vw,62px)}
.epic-hero-copy-section h1{grid-area:title;margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:500;font-size:clamp(4.4rem,9.2vw,10.5rem);line-height:.84;letter-spacing:-.065em;color:#f7f3ea}
.epic-hero-copy-section h1 span,.epic-hero-copy-section h1 em{display:block}
.epic-hero-copy-section h1 em{color:#c9a449;font-weight:500}
.epic-hero-copy-lede{grid-area:lede;max-width:520px;margin:0 0 clamp(28px,4vw,46px);font-size:clamp(1.05rem,1.35vw,1.35rem);line-height:1.72;color:rgba(247,243,234,.72)}
.epic-hero-copy-actions{grid-area:actions;align-self:start;margin:0}
@keyframes epic-scroll-dot{0%{transform:translate(-50%,0);opacity:0}20%{opacity:1}72%{opacity:1}100%{transform:translate(-50%,24px);opacity:0}}
@keyframes epic-grain-shift{0%{transform:translate3d(0,0,0)}25%{transform:translate3d(1%,-.5%,0)}50%{transform:translate3d(-.5%,1%,0)}75%{transform:translate3d(.5%,.5%,0)}100%{transform:translate3d(-1%,-.5%,0)}}
@media (max-width:900px){.epic-hero-copy-inner{grid-template-columns:1fr;grid-template-areas:"kicker" "title" "lede" "actions";align-items:start}.epic-hero-copy-section h1{margin-bottom:38px}.epic-hero-copy-lede{margin-bottom:34px}.epic-mask-video{-webkit-mask-size:110vw auto;mask-size:110vw auto}}
@media (max-width:600px){.epic-mask-hero,.epic-mask-pin{min-height:560px}.epic-liquid-logo strong{font-size:clamp(4rem,25vw,7rem)}.epic-liquid-logo small{letter-spacing:.35em}.epic-mask-video{-webkit-mask-size:92vw auto;mask-size:92vw auto}.epic-hero-copy-section{padding:94px 0 100px}.epic-hero-copy-section h1{font-size:clamp(3.45rem,17.2vw,5.6rem);line-height:.88}.epic-hero-copy-actions{display:grid;width:100%;gap:12px}.epic-hero-copy-actions .button{width:100%;justify-content:center}}
@media (prefers-reduced-motion:reduce){.epic-mask-grain,.epic-mask-scroll-cue i{animation:none}.epic-liquid-intro{transition:none}.epic-mask-scroll-cue{display:none}}
`;
await writeFile(stylesPath, styles, 'utf8');

if (!homepage.includes('data-epic-mask-hero') || !homepage.includes('data-epic-hero-copy') || !homepage.includes('data-epic-liquid-intro')) {
  throw new Error('Cinematic hero validation failed.');
}
if (homepage.includes('<body class="is-loading home-page"')) {
  throw new Error('The homepage still contains the legacy loading scroll lock.');
}
if (!homepage.includes('preload="none"') || !homepage.includes('data-desktop-src=')) {
  throw new Error('The deferred breakout-video loading strategy was not installed.');
}
console.log('Installed unlocked, performance-optimized EPIC video-mask hero with responsive scroll behavior.');
