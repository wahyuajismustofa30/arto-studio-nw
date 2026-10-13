// Ornamen koleksi kedua: dipakai oleh template di templates-koleksi-2.json.
// Semua digambar prosedural (tanpa file gambar) dalam satuan kanvas template.
import { rng, DEG, leaf, star8Path, diamondPath, slotPath } from "./ornaments.js";

/** "#RRGGBB" -> rgba() dengan alfa tertentu. Nilai non-hex dikembalikan apa adanya. */
export function alpha(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function stroke(ctx, color, width = 2, dash) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash || []);
  ctx.stroke();
  ctx.setLineDash([]);
}

function quadPt(x1, y1, cx, cy, x2, y2, t) {
  const u = 1 - t;
  return [u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2];
}

/** Bentuk bebas memakai geometri slot (lengkung, kubah, hati, heksagon, ...). */
export function shape(ctx, l) {
  slotPath(ctx, { shape: l.shape, x: l.x, y: l.y, width: l.w, height: l.h, radius: l.radius }, l.grow || 0);
  if (l.fill) {
    ctx.fillStyle = l.fill;
    ctx.fill();
  }
  if (l.stroke) stroke(ctx, l.stroke, l.lineWidth || 1, l.dash);
}

export function daisy(ctx, x, y, r, petal = "#FFFCF8", center = "#E3CB98") {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = petal;
  for (let i = 0; i < 12; i++) {
    ctx.save();
    ctx.rotate((i / 12) * Math.PI * 2);
    ctx.beginPath();
    ctx.ellipse(r * 0.55, 0, r * 0.45, r * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
  ctx.fillStyle = center;
  ctx.fill();
  ctx.restore();
}

/** Karangan daun melingkar (mahkota/wreath). */
export function wreath(ctx, { x, y, r, color = "#A8B5A0", color2, leaves = 36, from = 0, to = 360, leafLen = 40, round = false, lineWidth = 2 }) {
  const a0 = from * DEG, a1 = to * DEG;
  ctx.beginPath();
  ctx.arc(x, y, r, a0, a1);
  stroke(ctx, color2 || color, lineWidth);
  for (let i = 0; i < leaves; i++) {
    const a = a0 + (a1 - a0) * ((i + 0.5) / leaves);
    const side = i % 2 ? 1 : -1;
    const c = color2 && i % 3 === 0 ? color2 : color;
    ctx.save();
    ctx.translate(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.rotate(a + Math.PI / 2 + side * 0.65);
    if (round) {
      ctx.beginPath();
      ctx.ellipse(leafLen * 0.45, 0, leafLen * 0.38, leafLen * 0.32, 0, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();
    } else leaf(ctx, leafLen, leafLen * 0.3, c);
    ctx.restore();
  }
}

/** Sudut bergaya art deco: garis L bertingkat + kipas. */
export function decoCorners(ctx, { x, y, w, h, size = 120, color, lineWidth = 2 }) {
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sx, sy);
    for (let k = 0; k < 3; k++) {
      const d = k * size * 0.14, L = size * (1 - k * 0.22);
      ctx.beginPath();
      ctx.moveTo(d, L);
      ctx.lineTo(d, d);
      ctx.lineTo(L, d);
      stroke(ctx, color, lineWidth);
    }
    const o = size * 0.3, f = size * 0.32;
    ctx.beginPath();
    ctx.arc(o, o, f, 0, Math.PI / 2);
    stroke(ctx, color, lineWidth);
    for (let i = 1; i < 4; i++) {
      const a = (i * Math.PI) / 8;
      ctx.beginPath();
      ctx.moveTo(o, o);
      ctx.lineTo(o + Math.cos(a) * f, o + Math.sin(a) * f);
      stroke(ctx, color, lineWidth * 0.7);
    }
    diamondPath(ctx, size * 0.72, size * 0.72, size * 0.05);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }
}

/** Sinar matahari / berkas cahaya. ratio = lebar berkas relatif terhadap jarak antarberkas. */
export function rays(ctx, { x, y, count = 24, inner = 0, outer = 600, color, from = 0, to = 360, ratio = 0.5 }) {
  ctx.fillStyle = color;
  const step = ((to - from) * DEG) / count;
  for (let i = 0; i < count; i++) {
    const a = from * DEG + (i + 0.5) * step, half = (step * ratio) / 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a - half * 0.3) * inner, y + Math.sin(a - half * 0.3) * inner);
    ctx.lineTo(x + Math.cos(a - half) * outer, y + Math.sin(a - half) * outer);
    ctx.lineTo(x + Math.cos(a + half) * outer, y + Math.sin(a + half) * outer);
    ctx.lineTo(x + Math.cos(a + half * 0.3) * inner, y + Math.sin(a + half * 0.3) * inner);
    ctx.closePath();
    ctx.fill();
  }
}

