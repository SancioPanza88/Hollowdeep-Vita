#!/usr/bin/env python3
"""Generate the Vita icon and LiveArea art (pure stdlib PNG writer).

The art is drawn from the game's own palette: a lantern under the village,
gold on near-black, with a faint ember glow.
"""
import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "vita", "sce_sys")

BG = (11, 8, 16)
GOLD = (224, 164, 58)
GOLD_HI = (255, 217, 138)
GOLD_LO = (168, 100, 26)
RED = (120, 14, 22)
PAPER = (242, 230, 201)


def write_png(path, w, h, pixels, alpha=False):
    """Write an 8-bit PNG. Pixels are (r, g, b) tuples, or (r, g, b, a) when
    alpha is set.

    The Vita's package installer rejects icon0.png with an alpha channel
    (error 0x8010113D), and every channel count here must match the pixels we
    actually emit or the file is a malformed PNG.
    """
    bpp = 4 if alpha else 3
    color_type = 6 if alpha else 2
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            px = pixels[y * w + x]
            raw.extend(px[:bpp] if len(px) >= bpp else tuple(px) + (255,) * (bpp - len(px)))
    if len(raw) != h * (1 + w * bpp):
        raise ValueError("pixel buffer does not match %dx%d" % (w, h))

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data +
                struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    packed = zlib.compress(bytes(raw), 9)
    # Round-trip check: a mismatch between IHDR and the row bytes is invisible
    # to the writer but fatal to Sony's installer.
    if len(zlib.decompress(packed)) != len(raw):
        raise ValueError("png payload mismatch")
    png = (b"\x89PNG\r\n\x1a\n" +
           chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, color_type, 0, 0, 0)) +
           chunk(b"IDAT", packed) +
           chunk(b"IEND", b""))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(png)


def blend(dst, src, a):
    return tuple(int(dst[i] + (src[i] - dst[i]) * a) for i in range(3))


def canvas(w, h):
    return [BG for _ in range(w * h)]


def put(px, w, h, x, y, color, a=1.0):
    if 0 <= x < w and 0 <= y < h:
        px[y * w + x] = blend(px[y * w + x], color, max(0.0, min(1.0, a)))


def glow(px, w, h, cx, cy, radius, color, strength):
    for y in range(max(0, int(cy - radius)), min(h, int(cy + radius) + 1)):
        for x in range(max(0, int(cx - radius)), min(w, int(cx + radius) + 1)):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if d < radius:
                a = (1.0 - d / radius) ** 2 * strength
                put(px, w, h, x, y, color, a)


def lantern(px, w, h, cx, cy, scale):
    """Pixel lantern: chain, cap, glass with a flame, base."""
    band = max(1, int(scale * 1.4))
    halfw = int(scale * 5)
    top = int(cy - scale * 8)
    bot = int(cy + scale * 7)
    # chain
    for y in range(max(0, top - int(scale * 6)), top):
        for x in range(int(cx - band / 2), int(cx + band / 2) + 1):
            put(px, w, h, x, y, GOLD_LO, 0.9)
    # cap
    for y in range(top, top + int(band * 1.6)):
        t = (y - top) / max(1.0, band * 1.6)
        for x in range(int(cx - halfw * t), int(cx + halfw * t) + 1):
            put(px, w, h, x, y, GOLD_HI, 0.95)
    # glass body
    for y in range(top + int(band * 1.6), bot):
        t = (y - top) / max(1.0, (bot - top))
        wide = int(halfw * (0.95 + 0.15 * (1.0 - abs(0.5 - t) * 2)))
        for x in range(int(cx - wide), int(cx + wide) + 1):
            edge = abs(x - cx) / max(1.0, wide)
            inside = 1.0 - edge ** 3
            col = blend((30, 18, 8), (255, 196, 96), inside)
            put(px, w, h, x, y, col)
    # flame
    flame_y = int((top + bot) / 2)
    for i in range(-int(scale * 3), int(scale * 3) + 1):
        hgt = int(scale * 4 * (1 - abs(i) / max(1.0, scale * 3)))
        for y in range(flame_y - hgt, flame_y + int(scale * 2)):
            put(px, w, h, int(cx + i), y, (255, 246, 210), 0.85)
    # base
    for y in range(bot, bot + int(band * 1.4)):
        for x in range(int(cx - halfw), int(cx + halfw) + 1):
            put(px, w, h, x, y, GOLD_LO, 0.95)


def embers(px, w, h, seed=7):
    x = seed
    for i in range(26):
        x = (x * 1103515245 + 12345) & 0x7FFFFFFF
        ex = x % w
        x = (x * 1103515245 + 12345) & 0x7FFFFFFF
        ey = x % max(1, int(h * 0.7))
        put(px, w, h, ex, ey, (210, 120, 60), 0.35)


def icon():
    w = h = 128
    px = canvas(w, h)
    glow(px, w, h, 64, 78, 58, RED, 0.20)
    glow(px, w, h, 64, 74, 34, GOLD, 0.16)
    lantern(px, w, h, 64, 72, 4.0)
    embers(px, w, h)
    write_png(os.path.join(OUT, "icon0.png"), w, h, px)


def livearea():
    w, h = 840, 500
    px = canvas(w, h)
    glow(px, w, h, 420, 300, 300, RED, 0.16)
    glow(px, w, h, 420, 250, 180, GOLD, 0.10)
    lantern(px, w, h, 420, 250, 11.0)
    for y in range(h):
        for x in range(w):
            if (x + y) % 2 == 0:
                put(px, w, h, x, y, (0, 0, 0), 0.05)
    embers(px, w, h, seed=19)
    write_png(os.path.join(OUT, "livearea", "contents", "bg.png"), w, h, px)

    w, h = 280, 158
    px = canvas(w, h)
    glow(px, w, h, 140, 92, 110, RED, 0.18)
    lantern(px, w, h, 140, 84, 5.0)
    embers(px, w, h, seed=3)
    write_png(os.path.join(OUT, "livearea", "contents", "startup.png"), w, h, px)

    template = """<?xml version="1.0" encoding="utf-8"?>
<livearea style="a1" format-ver="01.00" content-rev="1">
  <livearea-background>
    <image>bg.png</image>
  </livearea-background>
  <gate>
    <startup-image>startup.png</startup-image>
  </gate>
  <frame id="frame1">
    <liveitem>
      <text align="center" color="#ffd98a" size="22" >HOLLOWDEEP</text>
    </liveitem>
    <liveitem>
      <text align="center" color="#8f84a8" size="14" >THE LANTERN BELOW</text>
    </liveitem>
  </frame>
</livearea>
"""
    path = os.path.join(OUT, "livearea", "contents", "template.xml")
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(template)


def main():
    icon()
    livearea()
    print("wrote Vita icon + LiveArea art in", OUT)


if __name__ == "__main__":
    main()
