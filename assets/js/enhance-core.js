// Algoritma optimalisasi foto (murni, tanpa DOM) — dipakai Web Worker dan cadangan thread utama.
//
// Mode otomatis (konservatif, aman untuk foto yang sudah bagus):
//   1. Keseimbangan putih ringan (gray-world sebagian, maks. ±8%), melemah otomatis pada foto
//      yang warnanya memang dominan agar warna asli tidak "dinetralkan".
//   2. Perentangan level terbatas (persentil 0,5%–99,5%) bila rentang tonal foto sempit/kusam.
//   3. Gamma yang menjaga kecerahan rata-rata; hanya foto terlalu gelap/terang yang digeser.
//   4. Kurva-S kontras halus + vibrance (warna pudar dinaikkan lebih banyak dari warna yang sudah kuat).
//   5. Penajaman unsharp-mask pada luminans, dengan ambang agar noise tidak ikut diperkuat.
// Penyesuaian manual (kecerahan, kontras, saturasi, kehangatan, ketajaman) ditumpuk di atasnya.

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

export function analyze(px, w, h) {
  const n = w * h;
  const step = Math.max(1, Math.floor(n / 250000));
  const hist = new Uint32Array(256);
  let sr = 0, sg = 0, sb = 0, cnt = 0, sum = 0, total = 0;
  for (let i = 0; i < n; i += step) {
    const o = i * 4, r = px[o], g = px[o + 1], b = px[o + 2];
    const l = (r * 299 + g * 587 + b * 114) / 1000;
    hist[l | 0]++;
    sum += l;
    total++;
    if (l > 40 && l < 215) { sr += r; sg += g; sb += b; cnt++; }
  }
  const pct = (p) => {
    const target = total * p;
    let acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= target) return v / 255; }
    return 1;
  };
  return {
    lo: pct(0.005),
    hi: pct(0.995),
    mean: sum / total / 255,
    avg: cnt ? [sr / cnt, sg / cnt, sb / cnt] : [128, 128, 128],
  };
}

/** Bangun tabel lookup per kanal dari analisis + parameter. */
function buildLUT(params, a) {
  const lut = [new Uint8ClampedArray(256), new Uint8ClampedArray(256), new Uint8ClampedArray(256)];
  const auto = !!params.auto;
  // Keseimbangan putih: kuat bila foto hampir netral (rona lampu), melemah bila foto memang berwarna dominan.
  let gains = [1, 1, 1];
  if (auto && a) {
    const gray = (a.avg[0] + a.avg[1] + a.avg[2]) / 3;
    const spread = Math.max(...a.avg) - Math.min(...a.avg);
    const strength = spread < 20 ? 0.6 : spread > 60 ? 0 : (0.6 * (60 - spread)) / 40;
    gains = a.avg.map((c) => Math.min(1.08, Math.max(0.92, 1 + (gray / Math.max(c, 1) - 1) * strength)));
  }
  const warm = (params.warmth || 0) / 100;
  gains = [gains[0] * (1 + warm * 0.08), gains[1] * (1 + warm * 0.015), gains[2] * (1 - warm * 0.08)];
  // Perentangan level dibatasi, lalu gamma menjaga kecerahan rata-rata
  // (hanya foto yang terlalu gelap/terang yang digeser kecerahannya).
  let lo = 0, hi = 1, gamma = 1;
  if (auto && a) {
    if (a.hi - a.lo < 0.94) {
      lo = Math.min(a.lo * 0.6, 0.2);
      hi = a.hi + (1 - a.hi) * 0.4;
    }
    const mapped = clamp01((a.mean - lo) / Math.max(0.05, hi - lo));
    const target = a.mean < 0.32 ? 0.38 + a.mean * 0.25 : a.mean > 0.72 ? 0.68 : a.mean;
    if (mapped > 0.02 && mapped < 0.98) gamma = Math.min(1.35, Math.max(0.7, Math.log(target) / Math.log(mapped)));
  }
  const bright = (params.brightness || 0) / 100;
  const brightGamma = Math.pow(2, -bright * 0.9);
  const contrast = (params.contrast || 0) / 100;
  const sCurve = auto ? 0.16 : 0;
  for (let c = 0; c < 3; c++) {
    for (let v = 0; v < 256; v++) {
      let x = (v / 255) * gains[c];
      x = clamp01((x - lo) / (hi - lo));
      x = Math.pow(x, gamma * brightGamma);
      if (sCurve) x = x + (x * x * (3 - 2 * x) - x) * sCurve;
      if (contrast) x = 0.5 + (x - 0.5) * (1 + contrast * (contrast > 0 ? 0.6 : 0.5));
      lut[c][v] = Math.round(clamp01(x) * 255);
    }
  }
  return lut;
}

/** Proses piksel RGBA di tempat. `upscaled` menandai foto yang diperbesar (penajaman lebih kuat). */
export function processPixels(px, w, h, params = {}, { upscaled = false } = {}) {
  const auto = !!params.auto;
  const a = auto ? analyze(px, w, h) : null;
  const lut = buildLUT(params, a);
  const sat = (params.saturation || 0) / 100;
  const vib = auto ? 0.18 : 0;
  const n = w * h;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    let r = lut[0][px[o]], g = lut[1][px[o + 1]], b = lut[2][px[o + 2]];
    if (sat || vib) {
      const l = r * 0.299 + g * 0.587 + b * 0.114;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const curSat = mx ? (mx - mn) / mx : 0;
      const f = 1 + sat + vib * (1 - curSat);
      r = l + (r - l) * f;
      g = l + (g - l) * f;
      b = l + (b - l) * f;
    }
    px[o] = r; px[o + 1] = g; px[o + 2] = b; // Uint8ClampedArray membatasi otomatis
  }
  const amount = (auto ? (upscaled ? 0.6 : 0.3) : 0) + ((params.sharpness || 0) / 100) * 1.2;
  if (amount > 0.01) sharpen(px, w, h, amount);
  return px;
}

/** Unsharp mask pada luminans: blur kotak 3x3 terpisah, ambang 2 level untuk menahan noise. */
function sharpen(px, w, h, amount) {
  const n = w * h;
  const L = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    L[i] = px[o] * 0.299 + px[o + 1] * 0.587 + px[o + 2] * 0.114;
  }
  const tmp = new Float32Array(n);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const x0 = x > 0 ? x - 1 : x, x1 = x < w - 1 ? x + 1 : x;
      tmp[row + x] = (L[row + x0] + L[row + x] + L[row + x1]) / 3;
    }
  }
  for (let y = 0; y < h; y++) {
    const y0 = (y > 0 ? y - 1 : y) * w, y1 = (y < h - 1 ? y + 1 : y) * w, row = y * w;
    for (let x = 0; x < w; x++) {
      const blur = (tmp[y0 + x] + tmp[row + x] + tmp[y1 + x]) / 3;
      const d = L[row + x] - blur;
      if (d > -2 && d < 2) continue;
      const add = d * amount;
      const o = (row + x) * 4;
      px[o] += add; px[o + 1] += add; px[o + 2] += add;
    }
  }
}

export const NEUTRAL = Object.freeze({ auto: false, brightness: 0, contrast: 0, saturation: 0, warmth: 0, sharpness: 0 });
export const DEFAULT_ADJUST = Object.freeze({ ...NEUTRAL, auto: true });

export function isNeutral(a) {
  return !a || (!a.auto && !a.brightness && !a.contrast && !a.saturation && !a.warmth && !a.sharpness);
}
