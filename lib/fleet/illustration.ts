import { feet, options, type ModelSpecs } from "./index";

// Drawn stand-ins for the builders' photos: a side view at sea and a typical
// charter layout, built from each model's real proportions and cabin count.
// Clearly labelled as illustrations; the quote carries the real yacht's photos.

const C = {
  skyTop: "#f6ead2",
  skyBottom: "#f2f4ef",
  sun: "#f2c27a",
  sea1: "#4a8aa8",
  sea2: "#2f6a87",
  sea3: "#1f4f69",
  hull: "#fbf9f4",
  hullLine: "#2a2826",
  glass: "#2b3a45",
  sail: "#fffdf8",
  sailLine: "#c9bfae",
  mast: "#3b3a38",
  accent: "#c75d3e",
  ink: "#2a2826",
  muted: "#6b6258",
  deck: "#efe6d4",
  cabin: "#f8f1e3",
  head: "#dfeaf0",
  saloon: "#f3e4d6",
  net: "#b9ab92",
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const r = (n: number) => Math.round(n * 10) / 10;

function frame(w: number, h: number, body: string, caption: string, onDark = false): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial, sans-serif">${body}<text x="${w - 24}" y="${h - 22}" text-anchor="end" font-size="22" fill="${onDark ? "#ffffff" : C.muted}" opacity="0.9">${esc(caption)}</text></svg>`;
}

