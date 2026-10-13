// API thread utama untuk optimalisasi foto: antrean ke Web Worker, cache hasil, dan perbesaran
// halus untuk foto beresolusi rendah. Bila Worker tidak tersedia, proses berjalan di thread utama.
import { processPixels, isNeutral, DEFAULT_ADJUST, NEUTRAL } from "./enhance-core.js";

export { isNeutral, DEFAULT_ADJUST, NEUTRAL };

export const PREVIEW_SIDE = 1400;   // ukuran kerja untuk tampilan editor
export const UPSCALE_TARGET = 1800; // sisi terpanjang minimal untuk ekspor bila "otomatis" aktif

let worker = null;
let workerBroken = false;
let seq = 0;
const pending = new Map();

function getWorker() {
  if (worker || workerBroken) return worker;
  try {
    worker = new Worker(new URL("./enhance-worker.js", import.meta.url), { type: "module" });
    worker.onmessage = (e) => {
      const job = pending.get(e.data.id);
      if (!job) return;
      pending.delete(e.data.id);
      e.data.error ? job.reject(new Error(e.data.error)) : job.resolve(new Uint8ClampedArray(e.data.buffer));
    };
    worker.onerror = (e) => {
      // Mis. browser tanpa dukungan module worker: jalankan ulang semua tugas di thread utama.
      e.preventDefault?.();
      workerBroken = true;
      worker = null;
      for (const [, job] of pending) job.fallback();
      pending.clear();
    };
  } catch {
    workerBroken = true;
    worker = null;
  }
  return worker;
}

function runJob(data, w, h, params, upscaled) {
  const local = () => processPixels(data, w, h, params, { upscaled });
  const wk = getWorker();
  if (!wk) return Promise.resolve(local());
  return new Promise((resolve, reject) => {
    const id = ++seq;
    // Simpan salinan untuk cadangan bila worker mati di tengah jalan (buffer asli dipindahkan).
    const copy = new Uint8ClampedArray(data);
    pending.set(id, { resolve, reject, fallback: () => resolve(processPixels(copy, w, h, params, { upscaled })) });
    wk.postMessage({ id, width: w, height: h, buffer: data.buffer, params, upscaled }, [data.buffer]);
  });
}

// Cache kanvas hasil: kunci = id foto + ukuran + parameter.
const cache = new Map();
const MAX_CACHE = 14;

function cacheGet(key) {
  const v = cache.get(key);
  if (v) { cache.delete(key); cache.set(key, v); }
  return v;
}
function cacheSet(key, value) {
  cache.set(key, value);
  // Entri lama cukup dilepas dari cache; kanvasnya dibebaskan GC bila tidak lagi ditampilkan.
  while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
}

/** Lepaskan semua hasil cache milik foto tertentu (saat foto dibuang dari riwayat). */
export function forgetPhoto(photoId) {
  for (const k of [...cache.keys()]) if (k.startsWith(`${photoId}|`)) cache.delete(k);
}

const keyOf = (a) => [a.auto ? 1 : 0, a.brightness | 0, a.contrast | 0, a.saturation | 0, a.warmth | 0, a.sharpness | 0].join(",");

/**
 * Hasilkan kanvas foto teroptimasi.
 * mode "preview": diperkecil ke PREVIEW_SIDE (cepat, untuk editor).
 * mode "full": resolusi kerja penuh; bila otomatis & foto kecil, diperbesar halus hingga UPSCALE_TARGET.
 * Mengembalikan sumber asli bila parameter netral.
 */
export function getEnhanced(photoId, photo, adjust, mode = "preview") {
  if (isNeutral(adjust)) return Promise.resolve(photo.source);
  const long = Math.max(photo.width, photo.height);
  let target = mode === "preview" ? Math.min(long, PREVIEW_SIDE) : long;
  const upscaled = mode === "full" && adjust.auto && long < UPSCALE_TARGET;
  if (upscaled) target = Math.min(UPSCALE_TARGET, long * 2);
  const key = `${photoId}|${mode}|${target}|${keyOf(adjust)}`;
  const hit = cacheGet(key);
  if (hit) return hit;
  const p = (async () => {
    const k = target / long;
    const w = Math.max(1, Math.round(photo.width * k)), h = Math.max(1, Math.round(photo.height * k));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(photo.source, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const out = await runJob(img.data, w, h, { ...adjust }, upscaled);
    ctx.putImageData(new ImageData(out, w, h), 0, 0);
    return c;
  })();
  cacheSet(key, p);
  p.catch(() => cache.delete(key));
  return p;
}

/** Ringkasan kualitas sumber foto untuk ditampilkan ke pengguna. */
export function describeResolution(photo) {
  const long = Math.max(photo.origWidth || photo.width, photo.origHeight || photo.height);
  if (long >= 2000) return { level: "good", text: "Resolusi foto sangat baik untuk cetak dan ekspor resolusi tinggi." };
  if (long >= 1200) return { level: "ok", text: "Resolusi foto cukup untuk ekspor standar." };
  return { level: "low", text: "Resolusi foto rendah. Mode otomatis akan memperbesarnya secara halus dan menajamkan detail saat ekspor — hasil tetap terbatas oleh detail asli foto." };
}
