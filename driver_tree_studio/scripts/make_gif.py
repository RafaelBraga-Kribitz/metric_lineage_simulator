"""Assemble PNG frames (sorted by name) into a looping GIF. Usage: make_gif.py FRAMES_DIR OUT.gif"""
import sys
from pathlib import Path

from PIL import Image

frames_dir, out = Path(sys.argv[1]), Path(sys.argv[2])
frames = [Image.open(p).convert("RGB").resize((960, 600), Image.LANCZOS) for p in sorted(frames_dir.glob("*.png"))]
paletted = [f.quantize(colors=128, method=Image.MEDIANCUT) for f in frames]
paletted[0].save(out, save_all=True, append_images=paletted[1:], duration=2200, loop=0, optimize=True)
print(f"{out}: {len(frames)} frames, {out.stat().st_size // 1024} KiB")
