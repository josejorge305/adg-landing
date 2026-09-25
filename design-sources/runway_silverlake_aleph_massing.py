import base64, io, json, os, sys, time, urllib.request, urllib.error
from PIL import Image

KEY = open(os.path.expanduser("~/.runway_key")).read().strip()   # never printed
API = "https://api.dev.runwayml.com/v1"
HDR = {"Authorization": "Bearer " + KEY, "X-Runway-Version": "2024-11-06", "Content-Type": "application/json"}
OUT = "/tmp/runway/silverlake/"; os.makedirs(OUT, exist_ok=True)
BX = "/Users/josefigueroa/Library/CloudStorage/Box-Box/Aura Living/002 Aura at Silver Lake/002 Architecture/"
STYLES = {"beige": BX + "2026-02-04 - Aura at Silver Lake - Apartments - SD Package/SLV Rendering.png",
          "peach": BX + "Aura at Silver Lakes rendering.png"}
video = "data:video/mp4;base64," + base64.b64encode(open("/tmp/slvplan/massing-fly.mp4", "rb").read()).decode()

PROMPT = (
    "Transform this 3D massing model into a photorealistic aerial drone video of a new garden-style apartment community "
    "in Central Florida. Keep every building, its position, size and orientation, the roads, the lake shoreline and the camera "
    "movement exactly as in the input. The eight long three-story buildings become finished apartment buildings with the "
    "architecture PALETTE, stone-veneer base, stacked balconies with dark "
    "railings, gabled bays, charcoal shingle hip roofs. The small building near the lake is a one-story clubhouse with a fenced "
    "pool. Grey areas become asphalt drives and parking with parked cars. Green areas become manicured lawns with young trees and "
    "a walking path along the lake with a few people walking. The checkered background becomes dense oak and pine forest. "
    "Calm lake with soft reflections. Golden-hour light, clear sky. Photorealistic, sharp, stable, no text."
)


def data_uri(path):
    im = Image.open(path).convert("RGB"); w = int(im.height * 1.95)
    if im.width > w: x = (im.width - w) // 2; im = im.crop((x, 0, x + w, im.height))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=90)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def call(method, path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None, headers=HDR, method=method)
    try:
        return json.loads(urllib.request.urlopen(req, timeout=180).read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Runway API error {e.code} on {path}: {e.read().decode(errors='replace')[:500]}")


print(len(PROMPT), "chars")
tasks = {}
for name in (sys.argv[1:] or STYLES):
    pal = {"beige": "warm beige lap siding with cream board-and-batten panels and cream trim",
           "peach": "white and light-grey board-and-batten siding with soft peach accent panels and white trim"}[name]
    body = {"model": "aleph2", "videoUri": video, "promptText": PROMPT.replace("PALETTE", pal), "ratio": "1280:720", "seed": 7}
    tasks[name] = call("POST", "/video_to_video", body)["id"]; print("submitted", name)
t0 = time.time()
while tasks and time.time() - t0 < 1500:
    time.sleep(12)
    for name, tid in list(tasks.items()):
        r = call("GET", f"/tasks/{tid}")
        if r.get("status") == "SUCCEEDED":
            urllib.request.urlretrieve(r["output"][0], f"{OUT}aleph-{name}.mp4"); print("done", name); tasks.pop(name)
        elif r.get("status") in ("FAILED", "CANCELLED"):
            print("failed", name, r.get("failure"), r.get("failureCode")); tasks.pop(name)
