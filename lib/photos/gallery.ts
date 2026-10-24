// Three gallery photos per destination page, as search phrases for the stock
// picker. Chosen to show the place itself (harbour, coast, water) rather than
// generic boats, so each page feels like its destination.
export const GALLERY_QUERIES: Record<string, [string, string, string]> = {
  croatia: ["Dubrovnik old town sea", "Vis Croatia bay turquoise", "Korcula harbour Croatia"],
  "greece-athens": ["Mykonos windmills sea", "Greek island white village harbour", "Aegina Greece beach"],
  sardinia: ["Costa Smeralda beach Sardinia", "Sardinia granite rocks sea", "Cala Luna Sardinia"],
  bvi: ["Virgin Gorda baths boulders", "Caribbean turquoise beach palm", "Tortola island bay"],
  "greece-ionian": ["Kefalonia Myrtos beach", "Paxos Greece sea cave", "Zakynthos navagio"],
  turkey: ["Kas Turkey harbour", "Butterfly valley Turkey beach", "Fethiye Turkey coast"],
  balearics: ["Formentera turquoise beach", "Menorca cala", "Ibiza old town sea"],
  sicily: ["Taormina Sicily sea", "Lipari Aeolian islands", "Cefalu Sicily beach"],
  corsica: ["Corsica Scandola cliffs", "Porto Vecchio Corsica beach", "Calvi Corsica citadel sea"],
  montenegro: ["Kotor Montenegro old town bay", "Perast Montenegro church island", "Budva Montenegro coast"],
  seychelles: ["Anse Source d'Argent Seychelles", "La Digue Seychelles beach", "Praslin Seychelles"],
  thailand: ["Koh Phi Phi Thailand bay", "Railay Krabi limestone", "Phang Nga Bay James Bond island"],
};
