// Карта страниц сайта. Шапка и футер — общие компоненты, отдельными адресами
// они не существуют.
export const PAGES = [
  { name: 'about',    title: 'О нас',    path: '/' },
  { name: 'commande', title: 'Команда',  path: '/commande' },
  { name: 'project',  title: 'Проекты',  path: '/project' },
  { name: 'contact',  title: 'Контакты', path: '/contact' },
];

// По одной ширине на каждый контейнер дизайна (см. src/data/layout.json):
// 1200, 960, 640, 480 и 320. Так проверен каждый брейкпоинт, а не три случайные точки.
export const VIEWPORTS = [
  { name: 'w1440', width: 1440, height: 900 },
  { name: 'w1100', width: 1100, height: 900 },
  { name: 'w800',  width: 800,  height: 1024 },
  { name: 'w560',  width: 560,  height: 900 },
  { name: 'w375',  width: 375,  height: 812 },
];
