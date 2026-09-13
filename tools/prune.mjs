// Удаляет из сборки файлы, на которые никто не ссылается.
//
// Сборщик кладёт в dist исходные PNG рядом с оптимизированными вариантами, хотя
// в разметке их нет. Здесь это проверяется по факту: файл удаляется только если
// его имя не встречается ни в одном html, css или js собранного сайта.
import { readdir, readFile, stat, unlink } from 'node:fs/promises';
import { extname, join } from 'node:path';

const DIST = 'dist';

async function walk(dir) {
  const found = [];

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(path)));
    else found.push(path);
  }

  return found;
}

const files = await walk(DIST);
const readable = new Set(['.html', '.css', '.js', '.mjs', '.xml', '.txt', '.json']);

const haystack = (
  await Promise.all(
    files.filter((f) => readable.has(extname(f))).map((f) => readFile(f, 'utf8')),
  )
).join('\n');

const assets = files.filter((f) => f.includes('_astro') && !readable.has(extname(f)));
const orphans = assets.filter((f) => !haystack.includes(f.split('/').pop()));

let freed = 0;

for (const file of orphans) {
  freed += (await stat(file)).size;
  await unlink(file);
}

console.log(
  orphans.length > 0
    ? `убрано неиспользуемых файлов: ${orphans.length}, освобождено ${(freed / 1024 / 1024).toFixed(2)} МБ`
    : 'неиспользуемых файлов нет',
);
