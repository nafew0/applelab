#!/usr/bin/env python3
"""Build the homepage scroll-film frames from the hero keyframes and video clips.

Inputs (local-only, never committed — research/ stays out of git):
    research/keyframes for hero video/keyframe1.png … keyframe12.png   (1536x1024)
    research/keyframes for hero video/clip1.mp4   keyframe 1 -> ~3 (coming apart)
    research/keyframes for hero video/clip2.mp4   keyframe 8 -> 11 (coming together)
A missing clip is fine: the film cross-fades the keyframes it would have covered.

Outputs:
    public/applelab/film/*.webp
    src/components/applelab/film-manifest.json

The clips come back from the video model reframed (scaled, padded, shifted) and
darker than the keyframes. Each clip is aligned to its start keyframe and
colour-matched to it, then everything is cut to one shared frame so the
video-to-still cross-fades line up.

Usage (from frontend/):  python3 scripts/build_hero_film.py
Needs ffmpeg on PATH, Pillow and numpy.
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

FRONTEND = Path(__file__).resolve().parent.parent
SRC_DIR = FRONTEND.parent / "research" / "keyframes for hero video"
OUT_DIR = FRONTEND / "public" / "applelab" / "film"
MANIFEST = FRONTEND / "src" / "components" / "applelab" / "film-manifest.json"
PUBLIC_PREFIX = "/applelab/film"

KF_SIZE = (1536, 1024)
# The shared frame, in keyframe pixels: the region every clip also covers.
CANON = (0, 12, 1536, 932)
VIDEO_OUT = (1188, 712)  # clip frames keep ~native resolution; same aspect as CANON
STEP = 2  # keep every 2nd video frame (12 fps from 24 fps)

CLIPS = {
    # "then": the keyframe the clip's last frame fades into. The clips stop short of
    # (clip 1) or roughly at (clip 2) their end keyframe, so the still steps in.
    "apart": {"file": "clip1.mp4", "start_kf": 1, "then": 3, "fallback": [2, 3]},
    "together": {"file": "clip2.mp4", "start_kf": 8, "then": 11, "fallback": [9, 10, 11]},
}


def gray(im: Image.Image) -> np.ndarray:
    return np.asarray(im.convert("L").filter(ImageFilter.GaussianBlur(1)), dtype=np.float32)


def watermark_mask(h: int, w: int, y0: int, x0: int, shape: tuple[int, int]) -> np.ndarray:
    """True where pixels count; drops the bottom-right corner where the model's badge sits."""
    m = np.ones(shape, bool)
    m[max(0, int(h * 0.85) - y0):, max(0, int(w * 0.80) - x0):] = False
    return m


