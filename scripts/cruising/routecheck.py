# Report route points / segments and port markers that fall on land.
import json, sys
g = json.load(open(sys.argv[1]))
rings = [l["shape"] for l in g["map"]["land"]]
names = [l.get("name", "?") for l in g["map"]["land"]]
def inside(p, r):
    x, y = p; c = False
    for i in range(len(r)):
        (x1, y1), (x2, y2) = r[i - 1], r[i]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c
def on_land(p):
    return [names[i] for i, r in enumerate(rings) if inside(p, r)]
bad = 0
for l in g["legs"]:
    pts = l["route"]
    for a, b in zip(pts, pts[1:]):
        hits = set()
        for k in range(1, 40):
            t = k / 40
            q = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
            hits.update(on_land(q))
        if hits:
            bad += 1
            print(f"day {l['day']}: segment {a} -> {b} crosses {sorted(hits)}")
for p in g["ports"]:
    h = on_land(p["at"])
    if h: bad += 1; print(f"port {p['name']} {p['at']} is on {h}")
print("problems:", bad)
