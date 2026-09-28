"""Daytime Aura Living hero, regenerated after the frame audit of hero-day-v2 (car morphs, phantom shadow,
people fading/ghosting). Same opening frame as hero.jpg (16:9 crop) so the still-to-video fade stays seamless.
usage: python3 runway_hero_day_v5.py seed [seed ...]   -> /tmp/runway/hero5/day-<seed>.mp4"""
import base64, io, json, os, sys, time, urllib.request, urllib.error
from PIL import Image

KEY = open(os.path.expanduser("~/.runway_key")).read().strip()   # never printed
API = "https://api.dev.runwayml.com/v1"
HDR = {"Authorization": "Bearer " + KEY, "X-Runway-Version": "2024-11-06", "Content-Type": "application/json"}
SITE = "/Users/josefigueroa/Desktop/adg-landing/public/assets/site/"
OUT = "/tmp/runway/hero5/"; os.makedirs(OUT, exist_ok=True)

PROMPT = (
    "A bright, sunny afternoon on the street in front of a new eight-story apartment building. Slow, smooth, steady cinematic camera glide. "
    "Traffic moves naturally: the light silver compact SUV in the near lane drives slowly to the right, and the grey car behind it follows at "
    "the same easy pace. Each moving car keeps exactly the same make, model, body shape and color from the first frame to the last, in even "
    "sunlight, with no shadows sweeping across it. Parked cars stay parked and unchanged, including the red coupe by the cafe. "
    "A few pedestrians walk at a relaxed, steady pace along the sidewalk and stay solid and fully visible the whole time; nobody appears, "
    "fades, disappears, merges with another person or walks into a door. Residents on balconies move subtly. Trees and palms sway gently, "
    "clouds drift slowly. The building, balconies, windows and landscaping stay rigid and unchanged. Photorealistic, natural motion, no morphing."
)

im = Image.open(SITE + "hero.jpg").convert("RGB")
tw = round(im.height * 16 / 9)
if tw <= im.width:
    x = (im.width - tw) // 2; im = im.crop((x, 0, x + tw, im.height))
else:
    th = round(im.width * 9 / 16); y = (im.height - th) // 2; im = im.crop((0, y, im.width, y + th))
buf = io.BytesIO(); im.resize((1920, 1080), Image.LANCZOS).save(buf, "JPEG", quality=93)
img = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def call(method, path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None, headers=HDR, method=method)
    try:
        return json.loads(urllib.request.urlopen(req, timeout=180).read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Runway API error {e.code} on {path}: {e.read().decode(errors='replace')[:400]}")


print(len(PROMPT), "chars", flush=True)
seeds = [int(s) for s in sys.argv[1:]] or [5]
tasks = {s: call("POST", "/image_to_video", {"model": "veo3.1", "promptImage": img, "promptText": PROMPT,
                                             "ratio": "1920:1080", "duration": 8, "seed": s, "audio": False})["id"] for s in seeds}
print("submitted", list(tasks), flush=True)
t0 = time.time()
while tasks and time.time() - t0 < 1800:
    time.sleep(15)
    for s, tid in list(tasks.items()):
        r = call("GET", f"/tasks/{tid}")
        if r.get("status") == "SUCCEEDED":
            urllib.request.urlretrieve(r["output"][0], f"{OUT}day-{s}.mp4")
            print("done", s, r["output"][0], flush=True); tasks.pop(s)
        elif r.get("status") in ("FAILED", "CANCELLED"):
            print("failed", s, r.get("failure"), r.get("failureCode"), flush=True); tasks.pop(s)
print("pending", list(tasks), flush=True)
