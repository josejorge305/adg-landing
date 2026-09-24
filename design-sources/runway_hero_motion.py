import base64, io, json, os, sys, time, urllib.request, urllib.error
from PIL import Image

KEY = open(os.path.expanduser("~/.runway_key")).read().strip()   # never printed
API = "https://api.dev.runwayml.com/v1"
HDR = {"Authorization": "Bearer " + KEY, "X-Runway-Version": "2024-11-06", "Content-Type": "application/json"}
SITE = "/Users/josefigueroa/Desktop/adg-landing/public/assets/site/"
OUT = "/tmp/runway/hero/"; os.makedirs(OUT, exist_ok=True)

STILL = ("Locked-off tripod shot: the camera does not move, pan, tilt or zoom at all. "
         "The building's architecture, facade, balconies, railings and windows remain completely unchanged and rigid. "
         "No morphing, no warping, no new structures. Photorealistic, calm, peaceful, serene, natural slow motion.")
JOBS = {
    "day": ("hero.jpg",
            "A serene, peaceful late afternoon at a new apartment community. Soft white clouds drift very slowly across the blue sky. "
            "Palm fronds and street trees sway gently in a soft breeze. On a few balconies, residents move subtly and naturally, "
            "as if in relaxed conversation. A couple walks slowly along the sidewalk and one car drives slowly past. " + STILL),
    "dusk": ("hero-dusk.jpg",
             "A serene, peaceful dusk at a new apartment community. Pink and violet sunset clouds drift very slowly across the sky. "
             "Warm window lights glow steadily and one or two more windows softly light up. On a few balconies, silhouetted residents "
             "move gently as if in quiet conversation. Palm fronds sway softly in the evening breeze, and a car's headlights pass slowly "
             "along the street. " + STILL),
}


def crop169(src):
    im = Image.open(SITE + src).convert("RGB")
    tw = round(im.height * 16 / 9)
    if tw <= im.width:
        x = (im.width - tw) // 2; im = im.crop((x, 0, x + tw, im.height))
    else:
        th = round(im.width * 9 / 16); y = (im.height - th) // 2; im = im.crop((0, y, im.width, y + th))
    return im


def call(method, path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None, headers=HDR, method=method)
    try:
        return json.loads(urllib.request.urlopen(req, timeout=120).read())
    except urllib.error.HTTPError as e:
        return {"__error__": e.code, "msg": e.read().decode(errors="replace")[:500]}


tasks = {}
for name, (src, prompt) in JOBS.items():
    im = crop169(src)
    im.save(OUT + f"{name}-still-169.jpg", quality=92)            # the exact frame the video starts from
    buf = io.BytesIO(); im.resize((1920, 1080), Image.LANCZOS).save(buf, "JPEG", quality=92)
    data = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    r = call("POST", "/image_to_video", {"model": "veo3.1", "promptImage": data, "promptText": prompt[:1000], "ratio": "1920:1080", "duration": 8})
    if "__error__" in r:
        print(name, "veo3.1 rejected:", r["msg"][:300])
        r = call("POST", "/image_to_video", {"model": "gen4_turbo", "promptImage": data, "promptText": prompt[:1000], "ratio": "1280:720", "duration": 10})
        if "__error__" in r:
            print(name, "gen4_turbo rejected too:", r["msg"][:300]); continue
        print(name, "submitted with gen4_turbo (fallback)")
    else:
        print(name, "submitted with veo3.1")
    tasks[name] = r["id"]

t0 = time.time()
while tasks and time.time() - t0 < 1500:
    time.sleep(12)
    for name, tid in list(tasks.items()):
        r = call("GET", f"/tasks/{tid}")
        st = r.get("status")
        if st == "SUCCEEDED":
            urllib.request.urlretrieve(r["output"][0], OUT + name + ".mp4"); print("done", name); tasks.pop(name)
        elif st in ("FAILED", "CANCELLED"):
            print("failed", name, r.get("failure"), r.get("failureCode")); tasks.pop(name)
print("still pending:", list(tasks))
