import base64, json, os, sys, time, urllib.request, urllib.error

KEY = open(os.path.expanduser("~/.runway_key")).read().strip()   # never printed
API = "https://api.dev.runwayml.com/v1"
HDR = {"Authorization": "Bearer " + KEY, "X-Runway-Version": "2024-11-06", "Content-Type": "application/json"}
OUT = "/tmp/runway/silverlake/"
video = "data:video/mp4;base64," + base64.b64encode(open(OUT + os.environ.get("SRC", "nb-pan.mp4"), "rb").read()).decode()

PROMPT = os.environ.get("PROMPT") or (
    "Keep the camera movement, every building, the clubhouse, pool, playground, roads, parking, trees and the lake shoreline "
    "exactly as in the input video, with the same architecture, colors and layout. Only add natural everyday life and make the "
    "lake water a clear deep blue-green with soft reflections instead of murky green. Add residents walking along the lakeside "
    "path, a couple with a stroller, a jogger, children playing at the playground, a few adults swimming and lounging at the pool, "
    "one or two cars slowly driving through the parking lots, gentle ripples on the lake, and leaves and palms moving in a light "
    "breeze. Golden-hour light. Photorealistic, stable, no morphing, no text."
)


def call(method, path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None, headers=HDR, method=method)
    try:
        return json.loads(urllib.request.urlopen(req, timeout=180).read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Runway API error {e.code} on {path}: {e.read().decode(errors='replace')[:500]}")


print(len(PROMPT), "chars")
seeds = [int(s) for s in sys.argv[1:]] or [7]
tasks = {s: call("POST", "/video_to_video", {"model": "aleph2", "videoUri": video, "promptText": PROMPT,
                                             "ratio": "1584:672", "seed": s})["id"] for s in seeds}
print("submitted", list(tasks))
t0 = time.time()
while tasks and time.time() - t0 < 1500:
    time.sleep(12)
    for s, tid in list(tasks.items()):
        r = call("GET", f"/tasks/{tid}")
        if r.get("status") == "SUCCEEDED":
            urllib.request.urlretrieve(r["output"][0], f"{OUT}{os.environ.get('OUTNAME', 'nb-aleph')}-{s}.mp4"); print("done", s); tasks.pop(s)
        elif r.get("status") in ("FAILED", "CANCELLED"):
            print("failed", s, r.get("failure"), r.get("failureCode")); tasks.pop(s)