/** Side view at sea, scaled by length overall: under sail by day, or at anchor at sunset. */
export function profileSvg(m: ModelSpecs, mode: "sailing" | "anchored" = "sailing"): string {
  const evening = mode === "anchored";
  const W = 1600;
  const H = 1000;
  const loa = m.lengthOverallM ?? (m.kind === "catamaran" ? 13 : 14);
  const len = Math.min(1250, 520 + loa * 38); // drawn hull length in px
  const x0 = (W - len) / 2;
  const wl = 700; // waterline
  const cat = m.kind === "catamaran";
  const mastX = x0 + len * (cat ? 0.5 : 0.42);
  const mastH = Math.min(640, (cat ? 1.25 : 1.45) * len * 0.55);
  const top = wl - mastH;
  const free = cat ? 70 : 55; // freeboard
  const parts: string[] = [];
  const skyA = evening ? "#e9a07a" : C.skyTop;
  const skyB = evening ? "#f6d9b0" : C.skyBottom;
  parts.push(`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyA}"/><stop offset="1" stop-color="${skyB}"/></linearGradient></defs>`);
  parts.push(`<rect width="${W}" height="${H}" fill="url(#sky)"/>`);
  parts.push(`<circle cx="${evening ? 300 : W - 260}" cy="${evening ? wl - 70 : 210}" r="${evening ? 110 : 80}" fill="${evening ? "#f7c46e" : C.sun}" opacity="0.85"/>`);
  if (evening) {
    // the bay: a headland with pines and a beach
    parts.push(`<path d="M ${W * 0.45} ${wl - 10} Q ${W * 0.62} ${wl - 230} ${W * 0.8} ${wl - 190} Q ${W * 0.92} ${wl - 170} ${W} ${wl - 210} V ${wl + 10} H ${W * 0.45} Z" fill="#7b8a6a"/>`);
    parts.push(`<path d="M ${W * 0.5} ${wl + 2} Q ${W * 0.7} ${wl - 18} ${W} ${wl - 8} V ${wl + 10} H ${W * 0.5} Z" fill="#e8d6b4"/>`);
    for (let i = 0; i < 7; i++) parts.push(`<circle cx="${r(W * 0.6 + i * 75)}" cy="${r(wl - 160 + (i % 3) * 22)}" r="${26 + (i % 2) * 8}" fill="#5f6f52"/>`);
  } else parts.push(`<path d="M0 ${wl - 40} Q 300 ${wl - 70} 600 ${wl - 45} T 1200 ${wl - 50} T 1600 ${wl - 40} V ${wl + 20} H 0 Z" fill="#9fb7b4" opacity="0.35"/>`);
  // sails (furled at anchor)
  const boomY = wl - free - (cat ? 120 : 70);
  const mainFoot = len * (cat ? 0.4 : 0.42);
  if (!evening) parts.push(`<path d="M ${r(mastX + 6)} ${r(top + 20)} L ${r(mastX + 6)} ${r(boomY)} L ${r(mastX + 6 + mainFoot)} ${r(boomY)} Z" fill="${C.sail}" stroke="${C.sailLine}" stroke-width="3"/>`);
  for (let i = 1; i < 5 && !evening; i++) {
    const y = top + 20 + ((boomY - top - 20) * i) / 5;
    const xx = mastX + 6 + (mainFoot * i) / 5;
    parts.push(`<line x1="${r(mastX + 6)}" y1="${r(y)}" x2="${r(xx)}" y2="${r(y)}" stroke="${C.sailLine}" stroke-width="1.5" opacity="0.6"/>`);
  }
  const bowX = x0 + 8;
  const jibTack = { x: bowX + len * 0.06, y: wl - free - 8 };
  if (!evening) parts.push(`<path d="M ${r(mastX - 4)} ${r(top + 70)} L ${r(jibTack.x)} ${r(jibTack.y)} L ${r(mastX - len * 0.05)} ${r(jibTack.y - 10)} Z" fill="${C.sail}" stroke="${C.sailLine}" stroke-width="3"/>`);
  else {
    // sail cover on the boom, rolled jib on the forestay, anchor light at the masthead
    parts.push(`<rect x="${r(mastX)}" y="${r(boomY - 22)}" width="${r(mainFoot)}" height="22" rx="10" fill="#1f3b52"/>`);
    parts.push(`<line x1="${r(mastX - 2)}" y1="${r(top + 60)}" x2="${r(jibTack.x)}" y2="${r(jibTack.y)}" stroke="${C.sail}" stroke-width="10" stroke-linecap="round"/>`);
    parts.push(`<circle cx="${r(mastX)}" cy="${r(top - 6)}" r="9" fill="#fff6c8"/>`);
    parts.push(`<line x1="${r(bowX + 6)}" y1="${r(wl - free + 10)}" x2="${r(bowX - 90)}" y2="${r(wl + 120)}" stroke="#3b3a38" stroke-width="3" stroke-dasharray="6 6"/>`);
  }
  parts.push(`<line x1="${r(mastX)}" y1="${r(top)}" x2="${r(mastX)}" y2="${r(wl - free)}" stroke="${C.mast}" stroke-width="9" stroke-linecap="round"/>`);
  parts.push(`<line x1="${r(mastX)}" y1="${r(boomY)}" x2="${r(mastX + mainFoot + 8)}" y2="${r(boomY)}" stroke="${C.mast}" stroke-width="7" stroke-linecap="round"/>`);
  parts.push(`<line x1="${r(mastX)}" y1="${r(top + 4)}" x2="${r(bowX)}" y2="${r(wl - free)}" stroke="${C.mast}" stroke-width="2" opacity="0.6"/>`);
  parts.push(`<line x1="${r(mastX)}" y1="${r(top + 4)}" x2="${r(x0 + len - 6)}" y2="${r(wl - free)}" stroke="${C.mast}" stroke-width="2" opacity="0.6"/>`);
  if (cat) {
    // coachroof / saloon with the wraparound windows, hull with plumb bow
    const cx = x0 + len * 0.28;
    const cw = len * 0.56;
    const ch = 110;
    const cy = wl - free - ch;
    parts.push(`<path d="M ${r(cx)} ${r(wl - free)} L ${r(cx + 30)} ${r(cy)} L ${r(cx + cw - 20)} ${r(cy)} L ${r(cx + cw)} ${r(wl - free)} Z" fill="${C.hull}" stroke="${C.hullLine}" stroke-width="3"/>`);
    parts.push(`<path d="M ${r(cx + 40)} ${r(cy + 22)} L ${r(cx + cw - 30)} ${r(cy + 22)} L ${r(cx + cw - 22)} ${r(cy + 62)} L ${r(cx + 30)} ${r(cy + 62)} Z" fill="${C.glass}"/>`);
    parts.push(`<rect x="${r(cx + cw * 0.15)}" y="${r(cy - 26)}" width="${r(cw * 0.55)}" height="26" rx="6" fill="${C.hull}" stroke="${C.hullLine}" stroke-width="3"/>`);
    parts.push(`<path d="M ${r(x0)} ${r(wl - free)} L ${r(x0 + len)} ${r(wl - free)} L ${r(x0 + len - 6)} ${r(wl + 18)} L ${r(x0 + 18)} ${r(wl + 18)} Z" fill="${C.hull}" stroke="${C.hullLine}" stroke-width="3"/>`);
    for (let i = 0; i < 3; i++) parts.push(`<rect x="${r(x0 + len * (0.18 + i * 0.22))}" y="${r(wl - free + 26)}" width="${r(len * 0.08)}" height="12" rx="6" fill="${C.glass}"/>`);
    parts.push(`<line x1="${r(x0 + 4)}" y1="${r(wl - 6)}" x2="${r(x0 + len - 4)}" y2="${r(wl - 6)}" stroke="${C.accent}" stroke-width="5"/>`);
  } else {
    const deckY = wl - free;
    parts.push(`<path d="M ${r(x0)} ${r(deckY)} L ${r(x0 + len)} ${r(deckY + 6)} L ${r(x0 + len - 10)} ${r(wl + 16)} Q ${r(x0 + len * 0.45)} ${r(wl + 34)} ${r(x0 + 30)} ${r(wl + 6)} Z" fill="${C.hull}" stroke="${C.hullLine}" stroke-width="3"/>`);
    const cx = x0 + len * 0.3;
    const cw = len * 0.36;
    parts.push(`<path d="M ${r(cx)} ${r(deckY)} L ${r(cx + 40)} ${r(deckY - 42)} L ${r(cx + cw)} ${r(deckY - 46)} L ${r(cx + cw + 10)} ${r(deckY + 1)} Z" fill="${C.hull}" stroke="${C.hullLine}" stroke-width="3"/>`);
    parts.push(`<path d="M ${r(cx + 50)} ${r(deckY - 30)} L ${r(cx + cw - 20)} ${r(deckY - 33)} L ${r(cx + cw - 14)} ${r(deckY - 16)} L ${r(cx + 44)} ${r(deckY - 14)} Z" fill="${C.glass}"/>`);
    for (let i = 0; i < 3; i++) parts.push(`<rect x="${r(x0 + len * (0.2 + i * 0.16))}" y="${r(deckY + 22)}" width="${r(len * 0.06)}" height="9" rx="4.5" fill="${C.glass}"/>`);
    parts.push(`<path d="M ${r(x0 + len * 0.6)} ${r(wl + 22)} L ${r(x0 + len * 0.66)} ${r(wl + 110)} L ${r(x0 + len * 0.71)} ${r(wl + 110)} L ${r(x0 + len * 0.69)} ${r(wl + 22)} Z" fill="${C.hullLine}" opacity="0.18"/>`);
    parts.push(`<path d="M ${r(x0 + 26)} ${r(wl - 4)} Q ${r(x0 + len * 0.45)} ${r(wl + 12)} ${r(x0 + len - 8)} ${r(wl - 2)}" fill="none" stroke="${C.accent}" stroke-width="5"/>`);
  }
  // sea in front
  parts.push(`<path d="M0 ${wl + 6} Q 200 ${wl - 10} 400 ${wl + 6} T 800 ${wl + 6} T 1200 ${wl + 6} T 1600 ${wl + 6} V ${H} H 0 Z" fill="${evening ? "#4f7f93" : C.sea1}"/>`);
  parts.push(`<path d="M0 ${wl + 80} Q 250 ${wl + 60} 500 ${wl + 80} T 1000 ${wl + 80} T 1600 ${wl + 80} V ${H} H 0 Z" fill="${C.sea2}"/>`);
  parts.push(`<path d="M0 ${wl + 170} Q 300 ${wl + 150} 600 ${wl + 170} T 1200 ${wl + 170} T 1600 ${wl + 170} V ${H} H 0 Z" fill="${C.sea3}"/>`);
  const ft = feet(m.lengthOverallM);
  parts.push(`<text x="60" y="100" font-size="30" font-weight="600" fill="${C.muted}" letter-spacing="4">${esc(m.builder.toUpperCase())}</text>`);
  parts.push(`<text x="60" y="160" font-size="58" font-weight="700" fill="${C.ink}">${esc(m.name)}</text>`);
  if (ft) parts.push(`<text x="60" y="206" font-size="28" fill="${C.muted}">${ft} ft ${cat ? "catamaran" : "sailing yacht"}</text>`);
  return frame(W, H, parts.join(""), "Illustration, not the actual yacht", true);
}

