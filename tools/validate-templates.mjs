// Jalankan: node tools/validate-templates.mjs
// Memeriksa skema templates.json dan memastikan setiap path aset (thumbnail/layer image) benar-benar ada.
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateCatalog, findStructuralDuplicates } from "../assets/js/template-validator.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(await readFile(join(root, "assets/data/templates.json"), "utf8"));
for (const f of data.includes || []) {
  const extra = JSON.parse(await readFile(join(root, "assets/data", f), "utf8"));
  data.templates.push(...extra.templates);
}
const { templates, categories, errors } = validateCatalog(data);

for (const t of data.templates) {
  const paths = [t.thumbnail !== "auto" ? t.thumbnail : null, ...t.layers.filter((l) => l.type === "image").map((l) => l.src)].filter(Boolean);
  for (const p of paths) {
    try { await access(join(root, p)); } catch { errors.push(`[${t.id}] Aset tidak ditemukan: ${p}`); }
  }
}

const perCat = Object.fromEntries(categories.map((c) => [c.id, templates.filter((t) => t.category === c.id).length]));
console.log(`Template valid: ${templates.length}/${data.templates.length}`);
console.log("Per kategori:", perCat);
const emptyCats = Object.entries(perCat).filter(([, n]) => n === 0).map(([k]) => k);
if (emptyCats.length) errors.push(`Kategori tanpa template: ${emptyCats.join(", ")}`);
const dupes = findStructuralDuplicates(data.templates);
errors.push(...dupes);
const ratios = {};
for (const t of templates) ratios[t.aspectRatio] = (ratios[t.aspectRatio] || 0) + 1;
console.log("Per rasio:", ratios);
console.log(`Bentuk slot dipakai: ${[...new Set(templates.flatMap((t) => t.photoSlots.map((s) => s.shape || "rect")))].join(", ")}`);
console.log(`Pemeriksaan keunikan struktur: ${dupes.length ? dupes.length + " masalah" : "semua unik"}`);
if (errors.length) {
  console.error("\nMASALAH:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log("Semua template lolos validasi.");
