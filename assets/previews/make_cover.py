# -*- coding: utf-8 -*-
"""
Teaser cover for a tournament preview PDF.

Renders one page and blurs the SELECTION part of every bet line while leaving
the odds (@1.8, @6, ...) readable — the curiosity gap that makes the gate work.

Usage:  python make_cover.py canada.pdf 8 canada-cover.png
"""
import sys, fitz
from PIL import Image, ImageFilter

PDF   = sys.argv[1] if len(sys.argv) > 1 else "canada.pdf"
PAGE  = int(sys.argv[2]) if len(sys.argv) > 2 else 8      # 1-based
OUT   = sys.argv[3] if len(sys.argv) > 3 else "canada-cover.png"
DPI   = 150
BLUR  = 9          # gaussian radius in px
PAD   = 1.5        # pt of padding around each blurred run

doc = fitz.open(PDF)
page = doc[PAGE - 1]
scale = DPI / 72.0

pix = page.get_pixmap(dpi=DPI)
img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)

# group words into lines
words = sorted(page.get_text("words"), key=lambda w: (round(w[1], 1), w[0]))
lines = {}
for w in words:
    lines.setdefault(round(w[1], 1), []).append(w)

rects = []
for y, ws in lines.items():
    ws.sort(key=lambda w: w[0])
    # a bet line = one that carries an odds token like "@1.8" / "@6"
    odds = [w for w in ws if w[4].startswith("@")]
    if not odds:
        continue
    at = odds[0]
    # blur from the first word up to just before the odds token.
    # keep a leading label such as "Step 1:" readable.
    start = ws[0]
    if ws[0][4].lower().startswith("step") and len(ws) > 2:
        start = ws[2]
    x0, x1 = start[0] - PAD, at[0] - PAD
    y0 = min(w[1] for w in ws) - PAD
    y1 = max(w[3] for w in ws) + PAD
    if x1 - x0 > 8:
        rects.append((x0, y0, x1, y1))

for (x0, y0, x1, y1) in rects:
    box = (int(x0 * scale), int(y0 * scale), int(x1 * scale), int(y1 * scale))
    region = img.crop(box).filter(ImageFilter.GaussianBlur(BLUR))
    img.paste(region, box)

# crop away empty margins so the card shows content, not white space
blocks = [b for b in page.get_text("blocks") if b[4].strip()]
if blocks:
    m = 14  # pt margin
    cx0 = max(0, min(b[0] for b in blocks) - m)
    cy0 = max(0, min(b[1] for b in blocks) - m)
    cx1 = min(page.rect.width, max(b[2] for b in blocks) + m)
    cy1 = min(page.rect.height, max(b[3] for b in blocks) + m)
    img = img.crop((int(cx0 * scale), int(cy0 * scale),
                    int(cx1 * scale), int(cy1 * scale)))

img.save(OUT)
print("wrote %s  (%dx%d, page %d, %d bet lines blurred)"
      % (OUT, img.width, img.height, PAGE, len(rects)))
