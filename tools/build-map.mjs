// Собирает одну страницу-карту: все страницы сайта рядом, в масштабе.
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const PAGES = [
  ['/', 'Главная — /'],
  ['/commande', 'Команда — /commande'],
  ['/project', 'Проекты — /project'],
  ['/contact', 'Контакты — /contact'],
  ['/404', 'Не найдено — /404'],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const cards = [];

for (const [path, label] of PAGES) {
  await page.goto('http://localhost:4321' + path);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2600);

  const height = await page.evaluate(() => document.body.scrollHeight);
  cards.push(
    `<figure>
       <figcaption>${label}<span>1440 × ${height}px</span></figcaption>
       <div class="frame"><iframe src="http://localhost:4321${path}" width="1440" height="${height}"></iframe></div>
     </figure>`,
  );
  console.log(`  ${label.padEnd(26)} высота ${height}px`);
}

const SCALE = 0.102;

await writeFile(
  process.argv[2],
  `<meta charset="utf-8"><title>Карта сайта</title><style>
   body{background:#f4f4f5;margin:0;padding:14px;font:13px/1.4 -apple-system,system-ui,sans-serif}
   .row{display:flex;gap:12px;align-items:flex-start}
   figure{margin:0;width:${Math.round(1440 * SCALE)}px;flex:0 0 auto}
   figcaption{margin-bottom:6px;font-weight:600;color:#18181b;font-size:11px;line-height:1.25}
   figcaption span{display:block;font-weight:400;color:#71717a;font-size:10px}
   .frame{width:${Math.round(1440 * SCALE)}px;overflow:hidden;border-radius:6px;
          box-shadow:0 2px 14px rgba(0,0,0,.18);background:#0c0a0a}
   iframe{border:0;transform:scale(${SCALE});transform-origin:0 0;display:block}
   </style><div class="row">${cards.join('')}</div>`,
);

await browser.close();
