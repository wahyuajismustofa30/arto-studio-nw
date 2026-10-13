// Memuat katalog template dari assets/data/templates.json, memvalidasi, dan menyaring template rusak.
// Path relatif agar tetap berfungsi bila website di-hosting di subdirektori (mis. GitHub Pages).
import { validateCatalog } from "./template-validator.js";

let cache = null;

export function loadCatalog() {
  if (!cache) {
    const getJSON = (path) =>
      fetch(path, { cache: "no-cache" }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} (${path})`);
        return r.json();
      });
    cache = getJSON("assets/data/templates.json")
      .then(async (main) => {
        // Katalog tambahan (mis. templates-koleksi-2.json) digabung ke katalog utama.
        const extra = await Promise.all((main.includes || []).map((f) => getJSON(`assets/data/${f}`)));
        return { ...main, templates: [...main.templates, ...extra.flatMap((d) => d.templates || [])] };
      })
      .then((data) => {
        const result = validateCatalog(data);
        if (result.errors.length) console.warn("Template dilewati karena tidak valid:\n" + result.errors.join("\n"));
        const templates = result.templates.filter((t) => t.active !== false);
        return { ...result, templates, byId: new Map(templates.map((t) => [t.id, t])) };
      })
      .catch((e) => {
        cache = null; // izinkan mencoba lagi
        throw new Error(
          location.protocol === "file:"
            ? "Website harus dibuka lewat server (http://), bukan langsung dari file. Lihat README."
            : `Daftar template gagal dimuat (${e.message}). Periksa koneksi lalu muat ulang halaman.`
        );
      });
  }
  return cache;
}

export function categoryName(catalog, id) {
  return catalog.categories.find((c) => c.id === id)?.name || id;
}

export function ratioLabel(tpl) {
  const map = {
    "4:5": "Portrait 4:5", "3:4": "Portrait 3:4", "2:3": "Cetak 4R 2:3", "9:16": "Story 9:16",
    "1:1": "Square 1:1", "3:2": "Landscape 3:2", "1:3": "Strip 1:3", "3:1": "Strip lanskap 3:1",
  };
  return map[tpl.aspectRatio] || tpl.aspectRatio;
}

export function photoCountLabel(tpl) {
  const n = tpl.photoSlots.length;
  return n === 1 ? "1 foto" : `${n} foto`;
}
