import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const homepagePath = join(process.cwd(), 'dist', 'index.html');
const firstEmbedPattern = /<blockquote\s+class="instagram-media instagram-native-embed"\s+data-instgrm-captioned\s+data-instgrm-permalink="https:\/\/www\.instagram\.com\/p\/DbOAUooiFvr\/\?utm_source=ig_embed&amp;utm_campaign=loading"\s+data-instgrm-version="14">[\s\S]*?<\/blockquote>/;

const officialEmbed = `<blockquote class="instagram-media instagram-native-embed" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/p/DbOAUooiFvr/?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:16px;"><a href="https://www.instagram.com/p/DbOAUooiFvr/?utm_source=ig_embed&amp;utm_campaign=loading" style="background:#FFFFFF;line-height:0;padding:0;text-align:center;text-decoration:none;width:100%;" target="_blank"><div style="display:flex;flex-direction:row;align-items:center;"><div style="background-color:#F4F4F4;border-radius:50%;height:40px;margin-right:14px;width:40px;"></div><div style="display:flex;flex-direction:column;flex-grow:1;justify-content:center;"><div style="background-color:#F4F4F4;border-radius:4px;height:14px;margin-bottom:6px;width:100px;"></div><div style="background-color:#F4F4F4;border-radius:4px;height:14px;width:60px;"></div></div></div><div style="padding:31.5% 0;"></div><div style="color:#3897f0;font-family:Arial,sans-serif;font-size:14px;font-weight:550;line-height:18px;padding-top:8px;">View this post on Instagram</div><div style="padding:12.5% 0;"></div></a><p style="color:#c9c8cd;font-family:Arial,sans-serif;font-size:14px;line-height:17px;margin:8px 0 0;overflow:hidden;padding:8px 0 7px;text-align:center;text-overflow:ellipsis;white-space:nowrap;"><a href="https://www.instagram.com/p/DbOAUooiFvr/?utm_source=ig_embed&amp;utm_campaign=loading" style="color:#c9c8cd;font-family:Arial,sans-serif;font-size:14px;text-decoration:none;" target="_blank">A post shared by Corrie Yee (@corrieyee)</a></p></div></blockquote>`;

let homepage = await readFile(homepagePath, 'utf8');
if (!firstEmbedPattern.test(homepage)) {
  throw new Error('Slot 01 Instagram blockquote was not found for the exact-code test.');
}

homepage = homepage.replace(firstEmbedPattern, officialEmbed);

if (!homepage.includes('A post shared by Corrie Yee (@corrieyee)')) {
  throw new Error('Slot 01 official Instagram fallback content was not installed.');
}
if ((homepage.match(/class="instagram-media instagram-native-embed"/g) || []).length !== 6) {
  throw new Error('The exact-code test changed the six-card Instagram structure.');
}

await writeFile(homepagePath, homepage, 'utf8');
console.log('Slot 01 now uses Instagram’s copied outer blockquote, permalink, version, inline style, and official fallback structure; slots 02–06 unchanged.');
