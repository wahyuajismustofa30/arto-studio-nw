# Novi & Wahyu Wedding Photo Studio

Website editor bingkai foto untuk pernikahan **Novi Pangestuti & Wahyu Ajis Mustofa** — Jumat, 16 Oktober 2026.
Tamu memilih bingkai, memasukkan foto, mengatur posisi dan teks, lalu mengunduh hasilnya sebagai PNG atau JPG.
Semua proses terjadi di browser; foto tidak pernah dikirim ke server.

Website ini **statis murni**: HTML, CSS, dan JavaScript modul ES, tanpa framework, tanpa bundler, tanpa backend,
tanpa CDN. Cukup unggah foldernya ke hosting statis mana pun.

## Fitur

| Status | Fitur |
|---|---|
| Selesai | Beranda: hero, pratinjau bingkai unggulan, kategori, panduan 4 langkah, privasi, FAQ, footer |
| Selesai | Galeri: **100 template** di 12 kategori (8–9 per kategori), 8 rasio, 9 bentuk foto, 1–6 foto per template; filter, pencarian nama (debounce), 4 mode urutan, favorit (localStorage), empty state |
| Selesai | Pemeriksa keunikan otomatis: template ditolak bila hanya beda warna/teks dari template lain |
| Selesai | Optimalisasi kualitas foto: otomatis saat unggah (keseimbangan putih, level, eksposur, vibrance, penajaman), 5 slider manual, tahan-untuk-bandingkan, terapkan ke semua foto, perbesaran halus foto beresolusi rendah; diproses di Web Worker |
| Selesai | Editor: unggah JPG/PNG/WebP, validasi tanda tangan file, penolakan HEIC/file rusak dengan pesan jelas, orientasi EXIF |
| Selesai | Geser (mouse/1 jari), zoom (slider, tombol, scroll, cubit 2 jari), putar 90°, reset posisi, tombol arah, keyboard |
| Selesai | Foto selalu menutupi area slot (tidak bisa digeser sampai kosong) |
| Selesai | Multi-foto: slot independen, “isi beberapa foto sekaligus”, ganti/hapus per slot |
| Selesai | Teks: nama mempelai, tanggal, judul/pesan — dibatasi panjangnya, otomatis mengecil agar tidak terpotong |
| Selesai | Ganti template di editor (foto ikut pindah), undo/redo (40 langkah, state ringan), mulai ulang desain (bisa di-undo) |
| Selesai | Ekspor PNG & JPG, resolusi Standar (ukuran template) dan Tinggi (≤2×, dibatasi aman untuk iOS), pratinjau |
| Selesai | Bagikan via Web Share API (file JPG); fallback: unduh + salin tautan |
| Parsial | Bagikan: pada browser yang mewajibkan klik baru setelah gambar selesai dibuat, muncul tombol “Bagikan sekarang” (dua ketukan) |
| Belum | QR code undangan (URL undangan belum diberikan), PWA/offline (manfaatnya kecil untuk acara satu hari), label “Populer” (tidak ada data) |

## Struktur direktori

