import "server-only";
import type { Dictionary } from "./dictionaries/en";
import en from "./dictionaries/en";
import de from "./dictionaries/de";
import fr from "./dictionaries/fr";
import it from "./dictionaries/it";
import es from "./dictionaries/es";
import nl from "./dictionaries/nl";
import type { Locale } from "./config";

const DICTIONARIES: Record<Locale, Dictionary> = { en, de, fr, it, es, nl };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
