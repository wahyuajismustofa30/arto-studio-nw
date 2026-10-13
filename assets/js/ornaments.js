// Primitif ornamen yang digambar secara prosedural di Canvas 2D.
// Semua koordinat dalam satuan kanvas template (mis. 1080 x 1350). Tidak ada aset eksternal,
// sehingga ekspor tidak terkena masalah CORS dan hasilnya tetap tajam di resolusi tinggi.

export const DEG = Math.PI / 180;

export const FLOWER_PALETTES = {
  blush: { petals: ["#D8A6A1", "#E7BDB7", "#F4DCD6"], center: "#C5A46D", leaves: ["#A8B5A0", "#8D9C85"] },
  ivory: { petals: ["#F3EBDF", "#FFFCF8", "#E8D9C8"], center: "#C5A46D", leaves: ["#A8B5A0", "#8D9C85"] },
  gold: { petals: ["#D9BC85", "#E8D2A6", "#F3E6CA"], center: "#9C7E4C", leaves: ["#C5A46D", "#B09159"] },
  pastel: { petals: ["#EBC9C4", "#DCE3EA", "#EEDDEA"], center: "#E3CB98", leaves: ["#BFCBB8", "#A8B5A0"] },
  rust: { petals: ["#C98B6B", "#DBA98C", "#EDD2BE"], center: "#7A5E42", leaves: ["#9AA58A", "#7F8B70"] },
};

/** Generator acak deterministik (mulberry32) agar ornamen acak selalu sama di setiap render. */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r || 0, w / 2, h / 2));
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

/** Path bentuk slot foto. grow > 0 memperbesar bentuk ke luar (untuk bingkai/bayangan). */
export function slotPath(ctx, slot, grow = 0) {
  const x = slot.x - grow, y = slot.y - grow, w = slot.width + grow * 2, h = slot.height + grow * 2;
  ctx.beginPath();
  switch (slot.shape) {
    case "circle":
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case "arch": {
      const r = w / 2;
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + r);
      ctx.arc(x + r, y + r, r, Math.PI, 0);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      break;
    }
    case "pointedArch": {
      const ys = y + w * 0.62;
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, ys);
      ctx.bezierCurveTo(x, ys - w * 0.36, x + w * 0.3, y + w * 0.14, x + w / 2, y);
      ctx.bezierCurveTo(x + w * 0.7, y + w * 0.14, x + w, ys - w * 0.36, x + w, ys);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      break;
    }
    case "heart": {
      const cx = x + w / 2;
      ctx.moveTo(cx, y + h * 0.3);
      ctx.bezierCurveTo(cx, y, x, y, x, y + h * 0.3);
      ctx.bezierCurveTo(x, y + h * 0.6, cx, y + h * 0.8, cx, y + h);
      ctx.bezierCurveTo(cx, y + h * 0.8, x + w, y + h * 0.6, x + w, y + h * 0.3);
      ctx.bezierCurveTo(x + w, y, cx, y, cx, y + h * 0.3);
      ctx.closePath();
      break;
    }
    case "hexagon":
      polyPath(ctx, [[x + w / 2, y], [x + w, y + h * 0.25], [x + w, y + h * 0.75], [x + w / 2, y + h], [x, y + h * 0.75], [x, y + h * 0.25]]);
      break;
    case "octagon": {
      const c = Math.min(w, h) * 0.29;
      polyPath(ctx, [[x + c, y], [x + w - c, y], [x + w, y + c], [x + w, y + h - c], [x + w - c, y + h], [x + c, y + h], [x, y + h - c], [x, y + c]]);
      break;
    }
    case "rhombus":
      polyPath(ctx, [[x + w / 2, y], [x + w, y + h / 2], [x + w / 2, y + h], [x, y + h / 2]]);
      break;
    case "scallop": {
      const cx = x + w / 2, cy = y + h / 2, n = 22;
      for (let i = 0; i <= 360; i++) {
        const a = (i / 360) * Math.PI * 2;
        const f = 0.955 + 0.045 * Math.abs(Math.sin((n * a) / 2));
        const px = cx + Math.cos(a) * (w / 2) * f, py = cy + Math.sin(a) * (h / 2) * f;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      break;
    }
    default:
      roundRectPath(ctx, x, y, w, h, (slot.radius || 0) + (slot.radius ? grow : 0));
  }
}

function polyPath(ctx, pts) {
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
}

export function leaf(ctx, len, width, color, vein = true) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.45, -width, len, 0);
  ctx.quadraticCurveTo(len * 0.45, width, 0, 0);
  ctx.fillStyle = color;
  ctx.fill();
  if (vein) {
    ctx.beginPath();
    ctx.moveTo(len * 0.05, 0);
    ctx.lineTo(len * 0.88, 0);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = Math.max(1, width * 0.08);
    ctx.stroke();
  }
}

