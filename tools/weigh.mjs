// Сколько браузер реально качает на страницу: суммируем размеры ответов по типам.
// Вес папки dist тут ни при чём — из srcset скачивается один файл, а не все.
//
//   node tools/weigh.mjs dist /index.html 1440
//   node tools/weigh.mjs dist /commande.html 375
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const [dir, pagePath, widthArg] = process.argv.slice(2);
const width = Number(widthArg ?? 1440);
const PORT = 8777;

const srv = spawn('node', ['tools/serve.mjs', dir, String(PORT)], { stdio: 'ignore' });
process.on('exit', () => srv.kill());
await new Promise((r) => setTimeout(r, 700));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 } });

const bytes = new Map();
let requests = 0;

page.on('response', async (res) => {
  requests += 1;
  const type = (res.headers()['content-type'] ?? 'прочее').split(';')[0];
  try {
    const body = await res.body();
    bytes.set(type, (bytes.get(type) ?? 0) + body.length);
  } catch {
    // не все ответы отдают тело
  }
});

await page.goto(`http://localhost:${PORT}${pagePath}`);
await page.waitForLoadState('load');

// Прокручиваем страницу, чтобы догрузились ленивые картинки.
await page.evaluate(async () => {
  const step = Math.round(window.innerHeight / 2);
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 60));
  }
});
await page.waitForTimeout(1500);

const total = [...bytes.values()].reduce((a, b) => a + b, 0);
const kb = (n) => (n / 1024).toFixed(0).padStart(6);

console.log(`${dir}${pagePath} @${width}  запросов ${requests}`);
for (const [type, size] of [...bytes.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${kb(size)} КБ  ${type}`);
}
console.log(`  ${kb(total)} КБ  ВСЕГО`);

await browser.close();
srv.kill();
