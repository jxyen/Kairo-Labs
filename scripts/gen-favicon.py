#!/usr/bin/env python3
"""Regenerate site favicons from the new molecule-K mark.

Builds a square dark-ink icon with the emerald molecule-K centered, then writes:
  src/app/icon.png        (512px, Next downscales for the tab favicon)
  src/app/apple-icon.png  (180px, iOS home-screen)
  src/app/favicon.ico     (multi-size 16/32/48)
"""
from PIL import Image

SRC = "public/kairo-mark-new.png"
INK = (14, 21, 18, 255)   # --ink #0E1512 (brand near-black)
PAD = 0.12                # padding fraction around the mark

def make(size):
    canvas = Image.new("RGBA", (size, size), INK)
    mark = Image.open(SRC).convert("RGBA")
    box = int(size * (1 - 2 * PAD))
    # scale mark to fit inside box, preserving aspect
    scale = min(box / mark.width, box / mark.height)
    w, h = int(mark.width * scale), int(mark.height * scale)
    mark = mark.resize((w, h), Image.LANCZOS)
    canvas.alpha_composite(mark, ((size - w) // 2, (size - h) // 2))
    return canvas

make(512).save("src/app/icon.png")
make(180).convert("RGB").save("src/app/apple-icon.png")
make(256).save(
    "src/app/favicon.ico",
    sizes=[(16, 16), (32, 32), (48, 48)],
)
print("wrote icon.png, apple-icon.png, favicon.ico")
