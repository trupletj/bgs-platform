// Нэрнээс тогтвортой өнгө сонгоно — avatar-уудыг ялгаатай харагдуулна.
const PALETTE = [
  "#FD6A02", // brand orange
  "#2E7CF6",
  "#16A34A",
  "#9333EA",
  "#E5484D",
  "#0EA5A5",
  "#D97706",
  "#DB2777",
  "#475569",
];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/** Өнгийг 0.14 alpha-тай зөөлөн дэвсгэр болгоно */
export function avatarSoft(seed: string): string {
  const c = avatarColor(seed);
  const r = parseInt(c.slice(1, 3), 16);
  const g = parseInt(c.slice(3, 5), 16);
  const b = parseInt(c.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.14)`;
}
