// Как проявляются стикеры: сколько уже видно на каждый момент времени.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const srv = spawn('node', ['tools/serve.mjs', 'dist', '8774'], { stdio: 'ignore' });
process.on('exit', () => srv.kill());
await new Promise((r) => setTimeout(r, 700));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:8774/index.html', { waitUntil: 'commit' });

const start = Date.now();

for (let i = 0; i < 14; i++) {
  await page.waitForTimeout(180);

  const state = await page.evaluate(() => {
    if (!document.body) return null;
    const items = [...document.querySelectorAll('.collage .placed')];
    const shown = items.filter((el) => Number(getComputedStyle(el).opacity) > 0.5).length;
    return { всего: items.length, видно: shown, страница: getComputedStyle(document.body).opacity };
  });

  if (state) {
    const bar = '█'.repeat(state.видно) + '·'.repeat(state.всего - state.видно);
    console.log(`  ${String(Date.now() - start).padStart(5)}мс  ${bar}  ${state.видно}/${state.всего}  страница ${Number(state.страница).toFixed(2)}`);
  }
}

await browser.close();
srv.kill();
