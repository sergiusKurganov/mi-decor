import { test, expect } from '@playwright/test';
import { PAGES } from './pages.mjs';

// Эталон в tests/baseline снят с этой же сборки и стережёт регрессии в ней.

// Ленивые картинки грузятся по скроллу, а стикеры на главной едут параллаксом.
// Поэтому прокручиваем страницу до конца, возвращаемся наверх и ждём, пока
// догрузится всё: только тогда скриншот повторяем от запуска к запуску.
//
// Фоновые картинки ждём отдельно: фотографии карточек заданы фоном, а не тегом img,
// и в document.images не попадают.
async function settle(page) {
  await page.waitForLoadState('load');

  // Страница проявляется при первом заходе в сессии — ждём конца, иначе снимок
  // зависел бы от того, успела ли анимация закончиться.
  await page.waitForFunction(
    () => !document.documentElement.classList.contains('is-entering'),
    null,
    { timeout: 10_000 },
  );

  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight / 2);

    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }

    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 250));
    window.scrollTo(0, 0);
  });

  try {
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  } catch {
    // Медленный ответ — не повод падать.
  }

  await page.waitForFunction(
    () => Array.from(document.images).every((img) => img.complete),
    null,
    { timeout: 30_000 },
  );

  await page.evaluate(async () => {
    const urls = new Set();

    for (const el of document.querySelectorAll('*')) {
      const layers = getComputedStyle(el).backgroundImage;
      for (const found of layers.matchAll(/url\("?([^")]+)"?\)/g)) urls.add(found[1]);
    }

    await Promise.all(
      [...urls].map(
        (src) =>
          new Promise((resolve) => {
            const probe = new Image();
            probe.onload = probe.onerror = resolve;
            probe.src = src;
          }),
      ),
    );
  });

  // Стикеры на главной проявляются по очереди — ждём, пока последний дойдёт до конца.
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('.collage .placed')].every(
        (el) => Number(getComputedStyle(el).opacity) > 0.99,
      ),
    null,
    { timeout: 15_000 },
  );

  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
}

for (const { name, title, path } of PAGES) {
  test(`${title} (${name})`, async ({ page }) => {
    await page.goto(path);
    await settle(page);

    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