/** Cabin count to draw: the largest charter layout. */
const cabinsOf = (m: ModelSpecs) => Math.max(...(m.cabins.length ? m.cabins : [m.kind === "catamaran" ? 4 : 3]));
const headsOf = (m: ModelSpecs) => Math.max(...(m.heads.length ? m.heads : [2]));

function room(x: number, y: number, w: number, h: number, fill: string, label: string, size = 22): string {
  return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="10" fill="${fill}" stroke="${C.hullLine}" stroke-width="2"/>${label ? `<text x="${r(x + w / 2)}" y="${r(y + h / 2 + size / 3)}" text-anchor="middle" font-size="${size}" fill="${C.ink}">${esc(label)}</text>` : ""}`;
}

/** Top-down sketch of a typical charter layout. */
export function planSvg(m: ModelSpecs): string {
  const W = 1600;
  const H = 1000;
  const cabins = cabinsOf(m);
  const heads = headsOf(m);
  const parts: string[] = [`<rect width="${W}" height="${H}" fill="#fbf8f2"/>`];
  parts.push(`<text x="60" y="90" font-size="30" font-weight="600" fill="${C.muted}" letter-spacing="4">TYPICAL CHARTER LAYOUT</text>`);
  parts.push(`<text x="60" y="146" font-size="52" font-weight="700" fill="${C.ink}">${esc(m.name)}: ${cabins} cabins, ${heads} heads</text>`);
  if (m.kind === "catamaran") {
    // Bow to the right. Two hulls, bridgedeck between, trampoline forward.
    const x0 = 160;
    const len = 1280;
    const hullW = 170;
    const yTop = 230;
    const yBot = 830 - hullW;
    const hull = (y: number) => `<path d="M ${x0} ${y} H ${x0 + len - 90} Q ${x0 + len} ${y + hullW / 2} ${x0 + len - 90} ${y + hullW} H ${x0} Z" fill="${C.deck}" stroke="${C.hullLine}" stroke-width="3"/>`;
    parts.push(hull(yTop), hull(yBot));
    const deckX = x0 + 40;
    const deckW = len * 0.62;
    parts.push(`<rect x="${deckX}" y="${yTop + hullW}" width="${r(deckW)}" height="${r(yBot - yTop - hullW)}" fill="${C.deck}" stroke="${C.hullLine}" stroke-width="3"/>`);
    // trampoline
    const netX = deckX + deckW;
    parts.push(`<rect x="${r(netX)}" y="${yTop + hullW}" width="${r(x0 + len - 150 - netX)}" height="${r(yBot - yTop - hullW)}" fill="url(#net)" stroke="${C.net}" stroke-width="2"/>`);
    parts.push(`<defs><pattern id="net" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M0 0 L22 22 M22 0 L0 22" stroke="${C.net}" stroke-width="1.5"/></pattern></defs>`);
    parts.push(`<text x="${r(netX + (x0 + len - 150 - netX) / 2)}" y="${(yTop + yBot + hullW) / 2 + 8}" text-anchor="middle" font-size="22" fill="${C.muted}">Trampoline</text>`);
    // saloon and cockpit on the bridgedeck
    const midY = yTop + hullW + 20;
    const midH = yBot - yTop - hullW - 40;
    parts.push(room(deckX + 20, midY, deckW * 0.38, midH, "#f7efe2", "Cockpit"));
    parts.push(room(deckX + 40 + deckW * 0.38, midY, deckW * 0.56, midH, C.saloon, "Saloon and galley"));
    // cabins in the hulls: aft and forward of each hull (plus centre cabins on 5 and 6)
    const perHull = Math.ceil(Math.min(cabins, 6) / 2);
    const slots = (y: number, n: number, owner: boolean) => {
      const out: string[] = [];
      const usable = len - 200;
      const segW = usable / Math.max(n, 2);
      for (let i = 0; i < n; i++) {
        const x = x0 + 30 + i * segW + (n === 1 ? usable / 4 : 0);
        out.push(room(x, y + 20, segW * 0.66, hullW - 40, C.cabin, owner && n === 1 ? "Owner's suite" : "Double cabin"));
        out.push(room(x + segW * 0.69, y + 30, segW * 0.24, hullW - 60, C.head, "WC", 18));
      }
      return out.join("");
    };
    const portN = perHull;
    const stbdN = Math.max(1, Math.min(cabins, 6) - perHull);
    parts.push(slots(yTop, portN, false));
    parts.push(slots(yBot, stbdN, cabins === 3));
  } else {
    // Bow to the right, a monohull deck outline: aft cabins either side of the
    // companionway, saloon on the centreline, side cabins, forward cabin.
    const x0 = 140;
    const L = 1320;
    const cy = 560;
    const half = 195;
    parts.push(`<path d="M ${x0} ${cy - half} Q ${x0 + L * 0.55} ${cy - half - 40} ${x0 + L} ${cy} Q ${x0 + L * 0.55} ${cy + half + 40} ${x0} ${cy + half} Z" fill="${C.deck}" stroke="${C.hullLine}" stroke-width="3"/>`);
    const n = Math.min(cabins, 6);
    const aft = n >= 3 ? 2 : 1;
    const fwd = 1;
    const side = Math.max(0, n - aft - fwd);
    if (aft === 2) {
      parts.push(room(x0 + 24, cy - half + 22, 230, 150, C.cabin, "Double cabin"));
      parts.push(room(x0 + 24, cy + half - 172, 230, 150, C.cabin, "Double cabin"));
    } else parts.push(room(x0 + 24, cy - 80, 230, 160, C.cabin, "Double cabin"));
    parts.push(room(x0 + 280, cy - 80, 560, 160, C.saloon, "Saloon and galley"));
    // side cabins forward of the aft cabins, alternating port and starboard
    for (let i = 0; i < side; i++) {
      const col = Math.floor(i / 2);
      const top = i % 2 === 0;
      parts.push(room(x0 + 560 + col * 200, top ? cy - half + 10 : cy + 98, 180, 92, C.cabin, "Cabin", 20));
    }
    parts.push(room(x0 + L * 0.64, cy - 70, L * 0.14, 140, C.cabin, "Forward cabin", 20));
    // heads: small rooms along the sides by the saloon
    const hs = Math.min(heads, 4);
    for (let i = 0; i < hs; i++) {
      const top = i % 2 === 0;
      parts.push(room(x0 + 290 + Math.floor(i / 2) * 120, top ? cy - half + 12 : cy + 100, 100, 80, C.head, "WC", 18));
    }
  }
  parts.push(`<text x="60" y="${H - 60}" font-size="24" fill="${C.muted}">Layouts differ by year and version; your quote shows the exact yacht's plan.</text>`);
  return frame(W, H, parts.join(""), "Illustration");
}

