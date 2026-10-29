// The final check's structure, shared by the notes (server) and the
// question set (client): which questions belong to which topic, and which
// lesson teaches each topic. Questions appear in this order.

export interface Topic {
  id: string;
  title: string;
  /** Slugs of the lessons that teach it. */
  lessons: string[];
  /** Question ids, in order. */
  ids: string[];
}

export const TOPICS: Topic[] = [
  { id: "kit", title: "The kit and the chart", lessons: ["navigating-on-a-charter", "reading-the-chart"], ids: ["sounder", "distance-scale", "chart-depth", "tap-wreck"] },
  { id: "dst", title: "Distance, speed and time", lessons: ["distance-speed-and-time"], ids: ["dst-hours", "dst-arrive", "dst-speed"] },
  { id: "bearings", title: "Bearings and the compass", lessons: ["bearings-and-the-compass"], ids: ["reciprocal", "true-magnetic", "transit"] },
  { id: "lateral", title: "Lateral marks, Regions A and B", lessons: ["lateral-marks-a-and-b"], ids: ["region-a-red", "region-b-red", "which-b", "b-port-mark", "leaving-green"] },
  { id: "cardinal", title: "Cardinal and other marks", lessons: ["cardinal-and-other-marks"], ids: ["north-cardinal", "south-cardinal", "isolated-danger", "safe-water", "special-mark"] },
  { id: "lights", title: "Lights at night", lessons: ["lights-at-night"], ids: ["fl3", "iso", "daylight"] },
  { id: "pilotage", title: "Pilotage into a harbour", lessons: ["pilotage-into-a-harbour"], ids: ["clearing-bearing", "plan-approach", "lazy-line"] },
  { id: "anchoring", title: "Anchoring and mooring", lessons: ["anchoring-and-mooring"], ids: ["scope", "seagrass", "dragging"] },
  { id: "rules", title: "Rules of the road", lessons: ["rules-of-the-road"], ids: ["power-sail", "port-tack", "overtaking", "five-blasts"] },
  { id: "weather", title: "Weather", lessons: ["weather-for-a-charter-week"], ids: ["meltemi", "bora", "beaufort"] },
  { id: "plan", title: "The plotter and the week's plan", lessons: ["plotter-apps-and-the-plan"], ids: ["cog", "zoom", "marina-channel", "friday"] },
];

export const QUESTION_COUNT = TOPICS.reduce((n, t) => n + t.ids.length, 0);

/** 1-based question numbers for a topic, as shown in the set. */
export function questionNumbers(topicId: string): number[] {
  let n = 0;
  for (const t of TOPICS) {
    if (t.id === topicId) return t.ids.map((_, i) => n + i + 1);
    n += t.ids.length;
  }
  return [];
}