```
index.html              Beranda
templates.html          Galeri template
editor.html             Editor foto
assets/
  css/  fonts.css · base.css (token & tombol) · layout.css · components.css · editor.css
  js/
    app.js                Helper DOM aman, toast, ikon SVG, menu mobile
    fonts.js              Pemetaan font template + menunggu font sebelum menggambar kanvas
    ornaments.js          Primitif ornamen prosedural (bunga, daun, pola Islami, rol film, dsb.) + bentuk slot
    ornaments-extra.js    Ornamen koleksi 2 (mahkota daun, art deco, lentera, pita, awan, papan kayu, renda, dsb.)
    enhance-core.js       Algoritma optimalisasi foto (murni, tanpa DOM)
    enhance-worker.js     Web Worker yang menjalankan enhance-core
    enhance.js            Antrean worker, cache hasil, perbesaran halus, ringkasan resolusi
    renderer.js           Menggambar template: latar → foto ter-clip → ornamen → teks. Juga geometri geser/zoom
    template-validator.js Validasi skema (dipakai browser & Node)
    template-registry.js  Memuat + memvalidasi assets/data/templates.json
    thumbnails.js         Thumbnail otomatis (lazy, IntersectionObserver)
    image-loader.js       Validasi & decode foto, perkecil ke maks 2800 px, lepas object URL
    history.js            Undo/redo berbasis state JSON
    export.js             Render final ke kanvas terpisah → toBlob → unduh
    editor.js / gallery.js / home.js / storage.js
  data/templates.json     Katalog utama: kategori + 22 template koleksi 1 (+ daftar "includes")
  data/templates-koleksi-2.json  78 template koleksi 2 (dihasilkan tools/generate-koleksi-2.mjs)
  fonts/                  Cormorant Garamond, Jost, Great Vibes, Cinzel (WOFF2, SIL OFL 1.1)
  images/branding/        favicon, apple-touch-icon, og-image
tools/
  validate-templates.mjs  Validasi katalog, cek file aset ada, dan cek keunikan struktur
  generate-koleksi-2.mjs  Sumber desain 78 template koleksi 2
  make_fixtures.py        Membuat gambar uji
  e2e_test.py             Uji browser otomatis (Playwright)
```

## Menjalankan secara lokal

Modul ES dan `fetch()` tidak berjalan dari `file://`, jadi gunakan server lokal:

```bash
cd novi-wahyu-studio
python3 -m http.server 8080
# buka http://localhost:8080
```

Untuk mencoba di HP dalam satu Wi-Fi, buka `http://<IP-komputer>:8080`. Catatan: Web Share API hanya aktif di HTTPS
atau `localhost`, jadi tombol Bagikan akan memakai fallback saat diakses lewat IP lokal.

## Pilihan teknologi

- **Tanpa Fabric.js/Konva.js.** Kebutuhan editor ini sempit: slot foto tetap, foto hanya digeser/di-zoom/diputar
  di dalam slot, ornamen dan teks tidak dipindah pengguna. Renderer Canvas 2D sendiri (~400 baris) cukup,
  menghindari dependensi 300 KB+ dan risiko CDN gagal, serta memastikan editor, thumbnail, dan ekspor memakai
  kode gambar yang sama persis.
- **Ornamen prosedural**, bukan PNG: tajam di resolusi berapa pun, tidak ada masalah lisensi atau CORS saat ekspor.
- **Font di-host sendiri**: tidak ada permintaan ke Google Fonts (privasi), tetap jalan bila CDN diblokir, dan
  kanvas bisa menunggu font siap sebelum ekspor.

## Menambah template

Katalog terdiri dari `templates.json` (koleksi 1, ditulis tangan) dan file tambahan yang didaftarkan di
`"includes"`. Koleksi 2 dibuat dari `tools/generate-koleksi-2.mjs` — ubah desainnya di skrip itu lalu jalankan
`node tools/generate-koleksi-2.mjs` (file JSON-nya akan ditimpa). Untuk template baru yang ditulis manual:

1. Buka `assets/data/templates.json`, salin satu objek template sebagai titik awal.
2. Ubah `id` (unik, huruf kecil-tanda hubung), `name`, `category` (harus ada di `categories`), `aspectRatio`, `canvas`.
3. Atur `photoSlots`: `shape` = `rect` (pakai `radius` untuk sudut membulat/kapsul), `circle`, `arch`, `pointedArch`,
   `heart`, `hexagon`, `octagon`, `rhombus`, `scallop`.
4. Susun `layers` dari bawah ke atas. Wajib ada tepat satu `{ "type": "photos" }` — layer sebelumnya di bawah foto,
   sesudahnya di atas foto.
5. Teks memakai token `{name1}`, `{name2}`, `{date}`, `{message}`, serta `{i1}`/`{i2}` (inisial nama); kolom teks di editor muncul otomatis untuk token
   yang dipakai. Isi `defaults.message` bila memakai `{message}`. Setiap layer teks wajib punya `maxWidth`.
6. Jalankan `node tools/validate-templates.mjs`. Validator menolak template yang strukturnya identik dengan
   template lain setelah warna dan teks dihapus, atau yang tata letak slot + jenis ornamennya sama persis.
   Template tidak valid juga otomatis disaring di browser (lihat console).

