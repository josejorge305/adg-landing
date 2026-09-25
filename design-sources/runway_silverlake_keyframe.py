import base64, io, json, os, sys, time, urllib.request, urllib.error
from PIL import Image

KEY = open(os.path.expanduser("~/.runway_key")).read().strip()   # never printed
API = "https://api.dev.runwayml.com/v1"
HDR = {"Authorization": "Bearer " + KEY, "X-Runway-Version": "2024-11-06", "Content-Type": "application/json"}
OUT = "/tmp/runway/silverlake/"; os.makedirs(OUT, exist_ok=True)
SITE = "/Users/josefigueroa/Desktop/adg-landing/public/assets/"


def data_uri(img, q=90):
    buf = io.BytesIO(); img.convert("RGB").save(buf, "JPEG", quality=q)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


# references: the current aerial (layout) and the front elevation (architecture), cropped to <=2.3:1
layout = Image.open(os.environ.get("LAYOUT", "/tmp/slv/full-0.2.jpg")).convert("RGB")
if layout.width / layout.height > 2.3: layout = layout.crop((6, 0, layout.width - 6, layout.height))
elev = Image.open(os.environ.get("ELEV", SITE + "hq/slv-front.webp")).convert("RGB")
w = int(elev.height * 2.2); x = (elev.width - w) // 2; elev = elev.crop((x, 0, x + w, elev.height))

PROMPT = os.environ.get("PROMPT") or (
    "The same aerial photo as @layout with the exact same composition, camera, lake, path, clubhouse, fenced pool, playground, "
    "trees and people. Change only the two apartment buildings on the left so that all five buildings share one identical facade, "
    "the facade of @elevation: white and grey board-and-batten siding, soft peach accent panels, stacked balconies with dark railings, "
    "stone base, charcoal roofs. Make the lake fountain smaller, about half its height. "
    "Clear golden-hour light with less haze, crisp detail, no text."
)
print(len(PROMPT), "chars")


def call(method, path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None, headers=HDR, method=method)
    try:
        return json.loads(urllib.request.urlopen(req, timeout=120).read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Runway API error {e.code} on {path}: {e.read().decode(errors='replace')[:400]}")


refs = ([] if os.environ.get("NOLAYOUT") else [{"uri": data_uri(layout), "tag": "layout"}]) + [{"uri": data_uri(elev), "tag": "elevation"}]
seeds = [int(s) for s in sys.argv[1:]] or [11, 29]
tasks = {}
for seed in seeds:
    r = call("POST", "/text_to_image", {"model": "gen4_image", "promptText": PROMPT, "ratio": "1920:1080",
                                        "referenceImages": refs, "seed": seed})
    tasks[seed] = r["id"]; print("submitted keyframe seed", seed)

pending = dict(tasks); t0 = time.time()
while pending and time.time() - t0 < 900:
    time.sleep(8)
    for seed, tid in list(pending.items()):
        r = call("GET", f"/tasks/{tid}")
        if r.get("status") == "SUCCEEDED":
            urllib.request.urlretrieve(r["output"][0], f"{OUT}key-{os.environ.get('TAG', '')}{seed}.png"); print("done seed", seed); pending.pop(seed)
        elif r.get("status") in ("FAILED", "CANCELLED"):
            print("failed seed", seed, r.get("failure"), r.get("failureCode")); pending.pop(seed)
