import type { Short } from "../types";

// Reading a wind forecast, from the site's forecast guide and the weather
// lesson: direction is where it blows from, knots and Beaufort, plan for the
// gusts, two sources evening and morning, local acceleration and the summer
// afternoon build, and a limit agreed before the week.

export const howtoWindForecast: Short = {
  id: "howto-wind-forecast",
  strand: "howto",
  title: "Reading a wind forecast: 6 tips",
  speak: { "nauticalnomads.com": "nautical nomads dot com" },
  scenes: [
    {
      heading: "Read a wind forecast",
      sub: "6 tips before you sail",
      lead: "Six things to check in a wind forecast before you sail.",
      narration: "",
      seconds: 3,
      visual: { kind: "footage", footage: { q: "sailing yacht wind sea" } },
    },
    {
      badge: "Tip 1",
      heading: "Where it comes from",
      narration: "Wind direction is where the wind blows from, so a northerly comes from the north.",
      visual: { kind: "footage", footage: { q: "flag blowing wind sky" } },
    },
    {
      badge: "Tip 2",
      heading: "Knots and forces",
      sub: "Force 4 = 11 to 16 knots",
      narration: "Speed is given in knots, or as a force on the Beaufort scale. Force four is eleven to sixteen knots, a lovely sailing breeze.",
      visual: { kind: "footage", footage: { q: "sailboat sailing breeze" } },
    },
    {
      badge: "Tip 3",
      heading: "Plan for the gusts",
      narration: "Gusts are what the boat has to handle, so plan for them, not the average.",
      visual: { kind: "footage", footage: { q: "sailboat heeling waves" } },
    },
    {
      badge: "Tip 4",
      heading: "Check two sources",
      narration: "Compare two forecasts, evening and morning, and if they disagree, plan for the stronger.",
      visual: { kind: "footage", footage: { q: "clouds timelapse sea" } },
    },
    {
      badge: "Tip 5",
      heading: "Local effects",
      narration: "Wind is often stronger round capes and between islands, and it builds through summer afternoons.",
      visual: { kind: "footage", footage: { q: "island coast aerial sea" } },
    },
    {
      badge: "Tip 6",
      heading: "Know your limit",
      sub: "about Force 4 to 5",
      narration: "Most charter crews are comfortable up to about force four to five. Agree your limit before the week.",
      visual: { kind: "footage", footage: { q: "sailboats harbour calm" } },
    },
    {
      narration: "Save this for your next charter. More guides at nauticalnomads.com.",
      seconds: 4,
      visual: { kind: "end" },
    },
  ],
  caption: "Reading a wind forecast for a charter week: direction, knots and forces, gusts, two sources, local effects and your limit. Save it before you sail.",
  hashtags: ["sailing", "weather", "windforecast", "yachtcharter", "sailingtips", "learntosail", "nauticalnomads"],
  sources: [
    "Nautical Nomads guide: Weather 1, reading a sailing forecast (lib/cruising/howto.ts)",
    "Nautical Nomads course lesson: Weather for a charter week (components/courses/lessons/weather-for-a-charter-week)",
    "Met Office: Beaufort wind force scale, https://weather.metoffice.gov.uk/guides/coast-and-sea/beaufort-scale",
  ],
};