Tipe layer yang tersedia: `fill`, `rect`, `gradientRect`, `line`, `slotShadow`, `slotFrame`, `vignette`, `tint`,
`text`, `arcText`, `flower`, `flowerCluster`, `sprig`, `star8`, `diamond`, `heart`, `divider`, `islamicBorder`,
`filmHoles`, `wavyBorder`, `tape`, `scatter`, `grain`, `image`, dan koleksi 2: `shape`, `wreath`, `decoCorners`,
`rays`, `stripes`, `ribbon`, `crescent`, `rings`, `scallopBorder`, `garland`, `bokeh`, `brackets`, `dotGrid`, `waves`,
`lantern`, `flourish`, `torn`, `halftone`, `barcode`, `cloud`, `balloon`, `bunting`, `squiggle`, `textLines`,
`photoCorners`, `starTile`, `starBand`, `rainbow`, `wood`, `woodSlice`, `perforated`, `lace`, `meadow`, `pillar`, `leaf`. Properti setiap tipe dapat dilihat di
`LAYER_TYPES` (`template-validator.js`) dan `drawLayer` (`renderer.js`).

## Mengganti aset

- **Ornamen PNG/SVG buatan desainer:** simpan di `assets/images/templates/`, lalu tambahkan layer
  `{ "type": "image", "src": "assets/images/templates/nama.png", "x": 0, "y": 0, "w": 1080, "h": 1350 }`.
  Path harus relatif (tanpa `/` di depan). Validator memeriksa file benar-benar ada.
- **Thumbnail manual:** isi `"thumbnail": "assets/images/thumbnails/nama.webp"` (default `"auto"` = dibuat otomatis).
- **Font:** ganti file di `assets/fonts/` dan `fonts.css`, lalu sesuaikan `FONT_FAMILIES` di `fonts.js`.
- **Gambar pratinjau tautan:** `https://res.cloudinary.com/ahwihzsc/image/upload/og-image_-studio-nw.jpg` (1200×630).

## Build

Tidak ada build step. File di repo adalah file yang disajikan.

## Deployment

Unggah seluruh isi folder ke hosting statis (GitHub Pages, Netlify, Vercel, Cloudflare Pages, atau hosting biasa).
Semua path relatif, sehingga berfungsi di root domain maupun subdirektori seperti `username.github.io/nama-repo/`
(sudah diuji dari subdirektori).

**GitHub Pages:** push folder ke repo → Settings → Pages → Deploy from branch → `main` / root.

Setelah domain final diketahui:
- ubah `og:image` di ketiga file HTML menjadi URL absolut (beberapa aplikasi chat tidak membaca path relatif);
- tambahkan `<link rel="canonical" href="https://domain-final/">` bila diinginkan.

Gunakan HTTPS — Web Share API dan clipboard hanya berjalan di konteks aman.

## Optimalisasi kualitas foto

Setiap foto baru otomatis dioptimalkan (bisa dimatikan di tab **Kualitas**). Mode otomatis sengaja konservatif:

1. Keseimbangan putih ringan (gray-world, maks. ±8%) — melemah otomatis bila foto memang berwarna dominan.
2. Perentangan level terbatas bila rentang tonal foto sempit/kusam.
3. Gamma yang menjaga kecerahan rata-rata; hanya foto yang terlalu gelap/terang yang digeser.
4. Kurva-S kontras halus dan vibrance (warna pudar dinaikkan lebih banyak daripada warna yang sudah kuat).
5. Penajaman unsharp-mask pada luminans dengan ambang agar noise tidak ikut diperkuat.

Slider manual: kecerahan, kontras, saturasi, kehangatan, ketajaman. Editor memproses versi pratinjau (≤1400 px)
di Web Worker agar slider tetap lancar; ekspor memproses ulang pada resolusi penuh. Foto yang sisi terpanjangnya
di bawah 1800 px diperbesar halus (maks. 2×) lalu ditajamkan saat ekspor bila mode otomatis aktif.

Batasan jujur: ini koreksi foto klasik, bukan AI — tidak bisa memulihkan detail yang tidak ada, menghilangkan blur
gerak, atau mengurangi noise berat. Bila browser tidak mendukung module worker, proses berjalan di thread utama
(lebih lambat, hasil sama).

