import Svg, { Rect, G } from "react-native-svg";

// FNV-1a hash → seeded PRNG to produce a deterministic visual QR-like matrix.
// This is **not** a real QR encoder — it's a placeholder pattern, matching the
// design prototype. Swap with `react-native-qrcode-svg` when wiring real codes.
function qrMatrix(seed: string, n = 25): boolean[][] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rnd = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h >>> 0) / 4294967296;
  };
  const m = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => rnd() > 0.5),
  );
  const place = (r: number, c: number) => {
    for (let i = -1; i < 8; i++)
      for (let j = -1; j < 8; j++) {
        const rr = r + i,
          cc = c + j;
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
        const quiet = i === -1 || i === 7 || j === -1 || j === 7;
        const border =
          (i >= 0 && i < 7 && (j === 0 || j === 6)) ||
          (j >= 0 && j < 7 && (i === 0 || i === 6));
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        m[rr][cc] = quiet ? false : border || core;
      }
  };
  place(0, 0);
  place(0, n - 7);
  place(n - 7, 0);
  return m;
}

interface QrMatrixProps {
  seed: string;
  size?: number;
  color?: string;
}

export function QrMatrix({ seed, size = 206, color = "#16181D" }: QrMatrixProps) {
  const n = 25;
  const m = qrMatrix(seed, n);
  const cell = size / n;
  const rects: React.ReactNode[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      if (!m[r][c]) continue;
      const center = r > 9 && r < 15 && c > 9 && c < 15;
      if (center) continue;
      rects.push(
        <Rect
          key={`${r}-${c}`}
          x={c * cell}
          y={r * cell}
          width={cell * 0.92}
          height={cell * 0.92}
          rx={cell * 0.22}
          fill={color}
        />,
      );
    }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rects}
      <G transform={`translate(${size / 2 - size * 0.11}, ${size / 2 - size * 0.11})`}>
        <Rect width={size * 0.22} height={size * 0.22} rx={size * 0.05} fill="#fff" />
      </G>
    </Svg>
  );
}
