// Забирает Roboto с Google Fonts в public/fonts и генерирует src/styles/fonts.css,
// чтобы сайт не тянул шрифты со стороннего домена.
//
// Веса ровно те, что были доступны в исходной вёрстке: 300/400/500/700. Это важно:
// подбор шрифта в CSS для запроса 600 при таком наборе даёт 700, и текст в меню
// должен рендериться так же, как в эталоне.
import { mkdir, writeFile } from 'node:fs/promises';

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36';
const SUBSETS = ['cyrillic', 'cyrillic-ext', 'latin', 'latin-ext'];

// Roboto распространяется под SIL Open Font License 1.1, а она требует класть текст
// лицензии рядом с файлами шрифта. Забираем его из того же источника, что и сам шрифт.
const LICENSE_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/OFL.txt';

const css = await fetch(CSS_URL, { headers: { 'User-Agent': UA } }).then((r) => r.text());

await mkdir('public/fonts', { recursive: true });

await writeFile(
  'public/fonts/OFL.txt',
  await fetch(LICENSE_URL, { headers: { 'User-Agent': UA } }).then((r) => r.text()),
);

const blocks = [];
let subset = null;

for (const chunk of css.split('@font-face')) {
  const comment = chunk.match(/\/\*\s*([a-z-]+)\s*\*\/\s*$/);
  const face = chunk.match(/font-weight:\s*(\d+);[\s\S]*?src:\s*url\(([^)]+)\)[\s\S]*?unicode-range:\s*([^;]+);/);

  if (face) {
    const [, weight, url, range] = face;
    if (subset && SUBSETS.includes(subset)) {
      const file = `roboto-${weight}-${subset}.woff2`;
      const bytes = await fetch(url, { headers: { 'User-Agent': UA } }).then((r) => r.arrayBuffer());
      await writeFile(`public/fonts/${file}`, Buffer.from(bytes));
      blocks.push(
        `/* ${subset} */\n@font-face {\n  font-family: 'Roboto';\n  font-style: normal;\n  font-weight: ${weight};\n  font-display: swap;\n  src: url('/fonts/${file}') format('woff2');\n  unicode-range: ${range.trim()};\n}`,
      );
      console.log(`  ${file}  ${(bytes.byteLength / 1024).toFixed(1)} КБ`);
    }
  }

  subset = comment ? comment[1] : null;
}

await writeFile(
  'src/styles/fonts.css',
  `/* Сгенерировано tools/fetch-fonts.mjs — руками не правим. */\n\n${blocks.join('\n\n')}\n`,
);

console.log(`\n${blocks.length} начертаний, src/styles/fonts.css обновлён`);
console.log('лицензия: public/fonts/OFL.txt');
