// Essential cruising destinations: one guide per charter area. Everything a
// guide page and its narrated video need lives in this data, so adding a
// destination is data entry, not new code.

/** [longitude, latitude] in decimal degrees. */
export type LonLat = [number, number];

export type RegionId = "mediterranean" | "caribbean" | "northern-europe" | "indian-ocean" | "south-pacific" | "asia" | "americas" | "atlantic-islands";

export interface Port {
  name: string;
  at: LonLat;
  kind: "marina" | "town quay" | "buoys" | "anchorage";
  water: boolean;
  power: boolean;
  fuel: boolean;
  /** Short practical note: booking, shelter, approach, holding. */
  note: string;
}

export interface Leg {
  day: number;
  from: string;
  to: string;
  /** Approximate distance in nautical miles. */
  nm: number;
  /** Route through clear water, start to finish, for the map. */
  route: LonLat[];
  /** What the day is like. One or two sentences, also spoken in the video. */
  summary: string;
  /** Where the night is spent and how. */
  overnight: string;
  /** Optional stop along the way. */
  stop?: string;
}

export interface Wind {
  name: string;
  /** Compass direction the wind blows from. */
  from: string;
  /** Rotation in degrees of the arrow (direction the wind blows towards). */
  towards: number;
  note: string;
}

export interface CruisingGuide {
  id: string;
  name: string;
  region: RegionId;
  country: string;
  /** Home base for the itinerary. */
  base: string;
  tagline: string;
  intro: string;
  bestMonths: number[];
  level: "easy" | "intermediate" | "experienced";
  /** Destination on our booking site, for the "Plan my trip" link. */
  destinationId?: string;
  map: {
    /** Bounds of the map: [west, south, east, north]. */
    bounds: [number, number, number, number];
    /** Land shapes (rough outlines, not for navigation). */
    land: { name?: string; label?: LonLat; shape: LonLat[] }[];
  };
  legs: Leg[];
  ports: Port[];
  navigation: string[];
  weather: {
    summary: string;
    winds: Wind[];
    forecasts: string[];
    seaTemp: string;
  };
  provisioning: string[];
  /** Rules, fees, paperwork. */
  rules: string[];
}
