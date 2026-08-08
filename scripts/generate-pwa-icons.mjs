/**
 * Rasterises the PWA icon set from the brand mark.
 *
 * Android's install prompt is unreliable with SVG-only manifest icons, and the
 * clients running this till are on cheap Android hardware, so real PNGs are
 * generated here rather than pointing the manifest at an SVG.
 *
 * Run with: npm run icons
 */
import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, '../public');
const iconsDir = resolve(publicDir, 'icons');

const BRAND = '#863bff';
const BACKGROUND = '#ffffff';

await mkdir(iconsDir, { recursive: true });

const mark = await readFile(resolve(publicDir, 'favicon.svg'));

/**
 * @param {number} size    output edge length in px
 * @param {number} padding fraction of the canvas left empty around the mark
 * @param {string} bg      canvas colour
 */
async function render(size, padding, bg) {
  const inner = Math.round(size * (1 - padding * 2));
  const markPng = await sharp(mark).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: markPng, gravity: 'centre' }])
    .png()
    .toBuffer();
}

const targets = [
  // Standard icons: a little breathing room, white plate.
  { file: 'icon-192.png', size: 192, padding: 0.14, bg: BACKGROUND },
  { file: 'icon-512.png', size: 512, padding: 0.14, bg: BACKGROUND },
  // Maskable: Android crops to a circle, so the mark sits well inside the 80%
  // safe zone. The plate stays white -- the brand mark is itself purple, and
  // purple-on-purple leaves the icon unreadable on the home screen.
  { file: 'icon-512-maskable.png', size: 512, padding: 0.28, bg: BACKGROUND },
  { file: 'apple-touch-icon.png', size: 180, padding: 0.14, bg: BACKGROUND },
];

for (const { file, size, padding, bg } of targets) {
  const buffer = await render(size, padding, bg);
  await sharp(buffer).toFile(resolve(iconsDir, file));
  console.log(`generated icons/${file} (${size}x${size})`);
}
