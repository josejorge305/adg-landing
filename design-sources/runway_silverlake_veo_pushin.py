import base64, json, os, sys, time, urllib.request, urllib.error

KEY = open(os.path.expanduser("~/.runway_key")).read().strip()   # never printed
API = "https://api.dev.runwayml.com/v1"
HDR = {"Authorization": "Bearer " + KEY, "X-Runway-Version": "2024-11-06", "Content-Type": "application/json"}
OUT = "/tmp/runway/silverlake/"
img = "data:image/jpeg;base64," + base64.b64encode(open(OUT + os.environ.get("KEYF", "veo-key.jpg"), "rb").read()).decode()

PROMPT = os.environ.get("PROMPT") or (
    "Cinematic aerial drone shot, slow smooth push-in and gentle descent toward the clubhouse and the resort pool in the center of "
    "the frame. In the lake in the foreground, two tall decorative fountains spray water high into the air, one on the left and one "
    "on the right, framing the clubhouse and pool; the camera flies forward between them. Residents walk and jog along the "
    "lakeside path, children play at the playground, a few people swim and relax at the pool, the lake ripples around the "
    "fountains, trees and palms sway in a light breeze. Warm golden-hour light, clear blue lake water. The apartment buildings, "
    "roofs, clubhouse, parking and layout stay exactly as in the image, completely rigid, no morphing. Photorealistic."
)


def call(method, path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None, headers=HDR, method=method)
    try:
        return json.loads(urllib.request.urlopen(req, timeout=180).read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Runway API error {e.code} on {path}: {e.read().decode(errors='replace')[:500]}")


print(len(PROMPT), "chars", flush=True)
seeds = [int(s) for s in sys.argv[1:]] or [3]
tasks = {s: call("POST", "/image_to_video", {"model": "veo3.1", "promptImage": img, "promptText": PROMPT,
                                             "ratio": "1920:1080", "duration": 8, "seed": s})["id"] for s in seeds}
print("submitted", list(tasks), flush=True)
t0 = time.time()
while tasks and time.time() - t0 < 1800:
    time.sleep(15)
    for s, tid in list(tasks.items()):
        r = call("GET", f"/tasks/{tid}")
        if r.get("status") == "SUCCEEDED":
            urllib.request.urlretrieve(r["output"][0], f"{OUT}{os.environ.get('OUTNAME', 'veo')}-{s}.mp4"); print("done", s, flush=True); tasks.pop(s)
        elif r.get("status") in ("FAILED", "CANCELLED"):
            print("failed", s, r.get("failure"), r.get("failureCode"), flush=True); tasks.pop(s)
