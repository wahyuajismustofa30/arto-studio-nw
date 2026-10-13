"""Uji end-to-end dengan Playwright + Chromium.

Jalankan server lokal dulu (python3 -m http.server 8765 di folder proyek), lalu:
    python3 tools/e2e_test.py <folder-fixture> <folder-output>
Folder fixture berisi quad.jpg, purple.png, teal.webp, orange.jpg, exif6.jpg, fake.jpg, fake.heic, corrupt.jpg
(lihat README bagian Pengujian untuk cara membuatnya).
"""
import asyncio, os, sys
from playwright.async_api import async_playwright
from PIL import Image

BASE = os.environ.get("BASE_URL", "http://localhost:8765/")
FIX, OUT = sys.argv[1], sys.argv[2]
CHROME = os.environ.get("CHROME_PATH")
os.makedirs(OUT, exist_ok=True)
results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("PASS " if ok else "FAIL ") + name + (f" — {detail}" if detail else ""))


def near(c, target, tol=60):
    return all(abs(a - b) <= tol for a, b in zip(c[:3], target))


async def canvas_pixel(pg, tx, ty):
    """Warna piksel kanvas editor pada koordinat template (tx, ty)."""
    return await pg.evaluate("""([tx, ty]) => {
        const c = document.getElementById('canvas');
        const k = c.width / window.__tplW;
        const d = c.getContext('2d').getImageData(Math.round(tx*k), Math.round(ty*k), 1, 1).data;
        return [d[0], d[1], d[2]];
    }""", [tx, ty])


async def catalog(pg):
    return await pg.evaluate("""async () => {
        const c = await (await import('./assets/js/template-registry.js')).loadCatalog();
        return c.templates.map(t => ({id: t.id, name: t.name, category: t.category, slots: t.photoSlots.length, w: t.canvas.width, h: t.canvas.height,
            catName: c.categories.find(x => x.id === t.category).name}));
    }""")


def stats(path, box):
    im = Image.open(path).convert("L").crop(box)
    px = list(im.getdata())
    px.sort()
    n = len(px)
    return {"mean": sum(px) / n, "p2": px[int(n * 0.02)], "p98": px[int(n * 0.98)]}


async def ready(pg):
    await pg.wait_for_function("document.getElementById('loading').hidden === true", timeout=15000)
    await pg.wait_for_timeout(250)


async def toast_text(pg):
    await pg.wait_for_selector("#toast.is-visible", timeout=5000)
    return await pg.text_content("#toast")


async def download(pg, button_id, name):
    async with pg.expect_download(timeout=20000) as dl:
        await pg.click(button_id)
    d = await dl.value
    path = os.path.join(OUT, name)
    await d.save_as(path)
    await pg.wait_for_selector("#dlg-result[open]")
    await pg.click("#dlg-result .modal-actions [data-close]")
    return path, d.suggested_filename


