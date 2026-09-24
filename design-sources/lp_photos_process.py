import os, subprocess, json
import numpy as np
from PIL import Image, ImageEnhance

HQ = "/Users/josefigueroa/Desktop/adg-landing/public/assets/hq/"
ESR = "/tmp/esr/realesrgan-ncnn-vulkan"
PICKS = {
    "holly": [("/tmp/lpimg/holly/%02d" % n) for n in (57, 55, 8, 7, 41, 43, 48, 35, 40, 44, 39, 31, 12, 15, 13)],
    "granvista": [("/tmp/lpimg/granvista_b/%02d" % n) for n in (2, 5, 8, 6, 0, 1, 3)],
    "cinnamon": ["/tmp/lpimg/cinnamon/01", "/tmp/lpimg/cinnamon_b/05", "/tmp/lpimg/cinnamon_b/09", "/tmp/lpimg/cinnamon_b/06"],
}
EXISTING = {
    "holly": ["the-holly-by-soleste-aerial", "the-holly-by-soleste-lobby", "the-holly-by-soleste-north-tower"],
    "granvista": ["gran-vista-at-doral"],
    "cinnamon": ["cinnamon-cove"],
}


def find(stem):
    for ext in (".jpg", ".png", ".webp", ".jpeg"):
        if os.path.exists(stem + ext): return stem + ext
    raise FileNotFoundError(stem)


def ahash(im):
    g = np.asarray(im.convert("L").resize((16, 9), Image.LANCZOS)).astype(float); return g > g.mean()


def grade(im):
    a = np.asarray(im).astype(np.float32)
    lo = np.percentile(a, 0.4, axis=(0, 1)).min(); hi = np.percentile(a, 99.6, axis=(0, 1)).max()
    a = np.clip((a - lo) / max(hi - lo, 1) * 255, 0, 255); im = Image.fromarray(a.astype(np.uint8))
    im = ImageEnhance.Contrast(im).enhance(1.04)
    s = np.asarray(im.convert("HSV")).astype(np.float32)[..., 1].mean()
    im = ImageEnhance.Color(im).enhance(float(np.clip(92.0 / max(s, 1), 0.85, 1.12)))
    a = np.asarray(im).astype(np.float32); a[..., 0] *= 1.012; a[..., 2] *= 0.988
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


result = {}
for prop, stems in PICKS.items():
    ex = []
    for e in EXISTING[prop]:
        p = HQ + e + ".webp"
        if os.path.exists(p): ex.append(ahash(Image.open(p)))
    out = []
    for k, stem in enumerate(stems):
        src = find(stem)
        im = Image.open(src).convert("RGB")
        if any((ahash(im) != h).mean() < 0.18 for h in ex):
            print(prop, os.path.basename(src), "skipped: duplicate of an existing photo"); continue
        if im.width < 1600:
            tmp = f"/tmp/esr/lp_{prop}_{k}.png"; im.save(f"/tmp/esr/lp_{prop}_{k}_in.png")
            subprocess.run([ESR, "-i", f"/tmp/esr/lp_{prop}_{k}_in.png", "-o", tmp, "-n", "realesrgan-x4plus", "-m", "/tmp/esr/models"], check=True, capture_output=True, cwd="/tmp/esr")
            up = Image.open(tmp).convert("RGB"); tw = min(2400, im.width * 2)
            im = up.resize((tw, round(up.height * tw / up.width)), Image.LANCZOS)
        if im.width > 2400: im = im.resize((2400, round(im.height * 2400 / im.width)), Image.LANCZOS)
        if im.height > im.width * 0.9:                   # square/tall sources: crop to a 3:2 landscape frame
            th = round(im.width / 1.5); y = max(0, (im.height - th) // 2); im = im.crop((0, y, im.width, y + th))
        name = f"lp-{prop}-{len(out) + 1:02d}.webp"
        grade(im).save(HQ + name, "WEBP", quality=82, method=6)
        out.append("/assets/hq/" + name)
        print(prop, os.path.basename(src), "->", name, im.size)
    result[prop] = out
json.dump(result, open("/tmp/lpimg/final.json", "w"), indent=1)
