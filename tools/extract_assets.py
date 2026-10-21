#!/usr/bin/env python3
"""Extract the portable game assets from Hollowdeep.html.

Outputs (vita/assets/):
  game_XX.js   one file per inline <script>, evaluated in order by the native runtime
  sprites.png  the embedded sprite sheet
  font.ttf     the embedded 'Press Start 2P' font, converted from WOFF2

The module script (Trystero / WebRTC multiplayer) is skipped on purpose: the
Vita port has no network stack and the classic modes are the supported ones.
"""
import base64
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "Hollowdeep.html")
OUT = os.path.join(ROOT, "vita", "assets")


def main() -> int:
    html = open(SRC, encoding="utf-8").read()
    os.makedirs(OUT, exist_ok=True)

    # --- inline scripts -----------------------------------------------------
    scripts = []
    for m in re.finditer(r"<script([^>]*)>(.*?)</script>", html, re.S):
        attrs, body = m.group(1), m.group(2)
        if "src=" in attrs:
            continue
        if "module" in attrs:
            print("skip: <script type=module> (Trystero multiplayer)")
            continue
        body = body.strip()
        if body:
            scripts.append(body)
    if not scripts:
        print("ERROR: no inline scripts found", file=sys.stderr)
        return 1

    for old in os.listdir(OUT):
        if old.startswith("game_") and old.endswith(".js"):
            os.remove(os.path.join(OUT, old))
    total = 0
    for i, body in enumerate(scripts):
        path = os.path.join(OUT, "game_%02d.js" % i)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(body)
            f.write("\n")
        total += len(body)
    print("wrote %d scripts, %.1f KB" % (len(scripts), total / 1024.0))

    # --- sprite sheet -------------------------------------------------------
    m = re.search(r'data:image/png;base64,([A-Za-z0-9+/=]+)', html)
    if not m:
        print("ERROR: sprite sheet not found", file=sys.stderr)
        return 1
    png = base64.b64decode(m.group(1))
    with open(os.path.join(OUT, "sprites.png"), "wb") as f:
        f.write(png)
    print("wrote sprites.png (%d bytes)" % len(png))

    # --- font ---------------------------------------------------------------
    m = re.search(r'data:font/woff2;base64,([A-Za-z0-9+/=]+)', html)
    if not m:
        print("ERROR: font not found", file=sys.stderr)
        return 1
    woff2 = base64.b64decode(m.group(1))
    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        print("ERROR: fontTools is required (pip install fonttools brotli)", file=sys.stderr)
        return 1
    font = TTFont(io.BytesIO(woff2))
    buf = io.BytesIO()
    font.flavor = None
    font.save(buf)
    ttf = buf.getvalue()
    with open(os.path.join(OUT, "font.ttf"), "wb") as f:
        f.write(ttf)
    cmap = font.getBestCmap()
    print("wrote font.ttf (%d bytes), glyphs=%d cmap=%d" % (len(ttf), len(font.getGlyphOrder()), len(cmap)))

    # --- coverage report (useful to spot missing UI glyphs) -----------------
    used = set(ch for ch in html if ord(ch) > 0x7E)
    missing = sorted(ch for ch in used if ord(ch) not in cmap)
    if missing:
        print("note: characters used by the game but absent from the font: %s" %
              " ".join("%s(U+%04X)" % (c, ord(c)) for c in missing[:40]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
