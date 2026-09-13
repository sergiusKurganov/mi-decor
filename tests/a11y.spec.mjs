import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { PAGES } from './pages.mjs';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');

// Проверяем на широком экране и на телефоне: на узком меню превращается в бургер,
// то есть разметка другая. Промежуточные ширины ничего нового не покажут.
const CHECKED = ['w1440', 'w375'];

// Правила, которые не относятся к вёрстке страницы.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

/** Замечания axe для текущего состояния страницы. */
async function audit(page) {
  await page.addScriptTag({ path: axePath });

  const { violations } = await page.evaluate(
    async (tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }),
    TAGS,
  );

  return violations.map((v) => ({
    правило: v.id,
    важность: v.impact,
    что: v.help,
    узлов: v.nodes.length,
    пример: v.nodes[0]?.html?.slice(0, 120),
  }));
}

function show(title, report) {
  if (report.length === 0) return;
  console.log(`\n${title} — замечаний ${report.length}:`);
  report.forEach((r) =>
    console.log(`  [${r.важность}] ${r.правило}: ${r.что} (узлов: ${r.узлов})\n      ${r.пример}`),
  );
}

for (const { name, title, path } of PAGES) {
  test(`доступность: ${title} (${name})`, async ({ page }, testInfo) => {
    test.skip(!CHECKED.includes(testInfo.project.name), 'Достаточно широкого экрана и телефона');

    await page.goto(path);
    await page.waitForLoadState('load');

    const report = await audit(page);
    show(title, report);

    expect(report).toEqual([]);
  });
}

test('доступность: страница 404', async ({ page }, testInfo) => {
  test.skip(!CHECKED.includes(testInfo.project.name), 'Достаточно широкого экрана и телефона');

  await page.goto('/404');
  await page.waitForLoadState('load');

  const report = await audit(page);
  show('404', report);

  expect(report).toEqual([]);
});

test('меню на телефоне открывается с клавиатуры и доступно', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'w375', 'Бургер есть только на узком экране');

  await page.goto('/');
  await page.waitForLoadState('load');

  const burger = page.locator('.burger');
  const nav = page.locator('#site-nav');

  await expect(burger).toBeVisible();
  await expect(nav).toBeHidden();
  await expect(burger).toHaveAttribute('aria-expanded', 'false');

  // Первый Tab должен попадать на ссылку в обход шапки, дальше — логотип и бургер.
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();

  await burger.focus();
  await page.keyboard.press('Enter');

  await expect(nav).toBeVisible();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');

  // В открытом состоянии разметка другая — проверяем и её.
  const report = await audit(page);
  show('открытое меню', report);
  expect(report).toEqual([]);

  // Все четыре ссылки должны быть доступны с клавиатуры.
  for (const label of ['о нас', 'команда', 'проекты', 'контакты']) {
    await expect(nav.getByRole('link', { name: label })).toBeVisible();
  }

  // Escape закрывает меню и возвращает фокус на кнопку.
  await page.keyboard.press('Escape');
  await expect(nav).toBeHidden();
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await expect(burger).toBeFocused();
});
