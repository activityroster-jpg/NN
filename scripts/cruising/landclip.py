# Extract land outlines inside a lon/lat box from Natural Earth 10m (world-atlas
# topojson), clip to the box, simplify, and print rings as JSON.
import json, sys
path, w, s, e, n = sys.argv[1], *map(float, sys.argv[2:6])
tol = float(sys.argv[6]) if len(sys.argv) > 6 else 0.002
topo = json.load(open(path))
sx, sy = topo["transform"]["scale"]; tx, ty = topo["transform"]["translate"]
arcs = []
for a in topo["arcs"]:
    x = y = 0; pts = []
    for dx, dy in a:
        x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)
def arc(i):
    return arcs[i] if i >= 0 else arcs[~i][::-1]
def ring(idx):
    out = []
    for i in idx:
        p = arc(i); out.extend(p if not out else p[1:])
    return out
rings = []
for geom in topo["objects"]["land"]["geometries"]:
    polys = geom["arcs"] if geom["type"] == "MultiPolygon" else [geom["arcs"]]
    for poly in polys:
        rings.append(ring(poly[0]))  # outer rings only
m = 0.25  # clip well outside the visible frame so cut edges never show
W, S_, E, N = w - m, s - m, e + m, n + m
def clip(r):
    def edge(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            a, b = pts[i - 1], pts[i]
            if inside(b):
                if not inside(a): out.append(inter(a, b))
                out.append(b)
            elif inside(a): out.append(inter(a, b))
        return out
    def ix(x):
        return lambda a, b: (x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]))
    def iy(y):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y)
    for inside, inter in [(lambda p: p[0] >= W, ix(W)), (lambda p: p[0] <= E, ix(E)), (lambda p: p[1] >= S_, iy(S_)), (lambda p: p[1] <= N, iy(N))]:
        r = edge(r, inside, inter)
        if not r: return []
    return r
def dp(pts, eps):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]; L = (dx * dx + dy * dy) ** 0.5
    dmax, idx = 0, 0
    for i in range(1, len(pts) - 1):
        if L < 1e-9:  # closed ring: measure from the start point
            d = ((pts[i][0] - a[0]) ** 2 + (pts[i][1] - a[1]) ** 2) ** 0.5
        else:
            d = abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / L
        if d > dmax: dmax, idx = d, i
    if dmax > eps:
        return dp(pts[: idx + 1], eps)[:-1] + dp(pts[idx:], eps)
    return [a, b]
out = []
for r in rings:
    xs = [p[0] for p in r]; ys = [p[1] for p in r]
    if max(xs) < W or min(xs) > E or max(ys) < S_ or min(ys) > N: continue
    c = clip(r)
    if len(c) < 3: continue
    c = dp(c, tol)  # open ring: first and last points are kept
    if len(c) >= 3: out.append([[round(x, 4), round(y, 4)] for x, y in c])
print(json.dumps(out))
