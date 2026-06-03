// BGS Ажилтан апп — design tokens. Mirror of `makeTheme` in the design prototype.

export const BGS_ACCENT = "#FD6A02";
export const BGS_ACCENT_2 = "#D26101";

function hexToRgb(h: string): [number, number, number] {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

export function hexA(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export interface BgsTheme {
  dark: boolean;
  accent: string;
  accent2: string;
  accentSoft: string;
  accentGlow: string;
  bg: string;
  card: string;
  text: string;
  sub: string;
  faint: string;
  border: string;
}

export function getTheme(dark: boolean, accent: string = BGS_ACCENT): BgsTheme {
  if (dark) {
    return {
      dark: true,
      accent,
      accent2: BGS_ACCENT_2,
      accentSoft: hexA(accent, 0.17),
      accentGlow: hexA(accent, 0.5),
      bg: "#0E1014",
      card: "#181B22",
      text: "#F2F5F9",
      sub: "#98A2B3",
      faint: "#5C6573",
      border: "rgba(255,255,255,0.08)",
    };
  }
  return {
    dark: false,
    accent,
    accent2: BGS_ACCENT_2,
    accentSoft: hexA(accent, 0.1),
    accentGlow: hexA(accent, 0.35),
    bg: "#EEF0F3",
    card: "#FFFFFF",
    text: "#14171C",
    sub: "#6B7280",
    faint: "#A2AAB5",
    border: "rgba(16,20,28,0.08)",
  };
}
