// Проверка параллакса в новой сборке: сдвиг должен расти со скроллом и быть нулевым
// в начале страницы — иначе скриншот-тесты разойдутся с эталоном.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const srv = spawn('node', ['tools/serve.mjs', 'dist', '8779'], { stdio: 'ignore' });
process.on('exit', () => srv.kill());
await new Promise((r) => setTimeout(r, 700));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:8779/index.html');
await page.waitForLoadState('load');
await page.waitForTimeout(800);

for (const y of [0, 200, 500, 1000, 1500]) {
  await page.evaluate((to) => window.scrollTo(0, to), y);
  await page.waitForTimeout(250);

  const info = await page.evaluate(() => {
    const moving = document.querySelector('[data-parallax]');
    const still = [...document.querySelectorAll('.collage .placed')].find(
      (el) => !el.hasAttribute('data-parallax'),
    );
    const shift = (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).f.toFixed(1);
    return `едет: ${shift(moving)}px   стоит: ${shift(still)}px`;
  });

  console.log(`  scrollY=${String(y).padEnd(5)} ${info}`);
}

await browser.close();
srv.kill();
