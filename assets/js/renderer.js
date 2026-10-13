// Renderer template: menggambar latar, foto (ter-clip pada slot), ornamen, dan teks ke Canvas 2D.
// Dipakai bersama oleh thumbnail galeri, kanvas editor, pratinjau, dan ekspor final,
// sehingga yang dilihat pengguna sama dengan yang diunduh.

import * as O from "./ornaments.js";
import * as X from "./ornaments-extra.js";
import { fontString } from "./fonts.js";

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;

export const DEFAULT_TEXT = Object.freeze({
  name1: "Novi",
  name2: "Wahyu",
  date: "16 Oktober 2026",
});

export const TEXT_LIMITS = Object.freeze({ name1: 24, name2: 24, date: 32, message: 60 });
const TOKEN_RE = /\{(name1|name2|date|message|i1|i2)\}/g;
const TOKEN_FIELD = { name1: "name1", name2: "name2", date: "date", message: "message", i1: "name1", i2: "name2" };

/** Token teks yang dipakai sebuah template (menentukan kolom teks yang tampil di editor). */
export function textTokensOf(tpl) {
  const set = new Set();
  for (const l of tpl.layers) {
    if ((l.type === "text" || l.type === "arcText") && typeof l.text === "string") {
      for (const m of l.text.matchAll(TOKEN_RE)) set.add(TOKEN_FIELD[m[1]]);
    }
  }
  return ["name1", "name2", "date", "message"].filter((k) => set.has(k));
}

const initial = (s) => ([...String(s || "").trim()][0] || "").toLocaleUpperCase("id-ID");

export function resolveText(tpl, text = {}) {
  const v = {
    name1: text.name1 ?? DEFAULT_TEXT.name1,
    name2: text.name2 ?? DEFAULT_TEXT.name2,
    date: text.date ?? DEFAULT_TEXT.date,
    message: text.message ?? tpl.defaults?.message ?? "",
  };
  return { ...v, i1: initial(v.name1), i2: initial(v.name2) };
}

// ---------- Geometri foto ----------

/** Ukuran foto setelah rotasi 90°-an. */
function rotatedSize(photo, rot) {
  return rot % 180 === 0 ? [photo.width, photo.height] : [photo.height, photo.width];
}

/** Skala minimum agar foto menutupi seluruh slot (mode "cover"). */
export function coverScale(slot, photo, rot = 0) {
  const [w, h] = rotatedSize(photo, rot);
  return Math.max(slot.width / w, slot.height / h);
}

/** Batasi geser & zoom agar slot tidak pernah memperlihatkan area kosong. */
export function clampTransform(slot, photo, t) {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, t.zoom || 1));
  const s = coverScale(slot, photo, t.rot) * zoom;
  const [w, h] = rotatedSize(photo, t.rot);
  const maxX = Math.max(0, (w * s - slot.width) / 2);
  const maxY = Math.max(0, (h * s - slot.height) / 2);
  return {
    ...t,
    zoom,
    ox: Math.min(maxX, Math.max(-maxX, t.ox || 0)),
    oy: Math.min(maxY, Math.max(-maxY, t.oy || 0)),
  };
}

/** Zoom di sekitar titik pivot (koordinat template) agar titik di bawah jari tetap diam. */
export function zoomAround(slot, photo, t, newZoom, pivotX, pivotY) {
  const oldZoom = t.zoom || 1;
  const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
  const k = z / oldZoom;
  const cx = slot.x + slot.width / 2, cy = slot.y + slot.height / 2;
  const px = pivotX - cx, py = pivotY - cy;
  return clampTransform(slot, photo, { ...t, zoom: z, ox: px + ((t.ox || 0) - px) * k, oy: py + ((t.oy || 0) - py) * k });
}

// ---------- Cache gambar untuk layer bertipe "image" ----------

const imageCache = new Map();