## Privasi

Foto dibaca lewat object URL lokal, diproses di kanvas, dan hanya ada di memori selama halaman editor terbuka.
Tidak ada server, analytics, atau layanan eksternal. `localStorage` hanya menyimpan daftar ID template favorit.
Foto keluar dari perangkat hanya bila pengguna sendiri menekan Bagikan.

## Pengujian yang sudah dijalankan

Dijalankan otomatis dengan Playwright + Chromium 141 (headless, Linux), dari root dan dari subdirektori —
**68/68 pemeriksaan lulus** (versi terakhir, dijalankan dari root; versi 22 template sebelumnya juga diuji dari
subdirektori dengan hasil 54/54):

- Validasi katalog: 100/100 template valid, 8–9 per kategori, tanpa duplikat struktur.
- Pemeriksaan visual: thumbnail ke-78 template baru dirender dan diperiksa satu per satu (beberapa tumpang-tindih
  ornamen dengan teks diperbaiki).
- Editor desktop (1366×900): tolak file palsu, HEIC, dan JPEG terpotong; orientasi EXIF benar; foto tampil
  di slot; ornamen di atas foto; seret menggeser foto; batas geser mencegah area kosong; slider/tombol zoom;
  putar; reset; undo/redo; batas panjang teks; ekspor PNG 1080×1350 dan JPG HD 2160×2700 terunduh dan
  dapat dibuka (diperiksa dengan Pillow); hasil tanpa elemen UI; nama file rapi; pratinjau; fallback berbagi;
  ganti template; multi-foto (3 slot independen diverifikasi dari piksel hasil ekspor); mulai ulang + undo;
  template tak dikenal; tanpa error JavaScript.
- Ekspor setiap template (100) dengan ukuran sesuai konfigurasi.
- Optimalisasi: aktif otomatis untuk foto baru; rentang tonal foto kusam melebar (persentil 2–98: 35 → 70 level);
  bisa dimatikan; slider kecerahan mencerahkan hasil ekspor; undo/redo slider; tombol bandingkan; foto 400×300
  terekspor HD dengan peringatan resolusi rendah; “terapkan ke semua foto”; pemrosesan berjalan di Web Worker.
- Mobile (390×844, layar sentuh, DPR 3): gestur geser dan cubit (pointer event sintetis), semua tab, tanpa
  scroll horizontal, ekspor JPG, mode lanskap 844×390.
- Galeri mobile: filter, pencarian, empty state, favorit bertahan setelah muat ulang, tombol “Gunakan Template”.

Cara menjalankan ulang:

```bash
python3 -m http.server 8765 &
python3 tools/make_fixtures.py /tmp/fx
python3 tools/e2e_test.py /tmp/fx /tmp/out     # butuh: pip install playwright pillow && playwright install chromium
```

**Belum diuji:** perangkat fisik Android/iPhone, Safari (WebKit), Firefox, Edge, dan pembagian file ke aplikasi
nyata (Chromium headless di Linux tidak mendukung share file). Gestur cubit diuji dengan event sintetis, bukan jari.
Sebelum acara, coba buka tautan di minimal satu Android dan satu iPhone: unggah foto dari galeri, unduh, dan bagikan.

## Batasan yang diketahui

- Foto hilang bila halaman dimuat ulang (sengaja, demi privasi). Browser memberi peringatan sebelum menutup
  halaman bila ada foto, tetapi Safari iOS sering mengabaikan peringatan ini.
- Browser bawaan aplikasi (Instagram, WhatsApp, Facebook) sering memblokir unduhan; hasil gambar selalu
  ditampilkan di layar agar bisa disimpan dengan tekan lama.
- HEIC tidak didukung langsung; iPhone umumnya otomatis mengubah ke JPG saat memilih dari aplikasi Foto.
- Foto diperkecil ke sisi terpanjang 2800 px saat dimuat untuk menghemat memori — masih di atas kebutuhan
  ekspor resolusi tinggi.
- Thumbnail galeri memakai foto contoh abstrak, bukan foto pasangan.