/** Bird's-eye view at anchor in turquoise water. */
export function aerialSvg(m: ModelSpecs): string {
  const W = 1600;
  const H = 1000;
  const loa = m.lengthOverallM ?? 14;
  const beamM = m.beamM ?? (m.kind === "catamaran" ? 7.5 : 4.5);
  const len = Math.min(1150, 420 + loa * 36);
  const scale = len / loa;
  const beam = beamM * scale;
  const cx = W / 2 - 40;
  const cy = H / 2 + 10;
  const x0 = cx - len / 2;
  const parts: string[] = [];
  parts.push(`<defs><radialGradient id="sea" cx="0.5" cy="0.5" r="0.75"><stop offset="0" stop-color="#5cc3c8"/><stop offset="1" stop-color="#1f7f99"/></radialGradient><pattern id="net2" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 0 L16 16 M16 0 L0 16" stroke="#9c8e75" stroke-width="1.2"/></pattern></defs>`);
  parts.push(`<rect width="${W}" height="${H}" fill="url(#sea)"/>`);
  for (let i = 0; i < 18; i++) parts.push(`<path d="M ${r((i * 211) % W)} ${r((i * 137) % H)} q 30 -8 60 0" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.25"/>`);
  const shadow = (d: string) => `<path d="${d}" fill="#0d3b4a" opacity="0.25" transform="translate(18 22)"/>`;
  if (m.kind === "catamaran") {
    const hw = beam * 0.24;
    const hullPath = (y: number) => `M ${r(x0)} ${r(y)} H ${r(x0 + len - 70)} Q ${r(x0 + len)} ${r(y + hw / 2)} ${r(x0 + len - 70)} ${r(y + hw)} H ${r(x0)} Z`;
    const yA = cy - beam / 2;
    const yB = cy + beam / 2 - hw;
    parts.push(shadow(hullPath(yA)), shadow(hullPath(yB)));
    parts.push(`<path d="${hullPath(yA)}" fill="#fbf9f4" stroke="#2a2826" stroke-width="3"/>`, `<path d="${hullPath(yB)}" fill="#fbf9f4" stroke="#2a2826" stroke-width="3"/>`);
    const deckX = x0 + 10;
    const deckW = len * 0.66;
    parts.push(`<rect x="${r(deckX)}" y="${r(yA + hw)}" width="${r(deckW)}" height="${r(beam - 2 * hw)}" fill="#f4efe4" stroke="#2a2826" stroke-width="3"/>`);
    parts.push(`<rect x="${r(deckX + deckW * 0.38)}" y="${r(yA + hw + 14)}" width="${r(deckW * 0.6)}" height="${r(beam - 2 * hw - 28)}" rx="18" fill="#ffffff" stroke="#c9bfae" stroke-width="3"/>`);
    parts.push(`<rect x="${r(deckX + deckW)}" y="${r(yA + hw)}" width="${r(len * 0.22)}" height="${r(beam - 2 * hw)}" fill="url(#net2)" stroke="#9c8e75" stroke-width="2"/>`);
    parts.push(`<rect x="${r(deckX + 20)}" y="${r(yA + hw + 24)}" width="${r(deckW * 0.3)}" height="${r(beam - 2 * hw - 48)}" rx="14" fill="#c9a77c" opacity="0.6"/>`);
    parts.push(`<circle cx="${r(deckX + deckW * 0.7)}" cy="${r(cy)}" r="12" fill="#3b3a38"/>`);
  } else {
    const hull = `M ${r(x0)} ${r(cy - beam / 2 + 10)} Q ${r(x0 + len * 0.55)} ${r(cy - beam / 2 - 14)} ${r(x0 + len)} ${r(cy)} Q ${r(x0 + len * 0.55)} ${r(cy + beam / 2 + 14)} ${r(x0)} ${r(cy + beam / 2 - 10)} Z`;
    parts.push(shadow(hull), `<path d="${hull}" fill="#fbf9f4" stroke="#2a2826" stroke-width="3"/>`);
    parts.push(`<path d="M ${r(x0 + 16)} ${r(cy - beam / 2 + 26)} Q ${r(x0 + len * 0.5)} ${r(cy - beam / 2 + 6)} ${r(x0 + len - 40)} ${r(cy)} Q ${r(x0 + len * 0.5)} ${r(cy + beam / 2 - 6)} ${r(x0 + 16)} ${r(cy + beam / 2 - 26)} Z" fill="#c9a77c" opacity="0.55"/>`);
    parts.push(`<rect x="${r(x0 + len * 0.3)}" y="${r(cy - beam * 0.24)}" width="${r(len * 0.3)}" height="${r(beam * 0.48)}" rx="22" fill="#ffffff" stroke="#c9bfae" stroke-width="3"/>`);
    parts.push(`<rect x="${r(x0 + 20)}" y="${r(cy - beam * 0.3)}" width="${r(len * 0.26)}" height="${r(beam * 0.6)}" rx="16" fill="#e9dfcc" stroke="#c9bfae" stroke-width="2"/>`);
    parts.push(`<circle cx="${r(x0 + len * 0.62)}" cy="${r(cy)}" r="11" fill="#3b3a38"/>`);
  }
  parts.push(`<text x="60" y="90" font-size="30" font-weight="600" fill="#ffffff" letter-spacing="4">${esc(m.builder.toUpperCase())}</text>`);
  parts.push(`<text x="60" y="146" font-size="52" font-weight="700" fill="#ffffff">${esc(m.name)} at anchor</text>`);
  return frame(W, H, parts.join(""), "Illustration, not the actual yacht", true);
}