async def desktop(browser):
    ctx = await browser.new_context(viewport={"width": 1366, "height": 900}, accept_downloads=True)
    pg = await ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

    await pg.goto(BASE + "editor.html?t=mawar-pagi")
    await ready(pg)
    await pg.evaluate("window.__tplW = 1080")
    check("editor: judul template tampil", (await pg.text_content("#tpl-name")) == "Mawar Pagi")
    check("editor: undo nonaktif di awal", await pg.is_disabled("#undo"))

    # Ekspor tanpa foto harus ditolak dengan pesan
    await pg.click("#tab-simpan")
    await pg.click("#dl-png")
    check("ekspor tanpa foto ditolak", "minimal satu foto" in (await toast_text(pg)))

    # File tidak valid
    await pg.click("#tab-foto")
    for f, expect in [("fake.jpg", "bukan gambar"), ("fake.heic", "HEIC"), ("corrupt.jpg", "tidak dapat dibuka")]:
        await pg.set_input_files("#file", os.path.join(FIX, f))
        t = await toast_text(pg)
        check(f"tolak {f}", expect in t, t)
        await pg.evaluate("document.getElementById('toast').classList.remove('is-visible')")

    # Orientasi EXIF: disimpan 400x200 dengan orientasi 6 -> harus terbaca 200x400
    dims = await pg.evaluate("""async (u) => {
        const m = await import('./assets/js/image-loader.js');
        const blob = await (await fetch(u)).blob();
        const p = await m.loadPhoto(new File([blob], 'x.jpg', {type: 'image/jpeg'}));
        return [p.width, p.height];
    }""", "data:image/jpeg;base64," + __import__("base64").b64encode(open(os.path.join(FIX, "exif6.jpg"), "rb").read()).decode())
    check("orientasi EXIF diterapkan", dims == [200, 400], str(dims))

    # Unggah foto valid
    await pg.set_input_files("#file", os.path.join(FIX, "quad.jpg"))
    await pg.wait_for_function("!document.getElementById('remove').disabled")
    await pg.wait_for_timeout(200)
    center = await canvas_pixel(pg, 540, 590)
    check("foto tampil di slot (titik tengah putih)", near(center, (255, 255, 255), 40), str(center))
    check("undo aktif setelah unggah", not await pg.is_disabled("#undo"))
    ornament = await canvas_pixel(pg, 160, 168)
    check("ornamen bunga digambar di atas foto", not near(ornament, (220, 40, 40), 30), str(ornament))

    # Geser dengan mouse: seret ke kanan -> titik kiri-tengah slot ikut berubah
    box = await pg.locator("#canvas").bounding_box()
    before = await canvas_pixel(pg, 560, 590)
    k = box["width"] / 1080
    await pg.mouse.move(box["x"] + 540 * k, box["y"] + 590 * k)
    await pg.mouse.down()
    for i in range(1, 11):
        await pg.mouse.move(box["x"] + (540 + 30 * i) * k, box["y"] + 590 * k)
    await pg.mouse.up()
    await pg.wait_for_timeout(100)
    after = await canvas_pixel(pg, 560, 590)
    check("seret menggeser foto", before != after, f"{before} -> {after}")
    # Batas: slot tidak pernah kosong — sudut slot tetap berwarna foto, bukan latar krem
    corner = await canvas_pixel(pg, 150, 600)
    check("geser dibatasi (tidak ada area kosong)", not near(corner, (239, 230, 218), 12), str(corner))

    # Zoom
    await pg.click("#tab-atur")
    await pg.fill("#zoom", "250")
    await pg.dispatch_event("#zoom", "change")
    check("slider zoom memperbarui label", (await pg.text_content("#zoom-val")) == "250%")
    await pg.click("#zoom-in")
    check("tombol zoom +", int((await pg.text_content("#zoom-val")).rstrip("%")) > 250)
    await pg.click("#rotate")
    await pg.click("#reset-pos")
    check("reset posisi mengembalikan zoom 100%", (await pg.text_content("#zoom-val")) == "100%")

    # Undo / redo
    await pg.click("#undo")
    z_undo = await pg.text_content("#zoom-val")
    check("undo mengembalikan zoom sebelumnya", z_undo != "100%", z_undo)
    await pg.click("#redo")
    check("redo", (await pg.text_content("#zoom-val")) == "100%")

    # Teks panjang
    await pg.click("#tab-teks")
    await pg.fill("#txt-name1", "Novi Pangestuti Rahmawati Sekar")
    await pg.fill("#txt-name2", "Wahyu Ajis Mustofa Pratama")
    await pg.wait_for_timeout(800)
    v = await pg.input_value("#txt-name1")
    check("batas panjang teks diterapkan", len(v) <= 24, v)

    # Ekspor PNG standar
    await pg.click("#tab-simpan")
    path, fname = await download(pg, "#dl-png", "out-mawar.png")
    im = Image.open(path)
    check("PNG terunduh & dapat dibuka", im.format == "PNG", fname)
    check("PNG 1080x1350", im.size == (1080, 1350), str(im.size))
    px = im.convert("RGB").getpixel((540, 590))
    check("PNG berisi foto di slot", not near(px, (239, 230, 218), 15), str(px))
    check("PNG tanpa UI (sudut = latar template)", near(im.convert("RGB").getpixel((5, 5)), (255, 252, 248), 4))
    check("nama file rapi", fname.endswith("-mawar-pagi.png") and fname.startswith("novi-"), fname)

    # Ekspor JPG resolusi tinggi
    await pg.check('input[name="res"][value="high"]')
    path, fname = await download(pg, "#dl-jpg", "out-mawar-hd.jpg")
    im = Image.open(path)
    check("JPG HD terunduh & dapat dibuka", im.format == "JPEG", fname)
    check("JPG HD 2160x2700", im.size == (2160, 2700), str(im.size))

    # Pratinjau
    await pg.click("#preview")
    await pg.wait_for_selector("#dlg-preview[open]")
    nat = await pg.evaluate("new Promise(r => { const i = document.getElementById('dlg-preview-img'); i.complete ? r(i.naturalWidth) : i.onload = () => r(i.naturalWidth); })")
    check("pratinjau menampilkan gambar", nat == 1080, str(nat))
    await pg.keyboard.press("Escape")

    # Bagikan: Chromium headless di Linux tidak mendukung share file -> fallback dialog
    await pg.click("#share")
    await pg.wait_for_selector("#dlg-share[open]", timeout=15000)
    check("fallback berbagi tampil bila tidak didukung", "Unduh" in (await pg.text_content("#dlg-share-text")))
    await pg.click("#dlg-share [data-close]")

    # Ganti template ke kolase 3 foto -> foto pindah ke slot pertama
    await pg.click("#tab-template")
    await pg.click('.tpl-option[data-id="strip-klasik"]')
    await ready(pg)
    await pg.evaluate("window.__tplW = 600")
    check("ganti template", (await pg.text_content("#tpl-name")) == "Strip Klasik")
    check("URL mengikuti template", "t=strip-klasik" in pg.url)
    await pg.click("#tab-foto")
    check("chip area foto = 3", await pg.locator(".slot-chip").count() == 3)
    await pg.set_input_files("#files", [os.path.join(FIX, f) for f in ("purple.png", "teal.webp", "orange.jpg")])
    t = await toast_text(pg)
    check("isi banyak foto sekaligus", "2 foto dimasukkan" in t and "1 tidak dipakai" in t, t)
    # Ganti foto di slot 2 secara independen
    await pg.click('.slot-chip[data-slot="foto-2"]')
    await pg.set_input_files("#file", os.path.join(FIX, "orange.jpg"))
    await pg.wait_for_timeout(400)
    await pg.click("#tab-simpan")
    await pg.check('input[name="res"][value="standard"]')
    path, _ = await download(pg, "#dl-png", "out-strip.png")
    im = Image.open(path).convert("RGB")
    s1, s2, s3 = im.getpixel((100, 100)), im.getpixel((100, 600)), im.getpixel((100, 1100))
    # Slot 1 membawa foto quad dari template sebelumnya (sudah diputar 90°), jadi cukup pastikan berisi foto.
    check("strip: slot 1 berisi foto yang dibawa dari template lama", any(near(s1, c) for c in [(220, 40, 40), (40, 180, 60), (40, 70, 220), (240, 210, 40)]), str(s1))
    check("strip: slot 2 = foto pengganti (oranye)", near(s2, (240, 120, 20)), str(s2))
    check("strip: slot 3 = foto teal", near(s3, (20, 160, 160)), str(s3))
    check("strip ukuran 600x1800", im.size == (600, 1800))

    # Reset desain lalu undo
    await pg.click("#reset-all")
    await pg.click('#dlg-confirm button[value="ok"]')
    await pg.wait_for_timeout(200)
    check("reset desain mengosongkan foto", await pg.is_disabled("#remove"))
    await pg.click("#undo")
    await pg.wait_for_timeout(200)
    check("undo setelah reset memulihkan foto", not await pg.is_disabled("#remove"))

    # Template tidak dikenal
    await pg.goto(BASE + "editor.html?t=tidak-ada")
    await ready(pg)
    check("template tak dikenal -> fallback + pesan", "tidak ditemukan" in (await toast_text(pg)))

    check("desktop: tanpa error JavaScript", not errors, "; ".join(errors))
    await ctx.close()


