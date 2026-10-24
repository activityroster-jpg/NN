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
  /** 1 = Sunday (first sailing day) … 6 = Friday (back to base). */
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
  /** Things to do, two to four short items. */
  todo: string[];
}

export interface MooringType {
  kind: "marina" | "town quay" | "buoy" | "anchor";
  note: string;
}

/** How busy and pleasant each month is, January to December. */
export type MonthRating = "closed" | "shoulder" | "best" | "peak";

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
  /** Twelve entries, January first. */
  months: MonthRating[];
  /** Plain-English season notes, spoken in the video. */
  seasons: string[];
  /** Where most charter companies are based: the week starts and ends here. */
  baseMarina: {
    name: string;
    at: LonLat;
    note: string;
    /** A second main charter area, shown alongside the base. */
    alsoMain?: { name: string; at: LonLat };
    others: string[];
  };
  /** Saturday: check-in and the first night, still in the base marina. */
  arrival: string;
  /** Friday evening return and Saturday check-out. */
  departure: string;
  mooring: MooringType[];
  /** Spoken respellings for place names an English voice gets wrong. */
  say?: Record<string, string>;
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
