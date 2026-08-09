import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const homepagePath = join(root, 'dist', 'index.html');
const stylesPath = join(root, 'dist', 'assets', 'styles.css');

let homepage = await readFile(homepagePath, 'utf8');

const runtimePattern = /<script data-epic-cinematic-hero>[\s\S]*?<\/script>/;
if (!runtimePattern.test(homepage)) {
  throw new Error('EPIC cinematic hero runtime was not found for the v3 refinement.');
}

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
      const bikiniSection = document.querySelector('.bikini-feature');

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
          window.requestIdleCallback(loadBreakout, { timeout: 800 });
        } else {
          window.setTimeout(loadBreakout, 300);
        }
      };

      const syncVideos = () => {
        if (!breakoutLoaded || hero.classList.contains('is-static')) return;
        if (fullVideo.readyState < 2) return;
        if (!Number.isFinite(maskVideo.currentTime) || !Number.isFinite(fullVideo.currentTime)) return;
        if (Math.abs(maskVideo.currentTime - fullVideo.currentTime) > 0.3) {
          try { fullVideo.currentTime = maskVideo.currentTime; } catch (_) {}
        }
      };
      maskVideo.addEventListener('playing', syncVideos);
      const syncTimer = window.setInterval(syncVideos, 1500);

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

        window.gsap.timeline({ onComplete: () => intro.remove() })
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

      maskVideo.addEventListener('loadeddata', () => window.setTimeout(openCurtain, 80), { once: true });
      maskVideo.addEventListener('canplay', openCurtain, { once: true });
      if (maskVideo.readyState >= 2) openCurtain();
      window.setTimeout(openCurtain, 1800);

      ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach((eventName) => {
        window.addEventListener(eventName, loadBreakout, {
          once: true,
          passive: eventName !== 'keydown'
        });
      });

      const freezeHero = () => {
        if (hero.classList.contains('is-static')) return;
        loadBreakout();
        const finishFreeze = () => {
          if (Number.isFinite(maskVideo.currentTime) && fullVideo.readyState >= 2) {
            try { fullVideo.currentTime = maskVideo.currentTime; } catch (_) {}
          }
          maskVideo.pause();
          fullVideo.pause();
          hero.classList.add('is-static');
        };
        if (fullVideo.readyState >= 2) finishFreeze();
        else fullVideo.addEventListener('loadeddata', finishFreeze, { once: true });
      };

      const resetHeroForReturn = () => {
        hero.classList.remove('is-static');
        safePlay(maskVideo);
        if (breakoutLoaded) safePlay(fullVideo);
      };

      if (bikiniSection && 'IntersectionObserver' in window) {
        const freezeObserver = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          freezeObserver.disconnect();
          freezeHero();
        }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
        freezeObserver.observe(bikiniSection);
      }

      window.addEventListener('pageshow', (event) => {
        unlockPage();
        if (event.persisted) resetHeroForReturn();
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

      // The mobile word now approaches dead-center. Both breakouts use a longer
      // scroll runway and substantially lower terminal scale to avoid the prior
      // runaway close-up while preserving the fall-through effect.
      const scaleTarget = mobile ? 4.2 : 6.8;
      const endDistance = mobile ? '+=165%' : '+=220%';
      const vignette = pin.querySelector('.epic-mask-vignette');
      const scrollCue = pin.querySelector('.epic-mask-scroll-cue');

      const maskTimeline = window.gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: endDistance,
          pin,
          pinSpacing: true,
          scrub: mobile ? 0.72 : 0.92,
          anticipatePin: 1,
          fastScrollEnd: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (self.progress > 0.01) loadBreakout();
          },
          onLeave: unlockPage,
          onLeaveBack: unlockPage
        }
      });

      maskTimeline
        .to(scrollCue, { opacity: 0, duration: 0.08, ease: 'none' }, 0)
        .to(maskWord, {
          scale: scaleTarget,
          transformOrigin: mobile ? '50% 50%' : '73.5% 50%',
          ease: 'none',
          duration: 0.94
        }, 0)
        .to(fullVideo, {
          opacity: 1,
          ease: 'power1.inOut',
          duration: 0.36
        }, mobile ? 0.38 : 0.44)
        .to(maskWord, {
          opacity: 0,
          ease: 'power2.out',
          duration: 0.2
        }, mobile ? 0.76 : 0.8)
        .to(vignette, {
          opacity: 0.34,
          duration: 0.2,
          ease: 'none'
        }, mobile ? 0.72 : 0.76);

      if (copySection) {
        const copyItems = copySection.querySelectorAll('.epic-hero-copy-kicker, h1 span, h1 em, .epic-hero-copy-lede, .epic-hero-copy-actions');
        window.gsap.from(copyItems, {
          y: mobile ? 42 : 82,
          opacity: 0,
          duration: mobile ? 0.78 : 1,
          stagger: 0.075,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: copySection,
            start: 'top 80%',
            once: true
          }
        });
      }

      window.setTimeout(() => {
        unlockPage();
        window.ScrollTrigger.refresh();
      }, 120);
      window.addEventListener('resize', () => window.ScrollTrigger.refresh(), { passive: true });
      window.addEventListener('pagehide', () => window.clearInterval(syncTimer), { once: true });
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

