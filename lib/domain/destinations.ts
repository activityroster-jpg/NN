import type { Currency } from "./types";

// Destinations we sell. The four `featured` ones are front and centre; the rest
// are bookable but secondary. Copy (names, blurbs) lives in the dictionaries so
// it can be translated; this file holds the facts.

export interface DestinationDef {
  id: string;
  featured: boolean;
  /** ISO 3166 alpha-2. */
  country: string;
  /** Months (1-12) with regular charter weeks. */
  seasonMonths: number[];
  /** Months that are peak season, for the "best time" hint. */
  peakMonths: number[];
  /** Typical charter currency in the destination. */
  currency: Currency;
  center: { lat: number; lng: number };
  /** Main charter bases (display names). */
  bases: string[];
  /** Licence rules summary key (see dictionary `licence.*`). */
  licenceRule: "icc_vhf" | "icc_two" | "icc" | "experience";
  /** CSS gradient used until a hero photo is set in the admin. */
  heroGradient: string;
}

export const DESTINATIONS: readonly DestinationDef[] = [
  {
    id: "croatia",
    featured: true,
    country: "HR",
    seasonMonths: [4, 5, 6, 7, 8, 9, 10],
    peakMonths: [7, 8],
    currency: "EUR",
    center: { lat: 43.5, lng: 16.4 },
    bases: ["Split", "Kaštela", "Trogir", "Dubrovnik", "Šibenik"],
    licenceRule: "icc_vhf",
    heroGradient: "linear-gradient(135deg,#0e5a7a 0%,#1b8aa6 55%,#9fd8d6 100%)",
  },
  {
    id: "greece-athens",
    featured: true,
    country: "GR",
    seasonMonths: [4, 5, 6, 7, 8, 9, 10],
    peakMonths: [7, 8],
    currency: "EUR",
    center: { lat: 37.9, lng: 23.7 },
    bases: ["Alimos (Athens)", "Lavrion"],
    licenceRule: "icc_two",
    heroGradient: "linear-gradient(135deg,#123c69 0%,#2f6fb0 55%,#e8f1fb 100%)",
  },
  {
    id: "sardinia",
    featured: true,
    country: "IT",
    seasonMonths: [4, 5, 6, 7, 8, 9, 10],
    peakMonths: [7, 8],
    currency: "EUR",
    center: { lat: 41.1, lng: 9.5 },
    bases: ["Portisco", "Cannigione", "Olbia"],
    licenceRule: "icc",
    heroGradient: "linear-gradient(135deg,#0a6e6e 0%,#21a3a0 55%,#f2e6c9 100%)",
  },
  {
    id: "bvi",
    featured: true,
    country: "VG",
    seasonMonths: [1, 2, 3, 4, 5, 6, 7, 11, 12],
    peakMonths: [12, 1, 2, 3, 4],
    currency: "USD",
    center: { lat: 18.43, lng: -64.62 },
    bases: ["Road Town (Tortola)", "Nanny Cay", "Hodges Creek"],
    licenceRule: "experience",
    heroGradient: "linear-gradient(135deg,#056c8a 0%,#16b3c4 55%,#fdf3d8 100%)",
  },
  {
    id: "greece-ionian",
    featured: false,
    country: "GR",
    seasonMonths: [4, 5, 6, 7, 8, 9, 10],
    peakMonths: [7, 8],
    currency: "EUR",
    center: { lat: 38.8, lng: 20.7 },
    bases: ["Lefkada", "Corfu"],
    licenceRule: "icc_two",
    heroGradient: "linear-gradient(135deg,#1d4e6b,#4b8db3)",
  },
  {
    id: "turkey",
    featured: false,
    country: "TR",
    seasonMonths: [4, 5, 6, 7, 8, 9, 10],
    peakMonths: [7, 8],
    currency: "EUR",
    center: { lat: 36.7, lng: 28.9 },
    bases: ["Göcek", "Marmaris", "Bodrum"],
    licenceRule: "icc",
    heroGradient: "linear-gradient(135deg,#7a2e1b,#c4643c)",
  },
  {
    id: "balearics",
    featured: false,
    country: "ES",
    seasonMonths: [4, 5, 6, 7, 8, 9, 10],
    peakMonths: [7, 8],
    currency: "EUR",
    center: { lat: 39.6, lng: 2.9 },
    bases: ["Palma", "Ibiza"],
    licenceRule: "icc",
    heroGradient: "linear-gradient(135deg,#1f5f7a,#79b4c9)",
  },
  {
    id: "sicily",
    featured: false,
    country: "IT",
    seasonMonths: [4, 5, 6, 7, 8, 9, 10],
    peakMonths: [7, 8],
    currency: "EUR",
    center: { lat: 38.4, lng: 14.9 },
    bases: ["Portorosa", "Palermo"],
    licenceRule: "icc",
    heroGradient: "linear-gradient(135deg,#6b3a1e,#d08a4a)",
  },
  {
    id: "corsica",
    featured: false,
    country: "FR",
    seasonMonths: [5, 6, 7, 8, 9],
    peakMonths: [7, 8],
    currency: "EUR",
    center: { lat: 41.6, lng: 9.2 },
    bases: ["Ajaccio", "Propriano"],
    licenceRule: "icc",
    heroGradient: "linear-gradient(135deg,#2b4f3a,#6fa385)",
  },
  {
    id: "montenegro",
    featured: false,
    country: "ME",
    seasonMonths: [5, 6, 7, 8, 9, 10],
    peakMonths: [7, 8],
    currency: "EUR",
    center: { lat: 42.4, lng: 18.7 },
    bases: ["Tivat", "Kotor"],
    licenceRule: "icc_vhf",
    heroGradient: "linear-gradient(135deg,#253b5a,#5f7fa8)",
  },
  {
    id: "seychelles",
    featured: false,
    country: "SC",
    seasonMonths: [1, 2, 3, 4, 5, 9, 10, 11, 12],
    peakMonths: [4, 5, 10, 11],
    currency: "EUR",
    center: { lat: -4.6, lng: 55.5 },
    bases: ["Praslin", "Mahé"],
    licenceRule: "experience",
    heroGradient: "linear-gradient(135deg,#0c6b58,#3fbf9b)",
  },
  {
    id: "thailand",
    featured: false,
    country: "TH",
    seasonMonths: [1, 2, 3, 4, 11, 12],
    peakMonths: [12, 1, 2],
    currency: "EUR",
    center: { lat: 7.9, lng: 98.4 },
    bases: ["Phuket"],
    licenceRule: "experience",
    heroGradient: "linear-gradient(135deg,#5b2a6b,#b06fc0)",
  },
];

export const DESTINATION_IDS = DESTINATIONS.map((d) => d.id);

export function destinationById(id: string): DestinationDef | undefined {
  return DESTINATIONS.find((d) => d.id === id);
}

export function inSeason(d: DestinationDef, month: number): boolean {
  return d.seasonMonths.includes(month);
}
