import base64, io, json, os, sys, time, urllib.request, urllib.error
from PIL import Image

KEY_FILE = os.path.expanduser("~/.runway_key")
KEY = open(KEY_FILE).read().strip()          # never printed or logged
API = "https://api.dev.runwayml.com/v1"
HDR = {"Authorization": "Bearer " + KEY, "X-Runway-Version": "2024-11-06", "Content-Type": "application/json"}
HQ = "/Users/josefigueroa/Desktop/adg-landing/public/assets/hq/"
OUT = "/tmp/runway/"; os.makedirs(OUT, exist_ok=True)

GUARD = ("The building's architecture, facade, balconies, windows and rooflines remain completely unchanged, rigid and static. "
         "No morphing, no warping, no new structures, no people appearing. Photorealistic, stable, cinematic.")
JOBS = [
    ("aura-living", "aura-living-render-4.webp", "1280:720",
     "Very slow cinematic dolly-in toward the apartment building at dusk. Clouds drift slowly across the sunset sky, palm fronds sway gently in a light breeze, warm window lights glow steadily. " + GUARD),
    ("alcazar-millenium", "alcazar-millenium.webp", "1104:832",
     "Very slow cinematic push-in toward the building on a bright day. Soft white clouds drift slowly across the blue sky, street trees sway gently in a light breeze. " + GUARD),
    ("alcazar-villas", "alcazar-villas-aerial.webp", "1104:832",
     "Very slow aerial drone glide forward over the apartment community on a sunny day. Palm trees sway gently, the pool water shimmers softly, soft cloud shadows pass slowly over the ground. " + GUARD),
]


def call(method, path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None, headers=HDR, method=method)
    try:
        return json.loads(urllib.request.urlopen(req, timeout=60).read())
    except urllib.error.HTTPError as e:
        msg = e.read().decode(errors="replace")[:400]
        raise SystemExit(f"Runway API error {e.code} on {path}: {msg}")


def prep(src, ratio):
    w, h = map(int, ratio.split(":"))
    im = Image.open(HQ + src).convert("RGB")
    target = w / h
    if im.width / im.height > target:                      # crop to the requested ratio, centered
        nw = int(im.height * target); x = (im.width - nw) // 2; im = im.crop((x, 0, x + nw, im.height))
    else:
        nh = int(im.width / target); y = (im.height - nh) // 2; im = im.crop((0, y, im.width, y + nh))
    im = im.resize((w, h), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=90)
    im.save(OUT + src.replace(".webp", "-input.jpg"), quality=90)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


only = sys.argv[1:]  # optional: regenerate specific clips by name
tasks = {}
for name, src, ratio, prompt in JOBS:
    if only and name not in only:
        continue
    r = call("POST", "/image_to_video", {"model": "gen4_turbo", "promptImage": prep(src, ratio), "promptText": prompt[:1000], "ratio": ratio, "duration": 5})
    tasks[name] = r["id"]
    print("submitted", name)

pending = dict(tasks)
t0 = time.time()
while pending and time.time() - t0 < 900:
    time.sleep(10)
    for name, tid in list(pending.items()):
        r = call("GET", f"/tasks/{tid}")
        st = r.get("status")
        if st == "SUCCEEDED":
            url = r["output"][0]
            urllib.request.urlretrieve(url, OUT + name + ".mp4")
            print("done", name, os.path.getsize(OUT + name + ".mp4") // 1024, "KB")
            pending.pop(name)
        elif st in ("FAILED", "CANCELLED"):
            print("failed", name, r.get("failure") or r.get("failureCode"))
            pending.pop(name)
print("pending after wait:", list(pending))