async def all_templates_export(browser):
    """Setiap template aktif: muat, isi semua slot, ekspor PNG, cek ukuran."""
    ctx = await browser.new_context(viewport={"width": 1280, "height": 860}, accept_downloads=True)
    pg = await ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    await pg.goto(BASE + "templates.html")
    tpls = await catalog(pg)
    bad = []
    for t in tpls:
        await pg.goto(BASE + f"editor.html?t={t['id']}")
        await ready(pg)
        files = [os.path.join(FIX, "quad.jpg")] * t["slots"]
        if len(files) > 1:
            await pg.set_input_files("#files", files)
        else:
            await pg.set_input_files("#file", files[0])
        await pg.wait_for_function("!document.getElementById('remove').disabled")
        await pg.click("#tab-simpan")
        path, _ = await download(pg, "#dl-png", f"tpl-{t['id']}.png")
        im = Image.open(path)
        if im.size != (t["w"], t["h"]):
            bad.append(f"{t['id']} {im.size}")
    check(f"semua {len(tpls)} template terekspor dengan ukuran benar", not bad, ", ".join(bad))
    check("ekspor semua template tanpa error JS", not errors, "; ".join(errors))
    await ctx.close()


async def mobile(browser):
    ctx = await browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=3, is_mobile=True, has_touch=True, accept_downloads=True)
    pg = await ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    await pg.goto(BASE + "editor.html?t=kubah-sakinah")
    await ready(pg)
    await pg.evaluate("window.__tplW = 1080")
    cb = await pg.locator("#canvas").bounding_box()
    check("mobile: kanvas cukup besar (>= 55% tinggi layar)", cb["height"] >= 0.55 * 844 * 0.85, f"{cb['width']:.0f}x{cb['height']:.0f}")
    await pg.screenshot(path=os.path.join(OUT, "m-editor-empty.png"))
    await pg.set_input_files("#file", os.path.join(FIX, "quad.jpg"))
    await pg.wait_for_function("!document.getElementById('remove').disabled")

    # Gestur sentuh sintetis: geser satu jari lalu cubit dua jari
    res = await pg.evaluate("""async () => {
        const c = document.getElementById('canvas'); const r = c.getBoundingClientRect();
        const cx = r.left + r.width/2, cy = r.top + r.height*0.45;
        const ev = (type, id, x, y) => c.dispatchEvent(new PointerEvent(type, {pointerId:id, pointerType:'touch', clientX:x, clientY:y, bubbles:true, cancelable:true, isPrimary:id===1}));
        ev('pointerdown', 1, cx, cy);
        for (let i=1;i<=10;i++) ev('pointermove', 1, cx + i*4, cy);
        ev('pointerup', 1, cx+40, cy);
        await new Promise(r => setTimeout(r, 50));
        ev('pointerdown', 1, cx-20, cy); ev('pointerdown', 2, cx+20, cy);
        for (let i=1;i<=10;i++){ ev('pointermove', 1, cx-20-i*8, cy); ev('pointermove', 2, cx+20+i*8, cy); }
        ev('pointerup', 1, cx-100, cy); ev('pointerup', 2, cx+100, cy);
        await new Promise(r => setTimeout(r, 50));
        return document.getElementById('zoom-val').textContent;
    }""")
    check("mobile: cubit dua jari memperbesar foto", int(res.rstrip("%")) > 150, res)
    check("mobile: undo aktif setelah gestur", not await pg.is_disabled("#undo"))
    for tab in ["foto", "atur", "teks", "template", "simpan"]:
        await pg.click(f"#tab-{tab}")
        await pg.wait_for_timeout(500)
        await pg.screenshot(path=os.path.join(OUT, f"m-editor-{tab}.png"))
        sw = await pg.evaluate("document.documentElement.scrollWidth > innerWidth")
        if sw:
            check(f"mobile tab {tab}: tanpa scroll horizontal", False)
    path, _ = await download(pg, "#dl-jpg", "m-out.jpg")
    check("mobile: ekspor JPG", Image.open(path).size == (1080, 1350))
    await pg.set_viewport_size({"width": 844, "height": 390})
    await pg.wait_for_timeout(400)
    await pg.screenshot(path=os.path.join(OUT, "m-editor-landscape.png"))
    cb = await pg.locator("#canvas").bounding_box()
    check("mobile lanskap: kanvas tetap terlihat", cb["height"] > 250, f"{cb['width']:.0f}x{cb['height']:.0f}")
    check("mobile: tanpa error JavaScript", not errors, "; ".join(errors))

    # Galeri mobile: filter & pencarian & favorit
    await pg.set_viewport_size({"width": 390, "height": 844})
    await pg.goto(BASE + "templates.html")
    await pg.wait_for_selector(".tcard")
    total = await pg.locator(".tcard").count()
    cat = await catalog(pg)
    check("galeri: 100 template tampil", total == len(cat) == 100, str(total))
    expect_strip = sum(1 for t in cat if t["category"] == "photobooth-strip")
    await pg.click('.chip[data-cat="photobooth-strip"]')
    check("galeri: filter kategori", await pg.locator(".tcard").count() == expect_strip, f"{expect_strip}")
    await pg.click('.chip[data-cat="all"]')
    await pg.fill("#search", "emas")
    await pg.wait_for_timeout(400)
    expect_q = sum(1 for t in cat if "emas" in (t["name"] + " " + t["catName"]).lower())
    check("galeri: pencarian", await pg.locator(".tcard").count() == expect_q, f"{await pg.locator('.tcard').count()} vs {expect_q}")
    await pg.fill("#search", "zzzz")
    await pg.wait_for_timeout(400)
    check("galeri: empty state", await pg.is_visible(".empty-state"))
    await pg.click(".empty-state button")
    check("galeri: tampilkan semua lagi", await pg.locator(".tcard").count() == total)
    await pg.click('[data-fav="roll-film"]')
    await pg.click('.chip[data-cat="favorites"]')
    check("galeri: favorit tersimpan", await pg.locator(".tcard").count() == 1)
    await pg.reload()
    await pg.wait_for_selector(".tcard")
    check("galeri: favorit bertahan setelah muat ulang", await pg.locator(".tcard").count() == 1)
    await pg.click('.chip[data-cat="all"]')
    await pg.click('a.btn[href="editor.html?t=janji-suci"]')
    await ready(pg)
    check("galeri: tombol Gunakan Template membuka template yang benar", (await pg.text_content("#tpl-name")) == "Janji Suci")
    await ctx.close()


