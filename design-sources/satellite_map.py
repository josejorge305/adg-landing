import math, os, io, json, time, urllib.request
import numpy as np
from PIL import Image, ImageEnhance

OUT = "/Users/josefigueroa/Desktop/adg-landing/public/assets/map/"
os.makedirs(OUT, exist_ok=True)
URL = "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg"
CACHE = "/tmp/s2tiles/"; os.makedirs(CACHE, exist_ok=True)


def px(lat, lon, z):
    n = 256 * 2 ** z
    x = (lon + 180) / 360 * n
    s = math.sin(math.radians(lat))
    y = (0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)) * n
    return x, y


def tile(z, x, y):
    f = f"{CACHE}{z}_{x}_{y}.jpg"
    if not os.path.exists(f):
        req = urllib.request.Request(URL.format(z=z, x=x, y=y), headers={"User-Agent": "ADG-site-build/1.0"})
        for attempt in range(4):
            try:
                open(f, "wb").write(urllib.request.urlopen(req, timeout=30).read()); break
            except Exception as e:
                time.sleep(1.5 * (attempt + 1))
        time.sleep(0.05)
    return Image.open(f).convert("RGB")


def stitch(lat1, lon1, lat2, lon2, z):
    x0, y0 = px(lat1, lon1, z); x1, y1 = px(lat2, lon2, z)
    tx0, ty0, tx1, ty1 = int(x0 // 256), int(y0 // 256), int(x1 // 256), int(y1 // 256)
    canvas = Image.new("RGB", ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            canvas.paste(tile(z, tx, ty), ((tx - tx0) * 256, (ty - ty0) * 256))
    crop = canvas.crop((int(x0 - tx0 * 256), int(y0 - ty0 * 256), int(x1 - tx0 * 256), int(y1 - ty0 * 256)))
    return crop, (x0, y0, x1, y1)


def tone(im):
    """ADG duotone: luminance mapped navy -> steel blue -> pale, with a little of the true color kept."""
    a = np.asarray(im).astype(np.float32) / 255
    lum = (0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2])
    lum = np.clip((lum - 0.035) / 0.55, 0, 1) ** 0.78
    stops = np.array([[6, 16, 25], [18, 44, 63], [64, 120, 160], [196, 222, 236]], np.float32) / 255
    pos = np.array([0.0, 0.35, 0.72, 1.0])
    out = np.zeros_like(a)
    for c in range(3):
        out[..., c] = np.interp(lum, pos, stops[:, c])
    out = out * 0.82 + a * 0.18 * np.array([0.55, 0.75, 0.9])
    return Image.fromarray(np.clip(out * 255, 0, 255).astype(np.uint8))


# Statewide frame (zoom 8) and the South Florida detail (zoom 12, 16x the resolution)
STATE = (31.2, -87.8, 24.3, -79.6)
SOUTH = (26.12, -80.74, 25.38, -80.06)
state, sb = stitch(*STATE, 8)
south, ob = stitch(*SOUTH, 12)
tone(state).save(OUT + "fl-state.webp", "WEBP", quality=78, method=6)
south = ImageEnhance.Contrast(south).enhance(1.18)
from PIL import ImageFilter
south = south.filter(ImageFilter.GaussianBlur(0.6)).filter(ImageFilter.UnsharpMask(radius=2.5, percent=45, threshold=3))
tone(south).save(OUT + "fl-south.webp", "WEBP", quality=80, method=6)
# where the South Florida image sits in the statewide (zoom 8) pixel frame
sx0, sy0 = px(SOUTH[0], SOUTH[1], 8); sx1, sy1 = px(SOUTH[2], SOUTH[3], 8)
meta = {
    "state": {"w": state.width, "h": state.height, "x0": sb[0], "y0": sb[1]},
    "south": {"x": sx0 - sb[0], "y": sy0 - sb[1], "w": sx1 - sx0, "h": sy1 - sy0, "pxw": south.width, "pxh": south.height},
}
json.dump(meta, open("/tmp/s2meta.json", "w"), indent=1)
print(json.dumps(meta, indent=1))
print("sizes", os.path.getsize(OUT + "fl-state.webp") // 1024, "KB,", os.path.getsize(OUT + "fl-south.webp") // 1024, "KB")
p = tone(state); p.thumbnail((700, 700)); q = tone(south); q.thumbnail((700, 700))
sheet = Image.new("RGB", (p.width + q.width + 20, max(p.height, q.height)), "white"); sheet.paste(p, (0, 0)); sheet.paste(q, (p.width + 20, 0)); sheet.save("/tmp/s2prev.jpg", quality=82)
