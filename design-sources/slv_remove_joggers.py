"""Erase the two merging joggers on the center stretch of the lakeside path (Silver Lake Veo take 1), frame by frame.
Only pixels of the joggers inside a narrow band around the path are repainted from the surrounding path/lawn."""
import glob, os, sys
import cv2, numpy as np

SRC = "/tmp/runway/silverlake/full/"          # full-res frames of the 2.2-8.0 s segment
DST = "/tmp/runway/silverlake/clean/"; os.makedirs(DST, exist_ok=True)
X0, X1, Y0, Y1 = 700, 1030, 630, 810          # search window (1920x1080 coords) around the center stretch
PREVIEW = "--preview" in sys.argv

frames = sorted(glob.glob(SRC + "*.png"))
sheet = []
imgs = [cv2.imread(f) for f in frames]
masks = []
for n, f in enumerate(frames):
    img = imgs[n]; win = img[Y0:Y1, X0:X1]
    hsv = cv2.cvtColor(win, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    path = ((s < 45) & (v > 150)).astype(np.uint8)
    path = cv2.morphologyEx(path, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    # keep the path proper: the largest connected light-grey component
    num, lab, stats, _ = cv2.connectedComponentsWithStats(path)
    if num > 1:
        keep = [i for i in range(1, num) if stats[i, cv2.CC_STAT_AREA] >= 150]      # figures can split the path in two
        path = np.isin(lab, keep).astype(np.uint8)
    # a band hugging the path, extended upward (standing figures rise above the path in this oblique view)
    pathc = cv2.morphologyEx(path, cv2.MORPH_CLOSE, np.ones((7, 41), np.uint8))   # bridge where a figure hides the path
    band = cv2.dilate(pathc, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    band_up = cv2.dilate(pathc, np.ones((34, 1), np.uint8), anchor=(0, 0))
    band = ((band | band_up) > 0)
    grass = (h >= 28) & (h <= 90) & (s >= 45) & (v >= 45) & (v <= 235)
    fig = band & ~(path > 0) & ~grass
    fig = cv2.morphologyEx(fig.astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    # keep only compact blobs the size of a person
    num, lab, stats, _ = cv2.connectedComponentsWithStats(fig)
    mask = np.zeros_like(fig)
    for i in range(1, num):
        a, w_, h_ = stats[i, cv2.CC_STAT_AREA], stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT]
        if 6 <= a <= 2500 and w_ <= 80 and h_ <= 70: mask[lab == i] = 1
    # thin dark limbs next to a detected jogger read as shadowy grass: take dark pixels close to the jogger only
    if mask.any():
        near = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (45, 45))) > 0
        near2 = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (27, 27))) > 0
        mask = (mask | (near & band & (v < 85)) | (near2 & band)).astype(np.uint8)   # whole neighborhood, incl. white clothing that reads as pavement
    mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    masks.append(mask)

PAD = 40
def region(i):
    return imgs[i][Y0 - PAD:Y1 + PAD, X0 - PAD:X1 + PAD]

for n, f in enumerate(frames):
    img = imgs[n]; win = img[Y0:Y1, X0:X1]; mask = masks[n]
    tgt = cv2.cvtColor(region(n), cv2.COLOR_BGR2GRAY).astype(np.float32)
    cands, valid = [], []
    for j in range(0, len(frames), 7):
        if abs(j - n) < 40: continue
        src = cv2.cvtColor(region(j), cv2.COLOR_BGR2GRAY).astype(np.float32)
        warp = np.eye(2, 3, dtype=np.float32)
        try:
            _, warp = cv2.findTransformECC(tgt, src, warp, cv2.MOTION_AFFINE,
                                           (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 80, 1e-5), None, 5)
        except cv2.error:
            continue
        sz = (tgt.shape[1], tgt.shape[0])
        wimg = cv2.warpAffine(region(j), warp, sz, flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP)
        mj = np.zeros(tgt.shape, np.uint8); mj[PAD:-PAD, PAD:-PAD] = masks[j]
        wm = cv2.warpAffine(mj, warp, sz, flags=cv2.INTER_NEAREST + cv2.WARP_INVERSE_MAP)
        cands.append(wimg[PAD:-PAD, PAD:-PAD].astype(np.float32)); valid.append(wm[PAD:-PAD, PAD:-PAD] == 0)
    fixed = cv2.inpaint(win, mask * 255, 5, cv2.INPAINT_TELEA)
    if cands:
        C = np.stack(cands); V = np.stack(valid)[..., None]
        Cm = np.where(V, C, np.nan)
        med = np.nanmedian(Cm, axis=0)
        ok = ~np.isnan(med[..., 0])
        fill = np.where(ok[..., None], med, fixed.astype(np.float32)).astype(np.uint8)
        soft = cv2.GaussianBlur(mask.astype(np.float32), (7, 7), 0)[..., None]
        soft = np.clip(soft * 1.6, 0, 1)
        fixed = (fill * soft + win * (1 - soft)).astype(np.uint8)
    out = img.copy(); out[Y0:Y1, X0:X1] = fixed
    if PREVIEW:
        if n % 4 == 0:
            vis = win.copy(); vis[mask > 0] = (0, 0, 255)
            sheet.append(np.hstack([cv2.resize(win, None, fx=1.5, fy=1.5), cv2.resize(vis, None, fx=1.5, fy=1.5), cv2.resize(fixed, None, fx=1.5, fy=1.5)]))
    else:
        cv2.imwrite(DST + os.path.basename(f), out)
if PREVIEW:
    for i in range(0, len(sheet), 6):
        cv2.imwrite(f"/tmp/runway/silverlake/mask-{i // 6}.jpg", np.vstack(sheet[i:i + 6]), [cv2.IMWRITE_JPEG_QUALITY, 78])
print("frames", len(frames))