/** Bunga berlapis (mirip mawar/peony sederhana). */
export function flower(ctx, x, y, r, colors, center, petals = 6, rot = 0) {
  const [c0, c1, c2] = Array.isArray(colors) ? colors : [colors, colors, colors];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const ring = (n, dist, rx, ry, color, offset) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + offset;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(dist, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "rgba(73,58,50,0.10)";
      ctx.lineWidth = Math.max(0.8, r * 0.02);
      ctx.stroke();
      ctx.restore();
    }
  };
  ring(petals, r * 0.48, r * 0.52, r * 0.4, c0, 0);
  ring(petals - 1, r * 0.3, r * 0.36, r * 0.28, c1 || c0, Math.PI / petals);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.26, 0, Math.PI * 2);
  ctx.fillStyle = c2 || c1 || c0;
  ctx.fill();
  ctx.strokeStyle = "rgba(73,58,50,0.12)";
  ctx.lineWidth = Math.max(0.8, r * 0.02);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.16, 0.3, Math.PI * 1.7);
  ctx.stroke();
  if (center) {
    for (let i = 0; i < 5; i++) {
      const a = i * 1.26;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.08, Math.sin(a) * r * 0.08, Math.max(1, r * 0.035), 0, Math.PI * 2);
      ctx.fillStyle = center;
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Rangkaian bunga + daun untuk sudut bingkai. */
export function flowerCluster(ctx, x, y, s, rot, paletteName) {
  const p = FLOWER_PALETTES[paletteName] || FLOWER_PALETTES.blush;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  const leaves = [
    [-160, 120, 30, 0], [-115, 105, 28, 1], [-60, 110, 26, 0],
    [-15, 125, 30, 1], [40, 100, 26, 0], [95, 90, 22, 1], [150, 80, 20, 0],
  ];
  for (const [a, len, w, ci] of leaves) {
    ctx.save();
    ctx.rotate(a * DEG);
    ctx.translate(18, 0);
    leaf(ctx, len, w, p.leaves[ci]);
    ctx.restore();
  }
  // tangkai kecil dengan buah/bulatan kecil
  ctx.strokeStyle = p.leaves[1];
  ctx.lineWidth = 2.2;
  for (const [a, len] of [[-85, 120], [20, 130], [125, 100]]) {
    ctx.save();
    ctx.rotate(a * DEG);
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.quadraticCurveTo(len * 0.6, -14, len, -6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(len + 4, -6, 5, 0, Math.PI * 2);
    ctx.fillStyle = p.center;
    ctx.fill();
    ctx.restore();
  }
  flower(ctx, 62, -42, 36, [p.petals[1], p.petals[2], p.petals[0]], p.center, 6, 0.4);
  flower(ctx, -58, 34, 31, [p.petals[2], p.petals[1], p.petals[0]], p.center, 5, 1.1);
  flower(ctx, 0, 0, 54, p.petals, p.center, 7, 0.2);
  flower(ctx, 92, 36, 16, [p.petals[0], p.petals[2], p.petals[1]], null, 5, 0.6);
  ctx.restore();
}

function quadPoint(p0, p1, p2, t) {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
}

/** Ranting dengan daun berselang-seling. angle dalam derajat, bend = lengkungan relatif. */
export function sprig(ctx, x, y, { angle = 0, len = 200, leaves = 7, color = "#A8B5A0", bend = 0.18, leafScale = 1, round = false }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * DEG);
  const p0 = [0, 0], p1 = [len * 0.5, -len * bend], p2 = [len, 0];
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, len * 0.012);
  ctx.stroke();
  for (let i = 0; i < leaves; i++) {
    const t = 0.15 + (i / leaves) * 0.8;
    const [px, py] = quadPoint(p0, p1, p2, t);
    const [qx, qy] = quadPoint(p0, p1, p2, Math.min(1, t + 0.01));
    const tangent = Math.atan2(qy - py, qx - px);
    const side = i % 2 ? 1 : -1;
    const l = len * 0.22 * (1 - t * 0.45) * leafScale;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(tangent + side * 0.75);
    if (round) {
      ctx.beginPath();
      ctx.ellipse(l * 0.42, 0, l * 0.36, l * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    } else leaf(ctx, l, l * 0.32, color);
    ctx.restore();
  }
  const [ex, ey] = p2;
  ctx.save();
  ctx.translate(ex, ey);
  if (round) {
    ctx.beginPath();
    ctx.arc(len * 0.03, 0, len * 0.04 * leafScale, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  } else leaf(ctx, len * 0.16 * leafScale, len * 0.05 * leafScale, color);
  ctx.restore();
  ctx.restore();
}

export function star8Path(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.62;
    const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}

export function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y, x - s * 0.5, y - s * 0.05, x - s * 0.5, y + s * 0.28);
  ctx.bezierCurveTo(x - s * 0.5, y + s * 0.55, x - s * 0.15, y + s * 0.72, x, y + s * 0.9);
  ctx.bezierCurveTo(x + s * 0.15, y + s * 0.72, x + s * 0.5, y + s * 0.55, x + s * 0.5, y + s * 0.28);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.05, x, y, x, y + s * 0.3);
  ctx.closePath();
}

