// Simplified national flags as inline SVG, used as soft backgrounds behind
// destination buttons. Deliberately minimal (no coats of arms) so they read
// as a hint of colour rather than an exact emblem.

const stripesH = (colors: string[]) =>
  colors.map((c, i) => <rect key={i} x="0" y={(i * 60) / colors.length} width="90" height={60 / colors.length} fill={c} />);
const stripesV = (colors: string[]) =>
  colors.map((c, i) => <rect key={i} x={(i * 90) / colors.length} y="0" width={90 / colors.length} height="60" fill={c} />);

const FLAGS: Record<string, React.ReactNode> = {
  HR: (
    <>
      {stripesH(["#ff0000", "#ffffff", "#171796"])}
      {/* checkerboard shield */}
      {Array.from({ length: 20 }, (_, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        return (col + row) % 2 === 0 ? <rect key={i} x={34 + col * 4.4} y={16 + row * 5.5} width="4.4" height="5.5" fill="#ff0000" /> : null;
      })}
      <rect x="34" y="16" width="22" height="22" fill="none" stroke="#ffffff" strokeWidth="0.8" />
    </>
  ),
  GR: (
    <>
      {stripesH(["#0d5eaf", "#fff", "#0d5eaf", "#fff", "#0d5eaf", "#fff", "#0d5eaf", "#fff", "#0d5eaf"])}
      <rect x="0" y="0" width="33.3" height="33.3" fill="#0d5eaf" />
      <rect x="13.3" y="0" width="6.7" height="33.3" fill="#fff" />
      <rect x="0" y="13.3" width="33.3" height="6.7" fill="#fff" />
    </>
  ),
  IT: stripesV(["#009246", "#ffffff", "#ce2b37"]),
  FR: stripesV(["#0055a4", "#ffffff", "#ef4135"]),
  ES: (
    <>
      <rect width="90" height="60" fill="#aa151b" />
      <rect y="15" width="90" height="30" fill="#f1bf00" />
    </>
  ),
  TR: (
    <>
      <rect width="90" height="60" fill="#e30a17" />
      <circle cx="36" cy="30" r="15" fill="#fff" />
      <circle cx="39.5" cy="30" r="12" fill="#e30a17" />
      <polygon points="52,30 44,33.5 46,25 41,23 47,22" fill="#fff" />
    </>
  ),
  ME: (
    <>
      <rect width="90" height="60" fill="#c40308" />
      <rect x="2" y="2" width="86" height="56" fill="none" stroke="#d3ae3b" strokeWidth="3" />
    </>
  ),
  SC: (
    <>
      <rect width="90" height="60" fill="#003f87" />
      <polygon points="0,60 30,0 60,0 0,60" fill="#fcd856" />
      <polygon points="0,60 60,0 90,0 90,20 0,60" fill="#d62828" />
      <polygon points="0,60 90,20 90,40" fill="#fff" />
      <polygon points="0,60 90,40 90,60" fill="#007a3d" />
    </>
  ),
  TH: stripesH(["#a51931", "#f4f5f8", "#2d2a4a", "#2d2a4a", "#f4f5f8", "#a51931"]),
  VG: (
    <>
      <rect width="90" height="60" fill="#00247d" />
      {/* Union flag canton, simplified */}
      <g clipPath="url(#nn-vg-canton)">
        <line x1="0" y1="0" x2="45" y2="30" stroke="#fff" strokeWidth="6" />
        <line x1="45" y1="0" x2="0" y2="30" stroke="#fff" strokeWidth="6" />
        <line x1="0" y1="0" x2="45" y2="30" stroke="#cf142b" strokeWidth="2" />
        <line x1="45" y1="0" x2="0" y2="30" stroke="#cf142b" strokeWidth="2" />
        <rect x="19" y="0" width="7" height="30" fill="#fff" />
        <rect x="0" y="12" width="45" height="6" fill="#fff" />
        <rect x="20.5" y="0" width="4" height="30" fill="#cf142b" />
        <rect x="0" y="13.5" width="45" height="3" fill="#cf142b" />
      </g>
      <defs>
        <clipPath id="nn-vg-canton">
          <rect width="45" height="30" />
        </clipPath>
      </defs>
      {/* shield */}
      <path d="M60 24 h14 v12 q0 7 -7 10 q-7 -3 -7 -10 z" fill="#006129" stroke="#fff" strokeWidth="0.8" />
    </>
  ),
};

/** A faded flag that fills its (relative, overflow-hidden) parent. */
export function FlagBackdrop({ country, className = "" }: { country: string; className?: string }) {
  const art = FLAGS[country.toUpperCase()];
  if (!art) return null;
  return (
    <svg viewBox="0 0 90 60" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={`pointer-events-none absolute inset-0 -z-10 h-full w-full ${className}`}>
      {art}
    </svg>
  );
}
