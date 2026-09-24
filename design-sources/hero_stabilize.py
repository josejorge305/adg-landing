import cv2, numpy as np, subprocess, sys

# Tripod-lock a clip to its first frame using the building (facade features), then crop in to hide warped edges.
name = sys.argv[1]
SRC = f"/tmp/runway/hero/{name}.mp4"
OUT = f"/tmp/runway/hero/{name}-locked.mp4"
cap = cv2.VideoCapture(SRC)
W, H = int(cap.get(3)), int(cap.get(4)); fps = cap.get(5) or 24
frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
sift = cv2.SIFT_create(nfeatures=3000)
mask = np.zeros((H, W), np.uint8); mask[int(H * 0.12): int(H * 0.8), :] = 255      # facade band: skip upper sky and the street
g0 = cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY)
k0, d0 = sift.detectAndCompute(g0, mask)
bf = cv2.BFMatcher(cv2.NORM_L2)
Hs = [np.eye(3)]
for f in frames[1:]:
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
    k, d = sift.detectAndCompute(g, mask)
    m = [a for a, b in bf.knnMatch(d, d0, k=2) if a.distance < 0.72 * b.distance]
    src = np.float32([k[x.queryIdx].pt for x in m]); dst = np.float32([k0[x.trainIdx].pt for x in m])
    Hm, inl = cv2.findHomography(src, dst, cv2.RANSAC, 2.0)
    Hs.append(Hm if Hm is not None else Hs[-1])
# smooth the per-frame transforms slightly over time to remove jitter
Hs = np.array(Hs); sm = Hs.copy()
for i in range(len(Hs)):
    lo, hi = max(0, i - 2), min(len(Hs), i + 3); sm[i] = Hs[lo:hi].mean(axis=0)
need = 1.0
Z = np.eye(3)
ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
                       "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p", "-an", OUT], stdin=subprocess.PIPE)
warped = []
for f, Hm in zip(frames, sm):
    w = cv2.warpPerspective(f, Hm, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT)
    srcmask = np.zeros((H, W), np.float32); srcmask[24:H - 24, 24:W - 24] = 1   # ignore the generated frame's own thin border
    valid = cv2.warpPerspective(srcmask, Hm, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    valid = cv2.erode(valid, np.ones((71, 71), np.uint8))
    valid = cv2.GaussianBlur(valid, (0, 0), 38)[..., None]
    # exposed edges are filled from the first frame (the camera is now locked to it), feathered
    w = (w.astype(np.float32) * valid + frames[0].astype(np.float32) * (1 - valid)).clip(0, 255).astype(np.uint8)
    ff.stdin.write(w.tobytes()); warped.append(w)
ff.stdin.close(); ff.wait()
np.save(f"/tmp/runway/hero/{name}-zoom.npy", np.array([need]))
# residual motion of the building after locking (first vs last frame)
a = cv2.cvtColor(warped[0], cv2.COLOR_BGR2GRAY).astype(np.float32)[int(H * .2):int(H * .75)]
b = cv2.cvtColor(warped[-1], cv2.COLOR_BGR2GRAY).astype(np.float32)[int(H * .2):int(H * .75)]
(dx, dy), _ = cv2.phaseCorrelate(a, b)
print(f"{name}: frames {len(frames)}, crop-in {need:.3f}x, residual building drift ({dx:.1f}, {dy:.1f}) px")
cv2.imwrite(f"/tmp/runway/hero/{name}-locked_first.jpg", warped[0]); cv2.imwrite(f"/tmp/runway/hero/{name}-locked_last.jpg", warped[-1])
