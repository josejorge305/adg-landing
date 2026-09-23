import cv2, numpy as np, subprocess

A = "/tmp/runway/slv-aleph2.mp4"   # correct colors + people, fountains missing
O = "/Users/josefigueroa/Desktop/adg-landing/public/images_tmp_placeholder"
O = "/Users/josefigueroa/Desktop/adg-landing/public/assets/images/website/SLV Aerial.mp4"   # original with fountains
OUT = "/tmp/runway/slv-final.mp4"

ca, co = cv2.VideoCapture(A), cv2.VideoCapture(O)
W, H = int(ca.get(3)), int(ca.get(4)); fps = ca.get(5) or 24
n = int(min(ca.get(7), co.get(7)))
ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
                       "-vf", "scale=1280:-2,format=yuv420p", "-c:v", "libx264", "-crf", "24", "-preset", "slow", "-an", "-movflags", "+faststart", OUT],
                      stdin=subprocess.PIPE)
yy = np.linspace(0, 1, H)[:, None]
lower = np.clip((yy - 0.38) / 0.12, 0, 1)          # fountains live in the lake, the lower part of the frame
shifts = []
for i in range(n):
    oka, fa = ca.read(); oko, fo = co.read()
    if not (oka and oko): break
    fo = cv2.resize(fo, (W, H), interpolation=cv2.INTER_CUBIC)
    ga = cv2.cvtColor(fa, cv2.COLOR_BGR2GRAY).astype(np.float32)
    go = cv2.cvtColor(fo, cv2.COLOR_BGR2GRAY).astype(np.float32)
    # align the original to the edited frame (they share the camera move; correct any small drift)
    (dx, dy), _ = cv2.phaseCorrelate(go[: int(H * 0.5)], ga[: int(H * 0.5)])
    shifts.append((dx, dy))
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    fo = cv2.warpAffine(fo, M, (W, H), borderMode=cv2.BORDER_REPLICATE)
    go = cv2.warpAffine(go, M, (W, H), borderMode=cv2.BORDER_REPLICATE)
    # fountain spray: much brighter in the original than in the edited frame, in the lake area
    m = np.clip((go - ga - 22) / 45, 0, 1) * lower[:, 0][:, None] if False else np.clip((go - ga - 22) / 45, 0, 1) * lower
    m = cv2.dilate(m.astype(np.float32), np.ones((9, 9), np.uint8))
    m = cv2.GaussianBlur(m, (0, 0), 6)[..., None]
    out = fa.astype(np.float32) * (1 - m) + fo.astype(np.float32) * m
    ff.stdin.write(np.clip(out, 0, 255).astype(np.uint8).tobytes())
    if i in (12, 60, 110):
        cv2.imwrite(f"/tmp/runway/slv-final_{i}.jpg", np.clip(out, 0, 255).astype(np.uint8))
ff.stdin.close(); ff.wait()
sh = np.array(shifts)
print("frames", len(shifts), "| max alignment shift px:", np.abs(sh).max(axis=0).round(1))
