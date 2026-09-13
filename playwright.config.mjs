import { defineConfig } from '@playwright/test';
import { VIEWPORTS } from './tests/pages.mjs';

const PORT = 8765;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  snapshotPathTemplate: 'tests/baseline/{projectName}/{arg}{ext}',

  use: {
    baseURL: `http://localhost:${PORT}`,
  },

  expect: {
    toHaveScreenshot: {
      // Сглаживание шрифтов даёт шум в пару пикселей, поэтому допуск не нулевой.
      // Но он был слишком щедрым: 0.002 на 1440×900 — это 2592 пикселя, и в них
      // спокойно пряталось пропавшее подчёркивание активного пункта меню (148 px).
      threshold: 0.2,
      maxDiffPixelRatio: 0.0002,
      animations: 'disabled',
      scale: 'css',
    },
  },

  projects: VIEWPORTS.map(({ name, width, height }) => ({
    name,
    use: { viewport: { width, height } },
  })),

  webServer: {
    // Проверяем собранную статику, а не dev-сервер: тестируем то, что реально уедет
    // на хостинг. Свой сервер, а не astro preview, потому что тот уходит в фон и
    // Playwright считает его упавшим.
    command: `npm run build && node tools/serve.mjs dist ${PORT}`,
    port: PORT,
    reuseExistingServer: false,
    stdout: 'ignore',
    timeout: 120_000,
  },
});