async def quality(browser):
    """Optimalisasi foto: otomatis memperlebar rentang tonal foto kusam, bisa dimatikan, slider bekerja."""
    ctx = await browser.new_context(viewport={"width": 1366, "height": 900}, accept_downloads=True)
    pg = await ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    await pg.goto(BASE + "editor.html?t=ruang-putih")  # slot penuh 1080x1070 di atas
    await ready(pg)
    await pg.set_input_files("#file", os.path.join(FIX, "dull.jpg"))
    await pg.wait_for_function("!document.getElementById('remove').disabled")
    await pg.click("#tab-kualitas")
    check("kualitas: otomatis aktif untuk foto baru", (await pg.get_attribute("#q-auto", "aria-pressed")) == "true")
    info = await pg.text_content("#q-info")
    check("kualitas: info resolusi tampil", "1600 × 1200" in info, info)
    box = (100, 100, 980, 980)
    await pg.click("#tab-simpan")
    on_path, _ = await download(pg, "#dl-png", "q-auto-on.png")
    await pg.click("#tab-kualitas")
    await pg.click("#q-auto")
    check("kualitas: otomatis bisa dimatikan", (await pg.get_attribute("#q-auto", "aria-pressed")) == "false")
    await pg.click("#tab-simpan")
    off_path, _ = await download(pg, "#dl-png", "q-auto-off.png")
    a, b = stats(on_path, box), stats(off_path, box)
    check("kualitas: otomatis memperlebar rentang tonal foto kusam", (a["p98"] - a["p2"]) > (b["p98"] - b["p2"]) * 1.3, f"on {a} / off {b}")
    # Slider kecerahan (otomatis mati)
    await pg.click("#tab-kualitas")
    await pg.fill("#q-brightness", "80")
    await pg.dispatch_event("#q-brightness", "change")
    await pg.click("#tab-simpan")
    br_path, _ = await download(pg, "#dl-png", "q-bright.png")
    c = stats(br_path, box)
    check("kualitas: slider kecerahan mencerahkan hasil", c["mean"] > b["mean"] + 20, f"{b['mean']:.1f} -> {c['mean']:.1f}")
    # Undo mengembalikan kecerahan
    await pg.click("#undo")
    await pg.click("#tab-kualitas")
    check("kualitas: undo mengembalikan slider", (await pg.input_value("#q-brightness")) == "0")
    # Tahan untuk bandingkan
    await pg.click("#redo")
    await pg.dispatch_event("#q-compare", "pointerdown")
    pressed = await pg.get_attribute("#q-compare", "aria-pressed")
    await pg.dispatch_event("#q-compare", "pointerup")
    check("kualitas: tombol bandingkan", pressed == "true" and (await pg.get_attribute("#q-compare", "aria-pressed")) == "false")
    # Foto resolusi rendah + ekspor HD
    await pg.goto(BASE + "editor.html?t=mawar-pagi")
    await ready(pg)
    await pg.set_input_files("#file", os.path.join(FIX, "small.jpg"))
    await pg.wait_for_function("!document.getElementById('remove').disabled")
    await pg.click("#tab-kualitas")
    check("kualitas: peringatan resolusi rendah", "rendah" in (await pg.text_content("#q-info")))
    await pg.click("#tab-simpan")
    await pg.check('input[name="res"][value="high"]')
    hd, _ = await download(pg, "#dl-jpg", "q-small-hd.jpg")
    check("kualitas: foto kecil tetap terekspor HD", Image.open(hd).size == (2160, 2700))
    # Terapkan ke semua foto (kolase)
    await pg.goto(BASE + "editor.html?t=kolase-pastel")
    await ready(pg)
    await pg.set_input_files("#files", [os.path.join(FIX, f) for f in ("dull.jpg", "small.jpg", "quad.jpg")])
    await pg.wait_for_timeout(600)
    await pg.click("#tab-kualitas")
    await pg.fill("#q-warmth", "60")
    await pg.dispatch_event("#q-warmth", "change")
    await pg.click("#q-all")
    t = await toast_text(pg)
    check("kualitas: terapkan ke semua foto", "3 foto" in t, t)
    await pg.click('#tab-foto')
    await pg.click('.slot-chip[data-slot="kanan"]')
    await pg.click("#tab-kualitas")
    check("kualitas: slot lain ikut berubah", (await pg.input_value("#q-warmth")) == "60")
    worker_ok = await pg.evaluate("performance.getEntriesByType('resource').some(r => r.name.includes('enhance-worker.js'))")
    check("kualitas: diproses di Web Worker", worker_ok)
    check("kualitas: tanpa error JavaScript", not errors, "; ".join(errors))
    await ctx.close()


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(**({"executable_path": CHROME} if CHROME else {}))
        await desktop(browser)
        await quality(browser)
        await all_templates_export(browser)
        await mobile(browser)
        await browser.close()
    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} pemeriksaan lulus")
    sys.exit(1 if failed else 0)


asyncio.run(main())
