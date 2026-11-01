import { howtoMedMooring } from "./items/howto-med-mooring";
import { howtoAnchorChain } from "./items/howto-anchor-chain";
import { howtoBareboatNeeds } from "./items/howto-bareboat-needs";
import { howtoCatOrMono } from "./items/howto-cat-or-mono";
import { howtoCheckInPhotos } from "./items/howto-check-in-photos";
import { howtoMooringBuoy } from "./items/howto-mooring-buoy";
import { howtoProvisioning } from "./items/howto-provisioning";
import { howtoSeasickness } from "./items/howto-seasickness";
import { howtoSkipperRole } from "./items/howto-skipper-role";
import { howtoWindForecast } from "./items/howto-wind-forecast";
import { placeBvi } from "./items/place-bvi";
import { placeCorsicaWest } from "./items/place-corsica-west";
import { placeCroatiaSplit } from "./items/place-croatia-split";
import { placeGreeceIonian } from "./items/place-greece-ionian";
import { placeGreeceSaronic } from "./items/place-greece-saronic";
import { placeMallorca } from "./items/place-mallorca";
import { placeMontenegroKotor } from "./items/place-montenegro-kotor";
import { placeSardiniaMaddalena } from "./items/place-sardinia-maddalena";
import { placeSeychelles } from "./items/place-seychelles";
import { placeSicilyAeolian } from "./items/place-sicily-aeolian";
import { placeThailandPhuket } from "./items/place-thailand-phuket";
import { placeTurkeyGocek } from "./items/place-turkey-gocek";
import type { Short } from "./types";

export const SHORTS: Short[] = [
  howtoMedMooring,
  howtoAnchorChain,
  howtoBareboatNeeds,
  howtoCatOrMono,
  howtoCheckInPhotos,
  howtoMooringBuoy,
  howtoProvisioning,
  howtoSeasickness,
  howtoSkipperRole,
  howtoWindForecast,
  placeBvi,
  placeCorsicaWest,
  placeCroatiaSplit,
  placeGreeceIonian,
  placeGreeceSaronic,
  placeMallorca,
  placeMontenegroKotor,
  placeSardiniaMaddalena,
  placeSeychelles,
  placeSicilyAeolian,
  placeThailandPhuket,
  placeTurkeyGocek,
];

export function shortById(id: string): Short | undefined {
  return SHORTS.find((s) => s.id === id);
}
