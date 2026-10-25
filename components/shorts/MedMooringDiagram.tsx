// Top-down explainer for stern-to Mediterranean mooring, drawn in the frame's
// own coordinates (1080×1920). Each step is a scene; t (0–1) animates it.

const INK = "#2a2826";
const MUTED = "#6b6258";
const BRAND = "#c75d3e";
const WATER = "#d9e6ee";
const QUAY = "#cdbfa2";
const HULL = "#fffdf8";

const L = 136; // our boat's length on screen
const B = 60;
const WATER_Y = 620; // below the badge and heading
const QUAY_Y = 1250;
const CX = 540;
const FAR = QUAY_Y - 3.5 * L - L / 2; // centre when 3½ lengths off
const ANCHOR = { x: CX, y: FAR - L / 2 + 8 }; // dropped from the bow out there

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));

function hull(cx: number, cy: number, l: number, b: number): string {
  const h = l / 2;
  const w = b / 2;
  return `M ${cx} ${cy - h} C ${cx + w * 0.9} ${cy - h + l * 0.22} ${cx + w} ${cy - h + l * 0.45} ${cx + w} ${cy + h - l * 0.12} Q ${cx + w} ${cy + h} ${cx + w - 10} ${cy + h} L ${cx - w + 10} ${cy + h} Q ${cx - w} ${cy + h} ${cx - w} ${cy + h - l * 0.12} C ${cx - w} ${cy - h + l * 0.45} ${cx - w * 0.9} ${cy - h + l * 0.22} ${cx} ${cy - h} Z`;
}

function Boat({ cx, cy, fenders, dim }: { cx: number; cy: number; fenders?: boolean; dim?: boolean }) {
  const stroke = dim ? "#9a8c74" : INK;
  return (
    <g>
      <path d={hull(cx, cy, L, B)} fill={dim ? "#f1ebe0" : HULL} stroke={stroke} strokeWidth={4} strokeLinejoin="round" />
      <rect x={cx - 18} y={cy + L * 0.16} width={36} height={34} rx={8} fill="none" stroke={stroke} strokeWidth={3} />
      <circle cx={cx} cy={cy - L * 0.08} r={6} fill={stroke} />
      {fenders && [0.02, 0.18, 0.34].map((k) => (
        <g key={k}>
          <ellipse cx={cx - B / 2 - 7} cy={cy + L * k} rx={6} ry={12} fill={BRAND} />
          <ellipse cx={cx + B / 2 + 7} cy={cy + L * k} rx={6} ry={12} fill={BRAND} />
        </g>
      ))}
    </g>
  );
}

function Anchor({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={BRAND} strokeWidth={5} strokeLinecap="round">
      <circle cx={0} cy={-22} r={6} />
      <path d="M0 -16 V 22 M -16 -2 H 16 M -24 10 Q 0 36 24 10" />
    </g>
  );
}

function Label({ x, y, children, anchor = "middle", small }: { x: number; y: number; children: string; anchor?: "start" | "middle" | "end"; small?: boolean }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={small ? 26 : 30} fontWeight={600} fill={INK} style={{ fontFamily: "var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif" }}>
      {children}
    </text>
  );
}

function Wind() {
  return (
    <g>
      <path d="M 110 690 H 230 M 200 668 L 232 690 L 200 712" fill="none" stroke={MUTED} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <Label x={170} y={740} small>wind</Label>
    </g>
  );
}

export default function MedMooringDiagram({ step, t }: { step: number; t: number }) {
  const far = FAR;
  const near = QUAY_Y - L / 2 - 34; // a couple of metres off
  const snug = QUAY_Y - L / 2 - 12; // a metre off
  let cy = far;
  if (step === 3) cy = far + (near - far) * ease(seg(t, 0.1, 0.85));
  if (step === 4) cy = near;
  if (step === 5) cy = near + (snug - near) * ease(seg(t, 0.15, 0.6));
  const bow = cy - L / 2;
  const stern = cy + L / 2;
  const anchorDown = step >= 4 || (step === 3 && t > 0.08);
  const chain = step >= 4 || (step === 3 && t > 0.12);
  const lineLeft = step === 5 || (step === 4 && t > 0.15);
  const lineRight = step === 5 || (step === 4 && t > 0.6);
  const lazy = step === 3 && t > 0.78;
  const gang = step === 5 && t > 0.62;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <rect x={60} y={WATER_Y} width={960} height={QUAY_Y - WATER_Y} rx={28} fill={WATER} />
      <rect x={60} y={QUAY_Y} width={960} height={90} fill={QUAY} />
      <rect x={60} y={QUAY_Y - 6} width={960} height={10} fill="#8a7651" />
      {[310, 430, 650, 770].map((x) => <circle key={x} cx={x} cy={QUAY_Y + 26} r={9} fill={INK} />)}
      <Boat cx={330} cy={QUAY_Y - L / 2 - 16} dim />
      <Boat cx={750} cy={QUAY_Y - L / 2 - 16} dim />
      <Wind />
      {step === 2 && (
        <g>
          <path d={`M 700 ${stern + 10} V ${QUAY_Y - 10}`} stroke={MUTED} strokeWidth={3} strokeDasharray="10 10" />
          <Label x={720} y={(stern + QUAY_Y) / 2} anchor="start" small>3 to 4 boat lengths</Label>
          <path d={`M 440 ${QUAY_Y - 60} H 640`} stroke={BRAND} strokeWidth={4} strokeDasharray="12 10" />
          <Label x={540} y={QUAY_Y - 80} small>your gap</Label>
        </g>
      )}
      {chain && (
        <path d={`M ${ANCHOR.x} ${ANCHOR.y + 10} Q ${ANCHOR.x + (step === 5 ? 0 : 60)} ${(ANCHOR.y + bow) / 2} ${CX} ${bow}`} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="8 7" />
      )}
      {anchorDown && <Anchor x={ANCHOR.x} y={ANCHOR.y} />}
      {anchorDown && <Label x={ANCHOR.x + 44} y={ANCHOR.y + 8} anchor="start" small>anchor</Label>}
      {lazy && (
        <g>
          <path d={`M 880 ${QUAY_Y} Q 870 1000 860 820`} fill="none" stroke={MUTED} strokeWidth={4} strokeDasharray="4 12" strokeLinecap="round" />
          <circle cx={860} cy={820} r={10} fill={MUTED} />
          <Label x={860} y={790} small>or a lazy line</Label>
        </g>
      )}
      {lineLeft && <path d={`M ${CX - B / 2 + 4} ${stern - 6} L 430 ${QUAY_Y + 26}`} stroke={BRAND} strokeWidth={5} strokeLinecap="round" />}
      {lineRight && <path d={`M ${CX + B / 2 - 4} ${stern - 6} L 650 ${QUAY_Y + 26}`} stroke={BRAND} strokeWidth={5} strokeLinecap="round" />}
      {step === 4 && <Label x={430} y={QUAY_Y + 72} small>windward line first</Label>}
      {step === 5 && <Label x={CX + 60} y={(ANCHOR.y + bow) / 2} anchor="start" small>take in on the chain</Label>}
      {gang && <rect x={CX - 14} y={stern - 4} width={28} height={QUAY_Y - stern + 14} rx={4} fill="#8a7651" />}
      <Boat cx={CX} cy={cy} fenders />
    </svg>
  );
}
