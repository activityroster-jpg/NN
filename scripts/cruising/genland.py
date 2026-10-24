# Regenerate the `land` block of a guide file from Natural Earth rings.
# usage: genland.py guide.ts rings.json names.json
import json, sys
p, rp, names_p = sys.argv[1:4]
rings = json.load(open(rp)); names = json.load(open(names_p))
def bbox(r):
    xs = [q[0] for q in r]; ys = [q[1] for q in r]; return min(xs), max(xs), min(ys), max(ys)
def contains(r, pt):
    x, y = pt; c = False
    for i in range(len(r)):
        (x1, y1), (x2, y2) = r[i - 1], r[i]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c
items = []
for r in rings:
    # A name applies when its probe point lies inside the ring.
    nm = next((n for n in names["rings"] if contains(r, n["probe"])), None)
    parts = []
    if nm: parts.append(f'name: "{nm["name"]}"')
    if nm and nm.get("label"): parts.append(f'label: [{nm["label"][0]}, {nm["label"][1]}]')
    parts.append("shape: [" + ", ".join(f"[{x}, {y}]" for x, y in r) + "]")
    items.append("      { " + ", ".join(parts) + " },")
items += ["      " + x for x in names.get("extra", [])]
s = open(p).read()
start = s.index("    land: [\n") + len("    land: [\n"); end = s.index("    ],\n  },\n  legs:")
s = s[:start] + "      // Coastline: Natural Earth 1:10m (public domain), simplified.\n" + "\n".join(items) + "\n" + s[end:]
open(p, "w").write(s)
print(len(items), "land shapes")