def align(kf: Image.Image, frame: Image.Image) -> tuple[float, float, float]:
    """Scale s and offset (dx, dy) such that the keyframe scaled by s at (dx, dy) matches the frame."""

    def search(d, scales, dxs, dys):
        c = gray(frame.resize((frame.width // d, frame.height // d), Image.LANCZOS))
        h, w = c.shape
        best = (float("inf"), None)
        for s in scales:
            k = gray(kf.resize((round(KF_SIZE[0] * s / d), round(KF_SIZE[1] * s / d)), Image.LANCZOS))
            kh, kw = k.shape
            for dx in dxs:
                for dy in dys:
                    x0, y0 = max(0, dx), max(0, dy)
                    x1, y1 = min(w, dx + kw), min(h, dy + kh)
                    if x1 - x0 < w * 0.6 or y1 - y0 < h * 0.6:
                        continue
                    a = c[y0:y1, x0:x1]
                    b = k[y0 - dy:y1 - dy, x0 - dx:x1 - dx]
                    err = float(np.mean(np.abs(a - b)[watermark_mask(h, w, y0, x0, a.shape)]))
                    if err < best[0]:
                        best = (err, (s, dx * d, dy * d))
        return best

    _, (s, dx, dy) = search(4, np.arange(0.66, 1.0, 0.005), range(-40, 50, 2), range(-40, 30, 2))
    err, (s, dx, dy) = search(
        2, np.arange(s - 0.006, s + 0.0061, 0.001), range(dx // 2 - 5, dx // 2 + 6), range(dy // 2 - 5, dy // 2 + 6)
    )
    print(f"    aligned: scale={s:.4f} offset=({dx},{dy}) err={err:.1f}")
    return s, dx, dy


def colour_fit(kf: Image.Image, frame: Image.Image, s: float, dx: float, dy: float) -> np.ndarray:
    """Per-channel lookup tables that give the clip the keyframe's tonal distribution.

    Matching percentiles rather than fitting pixel pairs, because pixel pairs
    never line up perfectly between a keyframe and the video model's re-render.
    """
    fr = np.asarray(frame.convert("RGB"), dtype=np.float32)
    k = np.asarray(
        kf.convert("RGB").resize((round(KF_SIZE[0] * s), round(KF_SIZE[1] * s)), Image.LANCZOS), dtype=np.float32
    )
    h, w = fr.shape[:2]
    x0, y0 = max(0, dx), max(0, dy)
    x1, y1 = min(w, dx + k.shape[1]), min(h, dy + k.shape[0])
    a, b = fr[y0:y1, x0:x1], k[y0 - dy:y1 - dy, x0 - dx:x1 - dx]
    m = watermark_mask(h, w, y0, x0, a.shape[:2])
    qs = [1, 5, 10, 25, 50, 75, 90, 95, 99]
    luts = np.zeros((3, 256), np.uint8)
    for ch in range(3):
        src_q = np.percentile(a[..., ch][m], qs)
        dst_q = np.percentile(b[..., ch][m], qs)
        src_pts = np.concatenate([[0], np.maximum.accumulate(src_q + np.arange(len(qs)) * 1e-3), [255]])
        dst_pts = np.concatenate([[0], np.maximum.accumulate(dst_q), [255]])
        luts[ch] = np.clip(np.interp(np.arange(256), src_pts, dst_pts), 0, 255).round().astype(np.uint8)
    mid = [int(luts[ch][128]) for ch in range(3)]
    print(f"    colour: mid-grey 128 -> {mid}")
    return luts


def save_webp(im: Image.Image, name: str, quality: int) -> str:
    im.save(OUT_DIR / name, "WEBP", quality=quality, method=6)
    return f"{PUBLIC_PREFIX}/{name}"


def keyframe(n: int) -> Image.Image:
    return Image.open(SRC_DIR / f"keyframe{n}.png").convert("RGB")


def still(n: int, quality: int = 80) -> str:
    return save_webp(keyframe(n).crop(CANON), f"kf{n:02d}.webp", quality)


def clip_frames(section: str, spec: dict) -> list[str] | None:
    path = SRC_DIR / spec["file"]
    if not path.exists():
        print(f"  {spec['file']} not found -> keyframes {spec['fallback']} as stills")
        return None
    print(f"  {spec['file']}")
    count = int(
        subprocess.check_output(
            ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
             "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", str(path)],
            text=True,
        ).strip()
    )
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(path), "-vf", f"select='not(mod(n\\,{STEP}))+eq(n\\,{count - 1})'",
             "-fps_mode", "passthrough", f"{tmp}/%04d.png"],
            check=True,
        )
        files = sorted(Path(tmp).glob("*.png"))
        first = Image.open(files[0]).convert("RGB")
        start = keyframe(spec["start_kf"])
        s, dx, dy = align(start, first)
        luts = colour_fit(start, first, s, dx, dy)
        box = (dx + CANON[0] * s, dy + CANON[1] * s, dx + CANON[2] * s, dy + CANON[3] * s)
        prefix = "a" if section == "apart" else "b"
        srcs = []
        for i, f in enumerate(files):
            fr = Image.open(f).convert("RGB").transform(VIDEO_OUT, Image.EXTENT, box, Image.BICUBIC)
            px = np.asarray(fr).copy()
            for ch in range(3):
                px[..., ch] = luts[ch][px[..., ch]]
            srcs.append(save_webp(Image.fromarray(px), f"{prefix}{i:03d}.webp", 72))
        print(f"    {len(srcs)} frames")
        return srcs


def safe_box() -> dict:
    """The laptop's extent across every keyframe, in shared-frame pixels.

    Measured on a coordinate grid: widest point is the base in keyframe 1
    (x 320-1215), the exploded display reaches y 10 and the bottom case y 880.
    Re-measure if the keyframes are regenerated. The hands (6-7) are allowed
    to run off the edge.
    """
    return {"x": 300, "y": 0, "w": 936, "h": 900}


def edge_colours() -> dict:
    a = np.asarray(keyframe(1).crop(CANON), dtype=np.float32)
    top = a[:24].reshape(-1, 3).mean(0)
    bottom = a[-24:].reshape(-1, 3).mean(0)
    to_hex = lambda c: "#" + "".join(f"{int(round(v)):02x}" for v in c)
    return {"top": to_hex(top), "bottom": to_hex(bottom)}


def main() -> None:
    if not SRC_DIR.exists():
        sys.exit(f"Missing inputs: {SRC_DIR}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("*.webp"):
        old.unlink()

    entries: list[dict] = []

    def add(src: str, section: str, weight: float, hold: float) -> None:
        entries.append({"src": src, "section": section, "weight": weight, "hold": hold})

    def add_clip_or_stills(section: str) -> None:
        spec = CLIPS[section]
        frames = clip_frames(section, spec)
        if frames is None:
            for n in spec["fallback"]:
                add(still(n), section, 8, 0.45)
            return
        for src in frames[:-1]:
            add(src, section, 1, 0)
        # the clip's last frame lingers, so the fade into the next still is unhurried
        add(frames[-1], section, 5, 0.3)
        add(still(spec["then"]), section, 7, 0.4)

    print("Building hero film")
    add(still(1, 85), "intro", 6, 0.55)
    add_clip_or_stills("apart")
    add(still(4), "exploded", 9, 0.45)
    add(still(5), "out", 9, 0.45)
    add(still(6), "hands", 9, 0.45)
    add(still(7), "hands", 9, 0.45)
    add(still(8), "renewed", 7, 0.45)
    add_clip_or_stills("together")
    add(still(12, 85), "awake", 8, 1)

    manifest = {
        "width": CANON[2] - CANON[0],
        "height": CANON[3] - CANON[1],
        "safe": safe_box(),
        "background": edge_colours(),
        "entries": entries,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    total = sum(p.stat().st_size for p in OUT_DIR.glob("*.webp"))
    print(f"{len(entries)} entries, {total / 1e6:.2f} MB -> {OUT_DIR.relative_to(FRONTEND)}")
    print(f"safe box {manifest['safe']}  background {manifest['background']}")


if __name__ == "__main__":
    main()
