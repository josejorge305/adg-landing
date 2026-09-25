"""Aura Living at Silver Lake: massing render from FK site plan A1.01A, used as Runway layout reference."""
import json, math, sys
import numpy as np, fitz
from PIL import Image, ImageDraw

B = "/Users/josefigueroa/Library/CloudStorage/Box-Box/Aura Living/002 Aura at Silver Lake/"
PLAN = B + "002 Architecture/2026-02-04 - Aura at Silver Lake - Apartments - SD Package/ARCH/Individual Pages/A1.01A-ARCHITECTURAL SITE PLAN.pdf"
FT = 50 / 72.0            # 1" = 50' -> feet per PDF point
import os
W, H = int(os.environ.get("W", 1920)), int(os.environ.get("H", 1080))

# ---------- ground texture from the plan (PDF points, 0.5 px per pt) ----------
S = 0.5
pix = fitz.open(PLAN)[0].get_pixmap(matrix=fitz.Matrix(S, S))
plan = np.asarray(Image.frombytes("RGB", (pix.width, pix.height), pix.samples)).astype(np.float32) / 255
lum = plan.mean(axis=2)
grass = np.array([0.38, 0.55, 0.26]); line = np.array([0.33, 0.34, 0.36])
from PIL import ImageFilter
ink = Image.fromarray(((lum < 0.93) * 255).astype(np.uint8))
paved = ink.filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.MinFilter(11))
pv = (np.asarray(paved) > 127)[..., None]
tex = np.where(pv, np.array([0.30, 0.31, 0.33]), grass)
tex = np.where((lum < 0.7)[..., None] & pv, np.array([0.85, 0.85, 0.82]), tex)   # stall striping
tex = (tex * 255).astype(np.uint8)
timg = Image.fromarray(tex); td = ImageDraw.Draw(timg)
# title block / legend area on the right is not site: paint it forest
td.rectangle([2350 * S, 0, pix.width, pix.height], fill=(46, 74, 40))
# Silver Lake: southwest of the site
shore = [(0, 700), (380, 760), (1000, 1060), (1450, 1150), (1640, 1440), (1760, 1700), (1790, 2160), (0, 2160)]
td.polygon([(x * S, y * S) for x, y in shore], fill=(52, 88, 110))
tex = np.asarray(timg)
TH, TW = tex.shape[:2]

# ---------- camera: drone over Silver Lake, southwest of the site, looking northeast ----------
def world(px, py, z=0.0):
    return np.array([px * FT, -py * FT, z])

cx, cy = float(sys.argv[1]) if len(sys.argv) > 1 else 1460, float(sys.argv[2]) if len(sys.argv) > 2 else 1050
dist = float(sys.argv[3]) if len(sys.argv) > 3 else 1100      # horizontal feet from target
alt = float(sys.argv[4]) if len(sys.argv) > 4 else 480         # camera altitude, feet
az = math.radians(float(sys.argv[5]) if len(sys.argv) > 5 else 225)   # compass bearing from target to camera (225 = SW)
fov = math.radians(float(sys.argv[6]) if len(sys.argv) > 6 else 58)
T = world(cx, cy, 20)
C = T + np.array([math.sin(az) * dist, math.cos(az) * dist, 0]); C[2] = alt
f = T - C; f /= np.linalg.norm(f)
r = np.cross(f, [0, 0, 1]); r /= np.linalg.norm(r)
u = np.cross(r, f)
F = (W / 2) / math.tan(fov / 2)

def project(P):
    d = P - C
    z = d @ f
    return (W / 2 + F * (d @ r) / z, H / 2 - F * (d @ u) / z), z

# ---------- ground + sky, per pixel ray cast ----------
ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
dirs = f[None, None, :] + ((xs - W / 2) / F)[..., None] * r - ((ys - H / 2) / F)[..., None] * u
tz = -C[2] / np.where(dirs[..., 2] < -1e-6, dirs[..., 2], -1e-6)
P = C + tz[..., None] * dirs
tx = (P[..., 0] / FT * S).astype(int); ty = (-P[..., 1] / FT * S).astype(int)
inside = (dirs[..., 2] < -1e-6) & (tx >= 0) & (ty >= 0) & (tx < TW) & (ty < TH)
img = np.zeros((H, W, 3), np.float32)
from matplotlib.path import Path as MPath
lake_far = MPath([(-9000, 700), (0, 700), (380, 760), (1000, 1060), (1450, 1150), (1640, 1440), (1760, 1700), (1790, 2160), (1900, 9000), (-9000, 9000)])
px_all = P[..., 0] / FT; py_all = -P[..., 1] / FT
is_lake = lake_far.contains_points(np.c_[px_all.ravel(), py_all.ravel()]).reshape(H, W)
noise = (np.sin(px_all / 37) * np.cos(py_all / 29) + np.sin(px_all / 13 + py_all / 17)) * 10
img[:] = (46, 74, 40)                                              # tree canopy beyond the plan
img += noise[..., None]
img[is_lake] = (52, 88, 110)
img[inside] = tex[ty[inside], tx[inside]]
ground = dirs[..., 2] < -1e-6
fog = np.clip((tz * np.linalg.norm(dirs, axis=2) - 900) / 3500, 0, 0.75)[..., None]
img = img * (1 - fog) + np.array([200, 196, 180]) * fog
sky_t = np.clip(ys / (H * 0.5), 0, 1)[..., None]
sky = np.array([120, 160, 205]) * (1 - sky_t) + np.array([235, 215, 180]) * sky_t
img = np.where(ground[..., None], img, sky)
out = Image.fromarray(img.clip(0, 255).astype(np.uint8))

