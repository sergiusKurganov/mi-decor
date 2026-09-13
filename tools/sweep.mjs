// Как меняется геометрия элемента по всему диапазону ширин, а не в пяти точках.
//
//   node tools/sweep.mjs <путь> <селектор> [ширины через запятую]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const [pagePath, selector, widthsArg] = process.argv.slice(2);
const widths = (widthsArg ?? '1440,1300,1200,1199,1100,1000,960,959,900,800,700,640,639,560,480,479,420,375,320')
  .split(',')
  .map(Number);

const dir = process.env.SWEEP_DIR ?? 'dist';
const srv = spawn('node', ['tools/serve.mjs', dir, '8786'], { stdio: 'ignore' });
process.on('exit', () => srv.kill());
await new Promise((r) => setTimeout(r, 700));

const browser = await chromium.launch();

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`http://localhost:8786${pagePath}`);
  await page.waitForLoadState('load');
  await page.waitForTimeout(500);

  const box = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x * 10) / 10, w: Math.round(r.width * 10) / 10 };
  }, selector);

  console.log(box ? `  ${width}\tx=${box.x}\tw=${box.w}` : `  ${width}\t—`);
  await page.close();
}

await browser.close();
srv.kill();
