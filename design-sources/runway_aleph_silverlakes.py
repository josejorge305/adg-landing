import base64, json, os, time, urllib.request, urllib.error

KEY = open(os.path.expanduser("~/.runway_key")).read().strip()   # never printed
API = "https://api.dev.runwayml.com/v1"
HDR = {"Authorization": "Bearer " + KEY, "X-Runway-Version": "2024-11-06", "Content-Type": "application/json"}
OUT = "/tmp/runway/"

SRC = "/Users/josefigueroa/Desktop/adg-landing/public/assets/site/slv-aerial.mp4"   # the current 1280x544 clip
video = "data:video/mp4;base64," + base64.b64encode(open(SRC, "rb").read()).decode()

PROMPT = (
    "Keep the two tall white water fountains in the lake spraying continuously exactly as in the original video, in the same positions, "
    "with the same golden backlit spray. Keep the camera movement, roofs (dark charcoal gray), beige facades, white pool loungers, lake, "
    "lawns, trees, lighting and color grading identical to the original. Only add natural everyday life: residents walking along the "
    "lakeside paths, a couple strolling, a jogger, a few people swimming and relaxing at the pool, and children at the playground."
)


def call(method, path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None, headers=HDR, method=method)
    try:
        return json.loads(urllib.request.urlopen(req, timeout=120).read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Runway API error {e.code} on {path}: {e.read().decode(errors='replace')[:400]}")


r = call("POST", "/video_to_video", {"model": "aleph2", "videoUri": video, "promptText": PROMPT, "ratio": "1584:672", "seed": 42})
tid = r["id"]; print("submitted aleph")
t0 = time.time()
while time.time() - t0 < 1200:
    time.sleep(10)
    r = call("GET", f"/tasks/{tid}")
    if r.get("status") == "SUCCEEDED":
        urllib.request.urlretrieve(r["output"][0], OUT + "slv-aleph3.mp4"); print("done"); break
    if r.get("status") in ("FAILED", "CANCELLED"):
        print("failed", r.get("failure"), r.get("failureCode")); break
