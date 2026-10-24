# Cruising guide map tools

Coastline comes from Natural Earth 1:10m (public domain), via the `world-atlas` dev dependency.

1. `python3 scripts/cruising/landclip.py node_modules/world-atlas/land-10m.json W S E N 0.001 > /tmp/rings.json`
   extracts land inside the map bounds (clipped well outside them) and simplifies it.
2. Write a names file (see below), then
   `python3 scripts/cruising/genland.py lib/cruising/guides/<id>.ts /tmp/rings.json names.json`
   replaces the guide's `land: [...]` block. Names file:
   `{"rings":[{"name":"Vis","probe":[16.15,43.05],"label":[16.15,43.045]}], "extra":["{ name: \"Pakleni\", shape: [[16.33, 43.165], ...] },"]}`
   A ring gets a name when its probe point is inside it. `extra` adds hand-drawn islands too small for the dataset.
3. `node --experimental-strip-types scripts/cruising/dump.mjs lib/cruising/guides/<id>.ts > /tmp/g.json && python3 scripts/cruising/routecheck.py /tmp/g.json`
   reports any route segment or port marker on land. It must say `problems: 0`.

Map bounds should match the 16:9 video frame: lon span = lat span × 1.778 ÷ cos(mid latitude).
