// Validator konfigurasi template. Murni (tanpa DOM) sehingga bisa dijalankan di browser
// maupun di Node lewat tools/validate-templates.mjs.

export const LAYER_TYPES = {
  photos: [],
  fill: [],
  rect: ["x", "y", "w", "h"],
  gradientRect: ["x", "y", "w", "h", "from", "to"],
  line: ["x1", "y1", "x2", "y2", "stroke"],
  slotShadow: ["slot"],
  slotFrame: ["slot", "stroke"],
  vignette: ["slot"],
  tint: ["slot", "color"],
  text: ["text", "x", "y", "size"],
  arcText: ["text", "x", "y", "r", "size", "color"],
  flower: ["x", "y", "r"],
  flowerCluster: ["x", "y"],
  sprig: ["x", "y"],
  star8: ["x", "y", "r"],
  diamond: ["x", "y", "r", "fill"],
  heart: ["x", "y", "s"],
  divider: ["x", "y"],
  islamicBorder: ["x", "y", "w", "h"],
  filmHoles: ["x", "y", "w", "h"],
  wavyBorder: ["x", "y", "w", "h"],
  tape: ["x", "y"],
  scatter: ["count"],
  grain: [],
  image: ["src", "x", "y", "w", "h"],
  // koleksi 2
  shape: ["shape", "x", "y", "w", "h"],
  wreath: ["x", "y", "r"],
  decoCorners: ["x", "y", "w", "h", "color"],
  rays: ["x", "y", "color"],
  stripes: ["x", "y", "w", "h", "color"],
  ribbon: ["x", "y", "w", "h", "fill"],
  crescent: ["x", "y", "r", "fill"],
  rings: ["x", "y", "r", "stroke"],
  scallopBorder: ["x", "y", "w", "h", "color"],
  garland: ["x1", "y1", "x2", "y2"],
  bokeh: ["count"],
  brackets: ["x", "y", "w", "h", "color"],
  dotGrid: ["x", "y", "w", "h", "color"],
  waves: ["y", "fill"],
  lantern: ["x", "y"],
  flourish: ["x", "y", "color"],
  torn: ["x", "y", "w", "h", "fill"],
  halftone: ["x", "y", "w", "h", "color"],
  barcode: ["x", "y", "w", "h"],
  cloud: ["x", "y"],
  balloon: ["x", "y", "fill"],
  bunting: ["x1", "y1", "x2", "y2"],
  squiggle: ["x", "y", "w", "color"],
  textLines: ["x", "y", "w"],
  photoCorners: ["slot"],
  starTile: ["x", "y", "w", "h", "color"],
  starBand: ["x", "y", "w", "color"],
  rainbow: ["x", "y", "r", "colors"],
  wood: ["x", "y", "w", "h"],
  woodSlice: ["x", "y", "r"],
  perforated: ["x", "y", "w", "h", "fill", "holeColor"],
  lace: ["x", "y", "w", "h"],
  meadow: ["x", "y", "w", "h"],
  pillar: ["x", "y", "w", "h"],
  leaf: ["x", "y", "len", "width", "color"],
};

export const SLOT_SHAPES = ["rect", "circle", "arch", "pointedArch", "heart", "hexagon", "octagon", "rhombus", "scallop"];
const FONTS = ["serif", "sans", "script", "caps"];
const SLOT_LAYERS = ["slotShadow", "slotFrame", "vignette", "tint", "photoCorners"];

export function parseRatio(r) {
  const m = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(String(r || ""));
  return m ? Number(m[1]) / Number(m[2]) : NaN;
}

/** Path aset harus relatif (tanpa "/" di depan) agar tetap jalan di subdirektori, mis. GitHub Pages. */
export function isRelativeAssetPath(p) {
  return typeof p === "string" && /^assets\/[\w\-./]+\.(png|webp|jpe?g|svg)$/i.test(p) && !p.includes("..");
}

