import Svg, { Circle } from "react-native-svg";

/**
 * BGS Orbit mark — bgs.mn brand sheet-тэй ижил.
 * Цагираг = тогтвортой систем, улбар шар зангилаа = хөдөлгөөн, тэлэлт.
 * `background` нь зангилааны "gap"-ийг дэвсгэртэй яг тааруулна.
 */
export type OrbitVariant = "primary" | "reversed" | "accent" | "mono";

export const ORBIT_COLORS = {
  ink: "#16130F",
  accent: "#FD6A02",
  paper: "#FAF8F5",
  paper2: "#F1ECE4",
} as const;

const VARIANTS: Record<OrbitVariant, { ring: string; node: string; gap: string }> = {
  primary: { ring: ORBIT_COLORS.ink, node: ORBIT_COLORS.accent, gap: ORBIT_COLORS.paper },
  reversed: { ring: ORBIT_COLORS.paper, node: ORBIT_COLORS.accent, gap: ORBIT_COLORS.ink },
  accent: { ring: "#ffffff", node: ORBIT_COLORS.ink, gap: ORBIT_COLORS.accent },
  mono: { ring: ORBIT_COLORS.ink, node: ORBIT_COLORS.ink, gap: ORBIT_COLORS.paper2 },
};

interface OrbitMarkProps {
  size?: number;
  variant?: OrbitVariant;
  /** Зангилааны gap өнгийг дэвсгэртэй тааруулах override. */
  background?: string;
}

export function OrbitMark({ size = 120, variant = "primary", background }: OrbitMarkProps) {
  const v = VARIANTS[variant];
  const gap = background ?? v.gap;

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Circle cx={60} cy={60} r={44} stroke={v.ring} strokeWidth={11.4} fill="none" />
      <Circle cx={91.1} cy={28.9} r={20} fill={gap} />
      <Circle cx={91.1} cy={28.9} r={13} fill={v.node} />
    </Svg>
  );
}
