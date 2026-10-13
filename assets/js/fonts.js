// Pemetaan kunci font template -> font stack CSS, plus pemuatan font sebelum menggambar ke kanvas.
// Kanvas tidak menunggu font secara otomatis; tanpa langkah ini teks bisa terekspor dengan font fallback.

export const FONT_FAMILIES = {
  serif: { family: "Cormorant Garamond", stack: '"Cormorant Garamond", Georgia, "Times New Roman", serif' },
  sans: { family: "Jost", stack: 'Jost, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  script: { family: "Great Vibes", stack: '"Great Vibes", "Brush Script MT", "Segoe Script", cursive' },
  caps: { family: "Cinzel", stack: 'Cinzel, "Trajan Pro", Georgia, serif' },
};

export function fontString({ font = "serif", size = 32, weight = 400, italic = false }) {
  const f = FONT_FAMILIES[font] || FONT_FAMILIES.serif;
  return `${italic ? "italic " : ""}${weight} ${Math.round(size * 100) / 100}px ${f.stack}`;
}

const loaded = new Set();

/** Kumpulkan varian font yang dipakai template. */
export function fontsForTemplate(tpl) {
  const out = new Map();
  for (const layer of tpl.layers || []) {
    if (layer.type === "text" || layer.type === "arcText") {
      const key = `${layer.font || "serif"}|${layer.weight || 400}|${layer.italic ? 1 : 0}`;
      out.set(key, { font: layer.font || "serif", weight: layer.weight || 400, italic: !!layer.italic });
    }
  }
  return [...out.values()];
}

/**
 * Pastikan font siap. Tidak pernah reject: bila font gagal/lambat (maks timeoutMs),
 * kanvas memakai fallback dari font stack sehingga aplikasi tetap berjalan.
 */
export async function ensureFonts(variants, timeoutMs = 4000) {
  if (!("fonts" in document)) return false;
  const pending = variants
    .map((v) => fontString({ ...v, size: 40 }))
    .filter((s) => !loaded.has(s))
    .map((s) => document.fonts.load(s).then(() => loaded.add(s)).catch(() => {}));
  if (!pending.length) return true;
  let timer;
  const timeout = new Promise((r) => (timer = setTimeout(() => r(false), timeoutMs)));
  const ok = await Promise.race([Promise.all(pending).then(() => true), timeout]);
  clearTimeout(timer);
  return ok;
}