/** Dimensions drawing: side elevation and bow view with the builder's figures. */
export function dimensionsSvg(m: ModelSpecs): string {
  const W = 1600;
  const H = 1000;
  const loa = m.lengthOverallM ?? 14;
  const beamM = m.beamM ?? 4.5;
  const draftM = m.draftM ?? 2;
  const cat = m.kind === "catamaran";
  const s = 900 / Math.max(loa, 12);
  const len = loa * s;
  const x0 = 120;
  const wl = 560;
  const free = (cat ? 1.6 : 1.3) * s * 0.55;
  const dr = draftM * s;
  const parts: string[] = [`<rect width="${W}" height="${H}" fill="#f6f8f9"/>`];
  const grid: string[] = [];
  for (let x = 0; x < W; x += 40) grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#e3e9ec" stroke-width="1"/>`);
  for (let y = 0; y < H; y += 40) grid.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#e3e9ec" stroke-width="1"/>`);
  parts.push(grid.join(""));
  parts.push(`<text x="60" y="90" font-size="30" font-weight="600" fill="${C.muted}" letter-spacing="4">DIMENSIONS</text>`);
  parts.push(`<text x="60" y="146" font-size="52" font-weight="700" fill="${C.ink}">${esc(m.name)}</text>`);
  const line = `stroke="#1f4f69" stroke-width="3" fill="none"`;
  // side elevation
  if (cat) parts.push(`<path d="M ${r(x0)} ${r(wl - free)} H ${r(x0 + len)} L ${r(x0 + len - 6)} ${r(wl + dr)} H ${r(x0 + 20)} Z" ${line}/><path d="M ${r(x0 + len * 0.28)} ${r(wl - free)} L ${r(x0 + len * 0.32)} ${r(wl - free - 0.9 * s)} H ${r(x0 + len * 0.82)} L ${r(x0 + len * 0.86)} ${r(wl - free)}" ${line}/>`);
  else parts.push(`<path d="M ${r(x0)} ${r(wl - free)} L ${r(x0 + len)} ${r(wl - free + 4)} L ${r(x0 + len - 10)} ${r(wl + 0.5 * s)} Q ${r(x0 + len * 0.45)} ${r(wl + 0.7 * s)} ${r(x0 + 30)} ${r(wl + 0.15 * s)} Z" ${line}/><path d="M ${r(x0 + len * 0.6)} ${r(wl + 0.6 * s)} L ${r(x0 + len * 0.64)} ${r(wl + dr)} L ${r(x0 + len * 0.7)} ${r(wl + dr)} L ${r(x0 + len * 0.68)} ${r(wl + 0.6 * s)}" ${line}/><path d="M ${r(x0 + len * 0.3)} ${r(wl - free)} L ${r(x0 + len * 0.34)} ${r(wl - free - 0.55 * s)} H ${r(x0 + len * 0.66)} L ${r(x0 + len * 0.68)} ${r(wl - free)}" ${line}/>`);
  parts.push(`<line x1="${x0 - 40}" y1="${wl}" x2="${r(x0 + len + 40)}" y2="${wl}" stroke="#4a8aa8" stroke-width="2" stroke-dasharray="10 8"/>`);
  const arrow = (x1: number, y1: number, x2: number, y2: number, label: string, lx: number, ly: number, anchor = "middle") =>
    `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${C.accent}" stroke-width="3" marker-start="url(#a)" marker-end="url(#a)"/><text x="${r(lx)}" y="${r(ly)}" text-anchor="${anchor}" font-size="28" font-weight="600" fill="${C.ink}">${esc(label)}</text>`;
  parts.push(`<defs><marker id="a" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${C.accent}"/></marker></defs>`);
  const fmt = (n: number | null) => (n == null ? "–" : `${n.toLocaleString("en-GB", { maximumFractionDigits: 2 })} m`);
  parts.push(arrow(x0, wl - free - 160, x0 + len, wl - free - 160, `Length overall ${fmt(m.lengthOverallM)} (${feet(m.lengthOverallM) ?? "–"} ft)`, x0 + len / 2, wl - free - 175));
  parts.push(arrow(x0 + len + 70, wl, x0 + len + 70, wl + dr, `Draft ${fmt(m.draftM)}`, x0 + len + 90, wl + dr / 2 + 10, "start"));
  // bow view
  const bx = 1330;
  const bw = beamM * s * 0.5;
  const by = 330;
  if (cat) parts.push(`<path d="M ${r(bx - bw / 2)} ${by} V ${by + 70} H ${r(bx - bw / 2 + bw * 0.22)} V ${by} M ${r(bx + bw / 2)} ${by} V ${by + 70} H ${r(bx + bw / 2 - bw * 0.22)} V ${by} M ${r(bx - bw / 2)} ${by} H ${r(bx + bw / 2)} M ${r(bx - bw / 2 + 20)} ${by} L ${r(bx - bw / 2 + 40)} ${by - 60} H ${r(bx + bw / 2 - 40)} L ${r(bx + bw / 2 - 20)} ${by}" ${line}/>`);
  else parts.push(`<path d="M ${r(bx - bw / 2)} ${by} Q ${r(bx - bw / 2)} ${by + 80} ${r(bx)} ${by + 100} Q ${r(bx + bw / 2)} ${by + 80} ${r(bx + bw / 2)} ${by} Z M ${r(bx - bw / 4)} ${by} L ${r(bx - bw / 5)} ${by - 40} H ${r(bx + bw / 5)} L ${r(bx + bw / 4)} ${by}" ${line}/>`);
  parts.push(arrow(bx - bw / 2, by + 150, bx + bw / 2, by + 150, `Beam ${fmt(m.beamM)}`, bx, by + 195));
  const facts = [
    m.cabins.length ? `${options(m.cabins)} cabins` : null,
    m.heads.length ? `${options(m.heads)} heads` : null,
    m.berthsMax ? `up to ${m.berthsMax} berths` : null,
    m.waterL ? `${m.waterL} L water` : null,
    m.fuelL ? `${m.fuelL} L fuel` : null,
  ].filter(Boolean);
  parts.push(`<text x="60" y="${H - 120}" font-size="28" fill="${C.ink}">${esc(facts.join("  ·  "))}</text>`);
  parts.push(`<text x="60" y="${H - 70}" font-size="24" fill="${C.muted}">Builder's figures for the model; charter yachts differ by year and version.</text>`);
  return frame(W, H, parts.join(""), "Illustration");
}

