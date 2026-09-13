// Что происходит с прозрачностью при заходе на страницу и при скролле.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const dir = process.argv[2];
const path = process.argv[3];
const PORT = 8775;

const srv = spawn('node', ['tools/serve.mjs', dir, String(PORT)], { stdio: 'ignore' });
process.on('exit', () => srv.kill());
await new Promise((r) => setTimeout(r, 700));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const snap = () =>
  page.evaluate(() => {
    if (!document.body) return { body: 'ещё нет' };

    const wrapper = document.querySelector('main');
    const hidden = [...document.querySelectorAll('.placed')].filter(
      (el) => Number(getComputedStyle(el).opacity) < 0.99,
    );
    return {
      body: Number(getComputedStyle(document.body).opacity).toFixed(2),
      main: wrapper ? Number(getComputedStyle(wrapper).opacity).toFixed(2) : '—',
      корень: document.documentElement.className || '—',
      прозрачныхЭлементов: hidden.length,
    };
  });

await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'commit' });
for (const ms of [0, 60, 150, 300, 600, 1500]) {
  await page.waitForTimeout(ms === 0 ? 20 : ms - (ms === 60 ? 20 : 0));
  console.log(`  +${String(ms).padStart(4)}мс`, JSON.stringify(await snap(), null, 0));
}

console.log('\n  после прокрутки к «РАБОТАЕМ!»:');
await page.evaluate(() => window.scrollTo(0, 700));
await page.waitForTimeout(1200);
console.log('  ', JSON.stringify(await snap(), null, 0));

await browser.close();
srv.kill();
