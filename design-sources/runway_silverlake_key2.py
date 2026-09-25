import base64, io, json, os, sys, time, urllib.request, urllib.error
from PIL import Image

KEY = open(os.path.expanduser("~/.runway_key")).read().strip()   # never printed
API = "https://api.dev.runwayml.com/v1"
HDR = {"Authorization": "Bearer " + KEY, "X-Runway-Version": "2024-11-06", "Content-Type": "application/json"}
OUT = "/tmp/runway/silverlake/"


def uri(path, crop_w=0):
    im = Image.open(path).convert("RGB")
    if crop_w: im = im.crop((crop_w, 0, im.width - crop_w, im.height))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=92)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


refs = [{"uri": uri(OUT + "veo2-key.jpg"), "tag": "site"}, {"uri": uri(OUT + "orig-full.png", 4), "tag": "angle"}]
PROMPT = os.environ.get("PROMPT") or (
    "Photorealistic aerial drone photo of the exact apartment community in @site: same buildings, same beige facades and "
    "charcoal roofs, same clubhouse, pool, playground, parking and lakeside path, in the same arrangement. "
    "Shown from the low camera angle and with the lighting of @angle: drone low over the lake, looking toward the clubhouse "
    "and pool in the center, forest and hazy golden sky on the horizon, warm backlit golden-hour glow. "
    "In the lake in the foreground, two light, misty decorative fountains, one left and one right, framing the clubhouse. "
    "A few people walking on the lakeside path. Sharp detail, no text."
)
seeds = [int(s) for s in sys.argv[1:]] or [7, 31]
tasks = {}
for s in seeds:
    body = {"model": "gen4_image", "promptText": PROMPT, "ratio": "1920:1080", "referenceImages": refs, "seed": s}
    req = urllib.request.Request(API + "/text_to_image", data=json.dumps(body).encode(), headers=HDR, method="POST")
    try:
        tasks[s] = json.loads(urllib.request.urlopen(req, timeout=180).read())["id"]
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Runway error {e.code}: {e.read().decode(errors='replace')[:400]}")
print("submitted", list(tasks), len(PROMPT), flush=True)
t0 = time.time()
while tasks and time.time() - t0 < 900:
    time.sleep(8)
    for s, tid in list(tasks.items()):
        r = json.loads(urllib.request.urlopen(urllib.request.Request(API + f"/tasks/{tid}", headers=HDR), timeout=60).read())
        if r.get("status") == "SUCCEEDED":
            urllib.request.urlretrieve(r["output"][0], f"{OUT}key2-{s}.png"); print("done", s, flush=True); tasks.pop(s)
        elif r.get("status") in ("FAILED", "CANCELLED"):
            print("failed", s, r.get("failure"), flush=True); tasks.pop(s)