export function stripes(ctx, { x, y, w, h, width = 20, gap = 20, angle = 0, color }) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const d = Math.hypot(w, h);
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(angle * DEG);
  ctx.fillStyle = color;
  for (let s = -d / 2; s < d / 2; s += width + gap) ctx.fillRect(s, -d / 2, width, d);
  ctx.restore();
}

/** Pita spanduk dengan ekor berlekuk. (x, y) = pusat pita. */
export function ribbon(ctx, { x, y, w, h, fill, fill2, tail }) {
  const t = tail ?? h * 0.9, x0 = x - w / 2, x1 = x + w / 2, y0 = y - h / 2, y1 = y + h / 2, drop = h * 0.28, k = h * 0.5;
  ctx.fillStyle = fill2 || fill;
  for (const s of [-1, 1]) {
    const e = s < 0 ? x0 : x1;
    ctx.beginPath();
    ctx.moveTo(e - s * k, y0 + drop);
    ctx.lineTo(e + s * t, y0 + drop);
    ctx.lineTo(e + s * (t - h * 0.35), y0 + drop + h / 2);
    ctx.lineTo(e + s * t, y1 + drop);
    ctx.lineTo(e - s * k, y1 + drop);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e, y1);
    ctx.lineTo(e - s * k, y1 + drop);
    ctx.lineTo(e - s * k, y1);
    ctx.closePath();
    ctx.fillStyle = "rgba(40,25,15,0.22)";
    ctx.fill();
    ctx.fillStyle = fill2 || fill;
  }
  ctx.fillStyle = fill;
  ctx.fillRect(x0, y0, w, h);
}

export function crescent(ctx, { x, y, r, fill, rot = 0 }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot * DEG);
  ctx.beginPath();
  ctx.rect(-r * 2, -r * 2, r * 4, r * 4);
  ctx.arc(r * 0.38, -r * 0.12, r * 0.84, 0, Math.PI * 2, true);
  ctx.clip("evenodd");
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

export function rings(ctx, { x, y, r, stroke: color, lineWidth = 3 }) {
  for (const dx of [-r * 0.55, r * 0.55]) {
    ctx.beginPath();
    ctx.arc(x + dx, y, r, 0, Math.PI * 2);
    stroke(ctx, color, lineWidth);
  }
  diamondPath(ctx, x + r * 0.55, y - r - lineWidth - r * 0.2, r * 0.22);
  ctx.fillStyle = color;
  ctx.fill();
}