# ---------- buildings from the plan's color-coded footprints ----------
fills = json.load(open("/tmp/slvplan/fills.json"))
blds = [o for o in fills if o["kind"] in ("T1", "T2", "T3", "CLUB")]
sun = np.array([-0.55, -0.35, 0.76]); sun /= np.linalg.norm(sun)   # low sun from the west-southwest
faces = []
for b in blds:
    q = [np.array(p, float) for p in b["pts"][:4]]
    c0 = sum(q) / 4; e0, e1 = q[1] - q[0], q[2] - q[1]
    sa = e1 if np.linalg.norm(e0) >= np.linalg.norm(e1) else e0
    sa = sa / np.linalg.norm(sa)
    k = 0.72 if b["kind"] != "CLUB" else 0.85
    q = [c0 + (p - c0) - (1 - k) * np.dot(p - c0, sa) * sa for p in q]
    club = b["kind"] == "CLUB"
    h, rh = (18.0, 9.0) if club else (31.0, 11.0)
    base = [world(x, y, 0) for x, y in q]
    top = [world(x, y, h) for x, y in q]
    # hip roof: ridge along the long axis
    e0, e1 = top[1] - top[0], top[2] - top[1]
    cen = sum(top) / 4
    if np.linalg.norm(e0) >= np.linalg.norm(e1): long_, short = e0, e1
    else: long_, short = e1, e0
    L, Sh = np.linalg.norm(long_), np.linalg.norm(short)
    a = long_ / L * max(L / 2 - Sh / 2, 0)
    r0, r1 = cen - a + [0, 0, rh], cen + a + [0, 0, rh]
    for i in range(4):
        j = (i + 1) % 4
        faces.append(("wall", [base[i], base[j], top[j], top[i]]))
        # roof panel for this edge: connect to the nearer ridge end(s)
        mid = (top[i] + top[j]) / 2
        edge = top[j] - top[i]
        if abs(np.dot(edge / np.linalg.norm(edge), long_ / L)) > 0.7:
            ri, rj = (r0, r1) if np.dot(top[j] - top[i], r1 - r0) > 0 else (r1, r0)
            faces.append(("roof", [top[i], top[j], rj, ri]))
        else:
            rr = r0 if np.linalg.norm(mid - r0) < np.linalg.norm(mid - r1) else r1
            faces.append(("roof", [top[i], top[j], rr]))

draw = ImageDraw.Draw(out, "RGBA")
items = []
for kind, pts in faces:
    scr, zs = zip(*[project(p) for p in pts])
    if min(zs) <= 1: continue
    n = np.cross(pts[1] - pts[0], pts[2] - pts[0]); n /= (np.linalg.norm(n) + 1e-9)
    if np.dot(n, C - pts[0]) < 0: n = -n
    shade = 0.55 + 0.45 * max(np.dot(n, sun), 0)
    col = np.array((226, 214, 192) if kind == "wall" else (78, 80, 86)) * shade
    items.append((np.mean(zs), scr, tuple(int(c) for c in col.clip(0, 255)), pts, kind))
for _, scr, col, pts3, kind in sorted(items, key=lambda t: -t[0]):
    draw.polygon(scr, fill=col + (255,), outline=(40, 40, 44, 255))
    if kind != "wall": continue
    b0, b1, t1, t0 = pts3
    L = np.linalg.norm(b1 - b0); hgt = t0[2] - b0[2]
    floors = 3 if hgt > 25 else 1
    nwin = max(int(L / 13), 1)
    for fl in range(floors):
        for wi in range(nwin):
            a0, a1 = (wi + 0.3) / nwin, (wi + 0.7) / nwin
            z0, z1 = (fl + 0.3) / floors, (fl + 0.75) / floors
            quad = [b0 + (b1 - b0) * a + np.array([0, 0, hgt * z]) for a, z in ((a0, z0), (a1, z0), (a1, z1), (a0, z1))]
            sc = [project(q)[0] for q in quad]
            draw.polygon(sc, fill=(62, 70, 80, 255))
        zb = hgt * (fl / floors)
        if fl: draw.line([project(b0 + [0, 0, zb])[0], project(b1 + [0, 0, zb])[0]], fill=(150, 140, 125, 255), width=1)
out.save(sys.argv[7] if len(sys.argv) > 7 else "/tmp/slvplan/massing.png")
print("saved")