export function validateTemplate(t, categoryIds = null) {
  const errors = [];
  const err = (m) => errors.push(`[${t?.id || "tanpa-id"}] ${m}`);
  if (!t || typeof t !== "object") return ["Template bukan objek"];
  if (!t.id || !/^[a-z0-9-]+$/.test(t.id)) err("ID wajib berupa huruf kecil, angka, atau tanda hubung");
  if (!t.name) err("Nama wajib diisi");
  if (!t.category) err("Kategori wajib diisi");
  else if (categoryIds && !categoryIds.includes(t.category)) err(`Kategori tidak dikenal: ${t.category}`);
  if (!t.thumbnail) err("Thumbnail wajib diisi ('auto' atau path aset)");
  else if (t.thumbnail !== "auto" && !isRelativeAssetPath(t.thumbnail)) err(`Path thumbnail tidak valid: ${t.thumbnail}`);

  const W = t.canvas?.width, H = t.canvas?.height;
  if (!Number.isFinite(W) || !Number.isFinite(H) || W < 200 || H < 200 || W > 4000 || H > 4000) {
    err("Ukuran kanvas tidak valid (200–4000 px)");
  } else {
    const ratio = parseRatio(t.aspectRatio);
    if (!Number.isFinite(ratio)) err(`Rasio tidak valid: ${t.aspectRatio}`);
    else if (Math.abs(ratio - W / H) / ratio > 0.01) err(`Rasio ${t.aspectRatio} tidak sesuai kanvas ${W}x${H}`);
  }

  const slotIds = new Set();
  if (!Array.isArray(t.photoSlots) || !t.photoSlots.length) err("Minimal satu area foto");
  for (const s of t.photoSlots || []) {
    if (!s.id) err("Area foto tanpa ID");
    else if (slotIds.has(s.id)) err(`ID area foto duplikat: ${s.id}`);
    slotIds.add(s.id);
    if (s.shape && !SLOT_SHAPES.includes(s.shape)) err(`Bentuk area foto tidak dikenal: ${s.shape}`);
    if (![s.x, s.y, s.width, s.height].every(Number.isFinite) || s.width <= 0 || s.height <= 0) {
      err(`Ukuran area foto ${s.id} tidak valid`);
    } else if (s.x < 0 || s.y < 0 || s.x + s.width > W + 0.5 || s.y + s.height > H + 0.5) {
      err(`Area foto ${s.id} berada di luar kanvas`);
    }
  }

  if (!Array.isArray(t.layers)) err("Daftar layer wajib berupa array");
  const photoMarkers = (t.layers || []).filter((l) => l.type === "photos").length;
  if (photoMarkers !== 1) err(`Harus ada tepat satu layer "photos" (ditemukan ${photoMarkers})`);
  (t.layers || []).forEach((l, i) => {
    const req = LAYER_TYPES[l?.type];
    if (!req) return err(`Layer #${i} bertipe tidak dikenal: ${l?.type}`);
    for (const k of req) if (l[k] === undefined) err(`Layer #${i} (${l.type}) tanpa properti "${k}"`);
    if (SLOT_LAYERS.includes(l.type) && !slotIds.has(l.slot)) err(`Layer #${i} merujuk area foto tak dikenal: ${l.slot}`);
    if (l.type === "fill" && !l.color && !Array.isArray(l.gradient)) err(`Layer #${i} (fill) butuh color atau gradient`);
    if ((l.type === "text" || l.type === "arcText") && l.font && !FONTS.includes(l.font)) err(`Layer #${i} memakai font tak dikenal: ${l.font}`);
    if (l.type === "text" && !l.maxWidth) err(`Layer #${i} (text) wajib punya maxWidth agar teks panjang tidak keluar bingkai`);
    if (l.type === "image" && !isRelativeAssetPath(l.src)) err(`Layer #${i} path aset tidak valid: ${l.src}`);
    if (l.type === "shape" && !SLOT_SHAPES.includes(l.shape)) err(`Layer #${i} bentuk tidak dikenal: ${l.shape}`);
  });

  const formats = t.export?.formats;
  if (!Array.isArray(formats) || !formats.length || formats.some((f) => !["png", "jpg"].includes(f))) {
    err("export.formats harus berisi 'png' dan/atau 'jpg'");
  }
  return errors;
}

/** Validasi seluruh katalog. Mengembalikan template valid + daftar error (template rusak disaring). */
export function validateCatalog(data) {
  const errors = [];
  const categories = Array.isArray(data?.categories) ? data.categories : [];
  const catIds = categories.map((c) => c.id);
  if (!categories.length) errors.push("Daftar kategori kosong");
  const seen = new Set();
  const valid = [];
  for (const t of data?.templates || []) {
    const e = validateTemplate(t, catIds);
    if (t?.id && seen.has(t.id)) e.push(`[${t.id}] ID template duplikat`);
    seen.add(t?.id);
    if (e.length) errors.push(...e);
    else valid.push(t);
  }
  return { categories, templates: valid, errors };
}

/**
 * Deteksi template yang hanya berbeda warna/teks.
 * (1) Struktur JSON setelah semua warna, nama, dan teks dihapus tidak boleh sama.
 * (2) Kombinasi tata letak slot + jenis ornamen tidak boleh sama.
 */
export function findStructuralDuplicates(templates) {
  const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([^)]*\))$/i;
  const SKIP = new Set(["id", "name", "description", "featured", "active", "defaults", "category", "thumbnail", "text", "palette", "seed"]);
  const strip = (v) => {
    if (Array.isArray(v)) return v.map(strip);
    if (v && typeof v === "object") {
      const o = {};
      for (const k of Object.keys(v).sort()) if (!SKIP.has(k)) o[k] = strip(v[k]);
      return o;
    }
    return typeof v === "string" && COLOR.test(v) ? "C" : v;
  };
  const layoutKey = (t) =>
    t.aspectRatio + "|" + t.photoSlots.map((s) => `${s.shape || "rect"}:${Math.round(s.x / 20)},${Math.round(s.y / 20)},${Math.round(s.width / 20)},${Math.round(s.height / 20)}`).join(";") +
    "|" + [...new Set(t.layers.map((l) => l.type))].sort().join(",");
  const problems = [];
  const seenA = new Map(), seenB = new Map();
  for (const t of templates) {
    const a = JSON.stringify(strip(t)), b = layoutKey(t);
    if (seenA.has(a)) problems.push(`${t.id} hanya beda warna/teks dengan ${seenA.get(a)}`);
    else seenA.set(a, t.id);
    if (seenB.has(b)) problems.push(`${t.id} memiliki tata letak & jenis ornamen yang sama dengan ${seenB.get(b)}`);
    else seenB.set(b, t.id);
  }
  return problems;
}