/** Bingkai renda: garis persegi dengan lengkung setengah lingkaran ke luar dan titik lubang. */
export function scallopBorder(ctx, { x, y, w, h, r = 14, color, lineWidth = 2, dots = true }) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = color;
  const side = (x0, y0, x1, y1, nx, ny) => {
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(len / (r * 2)));
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len, seg = len / n, a = Math.atan2(ny, nx);
    for (let i = 0; i < n; i++) {
      const cx = x0 + ux * seg * (i + 0.5), cy = y0 + uy * seg * (i + 0.5);
      ctx.beginPath();
      ctx.arc(cx, cy, seg / 2, a - Math.PI / 2, a + Math.PI / 2);
      stroke(ctx, color, lineWidth);
      if (dots) {
        ctx.beginPath();
        ctx.arc(cx + nx * seg * 0.22, cy + ny * seg * 0.22, Math.max(1.5, seg * 0.07), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  side(x, y, x + w, y, 0, -1);
  side(x + w, y, x + w, y + h, 1, 0);
  side(x + w, y + h, x, y + h, 0, 1);
  side(x, y + h, x, y, -1, 0);
}

/** Untaian lampu bohlam dengan cahaya lembut. */
export function garland(ctx, { x1, y1, x2, y2, sag = 80, count = 12, wire = "#5A4A3E", bulb = "#F3D9A0", size = 14 }) {
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 + sag * 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  stroke(ctx, wire, 2.5);
  for (let i = 0; i < count; i++) {
    const [px, py] = quadPt(x1, y1, cx, cy, x2, y2, (i + 0.5) / count);
    const by = py + size * 1.1;
    const g = ctx.createRadialGradient(px, by, 0, px, by, size * 3.4);
    g.addColorStop(0, alpha(bulb, 0.5));
    g.addColorStop(1, alpha(bulb, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, by, size * 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = wire;
    ctx.fillRect(px - size * 0.3, py, size * 0.6, size * 0.5);
    ctx.beginPath();
    ctx.ellipse(px, by, size * 0.55, size * 0.75, 0, 0, Math.PI * 2);
    ctx.fillStyle = bulb;
    ctx.fill();
  }
}

export function bokeh(ctx, { count = 16, seed = 1, area, colors = ["#FFFFFF"], size = [20, 60] }, W, H) {
  const rand = rng(seed);
  const [ax, ay, aw, ah] = area || [0, 0, W, H];
  for (let i = 0; i < count; i++) {
    const r = size[0] + rand() * (size[1] - size[0]);
    const px = ax + rand() * aw, py = ay + rand() * ah;
    const c = colors[Math.floor(rand() * colors.length)];
    const g = ctx.createRadialGradient(px, py, r * 0.2, px, py, r);
    g.addColorStop(0, alpha(c, 0.55));
    g.addColorStop(0.8, alpha(c, 0.35));
    g.addColorStop(1, alpha(c, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function brackets(ctx, { x, y, w, h, len = 50, color, lineWidth = 2 }) {
  ctx.lineCap = "square";
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + sy * len);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + sx * len, cy);
    stroke(ctx, color, lineWidth);
  }
}

export function dotGrid(ctx, { x, y, w, h, gap = 40, r = 4, color, offsetRows = true }) {
  ctx.fillStyle = color;
  let row = 0;
  for (let py = y + gap / 2; py < y + h; py += gap, row++) {
    for (let px = x + gap / 2 + (offsetRows && row % 2 ? gap / 2 : 0); px < x + w; px += gap) {
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Bidang bergelombang dari garis y sampai bawah kanvas. */
export function waves(ctx, { x = 0, y, w, amp = 30, wave = 300, fill, phase = 0, bottom }, W, H) {
  const ww = w ?? W, yb = bottom ?? H;
  const f = (px) => y + Math.sin((px / wave) * Math.PI * 2 + phase) * amp;
  ctx.beginPath();
  ctx.moveTo(x, yb);
  for (let px = 0; px < ww; px += 8) ctx.lineTo(x + px, f(px));
  ctx.lineTo(x + ww, f(ww));
  ctx.lineTo(x + ww, yb);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Lentera gantung dengan cahaya. (x, y) = puncak badan lentera, top = titik gantung. */
export function lantern(ctx, { x, y, top = 0, s = 1, color = "#C5A46D", glow = "#F3D9A0" }) {
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x, y - 40 * s);
  stroke(ctx, color, 2);
  const g = ctx.createRadialGradient(x, y + 40 * s, 0, x, y + 40 * s, 150 * s);
  g.addColorStop(0, alpha(glow, 0.45));
  g.addColorStop(1, alpha(glow, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y + 40 * s, 150 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.arc(0, -33, 7, 0, Math.PI * 2);
  stroke(ctx, color, 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-14, -26); ctx.lineTo(14, -26); ctx.lineTo(30, -6); ctx.lineTo(-30, -6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-30, -6); ctx.lineTo(30, -6); ctx.lineTo(40, 40); ctx.lineTo(30, 86); ctx.lineTo(-30, 86); ctx.lineTo(-40, 40);
  ctx.closePath();
  ctx.fillStyle = alpha(glow, 0.92);
  ctx.fill();
  stroke(ctx, color, 3);
  ctx.beginPath();
  ctx.moveTo(0, -6); ctx.lineTo(0, 86);
  ctx.moveTo(-15, -6); ctx.lineTo(-21, 40); ctx.lineTo(-15, 86);
  ctx.moveTo(15, -6); ctx.lineTo(21, 40); ctx.lineTo(15, 86);
  stroke(ctx, color, 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-30, 86); ctx.lineTo(30, 86); ctx.lineTo(16, 104); ctx.lineTo(-16, 104);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 104); ctx.lineTo(0, 120);
  stroke(ctx, color, 2);
  ctx.beginPath();
  ctx.arc(0, 124, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Ukiran garis simetris (flourish) untuk gaya klasik & emas. */
export function flourish(ctx, { x, y, w = 400, color, lineWidth = 2, flip = false }) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(1, -1);
  ctx.lineCap = "round";
  ctx.fillStyle = color;
  const h = w / 2;
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.scale(s, 1);
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.bezierCurveTo(h * 0.25, -h * 0.2, h * 0.45, h * 0.16, h * 0.7, 0);
    ctx.bezierCurveTo(h * 0.82, -h * 0.08, h * 0.94, -h * 0.02, h, 0);
    stroke(ctx, color, lineWidth);
    ctx.beginPath();
    ctx.arc(h * 0.62, -h * 0.075, h * 0.06, Math.PI * 0.15, Math.PI * 1.75);
    stroke(ctx, color, lineWidth * 0.8);
    ctx.beginPath();
    ctx.moveTo(h * 0.28, -h * 0.04);
    ctx.bezierCurveTo(h * 0.32, -h * 0.18, h * 0.46, -h * 0.2, h * 0.5, -h * 0.11);
    stroke(ctx, color, lineWidth * 0.8);
    ctx.beginPath();
    ctx.moveTo(h * 0.36, h * 0.03);
    ctx.bezierCurveTo(h * 0.4, h * 0.13, h * 0.5, h * 0.13, h * 0.53, h * 0.07);
    stroke(ctx, color, lineWidth * 0.7);
    ctx.beginPath();
    ctx.arc(h, 0, Math.max(2, lineWidth * 1.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  diamondPath(ctx, 0, 0, Math.max(5, lineWidth * 3));
  ctx.fill();
  ctx.restore();
}

/** Kertas sobek dengan tepi bergerigi acak (deterministik). */
export function torn(ctx, { x, y, w, h, fill, seed = 1, amp = 18, edge = "top" }) {
  const rand = rng(seed);
  ctx.beginPath();
  if (edge === "top") {
    ctx.moveTo(x, y + h);
    for (let px = 0; px <= w; px += 14) ctx.lineTo(x + px, y + (rand() - 0.5) * amp * 2);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    for (let px = w; px >= 0; px -= 14) ctx.lineTo(x + px, y + h + (rand() - 0.5) * amp * 2);
  }
  ctx.closePath();
  ctx.shadowColor = "rgba(73,58,50,0.2)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = edge === "top" ? -4 : 4;
  ctx.fillStyle = fill;
  ctx.fill();
}

export function halftone(ctx, { x, y, w, h, gap = 24, maxR = 10, color, dir = "tl" }) {
  ctx.fillStyle = color;
  const cx = dir.includes("l") ? x : x + w, cy = dir.includes("t") ? y : y + h;
  const maxD = Math.hypot(w, h) * 0.6;
  for (let py = y + gap / 2; py < y + h; py += gap) {
    for (let px = x + gap / 2; px < x + w; px += gap) {
      const r = maxR * (1 - Math.hypot(px - cx, py - cy) / maxD);
      if (r < 0.8) continue;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function barcode(ctx, { x, y, w, h, seed = 1, color = "#111111" }) {
  const rand = rng(seed);
  ctx.fillStyle = color;
  let px = x;
  while (px < x + w) {
    const bw = 1.5 + Math.floor(rand() * 4) * 1.5;
    if (rand() > 0.3) ctx.fillRect(px, y, Math.min(bw, x + w - px), h);
    px += bw + 1.5 + rand() * 2;
  }
}

export function cloud(ctx, { x, y, s = 1, fill = "#FFFFFF" }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = fill;
  for (const [cx, cy, r] of [[-62, 12, 38], [-18, -16, 54], [42, -4, 46], [82, 18, 30]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(8, 30, 100, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function balloon(ctx, { x, y, r = 80, fill, string = "#B49A78", len }) {
  const L = len ?? r * 3;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 1.2);
  ctx.bezierCurveTo(x + r * 0.3, y + r * 1.2 + L * 0.3, x - r * 0.3, y + r * 1.2 + L * 0.6, x, y + r * 1.2 + L);
  stroke(ctx, string, 2);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 1.1);
  ctx.lineTo(x - r * 0.11, y + r * 1.26);
  ctx.lineTo(x + r * 0.11, y + r * 1.26);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - r * 0.35, y - r * 0.42, r * 0.17, r * 0.3, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fill();
}

/** Bendera segitiga (bunting) pada tali melengkung. */
export function bunting(ctx, { x1, y1, x2, y2, sag = 60, count = 10, colors = ["#D8A6A1"], size = 60, string = "#B49A78" }) {
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 + sag * 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  stroke(ctx, string, 2.5);
  for (let i = 0; i < count; i++) {
    const [ax, ay] = quadPt(x1, y1, cx, cy, x2, y2, (i + 0.12) / count);
    const [bx, by] = quadPt(x1, y1, cx, cy, x2, y2, (i + 0.88) / count);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo((ax + bx) / 2, (ay + by) / 2 + size);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
  }
}

export function squiggle(ctx, { x, y, w, amp = 8, wave = 50, color, lineWidth = 3 }) {
  ctx.beginPath();
  for (let px = 0; px <= w; px += 4) {
    const py = y + Math.sin((px / wave) * Math.PI * 2) * amp;
    px ? ctx.lineTo(x + px, py) : ctx.moveTo(x + px, py);
  }
  ctx.lineCap = "round";
  stroke(ctx, color, lineWidth);
}

/** Baris abu-abu sebagai simbol kolom teks (dekoratif, gaya koran/majalah). */
export function textLines(ctx, { x, y, w, lines = 8, gap = 30, color = "rgba(73,58,50,0.22)", lineWidth = 6, seed = 1 }) {
  const rand = rng(seed);
  ctx.lineCap = "round";
  for (let i = 0; i < lines; i++) {
    const short = i === lines - 1 || rand() < 0.12;
    const len = short ? w * (0.35 + rand() * 0.4) : w * (0.9 + rand() * 0.1);
    ctx.beginPath();
    ctx.moveTo(x, y + i * gap);
    ctx.lineTo(x + len, y + i * gap);
    stroke(ctx, color, lineWidth);
  }
}

/** Sudut foto album (segitiga penahan) di keempat sudut slot. */
export function photoCorners(ctx, slot, { size = 50, color = "#2A231F" }) {
  const { x, y, width: w, height: h } = slot, g = size * 0.22;
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 4;
  const tri = (a, b, c) => {
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.lineTo(...c);
    ctx.closePath();
    ctx.fill();
  };
  tri([x - g, y - g], [x + size, y - g], [x - g, y + size]);
  tri([x + w + g, y - g], [x + w - size, y - g], [x + w + g, y + size]);
  tri([x - g, y + h + g], [x + size, y + h + g], [x - g, y + h - size]);
  tri([x + w + g, y + h + g], [x + w - size, y + h + g], [x + w + g, y + h - size]);
}

/** Pola ubin bintang delapan yang saling terhubung. */
export function starTile(ctx, { x, y, w, h, gap = 90, r = 24, color, lineWidth = 1.5 }) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = color;
  for (let py = y; py <= y + h + gap; py += gap) {
    for (let px = x; px <= x + w + gap; px += gap) {
      star8Path(ctx, px, py, r);
      stroke(ctx, color, lineWidth);
      ctx.beginPath();
      ctx.moveTo(px + r, py);
      ctx.lineTo(px + gap - r, py);
      ctx.moveTo(px, py + r);
      ctx.lineTo(px, py + gap - r);
      stroke(ctx, color, lineWidth * 0.7);
      diamondPath(ctx, px + gap / 2, py + gap / 2, r * 0.3);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Satu baris bintang delapan yang dihubungkan garis. */
export function starBand(ctx, { x, y, w, size = 30, color, lineWidth = 1.5 }) {
  const n = Math.max(2, Math.round(w / (size * 2.2)) + 1), step = w / (n - 1), r = size * 0.42;
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const px = x + i * step;
    star8Path(ctx, px, y, r);
    stroke(ctx, color, lineWidth);
    if (i < n - 1) {
      ctx.beginPath();
      ctx.moveTo(px + r, y);
      ctx.lineTo(px + step - r, y);
      stroke(ctx, color, lineWidth * 0.7);
      diamondPath(ctx, px + step / 2, y, r * 0.25);
      ctx.fill();
    }
  }
}

export function rainbow(ctx, { x, y, r, width = 30, colors }) {
  colors.forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(x, y, r - i * width, Math.PI, 0);
    stroke(ctx, c, width);
  });
}

/** Papan kayu horizontal dengan serat, mata kayu, dan celah. */
export function wood(ctx, { x, y, w, h, plank = 130, colors = ["#9A7356", "#8A6446"], seed = 1 }) {
  const rand = rng(seed);
  let i = 0;
  for (let py = y; py < y + h; py += plank, i++) {
    const ph = Math.min(plank, y + h - py);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(x, py, w, ph);
    for (let g = 0; g < 5; g++) {
      const gy = py + ph * (0.15 + g * 0.17);
      ctx.beginPath();
      for (let px = 0; px <= w; px += 20) {
        const yy = gy + Math.sin(px / (120 + g * 30) + i * 1.7 + g) * 3;
        px ? ctx.lineTo(x + px, yy) : ctx.moveTo(x + px, yy);
      }
      stroke(ctx, "rgba(60,40,25,0.16)", 1.5);
    }
    if (rand() < 0.6) {
      ctx.beginPath();
      ctx.ellipse(x + rand() * w, py + ph * (0.3 + rand() * 0.4), 14 + rand() * 10, 6 + rand() * 4, 0, 0, Math.PI * 2);
      stroke(ctx, "rgba(60,40,25,0.25)", 1.5);
    }
    ctx.fillStyle = "rgba(40,25,15,0.35)";
    ctx.fillRect(x, py + ph - 3, w, 3);
  }
}

/** Irisan batang kayu dengan cincin tahun. */
export function woodSlice(ctx, { x, y, r, seed = 1, bark = "#6B4A33", inner = "#D9BC8E", ring = "#A97F52" }) {
  const rand = rng(seed);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = bark;
  ctx.shadowColor = "rgba(40,25,15,0.3)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fill();
  ctx.shadowColor = "transparent";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 0.93);
  g.addColorStop(0, "#EBD5AE");
  g.addColorStop(1, inner);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.93, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  for (let k = 1; k < 13; k++) {
    const rr = (r * 0.93 * k) / 13, wob = rand() * 6;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.08) {
      const f = rr + Math.sin(a * 3 + k) * wob * 0.5;
      const px = x + Math.cos(a) * f, py = y + Math.sin(a) * f;
      a ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    stroke(ctx, alpha(ring, 0.5), 1 + rand() * 1.5);
  }
  ctx.beginPath();
  ctx.moveTo(x + r * 0.9, y - r * 0.1);
  ctx.lineTo(x + r * 0.55, y - r * 0.05);
  ctx.lineTo(x + r * 0.4, y + r * 0.02);
  stroke(ctx, "rgba(90,60,40,0.4)", 2);
}

/** Bidang dengan tepi berlubang seperti perangko. */
export function perforated(ctx, { x, y, w, h, fill, hole = 10, holeColor }) {
  ctx.save();
  ctx.shadowColor = "rgba(73,58,50,0.2)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.fillStyle = holeColor;
  const step = hole * 2.5;
  const dot = (px, py) => {
    ctx.beginPath();
    ctx.arc(px, py, hole, 0, Math.PI * 2);
    ctx.fill();
  };
  for (let px = x + step / 2; px < x + w; px += step) { dot(px, y); dot(px, y + h); }
  for (let py = y + step / 2; py < y + h; py += step) { dot(x, py); dot(x + w, py); }
}

/** Pita renda horizontal dengan tepi bergelombang dan lubang. */
export function lace(ctx, { x, y, w, h, fill = "#FBF6EC", holeColor = "rgba(0,0,0,0.12)", scallop = 18 }) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  for (let px = x; px <= x + w; px += scallop * 2) {
    for (const py of [y, y + h]) {
      ctx.beginPath();
      ctx.arc(px, py, scallop, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = holeColor;
  for (let px = x; px <= x + w; px += scallop * 2) {
    for (const py of [y + scallop * 0.1, y + h - scallop * 0.1]) {
      ctx.beginPath();
      ctx.arc(px, py, scallop * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.beginPath();
  ctx.moveTo(x, y + scallop * 1.2);
  ctx.lineTo(x + w, y + scallop * 1.2);
  ctx.moveTo(x, y + h - scallop * 1.2);
  ctx.lineTo(x + w, y + h - scallop * 1.2);
  stroke(ctx, holeColor, 2, [6, 6]);
}

/** Padang rumput dengan bunga liar. */
export function meadow(ctx, { x, y, w, h, seed = 1, count = 60, colors = ["#A8B5A0"], flowers = 12, flowerColor = "#FFFCF8", center = "#E3CB98" }) {
  const rand = rng(seed);
  ctx.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const bx = x + rand() * w, bh = h * (0.4 + rand() * 0.6), lean = (rand() - 0.5) * h * 0.35;
    ctx.beginPath();
    ctx.moveTo(bx, y + h);
    ctx.quadraticCurveTo(bx + lean * 0.2, y + h - bh * 0.6, bx + lean, y + h - bh);
    stroke(ctx, colors[Math.floor(rand() * colors.length)], 2 + rand() * 2.5);
  }
  for (let i = 0; i < flowers; i++) {
    const fx = x + 20 + rand() * (w - 40), fh = h * (0.55 + rand() * 0.4), lean = (rand() - 0.5) * 40;
    ctx.beginPath();
    ctx.moveTo(fx, y + h);
    ctx.quadraticCurveTo(fx, y + h - fh * 0.5, fx + lean, y + h - fh);
    stroke(ctx, colors[0], 2.5);
    daisy(ctx, fx + lean, y + h - fh, 11 + rand() * 9, flowerColor, center);
  }
}

/** Pilar klasik: kepala, batang beralur, dan alas. */
export function pillar(ctx, { x, y, w, h, fill = "#E8D9C8", stroke: line = "#B9A48A" }) {
  const capH = w * 0.4, baseH = w * 0.45;
  const box = (bx, by, bw, bh) => {
    ctx.fillStyle = fill;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
  };
  box(x - w * 0.16, y, w * 1.32, capH * 0.45);
  box(x - w * 0.06, y + capH * 0.45, w * 1.12, capH * 0.55);
  box(x, y + capH, w, h - capH - baseH);
  for (let k = 1; k < 5; k++) {
    ctx.beginPath();
    ctx.moveTo(x + (w * k) / 5, y + capH + 8);
    ctx.lineTo(x + (w * k) / 5, y + h - baseH - 8);
    stroke(ctx, line, 1.5);
  }
  box(x - w * 0.08, y + h - baseH, w * 1.16, baseH * 0.5);
  box(x - w * 0.16, y + h - baseH * 0.5, w * 1.32, baseH * 0.5);
}

export function star5Path(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r * 0.45 : r;
    i ? ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad) : ctx.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
}

export function petalPath(ctx, sz) {
  ctx.beginPath();
  ctx.moveTo(0, -sz / 2);
  ctx.quadraticCurveTo(sz * 0.5, 0, 0, sz / 2);
  ctx.quadraticCurveTo(-sz * 0.5, 0, 0, -sz / 2);
  ctx.closePath();
}
