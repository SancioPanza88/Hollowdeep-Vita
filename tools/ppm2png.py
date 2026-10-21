#!/usr/bin/env python3
"""Convert the harness PPM screenshots to PNG (stdlib only)."""
import glob
import os
import struct
import sys
import zlib


def convert(path: str) -> str:
    data = open(path, "rb").read()
    if not data.startswith(b"P6"):
        raise ValueError("not a P6 PPM: %s" % path)
    fields, idx = [], 2
    while len(fields) < 3:
        while idx < len(data) and data[idx:idx + 1].isspace():
            idx += 1
        if data[idx:idx + 1] == b"#":
            while data[idx:idx + 1] not in (b"\n", b""):
                idx += 1
            continue
        start = idx
        while idx < len(data) and not data[idx:idx + 1].isspace():
            idx += 1
        fields.append(int(data[start:idx]))
    idx += 1
    w, h, maxv = fields
    assert maxv == 255
    pixels = data[idx:idx + w * h * 3]
    raw = bytearray()
    stride = w * 3
    for y in range(h):
        raw.append(0)
        raw.extend(pixels[y * stride:(y + 1) * stride])

    def chunk(tag, payload):
        return (struct.pack(">I", len(payload)) + tag + payload +
                struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF))

    out = (b"\x89PNG\r\n\x1a\n" +
           chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) +
           chunk(b"IDAT", zlib.compress(bytes(raw), 9)) +
           chunk(b"IEND", b""))
    dest = os.path.splitext(path)[0] + ".png"
    with open(dest, "wb") as f:
        f.write(out)
    return dest


def main(argv):
    paths = []
    for arg in argv:
        paths.extend(glob.glob(arg))
    if not paths:
        print("usage: ppm2png.py <file.ppm|glob> ...", file=sys.stderr)
        return 2
    for path in sorted(paths):
        print("converted", convert(path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
