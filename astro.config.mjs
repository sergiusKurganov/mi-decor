import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mi-decor.art',
  // Адреса без слеша на конце и без .html — такие же, как были: /commande, /project, /contact.
  trailingSlash: 'never',
  build: { format: 'file' },
  devToolbar: { enabled: false },

  // В старой версии главная открывалась и по /about — для поиска это дубль.
  // Адрес не выбрасываем, а отправляем на главную, чтобы внешние ссылки не побились.
  redirects: { '/about': '/' },
});
