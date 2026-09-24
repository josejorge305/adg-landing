import base64, io, json, os, time, urllib.request, urllib.error
from PIL import Image

KEY = open(os.path.expanduser("~/.runway_key")).read().strip()   # never printed
API = "https://api.dev.runwayml.com/v1"
HDR = {"Authorization": "Bearer " + KEY, "X-Runway-Version": "2024-11-06", "Content-Type": "application/json"}
OUT = "/tmp/runway/millenium-veo/"; os.makedirs(OUT, exist_ok=True)

src = Image.open("/Users/josefigueroa/Desktop/adg-landing/public/assets/hq/alcazar-millenium.webp").convert("RGB")
tw = round(src.height * 16 / 9)
if tw <= src.width:
    x = (src.width - tw) // 2; src = src.crop((x, 0, x + tw, src.height))
src = src.resize((1920, 1080), Image.LANCZOS); src.save(OUT + "input.jpg", quality=92)
buf = io.BytesIO(); src.save(buf, "JPEG", quality=92)
img = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

PROMPT = (
    "A lively, sunny afternoon at a modern mid-rise apartment building on a city street corner. "
    "Several cars drive through the intersection and along the street, the red sports car pulls away slowly, "
    "pedestrians cross at the crosswalk and walk along the sidewalk in front of the ground-floor storefronts, "
    "the street trees sway in a light breeze and white clouds drift across the blue sky. "
    "Very slow, smooth cinematic camera push-in. The building's architecture, colors, balconies and windows remain "
    "completely unchanged and rigid; no morphing, no warping. Photorealistic, natural motion."
)


def call(method, path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None, headers=HDR, method=method)
    try:
        return json.loads(urllib.request.urlopen(req, timeout=120).read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Runway API error {e.code}: {e.read().decode(errors='replace')[:300]}")


r = call("POST", "/image_to_video", {"model": "veo3.1", "promptImage": img, "promptText": PROMPT, "ratio": "1920:1080", "duration": 8})
tid = r["id"]; print("submitted veo3.1 millenium")
t0 = time.time()
while time.time() - t0 < 1500:
    time.sleep(12)
    r = call("GET", f"/tasks/{tid}")
    if r.get("status") == "SUCCEEDED":
        urllib.request.urlretrieve(r["output"][0], OUT + "millenium.mp4"); print("done"); break
    if r.get("status") in ("FAILED", "CANCELLED"):
        print("failed", r.get("failure"), r.get("failureCode")); break