export function sparklePath(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.15, y - r * 0.15, x + r, y);
  ctx.quadraticCurveTo(x + r * 0.15, y + r * 0.15, x, y + r);
  ctx.quadraticCurveTo(x - r * 0.15, y + r * 0.15, x - r, y);
  ctx.quadraticCurveTo(x - r * 0.15, y - r * 0.15, x, y - r);
  ctx.closePath();
}

export function diamondPath(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
}

/** Pita geometris bergaya Islami: dua garis sejajar dengan bintang delapan di sepanjang sisi. */
export function islamicBorder(ctx, { x, y, w, h, size = 40, color = "#A8B5A0", lineWidth = 2 }) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeRect(x + size, y + size, w - size * 2, h - size * 2);
  const r = size * 0.3;
  const placeAlong = (x0, y0, x1, y1) => {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.round(dist / (size * 1.5)));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
      star8Path(ctx, px, py, r);
      ctx.stroke();
      if (i < n) {
        const mx = x0 + (x1 - x0) * (t + 0.5 / n), my = y0 + (y1 - y0) * (t + 0.5 / n);
        diamondPath(ctx, mx, my, r * 0.28);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
  };
  const c = size / 2;
  placeAlong(x + c, y + c, x + w - c, y + c);
  placeAlong(x + c, y + h - c, x + w - c, y + h - c);
  placeAlong(x + c, y + c + size * 1.5, x + c, y + h - c - size * 1.5);
  placeAlong(x + w - c, y + c + size * 1.5, x + w - c, y + h - c - size * 1.5);
}

export function filmHoles(ctx, { x, y, w, h, axis = "x", color = "#F3E7D3", hole = [34, 44], gap = 30 }) {
  ctx.fillStyle = color;
  const [hw, hh] = hole;
  if (axis === "x") {
    const n = Math.floor((w - gap) / (hw + gap));
    const start = x + (w - (n * hw + (n - 1) * gap)) / 2;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      roundRectPath(ctx, start + i * (hw + gap), y + (h - hh) / 2, hw, hh, 6);
      ctx.fill();
    }
  } else {
    const n = Math.floor((h - gap) / (hh + gap));
    const start = y + (h - (n * hh + (n - 1) * gap)) / 2;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      roundRectPath(ctx, x + (w - hw) / 2, start + i * (hh + gap), hw, hh, 6);
      ctx.fill();
    }
  }
}

/** Garis tepi bergelombang mengikuti persegi panjang. */
export function wavyBorder(ctx, { x, y, w, h, amp = 8, wave = 50, stroke = "#D8A6A1", lineWidth = 4 }) {
  ctx.beginPath();
  const side = (x0, y0, x1, y1, nx, ny, first) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.ceil(len / 4);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const off = Math.sin((t * len / wave) * Math.PI * 2) * amp;
      const px = x0 + (x1 - x0) * t + nx * off, py = y0 + (y1 - y0) * t + ny * off;
      first && i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
  };
  side(x, y, x + w, y, 0, -1, true);
  side(x + w, y, x + w, y + h, 1, 0, false);
  side(x + w, y + h, x, y + h, 0, 1, false);
  side(x, y + h, x, y, -1, 0, false);
  ctx.closePath();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.stroke();
}

/** Selotip kertas (washi tape) dengan ujung bergerigi. */
export function tape(ctx, { x, y, w = 160, h = 44, rot = 0, color = "rgba(232,217,200,0.85)" }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot * DEG);
  ctx.beginPath();
  const teeth = 5, tw = h / teeth;
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2, -h / 2);
  for (let i = 0; i < teeth; i++) ctx.lineTo(w / 2 + (i % 2 ? 0 : 5), -h / 2 + (i + 1) * tw);
  ctx.lineTo(-w / 2, h / 2);
  for (let i = 0; i < teeth; i++) ctx.lineTo(-w / 2 - (i % 2 ? 0 : 5), h / 2 - (i + 1) * tw);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(73,58,50,0.15)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fill();
  ctx.restore();
}

export function divider(ctx, { x, y, w = 260, color = "#C5A46D", lineWidth = 1.5 }) {
  const gap = 16;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x - gap, y);
  ctx.moveTo(x + gap, y);
  ctx.lineTo(x + w / 2, y);
  ctx.stroke();
  diamondPath(ctx, x, y, 7);
  ctx.fill();
  for (const dx of [-w / 2 - 8, w / 2 + 8]) {
    ctx.beginPath();
    ctx.arc(x + dx, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
