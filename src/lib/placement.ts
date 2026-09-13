export interface Spot {
  x: number;
  y: number;
  w: number;
  h?: number;
  rotate?: number;
  align?: string;
  fs?: string;
  lh?: string;
  ls?: string;
  weight?: number;
  tt?: string;
  bgSize?: string;
  bgPos?: string;
  bgColor?: string;
}

export type Placement = Record<string, Spot>;

/** Инлайновые переменные для элемента: свой набор координат на каждый брейкпоинт. */
export function spotVars(at: Placement): string {
  const parts: string[] = [];

  for (const [bucket, spot] of Object.entries(at)) {
    parts.push(
      `--x-${bucket}:${spot.x}px`,
      `--y-${bucket}:${spot.y}px`,
      `--w-${bucket}:${spot.w}px`,
    );
    if (spot.h !== undefined) parts.push(`--h-${bucket}:${spot.h}px`);
    if (spot.rotate) parts.push(`--r-${bucket}:${spot.rotate}deg`);
    if (spot.align) parts.push(`--a-${bucket}:${spot.align}`);
    if (spot.fs) parts.push(`--fs-${bucket}:${spot.fs}`);
    if (spot.lh) parts.push(`--lh-${bucket}:${spot.lh}`);
    if (spot.ls) parts.push(`--ls-${bucket}:${spot.ls}`);
    if (spot.tt) parts.push(`--tt-${bucket}:${spot.tt}`);
    if (spot.bgSize) parts.push(`--bgs-${bucket}:${spot.bgSize}`);
    if (spot.bgPos) parts.push(`--bgp-${bucket}:${spot.bgPos}`);
    if (spot.bgColor) parts.push(`--bgc-${bucket}:${spot.bgColor}`);
  }

  return parts.join(';');
}

/** Инлайновые переменные для контейнера: своя высота на каждом брейкпоинте. */
export function boardVars(heights: Record<string, number>): string {
  return Object.entries(heights)
    .map(([bucket, h]) => `--bh-${bucket}:${h}px`)
    .join(';');
}

/** Верхняя граница брейкпоинта; у самого широкого её нет. */
const BUCKET_LIMIT: Record<string, number | null> = {
  w375: 479,
  w560: 639,
  w800: 959,
  w1100: 1199,
  w1440: null,
};

const ORDER = ['w375', 'w560', 'w800', 'w1100', 'w1440'];

/**
 * Атрибут sizes из тех же данных, что и вёрстка: на каждом брейкпоинте известно,
 * какой ширины элемент на самом деле. Браузер возьмёт из srcset ровно нужный файл,
 * а не самый большой.
 */
export function sizesFor(at: Placement): string {
  const parts: string[] = [];

  for (const bucket of ORDER) {
    const spot = at[bucket];
    if (!spot) continue;

    const limit = BUCKET_LIMIT[bucket];
    parts.push(limit ? `(max-width: ${limit}px) ${spot.w}px` : `${spot.w}px`);
  }

  return parts.join(', ');
}

/**
 * Ширины для srcset: самый мелкий и самый крупный показ, каждый в одинарной и
 * двойной плотности. Промежуточные не нужны — при точном `sizes` браузер возьмёт
 * ближайший подходящий, а лишние варианты только раздувают сборку.
 */
export function widthsFor(at: Placement, natural: number): number[] {
  const shown = Object.values(at).map((spot) => Math.round(spot.w));
  const edges = [Math.min(...shown), Math.max(...shown)];

  const wanted = new Set(
    edges.flatMap((w) => [Math.min(w, natural), Math.min(w * 2, natural)]),
  );

  return [...wanted].sort((a, b) => a - b);
}
