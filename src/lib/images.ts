import type { ImageMetadata } from 'astro';

type Loader = () => Promise<{ default: ImageMetadata }>;
type Glob = Record<string, Loader>;

// Глоб намеренно без eager: при жадной загрузке сборщик считает использованными
// все исходники и складывает их в сборку рядом с оптимизированными вариантами —
// 29 файлов на 1.5 МБ, на которые никто не ссылается.
const stickers = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/stickers/*.png',
) as Glob;

const clients = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/clients/*.png',
) as Glob;

const team = import.meta.glob<{ default: ImageMetadata }>('../assets/team/*.jpg') as Glob;

async function pick(glob: Glob, folder: string, file: string): Promise<ImageMetadata> {
  const load = glob[`../assets/${folder}/${file}`];

  if (!load) {
    throw new Error(
      `Нет картинки src/assets/${folder}/${file}. ` +
        'Положить файл в эту папку и указать его имя в src/data.',
    );
  }

  return (await load()).default;
}

export const sticker = (file: string) => pick(stickers, 'stickers', file);
export const clientLogo = (file: string) => pick(clients, 'clients', file);
export const teamPhoto = (file: string) => pick(team, 'team', file);
