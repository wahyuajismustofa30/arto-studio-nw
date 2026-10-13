"""Membuat gambar uji untuk tools/e2e_test.py.  Pakai: python3 tools/make_fixtures.py <folder-tujuan>"""
import os, sys
from PIL import Image, ImageDraw

F = sys.argv[1]
os.makedirs(F, exist_ok=True)

def quad(w, h, cols, path, fmt, **kw):
    im = Image.new("RGB", (w, h)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w // 2, h // 2], fill=cols[0]); d.rectangle([w // 2, 0, w, h // 2], fill=cols[1])
    d.rectangle([0, h // 2, w // 2, h], fill=cols[2]); d.rectangle([w // 2, h // 2, w, h], fill=cols[3])
    d.ellipse([w * 0.4, h * 0.4, w * 0.6, h * 0.6], fill=(255, 255, 255))
    im.save(path, fmt, **kw)

quad(3000, 2000, [(220, 40, 40), (40, 180, 60), (40, 70, 220), (240, 210, 40)], f"{F}/quad.jpg", "JPEG", quality=90)
quad(1200, 1600, [(120, 60, 160)] * 4, f"{F}/purple.png", "PNG")
quad(1000, 1000, [(20, 160, 160)] * 4, f"{F}/teal.webp", "WEBP")
quad(800, 800, [(240, 120, 20)] * 4, f"{F}/orange.jpg", "JPEG")
im = Image.new("RGB", (400, 200), (200, 0, 0)); ex = Image.Exif(); ex[0x0112] = 6; im.save(f"{F}/exif6.jpg", "JPEG", exif=ex)
open(f"{F}/fake.jpg", "w").write("ini bukan gambar sama sekali")
open(f"{F}/fake.heic", "wb").write(b"\x00\x00\x00\x18ftypheic\x00\x00\x00\x00mif1heic" + b"\x00" * 100)
open(f"{F}/corrupt.jpg", "wb").write(open(f"{F}/orange.jpg", "rb").read()[:300])
# Foto kusam: rentang tonal sempit + rona kebiruan (untuk menguji optimalisasi otomatis)
dull = Image.new("RGB", (1600, 1200)); d = ImageDraw.Draw(dull)
for x in range(1600):
    v = 95 + int(60 * x / 1600)
    d.line([(x, 0), (x, 1200)], fill=(v - 6, v, v + 14))
d.ellipse([600, 400, 1000, 800], fill=(150, 130, 128))
dull.save(f"{F}/dull.jpg", "JPEG", quality=92)
quad(400, 300, [(200, 120, 90), (90, 140, 120), (120, 110, 170), (210, 190, 120)], f"{F}/small.jpg", "JPEG", quality=90)
print("Fixture dibuat di", F)
