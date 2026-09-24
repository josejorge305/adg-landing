import json, os, re
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

# reuse the tile fetch + ADG duotone from the footprint map build (functions only)
src = open("/Users/josefigueroa/Desktop/adg-landing/design-sources/satellite_map.py").read()
exec(src[: src.index("# Statewide frame")])

OFFICE = (25.7047, -80.2856)                       # 7520 SW 57th Avenue (Red Road), South Miami
LAT1, LON1, LAT2, LON2 = 25.772, -80.405, 25.636, -80.168
im, (x0, y0, x1, y1) = stitch(LAT1, LON1, LAT2, LON2, 13)
ox, oy = px(OFFICE[0], OFFICE[1], 13)
pin = ((ox - x0) / (x1 - x0) * 100, (oy - y0) / (y1 - y0) * 100)
im = ImageEnhance.Contrast(im).enhance(1.15).filter(ImageFilter.UnsharpMask(radius=2, percent=40, threshold=3))
print("snippet px", im.size, "office at", [round(v, 2) for v in pin], "%")


def duo(im, stops, keep=0.12, tint=(0.6, 0.75, 0.9), gamma=0.8):
    a = np.asarray(im).astype(np.float32) / 255
    lum = np.clip(((0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]) - 0.03) / 0.58, 0, 1) ** gamma
    s = np.array(stops, np.float32) / 255; pos = np.linspace(0, 1, len(stops))
    out = np.stack([np.interp(lum, pos, s[:, c]) for c in range(3)], -1)
    out = out * (1 - keep) + a * keep * np.array(tint)
    return Image.fromarray(np.clip(out * 255, 0, 255).astype(np.uint8))


w = 1100; h = round(im.height * w / im.width)
base = im.resize((w, h), Image.LANCZOS)
out = {
    "/Users/josefigueroa/Desktop/adg-landing/public/assets/map/office-snippet.webp": tone(base),
    # Reliant: cool chart-paper duotone (ink -> brokerage blue -> pale)
    "/Users/josefigueroa/Desktop/reliant-landing/public/assets/office-snippet.webp": duo(base, [[13, 17, 20], [22, 64, 92], [30, 149, 206], [226, 238, 244]], keep=0.1),
    # FHCP: navy -> teal -> pale sky
    "/Users/josefigueroa/Desktop/fhcp-landing/public/assets/office-snippet.webp": duo(base, [[10, 30, 42], [20, 58, 82], [47, 110, 126], [220, 236, 238]], keep=0.1, tint=(0.55, 0.8, 0.85)),
}
for path, img in out.items():
    img.save(path, "WEBP", quality=82, method=6); print(path.split("/Desktop/")[1], os.path.getsize(path) // 1024, "KB")
json.dump({"pin": pin, "w": w, "h": h}, open("/tmp/office_snippet.json", "w"))
sheet = Image.new("RGB", (3 * 370, 3 * 370 * h // w // 1 + 10), "white")
for k, img in enumerate(out.values()):
    t = img.copy(); t.thumbnail((360, 360)); sheet.paste(t, (k * 370, 0))
sheet.save("/tmp/office_snippets.jpg", quality=84)
