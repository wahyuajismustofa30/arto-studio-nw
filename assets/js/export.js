// Ekspor hasil akhir: render ulang komposisi di kanvas terpisah (bukan screenshot DOM), lalu toBlob.
import { renderTemplate, preloadTemplateAssets, resolveText } from "./renderer.js";
import { ensureFonts, fontsForTemplate } from "./fonts.js";

const MAX_SIDE = 4096;
const MAX_AREA = 16_000_000; // di bawah batas kanvas Safari iOS (~16,7 juta piksel)

export function exportScale(tpl, resolution) {
  if (resolution !== "high") return 1;
  const { width: w, height: h } = tpl.canvas;
  return Math.max(1, Math.min(2, MAX_SIDE / Math.max(w, h), Math.sqrt(MAX_AREA / (w * h))));
}

export function exportSize(tpl, resolution) {
  const s = exportScale(tpl, resolution);
  return { width: Math.round(tpl.canvas.width * s), height: Math.round(tpl.canvas.height * s) };
}

function slug(s) {
  return String(s || "").toLocaleLowerCase("id-ID").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
}

export function fileName(tpl, text, ext) {
  const v = resolveText(tpl, text);
  const base = [slug(v.name1), slug(v.name2), tpl.id].filter(Boolean).join("-") || "wedding-photo";
  return `${base}.${ext}`;
}

/** @returns {Promise<{blob: Blob, width: number, height: number}>} */
export async function renderBlob(tpl, { photos, text }, { format = "png", resolution = "standard" } = {}) {
  await ensureFonts(fontsForTemplate(tpl));
  const missing = await preloadTemplateAssets(tpl);
  if (missing.length) console.warn(missing.join("\n"));
  const scale = exportScale(tpl, resolution);
  const { width, height } = exportSize(tpl, resolution);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Perangkat kehabisan memori untuk membuat gambar. Coba resolusi Standar.");
  try {
    renderTemplate(ctx, tpl, {
      mode: "export",
      scale,
      photos,
      text,
      // JPEG tidak mendukung transparansi, jadi beri latar solid.
      background: format === "jpg" ? tpl.export?.jpgBackground || "#FFFCF8" : null,
    });
    const type = format === "jpg" ? "image/jpeg" : "image/png";
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.92));
    if (!blob || blob.size < 100) throw new Error("Gambar gagal dibuat. Coba resolusi Standar atau tutup aplikasi lain lalu ulangi.");
    return { blob, width, height };
  } finally {
    canvas.width = canvas.height = 0; // lepaskan memori kanvas segera
  }
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
