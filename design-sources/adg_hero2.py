import numpy as np, cv2, os
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

W = "/Users/josefigueroa/Desktop/adg-landing/public/assets/images/website/"
OUT = "/Users/josefigueroa/Desktop/adg-landing/public/assets/site/"

# 1) Hero: current 8-story Aura Living render
hero = Image.open(W + "Aura Living/ai-render-13630316.jpg").convert("RGB")
h2 = hero.copy(); h2.thumbnail((2400, 2400), Image.LANCZOS)
h2.save(OUT + "hero.webp", "WEBP", quality=80, method=6)
h2.save(OUT + "hero.jpg", quality=80, optimize=True, progressive=True)
print("hero", h2.size, os.path.getsize(OUT + "hero.webp") // 1024, "KB")

# 2) "Plans to built": architectural line drawing traced from the same render
g = cv2.cvtColor(np.asarray(h2), cv2.COLOR_RGB2GRAY)
g = cv2.bilateralFilter(g, 9, 40, 9)
edges = cv2.Canny(g, 60, 150)
lab, n = ndimage.label(edges > 0, structure=np.ones((3, 3)))
sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 90])
# drop foliage fragments from the tree along the left edge and cloud specks in the upper sky
lab2, n2 = ndimage.label(keep, structure=np.ones((3, 3)))
for i, sl in enumerate(ndimage.find_objects(lab2)):
    ys, xs = sl
    if (xs.stop < 260 and ys.stop < 820) or ys.stop < 200:
        keep[lab2 == i + 1] = False
keep = cv2.dilate(keep.astype(np.uint8), np.ones((2, 2), np.uint8)).astype(bool)
line = np.zeros((*keep.shape, 4), np.uint8)
line[keep] = (225, 240, 250, 255)
line[..., 3] = cv2.GaussianBlur(line[..., 3], (3, 3), 0.7)
Image.fromarray(line).save(OUT + "hero-lines.png", optimize=True)
Image.open(OUT + "hero-lines.png").save(OUT + "hero-lines.webp", "WEBP", lossless=True, method=6)
prev = Image.new("RGB", h2.size, (11, 27, 38)); L = Image.open(OUT + "hero-lines.png"); prev.paste(L, (0, 0), L)
prev.thumbnail((1000, 500)); prev.save("/tmp/adg_lines_prev.jpg", quality=82)

# 3) ADG monogram icons (from the official logo: just the "ADG" letters, no wordmark)
logo = Image.open(OUT + "adg-logo-color.png").convert("RGBA")
a = np.asarray(logo); al = a[..., 3] > 40
rows = np.where(al.any(axis=1))[0]
gaps = np.where(np.diff(rows) > 3)[0]
end = rows[gaps[0]] if len(gaps) else rows.max()
cols = np.where(al[: end + 1].any(axis=0))[0]
mono = logo.crop((cols.min(), rows.min(), cols.max() + 1, end + 1))
def tile(size, pad, radius):
    t = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    m = Image.new("L", (size, size), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    t.paste(Image.new("RGBA", (size, size), (255, 255, 255, 255)), (0, 0), m)
    mm = mono.copy(); mm.thumbnail((size - 2 * pad, size - 2 * pad), Image.LANCZOS)
    t.alpha_composite(mm, ((size - mm.width) // 2, (size - mm.height) // 2))
    return t
tile(64, 7, 14).save(OUT + "favicon.png", optimize=True)
tile(180, 22, 0).convert("RGB").save(OUT + "apple-touch-icon.png", optimize=True)

# 4) Share image 1200x630: hero render, navy shade, light logo, headline
img = h2.copy(); s = max(1200 / img.width, 630 / img.height); img = img.resize((int(img.width * s), int(img.height * s)), Image.LANCZOS)
x0 = (img.width - 1200) // 2; img = img.crop((x0, 0, x0 + 1200, 630))
arr = np.asarray(img).astype(float); xs = np.linspace(0, 1, 1200)[None, :, None]
shade = np.clip(0.9 - 1.0 * xs, 0, 0.9); arr = arr * (1 - shade) + np.array([13, 31, 45], float) * shade
og = Image.fromarray(arr.clip(0, 255).astype("uint8"))
wl = Image.open(W + "adg-logo.png").convert("RGBA"); wl.thumbnail((170, 120), Image.LANCZOS); og.paste(wl, (70, 64), wl)
d = ImageDraw.Draw(og)
f = ImageFont.truetype("/tmp/og/Newsreader.ttf", 66); f.set_variation_by_axes([500, 72])
d.text((70, 280), "Housing the Workforce.", font=f, fill=(255, 255, 255))
d.text((70, 356), "Strengthening Communities.", font=f, fill=(255, 255, 255))
d.text((72, 462), "Alcazar Development Group · Workforce housing developer, Florida", font=ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 24), fill=(214, 228, 235))
og.save(OUT + "og-image.jpg", quality=86, optimize=True)
p2 = og.copy(); p2.thumbnail((900, 480)); sheet = Image.new("RGB", (900 + 20 + 190, 480), "white"); sheet.paste(p2, (0, 0))
fv = Image.open(OUT + "favicon.png").resize((96, 96), Image.NEAREST); sheet.paste(fv, (930, 20), fv)
dk = Image.new("RGB", (96, 96), (40, 44, 48)); dk.paste(fv, (0, 0), fv); sheet.paste(dk, (930, 140))
sheet.save("/tmp/adg_og_prev.jpg", quality=82)
print("done")
