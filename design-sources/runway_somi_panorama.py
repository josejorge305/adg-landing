import base64, io, json, os, time, urllib.request, urllib.error
import numpy as np, cv2
from PIL import Image

KEY = open(os.path.expanduser("~/.runway_key")).read().strip()   # never printed
API = "https://api.dev.runwayml.com/v1"
HDR = {"Authorization": "Bearer " + KEY, "X-Runway-Version": "2024-11-06", "Content-Type": "application/json"}
D = "/tmp/somi/"

# full panorama at 1584 wide, padded top/bottom (soft extension of sky and lawn) to Runway's 1584:672 frame
pano = Image.open(D + "site_rendering.jpg").convert("RGB")
w = 1584; h = round(pano.height * w / pano.width)
pano = pano.resize((w, h), Image.LANCZOS)
top = (672 - h) // 2; bot = 672 - h - top
a = np.asarray(pano)
padded = cv2.copyMakeBorder(a, top, bot, 0, 0, cv2.BORDER_REFLECT)
band = padded.copy(); band = cv2.GaussianBlur(band, (0, 0), 9)
padded[:top] = band[:top]; padded[top + h:] = band[top + h:]
Image.fromarray(padded).save(D + "somi_input_padded.jpg", quality=94)
json.dump({"top": top, "h": h}, open(D + "somi_pad.json", "w"))
buf = io.BytesIO(); Image.fromarray(padded).save(buf, "JPEG", quality=94)
img = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

PROMPT = ("Very slow, smooth cinematic camera drift to the right along a lush tree-lined street of three new modern luxury homes. "
          "Tree branches, leaves and palm fronds sway gently in a soft breeze, white clouds drift slowly across the blue sky, "
          "a pair of seagulls glide across the sky, dappled sunlight flickers softly through the canopy. "
          "The three houses, rooflines, windows, garage doors and facades remain completely unchanged and rigid. "
          "No morphing, no warping, no new buildings, no people. Photorealistic, serene, natural.")


def call(method, path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None, headers=HDR, method=method)
    try:
        return json.loads(urllib.request.urlopen(req, timeout=120).read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Runway API error {e.code}: {e.read().decode(errors='replace')[:300]}")


r = call("POST", "/image_to_video", {"model": "gen4_turbo", "promptImage": img, "promptText": PROMPT, "ratio": "1584:672", "duration": 10})
tid = r["id"]; print("submitted", flush=True)
t0 = time.time()
while time.time() - t0 < 1200:
    time.sleep(10)
    r = call("GET", f"/tasks/{tid}")
    if r.get("status") == "SUCCEEDED":
        urllib.request.urlretrieve(r["output"][0], D + "somi_raw.mp4"); print("done", flush=True); break
    if r.get("status") in ("FAILED", "CANCELLED"):
        print("failed", r.get("failure"), r.get("failureCode"), flush=True); break
