import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
await page.goto('http://localhost:8765/');
await page.waitForLoadState('load');
await page.waitForTimeout(2500);

const box = async (sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
      position: cs.position, display: cs.display, z: cs.zIndex,
    };
  }, sel);

console.log('  ── меню закрыто');
console.log('    .bar ', JSON.stringify(await box('.bar')));
console.log('    .nav ', JSON.stringify(await box('.nav')));

await page.locator('.burger').click();
await page.waitForTimeout(400);

console.log('  ── меню открыто');
console.log('    .bar ', JSON.stringify(await box('.bar')));
console.log('    .nav ', JSON.stringify(await box('.nav')));
console.log('    первая ссылка', JSON.stringify(await box('.nav a')));

console.log('\n  ── что под пальцем в центре первой ссылки');
console.log(
  '   ',
  await page.evaluate(() => {
    const a = document.querySelector('.nav a');
    const r = a.getBoundingClientRect();
    const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return top ? `${top.tagName}.${top.className} «${(top.textContent || '').trim().slice(0, 20)}»` : 'ничего';
  }),
);

await page.screenshot({ path: process.argv[2], fullPage: false });
await browser.close();
