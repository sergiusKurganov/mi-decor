import { test, expect } from '@playwright/test';
import site from '../src/data/site.json' with { type: 'json' };
import footer from '../src/data/footer.json' with { type: 'json' };
import contact from '../src/data/contact.json' with { type: 'json' };
import team from '../src/data/team.json' with { type: 'json' };
import projects from '../src/data/projects.json' with { type: 'json' };
import home from '../src/data/home.json' with { type: 'json' };

// Скриншоты стерегут геометрию, но не содержимое: смена года в подвале «© 2025» на
// «© 2026» меняет около двух тысяч пикселей из трёх миллионов, и это укладывается
// в допуск на сглаживание. Поэтому тексты и количества проверяем отдельно и точно.

const people = team.blocks.flatMap((block) => block.people);

// Содержимое от ширины окна не зависит, поэтому хватает одного разрешения.
// Меню под бургером на узком экране проверяется в tests/a11y.spec.mjs.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'w1440', 'Достаточно одного разрешения');
});

test('подвал на каждой странице', async ({ page }) => {
  for (const { path } of [{ path: '/' }, { path: '/contact' }]) {
    await page.goto(path);

    for (const part of Object.values(footer.parts)) {
      await expect(page.locator('.foot')).toContainText(part.text);
    }
  }
});

test('навигация ведёт на все страницы', async ({ page }) => {
  await page.goto('/');

  for (const { label, href } of site.nav) {
    await expect(page.locator('.nav').getByRole('link', { name: label })).toHaveAttribute(
      'href',
      href,
    );
  }
});

test('контакты: имена, телефоны и ссылки', async ({ page }) => {
  await page.goto('/contact');

  for (const person of contact.people) {
    await expect(page.locator('.card')).toContainText(person.name);
    await expect(page.locator('.card')).toContainText(person.phone);

    const dialled = person.phone.replace(/[^\d+]/g, '');
    await expect(page.locator(`a[href="tel:${dialled}"]`)).toHaveCount(1);
  }

  await expect(page.locator(`a[href="${contact.telegram.url}"]`)).not.toHaveCount(0);
});

test('команда: все карточки на месте', async ({ page }) => {
  await page.goto('/commande');

  await expect(page.locator('.name')).toHaveCount(people.length);

  for (const person of people) {
    await expect(page.locator('.name', { hasText: person.name })).toHaveCount(1);
    await expect(page.locator('.role', { hasText: person.since })).not.toHaveCount(0);
  }
});

test('проекты: все логотипы на месте', async ({ page }) => {
  await page.goto('/project');

  await expect(page.locator('.wall img')).toHaveCount(projects.wall.logos.length);

  for (const logo of projects.wall.logos) {
    await expect(page.locator(`img[alt="Логотип: ${logo.client}"]`)).toHaveCount(1);
  }
});

test('главная: стикеры, текст и кнопка', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.collage img')).toHaveCount(home.collage.stickers.length);

  const plain = home.intro.text.replace(/\*\*/g, '').split('\n')[0];
  await expect(page.locator('.text')).toContainText(plain.slice(0, 60));

  const cta = page.locator('.cta');
  await expect(cta).toHaveText(home.intro.cta.label);
  await expect(cta).toHaveAttribute('href', home.intro.cta.href);
});

test('у каждой картинки есть подпись', async ({ page }) => {
  for (const path of ['/', '/commande', '/project', '/contact']) {
    await page.goto(path);

    const empty = await page.locator('img:not([alt]), img[alt=""]').count();
    expect(empty, `на ${path} есть картинки без alt`).toBe(0);
  }
});
