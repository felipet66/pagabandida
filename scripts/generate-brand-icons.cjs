const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const master = path.join(root, 'src/assets/brand/pagabandida-emblema-verde-v1.png');
const brand = path.join(root, 'src/assets/brand');
const publicDir = path.join(root, 'public');
const background = '#14220D';

async function tile(size, artworkSize) {
  const artwork = await sharp(master).resize(artworkSize, artworkSize, { fit: 'contain' }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: artwork, gravity: 'centre' }]).png().toBuffer();
}

async function main() {
  await sharp(master).resize(512, 512).webp({ quality: 90, alphaQuality: 100 })
    .toFile(path.join(brand, 'pagabandida-emblema-verde-512.webp'));
  for (const [file, size] of [['favicon-16x16.png', 16], ['favicon-32x32.png', 32], ['favicon.png', 64]]) {
    await sharp(master).resize(size, size).png().toFile(path.join(publicDir, file));
  }
  for (const [file, size] of [['apple-touch-icon.png', 180], ['android-chrome-192x192.png', 192], ['android-chrome-512x512.png', 512]]) {
    await fs.writeFile(path.join(publicDir, file), await tile(size, Math.round(size * .92)));
  }
  // Keep the entire emblem inside the maskable icon's central safe circle.
  const { data, info } = await sharp(master).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let radius = 0;
  for (let y = 0; y < info.height; y += 1) for (let x = 0; x < info.width; x += 1) {
    if (data[(y * info.width + x) * 4 + 3]) radius = Math.max(radius, Math.hypot(x - info.width / 2, y - info.height / 2));
  }
  const safeSize = Math.floor(info.width * (512 * .38) / radius);
  await fs.writeFile(path.join(publicDir, 'android-chrome-maskable-512x512.png'), await tile(512, safeSize));

  const sizes = [16, 32, 48];
  const images = await Promise.all(sizes.map(size => sharp(master).resize(size, size).png().toBuffer()));
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  images.forEach((png, index) => {
    const entry = 6 + index * 16;
    header[entry] = sizes[index]; header[entry + 1] = sizes[index];
    header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8); header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  await fs.writeFile(path.join(publicDir, 'favicon.ico'), Buffer.concat([header, ...images]));
  console.log('Logo, favicon, Apple Touch and PWA icons generated from the approved green emblem.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
