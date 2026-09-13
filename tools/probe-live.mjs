// Проверка живого сайта поведением, а не файлом: открывает меню на телефоне
// и смотрит, где оно раскрылось и что находится под пальцем.
//
//   node tools/probe-live.mjs https://mi-decor.art/ снимок.png
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
await page.goto(process.argv[2] ?? 'https://mi-decor.art/');
await page.waitForLoadState('load');
await page.waitForTimeout(3000);

await page.locator('.burger').click();
await page.waitForTimeout(400);

const info = await page.evaluate(() => {
  const bar = document.querySelector('.bar').getBoundingClientRect();
  const nav = document.querySelector('.nav').getBoundingClientRect();
  const link = document.querySelector('.nav a').getBoundingClientRect();
  const under = document.elementFromPoint(link.x + link.width / 2, link.y + link.height / 2);
  return {
    шапка: `${Math.round(bar.height)}px`,
    менюОткрылосьНа: `y=${Math.round(nav.y)}`,
    зазорОтШапки: `${Math.round(nav.y - (bar.y + bar.height))}px`,
    ширинаСсылки: `${Math.round(link.width)}px`,
    подПальцем: under ? `${under.tagName} «${(under.textContent || '').trim().slice(0, 14)}»` : 'ничего',
    ссылок: document.querySelectorAll('.nav a').length,
  };
});

console.log('  ' + JSON.stringify(info, null, 0).replace(/","/g, '"\n   "'));
await page.screenshot({ path: process.argv[3] });
await browser.close();
