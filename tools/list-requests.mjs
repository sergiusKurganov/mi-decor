import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const srv = spawn('node', ['tools/serve.mjs', 'dist', '8773'], { stdio: 'ignore' });
process.on('exit', () => srv.kill());
await new Promise((r) => setTimeout(r, 700));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const rows = [];

page.on('response', async (res) => {
  const url = res.url();
  if (!/\.(woff2|css|js)$/.test(url)) return;
  try {
    rows.push([(await res.body()).length, url.split('/').pop()]);
  } catch {}
});

await page.goto('http://localhost:8773' + (process.argv[2] ?? '/index.html'));
await page.waitForLoadState('load');
await page.waitForTimeout(2500);

for (const [size, name] of rows.sort((a, b) => b[0] - a[0])) {
  console.log(`  ${(size / 1024).toFixed(0).padStart(5)} КБ  ${name}`);
}
console.log(`  ${(rows.reduce((n, r) => n + r[0], 0) / 1024).toFixed(0).padStart(5)} КБ  всего кода и шрифтов`);

await browser.close();
srv.kill();
