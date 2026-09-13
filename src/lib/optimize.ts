import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

interface Options {
  format?: 'webp' | 'png' | 'avif' | 'jpeg';
  quality?: number;
}

/**
 * Набор вариантов картинки под srcset.
 *
 * Идём через `getImage`, а не через компонент `<Image>`: тот помечает исходный
 * файл использованным, и в сборку попадают все оригиналы, на которые никто не
 * ссылается — 29 лишних файлов на 1.8 МБ.
 */
export async function responsive(source: ImageMetadata, widths: number[], options: Options = {}) {
  const { format = 'webp', quality = 90 } = options;

  const variants = await Promise.all(
    widths.map((width) => getImage({ src: source, width, format, quality })),
  );

  const widest = variants[variants.length - 1];

  return {
    src: widest.src,
    srcset: variants.map((v, i) => `${v.src} ${widths[i]}w`).join(', '),
    width: widest.attributes.width ?? widths[widths.length - 1],
    height: widest.attributes.height,
  };
}
