// Замер эталона: снимает геометрию и вычисленные стили элементов исходной вёрстки,
// чтобы новую написать под конкретные числа, а не пересказывать чужой CSS.
//
//   node tools/measure.mjs <путь-страницы> <ширина> [селектор ...]
//
// Пример: node tools/measure.mjs /index.html 1440 .bar '.nav a'
// По умолчанию отдаёт dist/, то есть собранный сайт.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const [pagePath, widthArg, ...selectors] = process.argv.slice(2);
const width = Number(widthArg ?? 1440);
const PORT = 8799;

const dir = process.env.MEASURE_DIR ?? 'dist';
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', dir], {
  stdio: 'ignore',
});
const stop = () => server.kill();
process.on('exit', stop);

await new Promise((r) => setTimeout(r, 800));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 } });
await page.goto(`http://localhost:${PORT}${pagePath}`);
await page.waitForLoadState('load');
await page.waitForTimeout(1200);

const result = await page.evaluate((sels) => {
  const props = [
    'position', 'display', 'backgroundColor', 'color', 'fontSize', 'fontWeight',
    'fontFamily', 'lineHeight', 'letterSpacing', 'textTransform', 'textAlign',
    'padding', 'margin', 'borderRadius', 'borderWidth', 'borderColor', 'zIndex',
    'opacity', 'transform',
  ];
  const out = [];
  for (const sel of sels) {
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const cs = getComputedStyle(el);
      const style = {};
      for (const p of props) style[p] = cs[p];
      out.push({
        sel,
        tag: el.tagName.toLowerCase(),
        text: (el.textContent ?? '').trim().slice(0, 60),
        href: el.getAttribute('href'),
        src: el.getAttribute('src') ?? el.getAttribute('data-original'),
        rect: {
          x: Math.round(r.x * 100) / 100,
          y: Math.round(r.y * 100) / 100,
          w: Math.round(r.width * 100) / 100,
          h: Math.round(r.height * 100) / 100,
        },
        style,
      });
    }
  }
  return { out, scrollHeight: document.body.scrollHeight };
}, selectors.length ? selectors : ['header', 'header a', 'header img']);

console.log(JSON.stringify(result, null, 2));

await browser.close();
stop();
