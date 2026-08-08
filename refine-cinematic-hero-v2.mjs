import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const homepagePath = join(root, 'dist', 'index.html');
const stylesPath = join(root, 'dist', 'assets', 'styles.css');

let homepage = await readFile(homepagePath, 'utf8');

const replacements = [
  [
    "const scaleTarget = window.matchMedia('(max-width: 780px)').matches ? 34 : 50;",
    "const isMobileHero = window.matchMedia('(max-width: 780px)').matches;\n      const scaleTarget = isMobileHero ? 12 : 26;"
  ],
  [
    "end: '+=280%',",
    "end: isMobileHero ? '+=135%' : '+=280%',"
  ],
  [
    "scrub: 1.05,",
    "scrub: isMobileHero ? 0.58 : 1.05,"
  ],
  [
    "transformOrigin: '73.5% 50%',",
    "transformOrigin: isMobileHero ? '72% 50%' : '73.5% 50%',"
  ],
  [
    "duration: 0.25\n        }, 0.64)",
    "duration: isMobileHero ? 0.2 : 0.25\n        }, isMobileHero ? 0.48 : 0.64)"
  ],
  [
    "duration: 0.13\n        }, 0.87)",
    "duration: isMobileHero ? 0.16 : 0.13\n        }, isMobileHero ? 0.72 : 0.87)"
  ],
  [
    "duration: 0.16,\n          ease: 'none'\n        }, 0.84);",
    "duration: isMobileHero ? 0.18 : 0.16,\n          ease: 'none'\n        }, isMobileHero ? 0.69 : 0.84);"
  ]
];

for (const [before, after] of replacements) {
  if (!homepage.includes(before)) {
    throw new Error(`Cinematic hero v2 could not find expected runtime fragment: ${before.slice(0, 80)}`);
  }
  homepage = homepage.replace(before, after);
}

await writeFile(homepagePath, homepage, 'utf8');

let styles = await readFile(stylesPath, 'utf8');
const marker = '/* EPIC cinematic video-mask hero v2 responsive refinement */';
if (styles.includes(marker)) {
  throw new Error('The cinematic hero v2 refinement marker already exists.');
}

styles += `\n\n${marker}\n@media (min-width:901px){\n  .epic-mask-video{\n    -webkit-mask-size:clamp(1520px,160vw,3000px) auto;\n    mask-size:clamp(1520px,160vw,3000px) auto;\n  }\n}\n@media (max-width:780px){\n  .epic-mask-video{\n    -webkit-mask-size:clamp(310px,88vw,720px) auto;\n    mask-size:clamp(310px,88vw,720px) auto;\n    object-position:center center;\n  }\n  .epic-mask-word{\n    transform:translateZ(0);\n    transform-origin:72% 50%;\n  }\n  .epic-mask-scroll-cue{\n    bottom:max(30px,calc(env(safe-area-inset-bottom) + 18px));\n  }\n}\n`;

await writeFile(stylesPath, styles, 'utf8');

if (!homepage.includes("const scaleTarget = isMobileHero ? 12 : 26;")) {
  throw new Error('Cinematic hero v2 scale validation failed.');
}
if (!styles.includes('clamp(1520px,160vw,3000px)')) {
  throw new Error('Desktop EPIC mask-size validation failed.');
}
if (!styles.includes('clamp(310px,88vw,720px)')) {
  throw new Error('Mobile EPIC mask-size validation failed.');
}

console.log('Cinematic hero v2 applied: desktop EPIC doubled; mobile mask restored with a shorter controlled scroll transition.');