export function loadAssetImage(src) {
  if (!imageCache.has(src)) {
    imageCache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Aset gagal dimuat: ${src}`));
        img.src = src;
      })
    );
  }
  return imageCache.get(src);
}

const readyImages = new Map();

/** Muat semua aset gambar template. Aset yang gagal dicatat dan dilewati, bukan menghentikan render. */
export async function preloadTemplateAssets(tpl) {
  const failures = [];
  await Promise.all(
    tpl.layers
      .filter((l) => l.type === "image")
      .map((l) =>
        loadAssetImage(l.src)
          .then((img) => readyImages.set(l.src, img))
          .catch((e) => failures.push(e.message))
      )
  );
  return failures;
}

// ---------- Teks ----------

function measureSpaced(ctx, str, spacing) {
  if (!spacing) return ctx.measureText(str).width;
  let w = 0;
  for (const ch of str) w += ctx.measureText(ch).width;
  return w + spacing * Math.max(0, [...str].length - 1);
}

function drawSpaced(ctx, str, x, y, spacing, align) {
  if (!spacing) {
    ctx.textAlign = align;
    ctx.fillText(str, x, y);
    return;
  }
  const total = measureSpaced(ctx, str, spacing);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  ctx.textAlign = "left";
  for (const ch of str) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

function fillTokens(str, values) {
  return str.replace(TOKEN_RE, (_, k) => values[k] ?? "");
}

function drawTextLayer(ctx, l, values) {
  let str = fillTokens(l.text, values).replace(/\s+/g, " ").trim();
  if (!str) return;
  if (l.upper) str = str.toLocaleUpperCase("id-ID");
  if (l.lower) str = str.toLocaleLowerCase("id-ID");
  let size = l.size;
  const spacingRatio = (l.spacing || 0) / l.size;
  const minSize = l.size * (l.minScale || 0.4);
  ctx.font = fontString({ ...l, size });
  // Perkecil font sampai muat di maxWidth agar nama panjang tidak terpotong.
  if (l.maxWidth) {
    let guard = 0;
    while (measureSpaced(ctx, str, size * spacingRatio) > l.maxWidth && size > minSize && guard++ < 60) {
      size *= 0.95;
      ctx.font = fontString({ ...l, size });
    }
    // Jika masih kepanjangan di ukuran minimum, potong dengan elipsis.
    if (measureSpaced(ctx, str, size * spacingRatio) > l.maxWidth) {
      while (str.length > 1 && measureSpaced(ctx, str + "…", size * spacingRatio) > l.maxWidth) str = str.slice(0, -1);
      str = str.trimEnd() + "…";
    }
  }
  ctx.fillStyle = l.color || "#493A32";
  ctx.textBaseline = "middle";
  if (l.shadow) {
    ctx.shadowColor = l.shadow;
    ctx.shadowBlur = size * 0.25;
  }
  let tx = l.x, ty = l.y;
  if (l.rot) {
    ctx.translate(l.x, l.y);
    ctx.rotate(l.rot * O.DEG);
    tx = ty = 0;
  }
  drawSpaced(ctx, str, tx, ty, size * spacingRatio, l.align || "center");
}

function drawArcText(ctx, l, values) {
  let str = fillTokens(l.text, values).replace(/\s+/g, " ").trim();
  if (l.upper) str = str.toLocaleUpperCase("id-ID");
  const chars = [...str];
  ctx.strokeStyle = l.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(l.x, l.y, l.r + l.size * 0.9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(l.x, l.y, l.r - l.size * 0.9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = fontString(l);
  ctx.fillStyle = l.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const step = (Math.PI * 2) / Math.max(chars.length, 1);
  chars.forEach((ch, i) => {
    const a = -Math.PI / 2 + i * step;
    ctx.save();
    ctx.translate(l.x + Math.cos(a) * l.r, l.y + Math.sin(a) * l.r);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  O.heartPath(ctx, l.x, l.y - l.r * 0.32, l.r * 0.55);
  ctx.fill();
}

// ---------- Foto ----------

const SAMPLE_TONES = [
  ["#E8D9C8", "#D8A6A1", "#C5A46D"],
  ["#DDE3D6", "#A8B5A0", "#E8D9C8"],
  ["#F1E2DC", "#C9A8A0", "#A8B5A0"],
  ["#E9E0D3", "#B9A48A", "#D8A6A1"],
];

/** Foto contoh abstrak untuk thumbnail galeri (bukan foto asli). */
function drawSamplePhoto(ctx, slot, index) {
  const [a, b, c] = SAMPLE_TONES[index % SAMPLE_TONES.length];
  const { x, y, width: w, height: h } = slot;
  const g = ctx.createLinearGradient(x, y, x + w * 0.4, y + h);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.beginPath();
  ctx.arc(x + w * 0.68, y + h * 0.34, Math.min(w, h) * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,252,248,0.7)";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.78);
  ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.55, x + w * 0.62, y + h * 0.74);
  ctx.quadraticCurveTo(x + w * 0.82, y + h * 0.84, x + w, y + h * 0.66);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fillStyle = c;
  ctx.globalAlpha *= 0.55;
  ctx.fill();
}

function drawEmptySlot(ctx, slot, mode) {
  const { x, y, width: w, height: h } = slot;
  ctx.fillStyle = "#EFE6DA";
  ctx.fillRect(x, y, w, h);
  if (mode !== "edit") return;
  const cx = x + w / 2, cy = y + h / 2;
  const u = Math.min(w, h);
  ctx.strokeStyle = "#B49A78";
  ctx.lineWidth = Math.max(2, u * 0.008);
  ctx.setLineDash([u * 0.03, u * 0.02]);
  O.slotPath(ctx, slot, -u * 0.04);
  ctx.stroke();
  ctx.setLineDash([]);
  const r = u * 0.09;
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.6, r, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFCF8";
  ctx.fill();
  ctx.strokeStyle = "#C5A46D";
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy - r * 0.6);
  ctx.lineTo(cx + r * 0.45, cy - r * 0.6);
  ctx.moveTo(cx, cy - r * 1.05);
  ctx.lineTo(cx, cy - r * 0.15);
  ctx.stroke();
  ctx.fillStyle = "#6B5B4F";
  ctx.font = fontString({ font: "sans", size: Math.max(16, u * 0.05), weight: 500 });
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Ketuk untuk tambah foto", cx, cy + r * 0.95);
}

function drawPhotos(ctx, tpl, opts) {
  tpl.photoSlots.forEach((slot, i) => {
    ctx.save();
    O.slotPath(ctx, slot);
    ctx.clip();
    const entry = opts.photos?.[slot.id];
    if (opts.mode === "thumb") {
      drawSamplePhoto(ctx, slot, i);
    } else if (entry && entry.photo) {
      const t = clampTransform(slot, entry.photo, entry);
      const s = coverScale(slot, entry.photo, t.rot) * t.zoom;
      ctx.translate(slot.x + slot.width / 2 + t.ox, slot.y + slot.height / 2 + t.oy);
      ctx.rotate((t.rot || 0) * O.DEG);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      const pw = entry.photo.width * s, ph = entry.photo.height * s;
      ctx.drawImage(entry.photo.source, -pw / 2, -ph / 2, pw, ph);
    } else {
      drawEmptySlot(ctx, slot, opts.mode);
    }
    ctx.restore();
  });
}

// ---------- Layer ----------

function slotById(tpl, id) {
  return tpl.photoSlots.find((s) => s.id === id);
}

function applyStroke(ctx, l) {
  ctx.strokeStyle = l.stroke;
  ctx.lineWidth = l.lineWidth || 1;
  ctx.setLineDash(l.dash || []);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawLayer(ctx, tpl, l, opts, values) {
  const W = tpl.canvas.width, H = tpl.canvas.height;
  switch (l.type) {
    case "photos":
      drawPhotos(ctx, tpl, opts);
      break;
    case "fill": {
      if (l.gradient) {
        const g = ctx.createLinearGradient(0, 0, l.horizontal ? W : 0, l.horizontal ? 0 : H);
        l.gradient.forEach((c, i) => g.addColorStop(i / (l.gradient.length - 1), c));
        ctx.fillStyle = g;
      } else ctx.fillStyle = l.color;
      ctx.fillRect(0, 0, W, H);
      break;
    }
    case "rect": {
      if (l.rot) {
        ctx.translate(l.x + l.w / 2, l.y + l.h / 2);
        ctx.rotate(l.rot * O.DEG);
        ctx.translate(-(l.x + l.w / 2), -(l.y + l.h / 2));
      }
      ctx.beginPath();
      O.roundRectPath(ctx, l.x, l.y, l.w, l.h, l.r || 0);
      if (l.fill) {
        if (l.shadow) {
          ctx.shadowColor = l.shadow.color || "rgba(73,58,50,0.18)";
          ctx.shadowBlur = l.shadow.blur ?? 24;
          ctx.shadowOffsetY = l.shadow.y ?? 8;
        }
        ctx.fillStyle = l.fill;
        ctx.fill();
        ctx.shadowColor = "transparent";
      }
      if (l.stroke) applyStroke(ctx, l);
      break;
    }
    case "gradientRect": {
      const g = l.horizontal ? ctx.createLinearGradient(l.x, 0, l.x + l.w, 0) : ctx.createLinearGradient(0, l.y, 0, l.y + l.h);
      g.addColorStop(0, l.from);
      g.addColorStop(1, l.to);
      ctx.fillStyle = g;
      ctx.fillRect(l.x, l.y, l.w, l.h);
      break;
    }
    case "line":
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.lineCap = "round";
      applyStroke(ctx, l);
      break;
    case "slotShadow": {
      const s = slotById(tpl, l.slot);
      O.slotPath(ctx, s, l.grow || 0);
      ctx.shadowColor = l.color || "rgba(73,58,50,0.22)";
      ctx.shadowBlur = l.blur ?? 30;
      ctx.shadowOffsetY = l.offsetY ?? 10;
      ctx.fillStyle = l.fill || "#FFFFFF";
      ctx.fill();
      break;
    }
    case "slotFrame": {
      const s = slotById(tpl, l.slot);
      O.slotPath(ctx, s, l.grow || 0);
      applyStroke(ctx, l);
      break;
    }
    case "vignette": {
      const s = slotById(tpl, l.slot);
      O.slotPath(ctx, s);
      ctx.clip();
      const cx = s.x + s.width / 2, cy = s.y + s.height / 2;
      const r = Math.hypot(s.width, s.height) / 2;
      const g = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, `rgba(30,20,12,${l.strength ?? 0.5})`);
      ctx.fillStyle = g;
      ctx.fillRect(s.x, s.y, s.width, s.height);
      break;
    }
    case "tint": {
      const s = slotById(tpl, l.slot);
      if (!opts.photos?.[s.id]?.photo && opts.mode !== "thumb") break;
      O.slotPath(ctx, s);
      ctx.clip();
      ctx.globalCompositeOperation = l.blend || "color";
      ctx.fillStyle = l.color;
      ctx.fillRect(s.x, s.y, s.width, s.height);
      break;
    }
    case "text":
      drawTextLayer(ctx, l, values);
      break;
    case "arcText":
      drawArcText(ctx, l, values);
      break;
    case "flower":
      if (l.style === "daisy") {
        const pal = O.FLOWER_PALETTES[l.palette || "ivory"];
        X.daisy(ctx, l.x, l.y, l.r, l.color || pal.petals[1], l.center || pal.center);
        break;
      }
      O.flower(ctx, l.x, l.y, l.r, O.FLOWER_PALETTES[l.palette || "blush"].petals, O.FLOWER_PALETTES[l.palette || "blush"].center, l.petals || 6, (l.rot || 0) * O.DEG);
      break;
    case "flowerCluster":
      O.flowerCluster(ctx, l.x, l.y, l.s || 1, (l.rot || 0) * O.DEG, l.palette);
      break;
    case "sprig":
      O.sprig(ctx, l.x, l.y, l);
      break;
    case "star8":
      O.star8Path(ctx, l.x, l.y, l.r);
      if (l.fill) { ctx.fillStyle = l.fill; ctx.fill(); }
      if (l.stroke) applyStroke(ctx, l);
      break;
    case "diamond":
      O.diamondPath(ctx, l.x, l.y, l.r);
      ctx.fillStyle = l.fill;
      ctx.fill();
      break;
    case "heart":
      ctx.translate(l.x, l.y);
      ctx.rotate((l.rot || 0) * O.DEG);
      O.heartPath(ctx, 0, -l.s * 0.45, l.s);
      if (l.fill) {
        ctx.fillStyle = l.fill;
        ctx.fill();
      }
      if (l.stroke) applyStroke(ctx, l);
      break;
    case "divider":
      O.divider(ctx, l);
      break;
    case "islamicBorder":
      O.islamicBorder(ctx, l);
      break;
    case "filmHoles":
      O.filmHoles(ctx, l);
      break;
    case "wavyBorder":
      O.wavyBorder(ctx, l);
      break;
    case "tape":
      O.tape(ctx, l);
      break;
    case "scatter":
      drawScatter(ctx, tpl, l);
      break;
    case "grain": {
      const rand = O.rng(l.seed || 1);
      const [ax, ay, aw, ah] = l.area || [0, 0, W, H];
      ctx.fillStyle = l.color || "#493A32";
      for (let i = 0; i < (l.amount || 2000); i++) {
        const sz = 1 + rand() * 1.6;
        ctx.fillRect(ax + rand() * aw, ay + rand() * ah, sz, sz);
      }
      break;
    }
    case "image": {
      const img = readyImages.get(l.src);
      if (img) ctx.drawImage(img, l.x, l.y, l.w, l.h);
      break;
    }
    case "shape": X.shape(ctx, l); break;
    case "wreath": X.wreath(ctx, l); break;
    case "decoCorners": X.decoCorners(ctx, l); break;
    case "rays": X.rays(ctx, l); break;
    case "stripes": X.stripes(ctx, l); break;
    case "ribbon": X.ribbon(ctx, l); break;
    case "crescent": X.crescent(ctx, l); break;
    case "rings": X.rings(ctx, l); break;
    case "scallopBorder": X.scallopBorder(ctx, l); break;
    case "garland": X.garland(ctx, l); break;
    case "bokeh": X.bokeh(ctx, l, W, H); break;
    case "brackets": X.brackets(ctx, l); break;
    case "dotGrid": X.dotGrid(ctx, l); break;
    case "waves": X.waves(ctx, l, W, H); break;
    case "lantern": X.lantern(ctx, l); break;
    case "flourish": X.flourish(ctx, l); break;
    case "torn": X.torn(ctx, l); break;
    case "halftone": X.halftone(ctx, l); break;
    case "barcode": X.barcode(ctx, l); break;
    case "cloud": X.cloud(ctx, l); break;
    case "balloon": X.balloon(ctx, l); break;
    case "bunting": X.bunting(ctx, l); break;
    case "squiggle": X.squiggle(ctx, l); break;
    case "textLines": X.textLines(ctx, l); break;
    case "photoCorners": X.photoCorners(ctx, slotById(tpl, l.slot), l); break;
    case "starTile": X.starTile(ctx, l); break;
    case "starBand": X.starBand(ctx, l); break;
    case "rainbow": X.rainbow(ctx, l); break;
    case "wood": X.wood(ctx, l); break;
    case "woodSlice": X.woodSlice(ctx, l); break;
    case "perforated": X.perforated(ctx, l); break;
    case "lace": X.lace(ctx, l); break;
    case "meadow": X.meadow(ctx, l); break;
    case "pillar": X.pillar(ctx, l); break;
    case "leaf":
      ctx.translate(l.x, l.y);
      ctx.rotate((l.angle || 0) * O.DEG);
      O.leaf(ctx, l.len, l.width, l.color);
      break;
    default:
      break;
  }
}

function drawScatter(ctx, tpl, l) {
  const rand = O.rng(l.seed || 1);
  const [ax, ay, aw, ah] = l.area || [0, 0, tpl.canvas.width, tpl.canvas.height];
  const [smin, smax] = l.size || [8, 20];
  const colors = l.colors || ["#D8A6A1"];
  const margin = l.margin ?? 12;
  const inSlot = (px, py) =>
    tpl.photoSlots.some((s) => px > s.x - margin && px < s.x + s.width + margin && py > s.y - margin && py < s.y + s.height + margin);
  for (let i = 0; i < (l.count || 20); i++) {
    let px, py, tries = 0;
    do {
      px = ax + rand() * aw;
      py = ay + rand() * ah;
    } while (l.avoidSlots && inSlot(px, py) && ++tries < 40);
    const sz = smin + rand() * (smax - smin);
    const rot = (rand() - 0.5) * 0.8;
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    if (l.avoidSlots && inSlot(px, py)) continue;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    if (l.shape === "heart") O.heartPath(ctx, 0, -sz * 0.45, sz);
    else if (l.shape === "sparkle") O.sparklePath(ctx, 0, 0, sz);
    else if (l.shape === "star8") O.star8Path(ctx, 0, 0, sz);
    else if (l.shape === "star5") X.star5Path(ctx, 0, 0, sz);
    else if (l.shape === "petal") X.petalPath(ctx, sz);
    else if (l.shape === "confetti") { ctx.beginPath(); ctx.rect(-sz / 2, -sz / 5, sz, sz * 0.4); }
    else { ctx.beginPath(); ctx.arc(0, 0, sz / 2, 0, Math.PI * 2); }
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Gambar template ke ctx.
 * opts.mode: "thumb" (foto contoh), "edit" (placeholder interaktif), "export" (hasil final).
 * opts.scale: pengali dari satuan template ke piksel kanvas.
 * opts.photos: { [slotId]: { photo:{source,width,height}, zoom, ox, oy, rot } }
 */
export function renderTemplate(ctx, tpl, opts = {}) {
  const scale = opts.scale || 1;
  const values = resolveText(tpl, opts.text);
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, tpl.canvas.width, tpl.canvas.height);
  }
  for (const l of tpl.layers) {
    ctx.save();
    if (l.opacity != null) ctx.globalAlpha = l.opacity;
    drawLayer(ctx, tpl, l, opts, values);
    ctx.restore();
  }
  if (opts.mode === "edit" && opts.activeSlot && tpl.photoSlots.length > 1) {
    const s = slotById(tpl, opts.activeSlot);
    if (s) {
      O.slotPath(ctx, s, -3);
      ctx.strokeStyle = "rgba(197,164,109,0.95)";
      ctx.lineWidth = Math.max(3, 3 / scale);
      ctx.setLineDash([14, 10]);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Slot teratas yang memuat titik (x,y) dalam koordinat template. */
export function hitSlot(tpl, x, y) {
  for (let i = tpl.photoSlots.length - 1; i >= 0; i--) {
    const s = tpl.photoSlots[i];
    if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) return s;
  }
  return null;
}