homepage = homepage.replace(runtimePattern, runtime);
await writeFile(homepagePath, homepage, 'utf8');

let styles = await readFile(stylesPath, 'utf8');
const marker = '/* EPIC hero v3 choreography and layout refinement */';
if (styles.includes(marker)) {
  throw new Error('EPIC hero v3 stylesheet marker already exists.');
}

const verticalMask = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 460 1500'%3E%3Cg text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-size='320' font-weight='900'%3E%3Ctext x='230' y='300'%3EE%3C/text%3E%3Ctext x='230' y='650'%3EP%3C/text%3E%3Ctext x='230' y='1000'%3EI%3C/text%3E%3Ctext x='230' y='1350'%3EC%3C/text%3E%3C/g%3E%3C/svg%3E")`;

styles += `\n\n${marker}\n
/* A frozen video frame becomes the static hero for the remainder of the current
   page visit after the Bikini Contest section is reached. */
.epic-mask-hero.is-static .epic-breakout-video{opacity:1!important}
.epic-mask-hero.is-static .epic-mask-word,
.epic-mask-hero.is-static .epic-mask-scroll-cue{opacity:0!important;visibility:hidden!important}
.epic-mask-hero.is-static .epic-mask-grain{animation:none}

/* Desktop starts ten percent smaller than the previous 160vw treatment. */
@media (min-width:901px){
  .epic-mask-video{
    -webkit-mask-size:clamp(1120px,144vw,2700px) auto!important;
    mask-size:clamp(1120px,144vw,2700px) auto!important;
  }

  .button-row:has(>.button:nth-child(2):last-child){
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    width:min(100%,660px);
    align-items:stretch;
  }
  .button-row:has(>.button:nth-child(2):last-child)>.button{
    width:100%;
    min-width:0;
    height:100%;
  }
  .bikini-actions{margin-inline:auto}
}

/* Mobile uses four independently positioned letters, eliminating the E/P
   collision while creating the requested tall, oversized vertical wordmark. */
@media (max-width:780px){
  .epic-mask-video{
    -webkit-mask-image:${verticalMask}!important;
    mask-image:${verticalMask}!important;
    -webkit-mask-size:auto clamp(820px,130vh,1380px)!important;
    mask-size:auto clamp(820px,130vh,1380px)!important;
    -webkit-mask-position:center center!important;
    mask-position:center center!important;
    object-position:center center!important;
  }
  .epic-mask-word{transform-origin:50% 50%!important}

  .epic-hero-copy-inner{
    justify-items:center;
    text-align:center;
  }
  .epic-hero-copy-kicker,
  .epic-hero-copy-section h1,
  .epic-hero-copy-lede{
    width:100%;
    margin-inline:auto;
    text-align:center;
  }
  .epic-hero-copy-actions{
    justify-content:center;
    margin-inline:auto;
  }
}

/* Never crop the Bikini Contest artwork or animated logo. */
.bikini-art-frame{display:grid;place-items:center;background:#05070d}
.bikini-art-frame img{
  position:absolute;
  inset:0;
  width:100%!important;
  height:100%!important;
  min-height:0!important;
  max-width:100%!important;
  max-height:100%!important;
  object-fit:contain!important;
  object-position:center center!important;
}

/* Center the FAQ action and both final client/talent CTAs on every viewport. */
.faq-intro .text-link{
  display:flex;
  width:max-content;
  max-width:100%;
  margin:28px auto 0;
  justify-content:center;
  text-align:center;
}
.cta-panel>div{
  width:100%;
  display:flex;
  flex-direction:column;
  align-items:center;
  text-align:center;
}
.cta-panel .eyebrow,
.cta-panel h2{text-align:center}
.cta-panel .button{margin-inline:auto}
`;

await writeFile(stylesPath, styles, 'utf8');

if (!homepage.includes("const scaleTarget = mobile ? 4.2 : 6.8;")) {
  throw new Error('EPIC hero v3 scale targets were not installed.');
}
if (!homepage.includes("const endDistance = mobile ? '+=165%' : '+=220%';")) {
  throw new Error('EPIC hero v3 scroll distances were not installed.');
}
if (!styles.includes("viewBox='0 0 460 1500'")) {
  throw new Error('Vertical mobile EPIC mask was not installed.');
}
if (!styles.includes('144vw')) {
  throw new Error('Desktop EPIC mask was not reduced by ten percent.');
}

console.log('Applied EPIC hero v3: vertical mobile mask, centered zoom, gradual breakout, visit-long frozen fallback, equal buttons, uncropped Bikini artwork, and centered CTAs.');
