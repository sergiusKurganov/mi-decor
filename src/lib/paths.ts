/**
 * Адрес страницы без служебного `.html`.
 *
 * Сборка кладёт страницы файлами (`commande.html`), поэтому во время сборки
 * `Astro.url.pathname` содержит расширение. Наружу же ведут чистые адреса —
 * `/commande`, — и по ним же сверяется активный пункт меню и canonical.
 */
export function cleanPath(pathname: string): string {
  return pathname.replace(/index\.html$/, '').replace(/\.html$/, '') || '/';
}