export const ILLUSTRATIONS = ["profile", "anchored", "aerial", "plan", "dimensions"] as const;
export type IllustrationKind = (typeof ILLUSTRATIONS)[number];

export function illustrationSvg(m: ModelSpecs, kind: IllustrationKind): string {
  if (kind === "anchored") return profileSvg(m, "anchored");
  if (kind === "aerial") return aerialSvg(m);
  if (kind === "plan") return planSvg(m);
  if (kind === "dimensions") return dimensionsSvg(m);
  return profileSvg(m);
}

export const illustrationUrl = (id: string, kind: IllustrationKind = "profile") => `/art/yacht/${id}-${kind}.svg`;
export const ILLUSTRATION_LABEL: Record<IllustrationKind, string> = { profile: "Under sail", anchored: "At anchor", aerial: "From above", plan: "Typical layout", dimensions: "Dimensions" };

// ── Gallery: photo-style 3D renders (public/art/yachts, made by
// scripts/renders/render.mjs) plus the typical layout drawing above. ─────────
export const GALLERY = ["sailing", "anchored", "aerial", "profile", "plan"] as const;
export type GalleryKind = (typeof GALLERY)[number];
export const galleryUrl = (id: string, kind: GalleryKind = "sailing") => (kind === "plan" ? illustrationUrl(id, "plan") : `/art/yachts/${id}-${kind}.webp`);
export const GALLERY_LABEL: Record<GalleryKind, string> = {
  sailing: "Under sail",
  anchored: "At anchor at sunset",
  aerial: "From above",
  profile: "Side on, under sail",
  plan: "Typical layout",
};
