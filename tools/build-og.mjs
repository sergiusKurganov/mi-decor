// Картинка для соцсетей: логотип на фирменном фоне, 1200×630.
import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;
const INK = { r: 12, g: 10, b: 10, alpha: 1 };

const logo = await sharp('src/assets/logo.png')
  .resize({ width: 720 })
  .toBuffer();

await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: INK } })
  .composite([{ input: logo, gravity: 'centre' }])
  .png()
  .toFile('public/og.png');

const { width, height } = await sharp('public/og.png').metadata();
const { size } = await (await import('node:fs/promises')).stat('public/og.png');
console.log(`public/og.png — ${width}×${height}, ${(size / 1024).toFixed(0)} КБ`);
