// Generator koleksi kedua (78 template) -> assets/data/templates-koleksi-2.json
// Jalankan: node tools/generate-koleksi-2.mjs
// Setiap template di bawah dirancang satu per satu (tata letak, bentuk slot, ornamen, tipografi berbeda).
// Helper hanya memendekkan penulisan; hasil akhirnya tetap JSON biasa yang bisa diedit langsung.
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const C = {
  ivory: "#F8F4EE", white: "#FFFCF8", beige: "#E8D9C8", gold: "#C5A46D", goldDeep: "#9C7E4C", pink: "#D8A6A1",
  pinkDeep: "#C27F79", rose: "#9B6E69", sage: "#A8B5A0", sageDeep: "#6E7D66", brown: "#493A32", muted: "#81766D",
  cream: "#FBF6EC", kraft: "#D9C3A0", rust: "#B5654A", wood: "#8A6E4F", dark: "#1F1A17", forest: "#2F4038",
};

const SIZES = {
  P: [1080, 1350, "4:5"], S: [1080, 1920, "9:16"], Q: [1080, 1080, "1:1"], L: [1500, 1000, "3:2"],
  T: [600, 1800, "1:3"], R: [1200, 1800, "2:3"], H: [1800, 600, "3:1"], V: [1080, 1440, "3:4"],
};

const out = [];
function T(id, name, category, size, description, photoSlots, layers, message) {
  const [width, height, aspectRatio] = SIZES[size];
  out.push({
    id, name, category, description, aspectRatio, canvas: { width, height }, thumbnail: "auto", featured: false, active: true,
    ...(message ? { defaults: { message } } : {}), photoSlots, layers, export: { formats: ["png", "jpg"] },
  });
}
const slot = (id, x, y, width, height, shape = "rect", radius) => ({ id, shape, x, y, width, height, ...(radius ? { radius } : {}) });
const tx = (text, x, y, o = {}) => ({ type: "text", text, x, y, font: "serif", size: 40, color: C.brown, maxWidth: 900, ...o });
const fill = (c) => (Array.isArray(c) ? { type: "fill", gradient: c } : { type: "fill", color: c });
const P = { type: "photos" };
const frame = (slotId, stroke, lineWidth = 2, grow = 10, extra = {}) => ({ type: "slotFrame", slot: slotId, stroke, lineWidth, grow, ...extra });
const shadow = (slotId, o = {}) => ({ type: "slotShadow", slot: slotId, blur: 30, offsetY: 10, ...o });
const NAMES = "{name1} & {name2}";

// ===================== ROMANTIC FLORAL (7) =====================
T("bunga-hati", "Bunga Hati", "romantic-floral", "Q", "Foto berbentuk hati dengan taburan kelopak bunga.",
  [slot("main", 240, 90, 600, 560, "heart")],
  [fill([C.white, "#F7E6E2"]),
    { type: "scatter", shape: "petal", count: 34, seed: 31, area: [30, 30, 1020, 1020], colors: [C.pink, "#EBC4BF", "#F4DCD6"], size: [14, 28], avoidSlots: true, margin: 20 },
    shadow("main", { fill: "#FFFFFF" }), P, frame("main", C.pink, 3, 12),
    { type: "flowerCluster", x: 540, y: 252, s: 0.75, rot: -90, palette: "blush" },
    tx(NAMES, 540, 770, { font: "script", size: 104 }),
    tx("{date}", 540, 850, { font: "sans", size: 26, spacing: 6, upper: true, color: C.rose }),
    tx("{message}", 540, 920, { italic: true, size: 40, color: C.muted })],
  "Cinta yang mekar selamanya");

T("mahkota-bunga", "Mahkota Bunga", "romantic-floral", "P", "Foto bulat dikelilingi mahkota daun dan tiga rangkaian bunga.",
  [slot("main", 240, 150, 600, 600, "circle")],
  [fill(C.white), { type: "rect", x: 40, y: 40, w: 1000, h: 1270, stroke: "#EBCFCB", lineWidth: 2 },
    P, frame("main", C.gold, 2, 10),
    { type: "wreath", x: 540, y: 450, r: 338, color: C.sage, color2: C.sageDeep, leaves: 44, leafLen: 46 },
    { type: "flowerCluster", x: 540, y: 112, s: 0.8, rot: -90, palette: "blush" },
    { type: "flowerCluster", x: 262, y: 650, s: 0.7, rot: 140, palette: "blush" },
    { type: "flowerCluster", x: 818, y: 650, s: 0.7, rot: 40, palette: "blush" },
    tx(NAMES, 540, 920, { font: "caps", size: 58, spacing: 6, upper: true }),
    { type: "divider", x: 540, y: 985, w: 260, color: C.gold },
    tx("{date}", 540, 1040, { italic: true, size: 40, color: C.muted }),
    tx("{message}", 540, 1150, { font: "script", size: 66, color: C.pinkDeep })],
  "Dengan cinta");

T("surat-cinta", "Surat Cinta", "romantic-floral", "L", "Format lanskap: foto bermatras putih di kanan, surat bernuansa bunga di kiri.",
  [slot("main", 660, 70, 770, 860, "rect", 12)],
  [fill("#FBF1EE"), shadow("main"), P, frame("main", "#FFFFFF", 14, 7),
    { type: "flowerCluster", x: 676, y: 92, s: 1.0, rot: -30, palette: "blush" },
    tx("{message}", 330, 250, { font: "script", size: 78, color: C.pinkDeep, maxWidth: 560 }),
    tx("{name1}", 330, 410, { weight: 500, size: 96, maxWidth: 560 }),
    tx("&", 330, 495, { italic: true, size: 56, color: C.gold, maxWidth: 120 }),
    tx("{name2}", 330, 580, { weight: 500, size: 96, maxWidth: 560 }),
    { type: "divider", x: 330, y: 675, w: 240, color: C.gold },
    tx("{date}", 330, 730, { font: "sans", size: 26, spacing: 6, upper: true, color: C.muted, maxWidth: 560 }),
    { type: "heart", x: 330, y: 840, s: 44, fill: C.pink },
    { type: "sprig", x: 90, y: 970, angle: -60, len: 220, leaves: 7, color: C.sage }],
  "With Love");

T("kelopak-jatuh", "Kelopak Jatuh", "romantic-floral", "S", "Foto penuh dengan kelopak berjatuhan dan kertas sobek di bawahnya.",
  [slot("main", 0, 0, 1080, 1340)],
  [fill(C.white), P,
    { type: "scatter", shape: "petal", count: 26, seed: 44, area: [0, 0, 1080, 900], colors: ["#F4DCD6", "#EBC4BF", C.white], size: [16, 32], opacity: 0.9 },
    { type: "torn", x: 0, y: 1290, w: 1080, h: 630, fill: C.white, seed: 8, amp: 22, edge: "top" },
    { type: "flowerCluster", x: 950, y: 1320, s: 1.1, rot: 200, palette: "blush" },
    tx("{message}", 540, 1470, { italic: true, size: 46, color: C.muted }),
    tx(NAMES, 540, 1610, { font: "script", size: 130 }),
    tx("{date}", 540, 1750, { font: "sans", size: 30, spacing: 10, upper: true, color: C.muted }),
    { type: "sprig", x: 90, y: 1880, angle: -25, len: 200, leaves: 6, color: C.sage }],
  "Hari ini, esok, dan selamanya");

T("dua-hati-mekar", "Dua Hati Mekar", "romantic-floral", "P", "Dua foto bulat berdampingan disatukan rangkaian bunga.",
  [slot("kiri", 80, 300, 450, 450, "circle"), slot("kanan", 550, 300, 450, 450, "circle")],
  [fill([C.white, "#F8E9E5"]), tx("{message}", 540, 160, { italic: true, size: 50, color: C.muted }),
    P, frame("kiri", C.pink, 3, 10), frame("kanan", C.pink, 3, 10),
    { type: "flowerCluster", x: 540, y: 318, s: 0.85, rot: -90, palette: "blush" },
    { type: "flowerCluster", x: 540, y: 738, s: 0.65, rot: 90, palette: "blush" },
    tx(NAMES, 540, 925, { font: "script", size: 112 }),
    { type: "divider", x: 540, y: 1005, w: 240, color: C.gold },
    tx("{date}", 540, 1060, { font: "sans", size: 28, spacing: 8, upper: true, color: C.muted }),
    { type: "scatter", shape: "heart", count: 10, seed: 5, area: [60, 1120, 960, 180], colors: [C.pink, "#EBC4BF"], size: [14, 24] }],
  "Dua hati, satu cinta");

T("jendela-mawar", "Jendela Mawar", "romantic-floral", "V", "Foto bergelombang (scallop) dalam bingkai renda dengan bunga di empat sudut.",
  [slot("main", 190, 190, 700, 760, "scallop")],
  [fill("#FBF6F1"), { type: "scallopBorder", x: 60, y: 60, w: 960, h: 1320, r: 16, color: C.pink, lineWidth: 2 },
    P, frame("main", C.gold, 2, 12),
    { type: "flowerCluster", x: 112, y: 112, s: 0.75, rot: 45, palette: "blush" },
    { type: "flowerCluster", x: 968, y: 112, s: 0.75, rot: 135, palette: "blush" },
    { type: "flowerCluster", x: 112, y: 1328, s: 0.75, rot: -45, palette: "blush" },
    { type: "flowerCluster", x: 968, y: 1328, s: 0.75, rot: -135, palette: "blush" },
    tx(NAMES, 540, 1075, { font: "script", size: 110, maxWidth: 800 }),
    tx("{date}", 540, 1165, { font: "caps", size: 30, spacing: 8, upper: true, color: C.goldDeep, maxWidth: 800 }),
    tx("{message}", 540, 1232, { italic: true, size: 36, color: C.muted, maxWidth: 760 })],
  "Seindah mawar di pagi hari");

T("kartu-pos-bunga", "Kartu Pos Bunga", "romantic-floral", "R", "Gaya kartu pos: foto berpinggiran perangko, cap pos, dan tulisan tangan.",
  [slot("main", 150, 150, 900, 1000)],
  [fill("#F3EBE0"), { type: "grain", seed: 77, amount: 6000, color: C.brown, opacity: 0.08 },
    { type: "perforated", x: 110, y: 110, w: 980, h: 1080, fill: C.white, hole: 10, holeColor: "#F3EBE0" },
    P,
    { type: "squiggle", x: 640, y: 1238, w: 240, amp: 8, wave: 60, color: C.rust, lineWidth: 3, opacity: 0.8 },
    { type: "squiggle", x: 640, y: 1268, w: 240, amp: 8, wave: 60, color: C.rust, lineWidth: 3, opacity: 0.8 },
    { type: "squiggle", x: 640, y: 1298, w: 240, amp: 8, wave: 60, color: C.rust, lineWidth: 3, opacity: 0.8 },
    { type: "arcText", text: "· Pos Cinta · {date} ", x: 980, y: 1268, r: 92, font: "sans", weight: 500, size: 15, upper: true, color: C.rust },
    tx("{message}", 150, 1400, { font: "script", size: 78, align: "left", color: C.pinkDeep, maxWidth: 900 }),
    tx(NAMES, 150, 1520, { weight: 500, size: 62, align: "left", maxWidth: 900 }),
    { type: "line", x1: 150, y1: 1585, x2: 1050, y2: 1585, stroke: C.beige, lineWidth: 2 },
    tx("{date}", 150, 1640, { font: "sans", size: 26, spacing: 6, upper: true, align: "left", color: C.muted, maxWidth: 700 }),
    { type: "flowerCluster", x: 1070, y: 1680, s: 1.0, rot: 200, palette: "blush" }],
  "Dari kami, dengan cinta");

// ===================== ELEGANT GOLD (6) =====================
T("deco-emas", "Deco Emas", "elegant-gold", "S", "Art deco: foto oktagon, sudut bertingkat, dan sinar keemasan di latar gelap.",
  [slot("main", 190, 360, 700, 900, "octagon")],
  [fill(["#1E1A17", "#2E2620"]), { type: "rays", x: 540, y: 810, count: 36, inner: 480, outer: 1150, color: C.gold, opacity: 0.08 },
    { type: "decoCorners", x: 50, y: 50, w: 980, h: 1820, size: 150, color: C.gold, lineWidth: 2 },
    { type: "diamond", x: 540, y: 160, r: 9, fill: C.gold },
    tx("{message}", 540, 240, { font: "caps", size: 30, spacing: 14, upper: true, color: C.gold }),
    P, frame("main", C.gold, 3, 16), frame("main", C.gold, 1, 32),
    tx(NAMES, 540, 1425, { font: "caps", size: 64, spacing: 6, upper: true, color: "#F3E6CA" }),
    { type: "flourish", x: 540, y: 1515, w: 420, color: C.gold, lineWidth: 2 },
    tx("{date}", 540, 1605, { font: "sans", size: 28, spacing: 10, upper: true, color: C.gold })],
  "The Wedding Celebration");

T("kilau-hitam", "Kilau Hitam", "elegant-gold", "Q", "Latar hitam berkilau dengan bingkai emas ganda dan ukiran.",
  [slot("main", 150, 120, 780, 680)],
  [fill("#191513"), { type: "scatter", shape: "sparkle", count: 30, seed: 61, area: [0, 0, 1080, 1080], colors: [C.gold, "#E8D2A6"], size: [4, 12], avoidSlots: true, margin: 34, opacity: 0.9 },
    P, frame("main", C.gold, 2, 12), frame("main", C.gold, 1, 24),
    tx(NAMES, 540, 895, { font: "script", size: 96, color: "#F3E6CA" }),
    { type: "flourish", x: 540, y: 965, w: 360, color: C.gold, lineWidth: 2 },
    tx("{date}", 540, 1025, { font: "caps", size: 26, spacing: 8, upper: true, color: C.gold })]);

T("medali-emas", "Medali Emas", "elegant-gold", "P", "Foto bulat bersinar seperti medali, dengan ranting laurel dan pita emas.",
  [slot("main", 290, 170, 500, 500, "circle")],
  [fill(C.cream), tx("{message}", 540, 82, { font: "sans", size: 24, spacing: 10, upper: true, color: C.goldDeep }),
    { type: "rays", x: 540, y: 420, count: 48, inner: 270, outer: 440, color: C.gold, opacity: 0.35, ratio: 0.4 },
    P, frame("main", C.gold, 2, 10), frame("main", C.gold, 1, 22),
    { type: "sprig", x: 515, y: 705, angle: 195, len: 260, leaves: 10, color: C.gold, bend: 0.25 },
    { type: "sprig", x: 565, y: 705, angle: -15, len: 260, leaves: 10, color: C.gold, bend: -0.25 },
    { type: "ribbon", x: 540, y: 860, w: 820, h: 120, fill: C.gold, fill2: C.goldDeep },
    tx(NAMES, 540, 860, { font: "caps", size: 50, spacing: 6, upper: true, color: C.white, maxWidth: 720 }),
    tx("{date}", 540, 1015, { italic: true, size: 40, color: C.muted }),
    { type: "divider", x: 540, y: 1090, w: 300, color: C.gold }],
  "Pernikahan");

T("gerbang-emas", "Gerbang Emas", "elegant-gold", "L", "Foto lengkung di tengah dengan garis gerbang bertingkat; nama di kiri-kanan.",
  [slot("main", 530, 110, 440, 780, "arch")],
  [fill(C.ivory), { type: "shape", shape: "arch", x: 470, y: 50, w: 560, h: 900, stroke: C.gold, lineWidth: 1 },
    { type: "shape", shape: "arch", x: 500, y: 80, w: 500, h: 840, stroke: C.gold, lineWidth: 2 },
    P, frame("main", C.gold, 3, 6),
    tx("{name1}", 250, 450, { font: "caps", size: 60, spacing: 6, upper: true, maxWidth: 400 }),
    { type: "line", x1: 190, y1: 510, x2: 310, y2: 510, stroke: C.gold, lineWidth: 2 },
    tx("{date}", 250, 570, { italic: true, size: 34, color: C.muted, maxWidth: 400 }),
    tx("{name2}", 1250, 450, { font: "caps", size: 60, spacing: 6, upper: true, maxWidth: 400 }),
    { type: "line", x1: 1190, y1: 510, x2: 1310, y2: 510, stroke: C.gold, lineWidth: 2 },
    tx("{message}", 1250, 570, { italic: true, size: 34, color: C.muted, maxWidth: 400 }),
    { type: "diamond", x: 750, y: 30, r: 10, fill: C.gold }],
  "Sah & Bahagia");

T("bingkai-barok", "Bingkai Barok", "elegant-gold", "V", "Bingkai berukir dengan flourish atas-bawah dan sudut deco tipis.",
  [slot("main", 170, 260, 740, 820)],
  [fill("#F6F0E6"), { type: "rect", x: 60, y: 60, w: 960, h: 1320, stroke: C.gold, lineWidth: 2 },
    { type: "decoCorners", x: 60, y: 60, w: 960, h: 1320, size: 110, color: C.gold, lineWidth: 1.5 },
    { type: "flourish", x: 540, y: 172, w: 520, color: C.gold, lineWidth: 2.5 },
    P, frame("main", C.beige, 6, 6), frame("main", C.gold, 2, 14),
    tx(NAMES, 540, 1180, { font: "caps", size: 54, spacing: 8, upper: true, maxWidth: 820 }),
    tx("{date}", 540, 1250, { italic: true, size: 38, color: C.muted, maxWidth: 800 }),
    { type: "flourish", x: 540, y: 1318, w: 380, color: C.gold, lineWidth: 2, flip: true }]);

T("bintang-emas", "Malam Bintang Emas", "elegant-gold", "R", "Foto heksagon di bawah untaian lampu dan kilau bintang.",
  [slot("main", 260, 330, 680, 780, "hexagon")],
  [fill(["#2A211C", "#120F0D"]), { type: "garland", x1: 0, y1: 120, x2: 1200, y2: 120, sag: 110, count: 13, wire: "#5A4A3E", bulb: "#F3D9A0" },
    { type: "scatter", shape: "sparkle", count: 22, seed: 12, area: [0, 380, 1200, 1400], colors: [C.gold], size: [3, 9], avoidSlots: true, margin: 30 },
    P, frame("main", C.gold, 2.5, 14),
    tx(NAMES, 600, 1270, { font: "script", size: 120, color: C.ivory, maxWidth: 1040 }),
    tx("{date}", 600, 1395, { font: "caps", size: 30, spacing: 10, upper: true, color: C.gold }),
    tx("{message}", 600, 1485, { italic: true, size: 42, color: C.beige })],
  "Malam penuh bintang");

// ===================== MODERN MINIMALIST (7) =====================
T("garis-tipis", "Garis Tipis", "modern-minimalist", "P", "Hanya penanda sudut tipis dan tipografi kecil yang rata kiri-kanan.",
  [slot("main", 120, 120, 840, 980)],
  [fill("#FCFAF7"), P, { type: "brackets", x: 90, y: 90, w: 900, h: 1040, len: 60, color: C.brown, lineWidth: 2 },
    tx(NAMES, 120, 1215, { font: "sans", weight: 500, size: 30, spacing: 10, upper: true, align: "left", maxWidth: 560 }),
    tx("{date}", 960, 1215, { font: "sans", size: 24, spacing: 4, align: "right", color: C.muted, maxWidth: 320 }),
    tx("{message}", 120, 1268, { font: "sans", weight: 300, size: 22, spacing: 4, align: "left", color: C.muted, maxWidth: 840 })],
  "Wedding day");

T("blok-warna", "Blok Warna", "modern-minimalist", "Q", "Setengah bidang warna sage, setengah foto penuh.",
  [slot("main", 540, 0, 540, 1080)],
  [fill(C.white), { type: "rect", x: 0, y: 0, w: 540, h: 1080, fill: C.sage }, P,
    tx("{name1}", 270, 420, { weight: 500, size: 92, color: C.white, maxWidth: 440 }),
    tx("&", 270, 510, { italic: true, size: 60, color: "#F3E6CA", maxWidth: 100 }),
    tx("{name2}", 270, 600, { weight: 500, size: 92, color: C.white, maxWidth: 440 }),
    { type: "line", x1: 210, y1: 690, x2: 330, y2: 690, stroke: C.white, lineWidth: 2 },
    tx("{date}", 270, 750, { font: "sans", size: 24, spacing: 6, upper: true, color: C.white, maxWidth: 440 })]);

T("lingkar-sederhana", "Lingkar Sederhana", "modern-minimalist", "S", "Foto bulat kecil dan nama huruf kecil berukuran besar.",
  [slot("main", 240, 260, 600, 600, "circle")],
  [fill(C.ivory), P,
    tx("{name1}", 540, 1080, { size: 170, lower: true, maxWidth: 960 }),
    tx("& {name2}", 540, 1260, { italic: true, size: 170, lower: true, maxWidth: 960 }),
    { type: "line", x1: 470, y1: 1400, x2: 610, y2: 1400, stroke: C.brown, lineWidth: 2 },
    tx("{date}", 540, 1470, { font: "sans", size: 26, spacing: 8, upper: true, color: C.muted }),
    tx("{message}", 540, 1720, { font: "sans", weight: 300, size: 24, spacing: 4, lower: true, color: C.muted })],
  "terima kasih sudah hadir");

T("dua-bidang", "Dua Bidang", "modern-minimalist", "L", "Dua foto asimetris dengan kolom teks rata kiri.",
  [slot("besar", 60, 60, 860, 880), slot("kecil", 950, 60, 490, 560)],
  [fill("#FCFAF7"), P,
    tx(NAMES, 950, 700, { weight: 500, size: 54, align: "left", maxWidth: 490 }),
    tx("{date}", 950, 770, { font: "sans", size: 24, spacing: 6, upper: true, align: "left", color: C.muted, maxWidth: 490 }),
    { type: "line", x1: 950, y1: 820, x2: 1060, y2: 820, stroke: C.brown, lineWidth: 2 },
    tx("{message}", 950, 880, { font: "sans", weight: 300, size: 24, align: "left", color: C.muted, maxWidth: 490 })],
  "Awal dari selamanya");

T("passe-partout", "Passe-partout", "modern-minimalist", "P", "Foto dalam matras tebal seperti karya galeri, dengan ikon cincin.",
  [slot("main", 200, 190, 680, 800)],
  [fill("#EFE7DC"), { type: "rect", x: 140, y: 130, w: 800, h: 920, fill: "#FCFAF7", shadow: { blur: 20, y: 6 } },
    P, frame("main", "rgba(73,58,50,0.25)", 2, 1),
    { type: "rings", x: 540, y: 1140, r: 22, stroke: C.gold, lineWidth: 2.5 },
    tx(NAMES, 540, 1210, { font: "caps", size: 40, spacing: 10, upper: true, maxWidth: 860 }),
    tx("{date}", 540, 1265, { font: "sans", size: 22, spacing: 8, upper: true, color: C.muted })]);

T("tipografi-vertikal", "Tipografi Vertikal", "modern-minimalist", "S", "Foto tinggi penuh dengan nama berdiri vertikal di sisi kiri.",
  [slot("main", 300, 0, 780, 1920)],
  [fill(C.white), P,
    tx(NAMES, 150, 960, { weight: 500, size: 110, rot: -90, maxWidth: 1700 }),
    tx("{date}", 255, 960, { font: "sans", size: 26, spacing: 10, upper: true, rot: -90, color: C.muted, maxWidth: 1500 })]);

T("panorama-tunggal", "Panorama Tunggal", "modern-minimalist", "H", "Strip lanskap 3:1: satu foto panorama dan panel nama.",
  [slot("main", 0, 0, 1300, 600)],
  [fill(C.ivory), P,
    tx("{name1}", 1550, 200, { weight: 500, size: 70, maxWidth: 440 }),
    tx("&", 1550, 270, { italic: true, size: 44, color: C.gold, maxWidth: 80 }),
    tx("{name2}", 1550, 340, { weight: 500, size: 70, maxWidth: 440 }),
    { type: "line", x1: 1490, y1: 410, x2: 1610, y2: 410, stroke: C.gold, lineWidth: 2 },
    tx("{date}", 1550, 460, { font: "sans", size: 22, spacing: 6, upper: true, color: C.muted, maxWidth: 440 })]);

// ===================== ISLAMIC WEDDING (7) =====================
T("bulan-sabit", "Bulan Sabit", "islamic-wedding", "P", "Foto oktagon dengan bulan sabit dan pita bintang delapan.",
  [slot("main", 220, 250, 640, 760, "octagon")],
  [fill("#F7F3EA"), { type: "crescent", x: 532, y: 125, r: 46, fill: C.gold, rot: -30 },
    { type: "star8", x: 592, y: 98, r: 14, fill: C.gold },
    P, frame("main", C.gold, 3, 14),
    tx(NAMES, 540, 1095, { font: "caps", size: 50, spacing: 4, upper: true, maxWidth: 860 }),
    tx("{date}", 540, 1155, { font: "sans", size: 26, spacing: 6, upper: true, color: C.muted }),
    tx("{message}", 540, 1215, { italic: true, size: 38, color: C.brown }),
    { type: "starBand", x: 120, y: 1292, w: 840, size: 30, color: C.sage, lineWidth: 1.5 }],
  "Semoga sakinah, mawaddah, warahmah");

T("lentera-walimah", "Lentera Walimah", "islamic-wedding", "S", "Tiga lentera bercahaya menggantung di atas foto lengkung bernuansa hijau tua.",
  [slot("main", 200, 520, 680, 960, "arch")],
  [fill([C.forest, "#1F2B25"]),
    { type: "lantern", x: 220, y: 260, top: 0, s: 1.0, color: C.gold, glow: "#F3D9A0" },
    { type: "lantern", x: 540, y: 170, top: 0, s: 1.3, color: C.gold, glow: "#F3D9A0" },
    { type: "lantern", x: 860, y: 300, top: 0, s: 0.95, color: C.gold, glow: "#F3D9A0" },
    P, frame("main", C.gold, 3, 16),
    tx(NAMES, 540, 1605, { font: "script", size: 120, color: C.ivory }),
    tx("{date}", 540, 1715, { font: "caps", size: 30, spacing: 8, upper: true, color: C.gold }),
    tx("{message}", 540, 1800, { italic: true, size: 42, color: C.beige })],
  "Walimatul 'Ursy");

T("mihrab", "Mihrab", "islamic-wedding", "S", "Lengkung kubah bertingkat tiga seperti mihrab, dengan doa pengantin.",
  [slot("main", 290, 440, 500, 970, "pointedArch")],
  [fill("#EFE5D3"), { type: "shape", shape: "pointedArch", x: 170, y: 260, w: 740, h: 1270, fill: "rgba(197,164,109,0.12)" },
    { type: "shape", shape: "pointedArch", x: 210, y: 320, w: 660, h: 1170, stroke: C.gold, lineWidth: 1 },
    { type: "shape", shape: "pointedArch", x: 250, y: 380, w: 580, h: 1070, stroke: C.gold, lineWidth: 2 },
    tx("{message}", 540, 150, { italic: true, size: 46, maxWidth: 980 }),
    P, frame("main", C.gold, 3, 8),
    tx(NAMES, 540, 1640, { font: "caps", size: 54, spacing: 6, upper: true }),
    { type: "divider", x: 540, y: 1710, w: 280, color: C.gold },
    tx("{date}", 540, 1770, { font: "sans", size: 28, spacing: 8, upper: true, color: C.muted })],
  "Barakallahu lakuma wa baraka 'alaikuma");

T("mozaik-bintang", "Mozaik Bintang", "islamic-wedding", "Q", "Ubin bintang delapan keemasan di latar hijau tua dengan panel nama.",
  [slot("main", 290, 130, 500, 500, "circle")],
  [fill(C.forest), { type: "starTile", x: 0, y: 0, w: 1080, h: 1080, gap: 90, r: 26, color: C.gold, lineWidth: 1.5, opacity: 0.5 },
    { type: "shape", shape: "circle", x: 255, y: 95, w: 570, h: 570, fill: "#F7F3EA" },
    P, frame("main", C.gold, 2, 12),
    { type: "rect", x: 140, y: 740, w: 800, h: 250, r: 16, fill: "#F7F3EA" },
    tx(NAMES, 540, 825, { font: "caps", size: 46, spacing: 4, upper: true, maxWidth: 720 }),
    { type: "divider", x: 540, y: 880, w: 200, color: C.gold },
    tx("{date}", 540, 930, { font: "sans", size: 24, spacing: 6, upper: true, color: C.muted, maxWidth: 720 })]);

T("akad-nikah", "Akad Nikah", "islamic-wedding", "L", "Foto kubah di kiri, panel teks berpita geometris di kanan.",
  [slot("main", 90, 70, 600, 860, "pointedArch")],
  [fill("#F7F3EA"), { type: "islamicBorder", x: 760, y: 60, w: 680, h: 880, size: 34, color: C.sage, lineWidth: 1.5 },
    P, frame("main", C.gold, 3, 14),
    tx("{message}", 1100, 255, { font: "caps", size: 28, spacing: 10, upper: true, color: C.goldDeep, maxWidth: 540 }),
    tx("{name1}", 1100, 395, { weight: 500, size: 80, maxWidth: 540 }),
    tx("&", 1100, 475, { italic: true, size: 52, color: C.gold, maxWidth: 80 }),
    tx("{name2}", 1100, 555, { weight: 500, size: 80, maxWidth: 540 }),
    { type: "star8", x: 1100, y: 655, r: 18, stroke: C.gold, lineWidth: 2 },
    tx("{date}", 1100, 735, { font: "sans", size: 24, spacing: 6, upper: true, color: C.muted, maxWidth: 540 })],
  "Akad Nikah");

T("kubah-kembar", "Kubah Kembar", "islamic-wedding", "P", "Dua foto berbentuk kubah berdampingan di bawah bulan sabit.",
  [slot("kiri", 100, 300, 420, 720, "pointedArch"), slot("kanan", 560, 300, 420, 720, "pointedArch")],
  [fill("#F7F3EA"), { type: "crescent", x: 532, y: 155, r: 40, fill: C.gold, rot: -20 },
    { type: "star8", x: 586, y: 132, r: 12, fill: C.gold },
    P, frame("kiri", C.gold, 2.5, 10), frame("kanan", C.gold, 2.5, 10),
    tx(NAMES, 540, 1135, { font: "script", size: 100, maxWidth: 920 }),
    tx("{date}", 540, 1225, { font: "caps", size: 30, spacing: 8, upper: true, color: C.goldDeep }),
    tx("{message}", 540, 1290, { italic: true, size: 36, color: C.muted })],
  "Barakallahu lakuma");

T("doa-pengantin", "Doa Pengantin", "islamic-wedding", "R", "Format cetak 4R: foto bulat, doa sakinah, dan tiga bintang.",
  [slot("main", 300, 200, 600, 600, "circle")],
  [fill("#EEF0E8"), { type: "rect", x: 40, y: 40, w: 1120, h: 1720, stroke: C.sageDeep, lineWidth: 2 },
    { type: "rect", x: 56, y: 56, w: 1088, h: 1688, stroke: C.sageDeep, lineWidth: 1 },
    { type: "star8", x: 48, y: 48, r: 18, fill: C.sageDeep }, { type: "star8", x: 1152, y: 48, r: 18, fill: C.sageDeep },
    { type: "star8", x: 48, y: 1752, r: 18, fill: C.sageDeep }, { type: "star8", x: 1152, y: 1752, r: 18, fill: C.sageDeep },
    P, frame("main", C.gold, 2, 14), frame("main", C.sage, 1, 28),
    tx("{message}", 600, 945, { font: "caps", size: 36, spacing: 8, upper: true, color: C.sageDeep, maxWidth: 1040 }),
    { type: "star8", x: 480, y: 1035, r: 14, fill: C.gold }, { type: "star8", x: 600, y: 1035, r: 19, fill: C.gold },
    { type: "star8", x: 720, y: 1035, r: 14, fill: C.gold },
    tx(NAMES, 600, 1215, { font: "script", size: 130, maxWidth: 1000 }),
    tx("{date}", 600, 1355, { font: "sans", size: 30, spacing: 10, upper: true, color: C.sageDeep }),
    { type: "crescent", x: 600, y: 1550, r: 40, fill: C.gold, rot: -30 }],
  "Sakinah · Mawaddah · Warahmah");

// ===================== CUTE & PLAYFUL (6) =====================
T("balon-cinta", "Balon Cinta", "cute-playful", "S", "Balon warna-warni melayang di atas foto bersudut bulat.",
  [slot("main", 150, 600, 780, 880, "rect", 40)],
  [fill(["#FFF4F1", "#FDE6E2"]),
    { type: "balloon", x: 230, y: 250, r: 78, fill: C.pink, len: 250 },
    { type: "balloon", x: 420, y: 170, r: 92, fill: "#EBC4BF", len: 300 },
    { type: "balloon", x: 650, y: 200, r: 88, fill: "#E8D2A6", len: 280 },
    { type: "balloon", x: 860, y: 280, r: 76, fill: C.sage, len: 230 },
    shadow("main"), P, frame("main", "#FFFFFF", 12, 6),
    tx(NAMES, 540, 1615, { font: "script", size: 120 }),
    tx("{date}", 540, 1725, { font: "sans", weight: 500, size: 30, spacing: 6, color: C.rose }),
    { type: "scatter", shape: "heart", count: 8, seed: 81, area: [40, 1790, 1000, 110], colors: [C.pink], size: [12, 22] }]);

T("stiker-lucu", "Stiker Lucu", "cute-playful", "Q", "Foto bergelombang seperti stiker, latar bergaris, dan label nama berbentuk pil.",
  [slot("main", 190, 110, 700, 700, "scallop")],
  [fill("#FFF6EC"), { type: "stripes", x: 0, y: 0, w: 1080, h: 1080, width: 30, gap: 30, angle: 0, color: "#FBE3DF" },
    shadow("main"), P, frame("main", "#FFFFFF", 12, 6),
    { type: "scatter", shape: "star5", count: 7, seed: 9, area: [30, 30, 1020, 800], colors: [C.gold, C.pink, C.sage], size: [24, 40], avoidSlots: true, margin: 40 },
    { type: "heart", x: 860, y: 150, s: 82, rot: 15, fill: C.pink, stroke: "#FFFFFF", lineWidth: 6 },
    { type: "rect", x: 290, y: 860, w: 500, h: 110, r: 55, fill: C.brown },
    tx(NAMES, 540, 915, { font: "sans", weight: 500, size: 40, spacing: 3, upper: true, color: C.white, maxWidth: 440 }),
    tx("{date}", 540, 1020, { font: "sans", weight: 500, size: 26, spacing: 4, color: C.rose })]);

T("hati-besar", "Hati Besar", "cute-playful", "P", "Foto berbentuk hati besar di atas pola polkadot dan awan.",
  [slot("main", 140, 140, 800, 760, "heart")],
  [fill("#FFF7F4"), { type: "dotGrid", x: 0, y: 0, w: 1080, h: 1350, gap: 46, r: 5, color: "#F2D3CE" },
    P, frame("main", C.pink, 6, 12),
    tx(NAMES, 540, 1080, { font: "script", size: 104 }),
    tx("{date}", 540, 1170, { font: "sans", weight: 500, size: 28, spacing: 6, color: C.rose }),
    tx("{message}", 540, 1235, { font: "sans", weight: 500, size: 22, spacing: 8, upper: true, color: C.pinkDeep }),
    { type: "cloud", x: 120, y: 1290, s: 0.9, fill: "#FFFFFF" }, { type: "cloud", x: 960, y: 1300, s: 0.8, fill: "#FFFFFF" }],
  "Cinta itu sederhana");

T("doodle-bahagia", "Doodle Bahagia", "cute-playful", "L", "Dua foto dengan coretan tangan: garis berombak, hati, dan kilau.",
  [slot("kiri", 90, 120, 620, 620, "rect", 24), slot("kanan", 790, 120, 620, 620, "rect", 24)],
  [fill("#FFFDF9"), P, frame("kiri", C.brown, 3, 4), frame("kanan", C.brown, 3, 4),
    { type: "heart", x: 750, y: 95, s: 70, rot: -10, stroke: C.brown, lineWidth: 3 },
    { type: "scatter", shape: "sparkle", count: 6, seed: 4, area: [20, 15, 1460, 90], colors: [C.gold], size: [10, 18] },
    { type: "squiggle", x: 90, y: 795, w: 1320, amp: 10, wave: 70, color: C.pink, lineWidth: 4 },
    tx(NAMES, 750, 880, { font: "script", size: 92, maxWidth: 1300 }),
    tx("{date}", 750, 955, { font: "sans", weight: 500, size: 26, spacing: 6, color: C.rose })]);

T("pesta-confetti", "Pesta Confetti", "cute-playful", "P", "Bendera segitiga dan hujan confetti untuk suasana pesta.",
  [slot("main", 120, 300, 840, 760, "rect", 30)],
  [fill(C.white),
    { type: "scatter", shape: "confetti", count: 55, seed: 21, area: [0, 140, 1080, 960], colors: [C.pink, C.gold, C.sage, "#EBC4BF"], size: [12, 22], avoidSlots: true, margin: 20 },
    { type: "bunting", x1: 0, y1: 50, x2: 1080, y2: 50, sag: 60, count: 11, colors: [C.pink, C.gold, C.sage, "#EBC4BF"], size: 64 },
    tx("{message}", 540, 230, { font: "sans", weight: 500, size: 30, spacing: 8, upper: true, color: C.pinkDeep }),
    P, frame("main", C.brown, 3, 10),
    tx(NAMES, 540, 1165, { font: "script", size: 104 }),
    tx("{date}", 540, 1255, { font: "sans", weight: 500, size: 28, spacing: 6, color: C.rose })],
  "Ayo rayakan!");

T("polaroid-duo", "Polaroid Duo", "cute-playful", "S", "Dua polaroid bertumpuk dengan nama masing-masing di bawahnya.",
  [slot("atas", 170, 200, 600, 560), slot("bawah", 310, 980, 600, 560)],
  [fill("#FDF0E4"), tx("{message}", 540, 100, { italic: true, size: 46, color: C.muted }),
    { type: "rect", x: 130, y: 160, w: 680, h: 740, fill: "#FFFFFF", shadow: { blur: 24, y: 8 } },
    { type: "rect", x: 270, y: 940, w: 680, h: 740, fill: "#FFFFFF", shadow: { blur: 24, y: 8 } },
    P,
    { type: "tape", x: 470, y: 165, w: 180, h: 46, rot: -6, color: "rgba(216,166,161,0.85)" },
    { type: "tape", x: 610, y: 945, w: 180, h: 46, rot: 5, color: "rgba(168,181,160,0.85)" },
    tx("{name1}", 470, 832, { font: "script", size: 66, maxWidth: 600 }),
    tx("{name2}", 610, 1612, { font: "script", size: 66, maxWidth: 600 }),
    { type: "heart", x: 880, y: 300, s: 60, fill: C.pink },
    { type: "scatter", shape: "star5", count: 4, seed: 2, area: [20, 1000, 230, 300], colors: [C.gold], size: [20, 30] },
    tx("{date}", 540, 1790, { font: "sans", weight: 500, size: 28, spacing: 6, color: C.rose })],
  "Kita berdua");

// ===================== VINTAGE FILM (6) =====================
T("kontak-film", "Lembar Kontak", "vintage-film", "Q", "Lembar kontak film dengan empat bingkai dan lingkaran spidol merah.",
  [slot("f1", 100, 160, 420, 300), slot("f2", 560, 160, 420, 300), slot("f3", 100, 600, 420, 300), slot("f4", 560, 600, 420, 300)],
  [fill("#EFE6D6"), { type: "rect", x: 60, y: 110, w: 960, h: 400, fill: C.dark }, { type: "rect", x: 60, y: 550, w: 960, h: 400, fill: C.dark },
    { type: "filmHoles", x: 60, y: 114, w: 960, h: 40, axis: "x", color: "#EFE6D6", hole: [22, 26], gap: 22 },
    { type: "filmHoles", x: 60, y: 466, w: 960, h: 40, axis: "x", color: "#EFE6D6", hole: [22, 26], gap: 22 },
    { type: "filmHoles", x: 60, y: 554, w: 960, h: 40, axis: "x", color: "#EFE6D6", hole: [22, 26], gap: 22 },
    { type: "filmHoles", x: 60, y: 906, w: 960, h: 40, axis: "x", color: "#EFE6D6", hole: [22, 26], gap: 22 },
    P, { type: "grain", seed: 15, amount: 3000, area: [60, 110, 960, 840], color: "#EFE6D6", opacity: 0.15 },
    { type: "shape", shape: "circle", x: 540, y: 140, w: 460, h: 340, stroke: C.rust, lineWidth: 5, opacity: 0.85 },
    tx(NAMES, 540, 1003, { font: "caps", size: 34, spacing: 6, upper: true, maxWidth: 900 }),
    tx("{date}", 540, 1048, { font: "sans", size: 20, spacing: 6, upper: true, color: C.muted })]);

T("slide-proyektor", "Slide Proyektor", "vintage-film", "P", "Foto dalam bingkai slide film yang disinari berkas proyektor.",
  [slot("main", 290, 300, 500, 500)],
  [fill("#2A231F"), { type: "rays", x: 540, y: -200, count: 1, inner: 0, outer: 1500, color: "#F3E7D3", from: 70, to: 110, ratio: 0.9, opacity: 0.07 },
    { type: "rect", x: 200, y: 210, w: 680, h: 680, r: 30, fill: "#E9DEC9", shadow: { blur: 30, y: 10, color: "rgba(0,0,0,0.5)" } },
    P, { type: "vignette", slot: "main", strength: 0.3 },
    tx("{date}", 540, 255, { font: "sans", size: 22, spacing: 6, upper: true, color: "#6B5543", maxWidth: 600 }),
    tx(NAMES, 540, 847, { font: "sans", weight: 500, size: 26, spacing: 6, upper: true, color: "#6B5543", maxWidth: 600 }),
    tx("{message}", 540, 1060, { italic: true, size: 54, color: C.beige }),
    tx("Slide No. 16", 540, 1160, { font: "sans", size: 22, spacing: 8, upper: true, color: "#9C8F84" })],
  "Kenangan yang kita putar ulang");

T("koran-lama", "Koran Lama", "vintage-film", "S", "Halaman koran tempo dulu: judul berita, foto hitam-putih, dan kolom.",
  [slot("main", 80, 560, 920, 700)],
  [fill("#EFE7D6"), { type: "grain", seed: 33, amount: 7000, color: "#5A4A3E", opacity: 0.1 },
    tx("{message}", 540, 150, { font: "caps", weight: 600, size: 96, color: "#2A231F", maxWidth: 960 }),
    { type: "line", x1: 80, y1: 225, x2: 1000, y2: 225, stroke: "#2A231F", lineWidth: 3 },
    tx("Edisi Spesial · {date}", 540, 262, { font: "sans", size: 22, spacing: 6, upper: true, color: "#2A231F", maxWidth: 920 }),
    { type: "line", x1: 80, y1: 298, x2: 1000, y2: 298, stroke: "#2A231F", lineWidth: 1 },
    tx("{name1} & {name2} Resmi Menikah", 540, 395, { weight: 600, size: 76, color: "#2A231F", maxWidth: 920 }),
    tx("Dua keluarga bersatu dalam suka cita", 540, 480, { italic: true, size: 36, color: "#5A4A3E", maxWidth: 920 }),
    P, { type: "tint", slot: "main", color: "#808080", blend: "saturation" },
    tx("Foto: dokumentasi keluarga", 80, 1292, { italic: true, size: 22, align: "left", color: "#5A4A3E" }),
    { type: "textLines", x: 80, y: 1360, w: 440, lines: 12, gap: 34, color: "rgba(42,35,31,0.28)", lineWidth: 6, seed: 3 },
    { type: "textLines", x: 560, y: 1360, w: 440, lines: 12, gap: 34, color: "rgba(42,35,31,0.28)", lineWidth: 6, seed: 4 },
    { type: "line", x1: 80, y1: 1800, x2: 1000, y2: 1800, stroke: "#2A231F", lineWidth: 1 }],
  "Kabar Bahagia");

T("tiket-bioskop", "Tiket Bioskop", "vintage-film", "L", "Foto di dalam tiket bioskop lawas lengkap dengan sobekan dan tulisan ADMIT TWO.",
  [slot("main", 560, 170, 820, 660)],
  [fill("#2A231F"), { type: "rect", x: 80, y: 110, w: 1340, h: 780, r: 30, fill: "#F3E7D3" },
    { type: "shape", shape: "circle", x: 30, y: 450, w: 100, h: 100, fill: "#2A231F" },
    { type: "shape", shape: "circle", x: 1370, y: 450, w: 100, h: 100, fill: "#2A231F" },
    { type: "line", x1: 480, y1: 130, x2: 480, y2: 870, stroke: C.rust, lineWidth: 3, dash: [14, 10] },
    tx("Admit Two", 290, 500, { font: "caps", weight: 600, size: 54, spacing: 8, upper: true, rot: -90, color: C.rust, maxWidth: 640 }),
    tx("{date}", 395, 500, { font: "sans", size: 22, spacing: 6, upper: true, rot: -90, color: "#6B5543", maxWidth: 640 }),
    P, { type: "tint", slot: "main", color: "#8B6B4A", blend: "color", opacity: 0.3 }, { type: "vignette", slot: "main", strength: 0.3 },
    tx("{message}", 970, 140, { font: "sans", weight: 500, size: 22, spacing: 8, upper: true, color: "#6B5543", maxWidth: 800 }),
    tx(NAMES, 970, 862, { font: "caps", size: 30, spacing: 6, upper: true, color: "#2A231F", maxWidth: 800 })],
  "Premiere · Kursi A1 & A2");

T("strip-film-sepia", "Strip Film Sepia", "vintage-film", "T", "Potongan rol film vertikal berisi tiga foto bernada sepia.",
  [slot("f1", 90, 70, 420, 480), slot("f2", 90, 590, 420, 480), slot("f3", 90, 1110, 420, 480)],
  [fill("#211B18"),
    { type: "filmHoles", x: 10, y: 0, w: 60, h: 1800, axis: "y", color: C.beige, hole: [26, 34], gap: 26 },
    { type: "filmHoles", x: 530, y: 0, w: 60, h: 1800, axis: "y", color: C.beige, hole: [26, 34], gap: 26 },
    P,
    { type: "tint", slot: "f1", color: "#8B6B4A", blend: "color", opacity: 0.55 },
    { type: "tint", slot: "f2", color: "#8B6B4A", blend: "color", opacity: 0.55 },
    { type: "tint", slot: "f3", color: "#8B6B4A", blend: "color", opacity: 0.55 },
    { type: "grain", seed: 19, amount: 3500, area: [90, 70, 420, 1520], color: C.beige, opacity: 0.2 },
    tx(NAMES, 300, 1665, { font: "caps", size: 30, spacing: 4, upper: true, color: "#E8C79A", maxWidth: 420 }),
    tx("{date}", 300, 1725, { font: "sans", size: 20, spacing: 6, upper: true, color: "#9C8F84", maxWidth: 420 })]);

T("album-lawas", "Album Lawas", "vintage-film", "R", "Foto bersudut penahan di kertas album tua, dengan cap arsip.",
  [slot("main", 200, 220, 800, 900)],
  [fill("#E5D8C2"), { type: "grain", seed: 41, amount: 9000, color: "#6B5543", opacity: 0.14 },
    { type: "rect", x: 150, y: 170, w: 900, h: 1000, fill: "#F6EEDF", rot: -2, shadow: { blur: 22, y: 8 } },
    P, { type: "tint", slot: "main", color: "#8B6B4A", blend: "color", opacity: 0.35 }, { type: "vignette", slot: "main", strength: 0.3 },
    { type: "photoCorners", slot: "main", size: 70, color: C.dark },
    tx("{message}", 600, 1300, { font: "script", size: 76, color: "#4A3B30", maxWidth: 1000 }),
    tx(NAMES, 600, 1420, { italic: true, size: 52, maxWidth: 1000 }),
    tx("{date}", 600, 1510, { font: "caps", size: 28, spacing: 8, upper: true, color: "#6B5543" }),
    { type: "arcText", text: "· {name1} & {name2} · Arsip ", x: 1000, y: 1650, r: 82, font: "sans", weight: 500, size: 15, upper: true, color: C.wood }],
  "Kenangan manis kita");

// ===================== EDITORIAL & MAGAZINE (6) =====================
T("sampul-mode", "Sampul Mode", "editorial-magazine", "R", "Sampul majalah mode: judul raksasa, cover lines, dan barcode.",
  [slot("main", 0, 0, 1200, 1800)],
  [fill(C.brown), P,
    { type: "gradientRect", x: 0, y: 0, w: 1200, h: 520, from: "rgba(20,14,10,0.5)", to: "rgba(20,14,10,0)" },
    { type: "gradientRect", x: 0, y: 1180, w: 1200, h: 620, from: "rgba(20,14,10,0)", to: "rgba(20,14,10,0.62)" },
    tx("{message}", 600, 230, { weight: 600, size: 260, spacing: 4, upper: true, color: C.white, maxWidth: 1120 }),
    tx("Edisi Pernikahan · {date}", 600, 385, { font: "sans", weight: 500, size: 24, spacing: 8, upper: true, color: "#F3E6CA", maxWidth: 1100 }),
    tx("{name1}", 70, 1350, { italic: true, size: 84, align: "left", color: C.white, maxWidth: 780 }),
    tx("& {name2}", 70, 1445, { italic: true, size: 84, align: "left", color: C.white, maxWidth: 780 }),
    tx("Kisah lengkapnya di halaman 16", 70, 1530, { font: "sans", weight: 300, size: 28, align: "left", color: "#F1E6D8", maxWidth: 780 }),
    { type: "rect", x: 925, y: 1545, w: 215, h: 175, fill: "#FFFFFF" },
    { type: "barcode", x: 942, y: 1562, w: 181, h: 112, seed: 16, color: "#111111" },
    tx("No. 16", 1032, 1696, { font: "sans", weight: 500, size: 18, spacing: 4, color: "#111111", maxWidth: 190 })],
  "Amour");

T("halaman-ganda", "Halaman Ganda", "editorial-magazine", "L", "Spread majalah dua halaman: artikel di kiri, foto penuh di kanan.",
  [slot("main", 760, 0, 740, 1000)],
  [fill("#FCFAF6"), P,
    { type: "gradientRect", x: 640, y: 0, w: 120, h: 1000, from: "rgba(0,0,0,0)", to: "rgba(0,0,0,0.1)", horizontal: true },
    tx("Fitur Utama", 80, 110, { font: "sans", weight: 500, size: 20, spacing: 10, upper: true, align: "left", color: C.goldDeep, maxWidth: 600 }),
    tx("{name1}", 74, 240, { weight: 500, size: 110, align: "left", maxWidth: 600 }),
    tx("& {name2}", 74, 370, { italic: true, size: 110, align: "left", color: C.gold, maxWidth: 600 }),
    tx("{message}", 80, 480, { italic: true, size: 34, align: "left", color: C.muted, maxWidth: 600 }),
    { type: "textLines", x: 80, y: 560, w: 280, lines: 10, gap: 30, seed: 7 },
    { type: "textLines", x: 390, y: 560, w: 280, lines: 10, gap: 30, seed: 8 },
    tx("{date}", 80, 920, { font: "sans", size: 20, spacing: 6, upper: true, align: "left", color: C.muted, maxWidth: 500 }),
    tx("16", 690, 920, { font: "sans", size: 20, align: "right", color: C.muted, maxWidth: 80 })],
  "Tentang cinta yang tumbuh perlahan");

T("pop-art", "Pop Art", "editorial-magazine", "Q", "Gaya pop art: titik halftone, lingkaran berbayang tebal, dan judul tegas.",
  [slot("main", 330, 220, 640, 640, "circle")],
  [fill("#FDEDEA"), { type: "halftone", x: 0, y: 0, w: 1080, h: 1080, gap: 26, maxR: 10, color: C.pink, dir: "tl" },
    { type: "shape", shape: "circle", x: 360, y: 250, w: 640, h: 640, fill: C.brown },
    P, frame("main", C.brown, 8, 0),
    tx("{message}", 60, 120, { font: "sans", weight: 500, size: 84, upper: true, align: "left", color: C.brown, maxWidth: 960 }),
    tx(NAMES, 60, 960, { font: "script", size: 104, align: "left", maxWidth: 700 }),
    tx("{date}", 1020, 1030, { font: "sans", weight: 500, size: 24, spacing: 6, upper: true, align: "right", color: C.pinkDeep, maxWidth: 400 })],
  "Kami bilang ya!");

T("grid-editorial", "Grid Editorial", "editorial-magazine", "P", "Tata letak artikel: satu foto utama dan dua foto bernomor.",
  [slot("utama", 60, 300, 960, 560), slot("kiri", 60, 890, 465, 300), slot("kanan", 555, 890, 465, 300)],
  [fill("#FCFAF6"),
    tx(NAMES, 60, 120, { weight: 500, size: 88, align: "left", maxWidth: 960 }),
    tx("{message}", 60, 200, { font: "sans", weight: 300, size: 26, align: "left", color: C.muted, maxWidth: 700 }),
    tx("{date}", 1020, 200, { font: "sans", weight: 500, size: 22, spacing: 6, upper: true, align: "right", maxWidth: 300 }),
    { type: "line", x1: 60, y1: 250, x2: 1020, y2: 250, stroke: C.brown, lineWidth: 2 },
    P,
    tx("01", 85, 825, { font: "sans", weight: 500, size: 26, align: "left", color: C.white, maxWidth: 80, shadow: "rgba(0,0,0,0.5)" }),
    tx("02", 60, 1225, { font: "sans", weight: 500, size: 20, align: "left", color: C.goldDeep, maxWidth: 80 }),
    tx("03", 555, 1225, { font: "sans", weight: 500, size: 20, align: "left", color: C.goldDeep, maxWidth: 80 }),
    tx("{name1} & {name2} · Wedding Photo Studio", 60, 1295, { font: "sans", size: 18, spacing: 6, upper: true, align: "left", color: C.muted, maxWidth: 960 })],
  "Catatan dari hari paling bahagia");

T("poster-tipografi", "Poster Tipografi", "editorial-magazine", "S", "Nama raksasa memenuhi separuh atas; foto di bawah seperti poster.",
  [slot("main", 60, 980, 960, 880)],
  [fill("#EDE3D3"),
    tx("{name1}", 60, 230, { weight: 600, size: 260, upper: true, align: "left", maxWidth: 960 }),
    tx("&", 540, 470, { italic: true, size: 200, color: C.gold, maxWidth: 200 }),
    tx("{name2}", 1020, 720, { weight: 600, size: 260, upper: true, align: "right", maxWidth: 960 }),
    tx("{date}", 60, 905, { font: "sans", weight: 500, size: 24, spacing: 10, upper: true, align: "left", maxWidth: 460 }),
    tx("{message}", 1020, 905, { font: "sans", weight: 500, size: 24, spacing: 10, upper: true, align: "right", maxWidth: 460 }),
    P],
  "Est. 2026");

T("profil-majalah", "Profil Majalah", "editorial-magazine", "V", "Halaman wawancara: foto tinggi di kiri, kutipan dan kolom teks di kanan.",
  [slot("main", 0, 0, 620, 1440)],
  [fill("#FCFAF6"), P,
    tx("Wawancara Eksklusif", 680, 120, { font: "sans", weight: 500, size: 20, spacing: 8, upper: true, align: "left", color: C.goldDeep, maxWidth: 360 }),
    tx("{name1}", 680, 250, { weight: 500, size: 84, align: "left", maxWidth: 360 }),
    tx("& {name2}", 680, 350, { italic: true, size: 84, align: "left", color: C.gold, maxWidth: 360 }),
    { type: "line", x1: 680, y1: 420, x2: 780, y2: 420, stroke: C.brown, lineWidth: 2 },
    tx("{message}", 680, 500, { italic: true, size: 40, align: "left", maxWidth: 360 }),
    { type: "textLines", x: 680, y: 580, w: 340, lines: 16, gap: 30, seed: 11 },
    tx("{date}", 680, 1340, { font: "sans", size: 20, spacing: 6, upper: true, align: "left", color: C.muted, maxWidth: 360 })],
  "“Akhirnya, kami pulang.”");

// ===================== BOTANICAL GARDEN (7) =====================
T("karangan-eucalyptus", "Karangan Eucalyptus", "botanical-garden", "P", "Mahkota daun eucalyptus bulat mengelilingi foto.",
  [slot("main", 270, 170, 540, 540, "circle")],
  [fill("#F4F3EE"), P, frame("main", "#FFFFFF", 6, 8),
    { type: "wreath", x: 540, y: 440, r: 322, color: "#93A69A", color2: "#7E9488", leaves: 40, leafLen: 42, round: true },
    tx(NAMES, 540, 900, { weight: 500, size: 76 }),
    tx("{date}", 540, 980, { font: "sans", size: 26, spacing: 8, upper: true, color: C.sageDeep }),
    tx("{message}", 540, 1060, { italic: true, size: 40, color: C.muted }),
    { type: "sprig", x: 330, y: 1250, angle: -25, len: 240, leaves: 9, color: "#93A69A", round: true },
    { type: "sprig", x: 750, y: 1250, angle: 205, len: 240, leaves: 9, color: "#93A69A", round: true, bend: -0.18 }],
  "Tumbuh bersama");

T("tropis-hijau", "Tropis Hijau", "botanical-garden", "Q", "Daun-daun tropis besar membingkai foto dari setiap sudut.",
  [slot("main", 220, 180, 640, 640, "rect", 8)],
  [fill("#F1F2EA"),
    { type: "leaf", x: -40, y: 140, len: 420, width: 120, angle: 25, color: "#6E8B6A" },
    { type: "leaf", x: -30, y: 420, len: 360, width: 100, angle: 2, color: "#8FA88A" },
    { type: "leaf", x: 1100, y: 900, len: 400, width: 120, angle: 200, color: "#8FA88A" },
    { type: "leaf", x: 40, y: 1120, len: 380, width: 110, angle: -50, color: "#5E7A5B" },
    P,
    { type: "leaf", x: 1120, y: 150, len: 420, width: 120, angle: 150, color: "#6E8B6A" },
    tx(NAMES, 540, 905, { font: "script", size: 92, maxWidth: 760 }),
    tx("{date}", 540, 985, { font: "sans", size: 26, spacing: 8, upper: true, color: "#5E7A5B" })]);

T("rumah-kaca", "Rumah Kaca", "botanical-garden", "S", "Jendela rumah kaca berlengkung dengan sulur yang menjuntai.",
  [slot("main", 190, 380, 700, 1060, "arch")],
  [fill("#EEF1EA"), { type: "shape", shape: "arch", x: 150, y: 340, w: 780, h: 1140, stroke: C.sageDeep, lineWidth: 4 },
    P,
    { type: "line", x1: 540, y1: 380, x2: 540, y2: 1440, stroke: "#FFFFFF", lineWidth: 6, opacity: 0.55 },
    { type: "line", x1: 190, y1: 900, x2: 890, y2: 900, stroke: "#FFFFFF", lineWidth: 6, opacity: 0.55 },
    frame("main", C.sageDeep, 3, 0),
    { type: "sprig", x: 260, y: 0, angle: 95, len: 420, leaves: 9, color: "#8D9C85" },
    { type: "sprig", x: 540, y: 0, angle: 90, len: 300, leaves: 7, color: "#A8B5A0", bend: -0.15 },
    { type: "sprig", x: 820, y: 0, angle: 85, len: 460, leaves: 10, color: "#7F8B70" },
    tx(NAMES, 540, 1590, { font: "script", size: 120 }),
    tx("{date}", 540, 1705, { font: "sans", size: 28, spacing: 8, upper: true, color: C.sageDeep }),
    tx("{message}", 540, 1795, { italic: true, size: 40, color: C.muted })],
  "Cinta yang kami rawat");

T("herbarium", "Herbarium", "botanical-garden", "R", "Kartu spesimen herbarium: daun yang dipres dan label nama.",
  [slot("main", 150, 140, 900, 900)],
  [fill("#F2EBDD"), { type: "grain", seed: 51, amount: 5000, color: "#6B5543", opacity: 0.08 },
    P, frame("main", "#6B5543", 1, 1),
    { type: "sprig", x: 210, y: 1650, angle: -78, len: 440, leaves: 10, color: "#7F8B70" },
    { type: "sprig", x: 360, y: 1650, angle: -100, len: 380, leaves: 11, color: "#9AA58A", round: true },
    { type: "flower", x: 470, y: 1250, r: 42, style: "daisy", color: "#D9A98C", center: "#8A6E4F" },
    { type: "flower", x: 180, y: 1225, r: 30, style: "daisy", color: "#E8C5B0", center: "#8A6E4F" },
    { type: "rect", x: 620, y: 1180, w: 480, h: 420, stroke: "#6B5543", lineWidth: 2 },
    tx("Spesimen No. 16", 860, 1235, { font: "caps", size: 24, spacing: 4, upper: true, color: "#6B5543", maxWidth: 440 }),
    { type: "line", x1: 640, y1: 1272, x2: 1080, y2: 1272, stroke: "#6B5543", lineWidth: 1 },
    tx("{name1}", 860, 1335, { italic: true, size: 46, maxWidth: 440 }),
    tx("& {name2}", 860, 1400, { italic: true, size: 46, maxWidth: 440 }),
    tx("{date}", 860, 1475, { font: "sans", size: 20, spacing: 4, upper: true, color: C.muted, maxWidth: 440 }),
    tx("{message}", 860, 1545, { font: "sans", size: 18, spacing: 2, color: C.muted, maxWidth: 440 })],
  "Familia: Cinta Abadi");

T("lingkar-pakis", "Lingkar Pakis", "botanical-garden", "L", "Foto bulat dalam lingkaran pakis, dengan pembatas daun di sisi teks.",
  [slot("main", 120, 140, 720, 720, "circle")],
  [fill("#F3F1E8"), P, { type: "wreath", x: 480, y: 500, r: 412, color: "#7F9077", leaves: 60, leafLen: 50 },
    tx("{name1}", 1180, 360, { weight: 500, size: 84, maxWidth: 520 }),
    tx("&", 1180, 445, { italic: true, size: 52, color: "#7F9077", maxWidth: 80 }),
    tx("{name2}", 1180, 530, { weight: 500, size: 84, maxWidth: 520 }),
    { type: "sprig", x: 1060, y: 640, angle: 0, len: 240, leaves: 10, color: "#7F9077", bend: 0.08 },
    tx("{date}", 1180, 720, { font: "sans", size: 24, spacing: 6, upper: true, color: C.muted, maxWidth: 520 })]);

T("bunga-liar", "Bunga Liar", "botanical-garden", "V", "Padang rumput dan bunga daisy liar tumbuh di bawah foto.",
  [slot("main", 120, 110, 840, 860, "rect", 20)],
  [fill("#F6F4EC"), P,
    tx(NAMES, 540, 1065, { font: "script", size: 104 }),
    tx("{date}", 540, 1150, { font: "sans", size: 26, spacing: 8, upper: true, color: C.sageDeep }),
    { type: "meadow", x: 0, y: 1230, w: 1080, h: 210, seed: 3, count: 80, colors: ["#A8B5A0", "#8D9C85", "#7F8B70"], flowers: 16 }]);

T("gerbang-daun", "Gerbang Daun", "botanical-garden", "P", "Dua foto lengkung berdampingan di bawah sulur daun yang menyatu.",
  [slot("kiri", 110, 320, 410, 680, "arch"), slot("kanan", 560, 320, 410, 680, "arch")],
  [fill("#F4F3EE"), P,
    { type: "sprig", x: 60, y: 350, angle: -14, len: 520, leaves: 12, color: "#8D9C85", bend: 0.25 },
    { type: "sprig", x: 1020, y: 350, angle: 194, len: 520, leaves: 12, color: "#8D9C85", bend: -0.25 },
    { type: "sprig", x: 540, y: 300, angle: -90, len: 120, leaves: 5, color: "#A8B5A0", round: true },
    { type: "flower", x: 540, y: 305, r: 30, palette: "ivory", petals: 6 },
    tx(NAMES, 540, 1110, { weight: 500, size: 72, maxWidth: 920 }),
    tx("{date}", 540, 1185, { font: "sans", size: 26, spacing: 8, upper: true, color: C.sageDeep }),
    tx("{message}", 540, 1255, { italic: true, size: 38, color: C.muted })],
  "Dua jalan, satu tujuan");

// ===================== CLASSIC WEDDING (6) =====================
T("undangan-klasik", "Undangan Klasik", "classic-wedding", "V", "Seperti kartu undangan resmi: foto oval, bingkai garis, dan flourish.",
  [slot("main", 290, 300, 500, 620, "circle")],
  [fill("#FBF8F2"), { type: "rect", x: 50, y: 50, w: 980, h: 1340, stroke: C.brown, lineWidth: 2 },
    { type: "rect", x: 66, y: 66, w: 948, h: 1308, stroke: C.brown, lineWidth: 1 },
    { type: "flourish", x: 540, y: 190, w: 460, color: C.brown, lineWidth: 1.5 },
    P, frame("main", C.brown, 1, 10), frame("main", C.beige, 3, 20),
    tx("{message}", 540, 1010, { italic: true, size: 40, color: C.muted, maxWidth: 860 }),
    tx(NAMES, 540, 1110, { font: "caps", size: 54, spacing: 6, upper: true, maxWidth: 860 }),
    tx("{date}", 540, 1185, { italic: true, size: 38, color: C.muted }),
    { type: "flourish", x: 540, y: 1275, w: 360, color: C.brown, lineWidth: 1.5, flip: true }],
  "Dengan memohon rahmat dan ridha-Nya");

T("pita-satin", "Pita Satin", "classic-wedding", "P", "Pita satin merah muda membentang di bawah foto dengan nama pasangan.",
  [slot("main", 100, 100, 880, 980)],
  [fill(C.white), P,
    { type: "ribbon", x: 540, y: 1010, w: 960, h: 130, fill: C.pink, fill2: "#B98580" },
    tx(NAMES, 540, 1010, { font: "caps", size: 48, spacing: 6, upper: true, color: C.white, maxWidth: 760 }),
    tx("{date}", 540, 1170, { italic: true, size: 40, color: C.muted }),
    tx("{message}", 540, 1240, { font: "sans", size: 22, spacing: 10, upper: true, color: C.goldDeep })],
  "Kebahagiaan kami");

T("cincin-kawin", "Cincin Kawin", "classic-wedding", "Q", "Ikon sepasang cincin di atas foto dengan tipografi serif klasik.",
  [slot("main", 170, 230, 740, 580)],
  [fill(C.ivory), { type: "rings", x: 540, y: 125, r: 40, stroke: C.gold, lineWidth: 3.5 },
    { type: "line", x1: 340, y1: 125, x2: 460, y2: 125, stroke: C.gold, lineWidth: 1 },
    { type: "line", x1: 620, y1: 125, x2: 740, y2: 125, stroke: C.gold, lineWidth: 1 },
    P, frame("main", C.brown, 1, 10),
    tx(NAMES, 540, 905, { weight: 500, size: 64 }),
    tx("{date}", 540, 978, { font: "caps", size: 26, spacing: 8, upper: true, color: C.goldDeep }),
    tx("{message}", 540, 1035, { italic: true, size: 34, color: C.muted })],
  "Selamanya bersama");

T("album-keluarga", "Album Keluarga", "classic-wedding", "L", "Halaman album dengan tiga foto bersudut penahan dan keterangan tulisan tangan.",
  [slot("kiri", 90, 90, 640, 480), slot("kanan", 770, 90, 640, 480), slot("bawah", 430, 620, 640, 320)],
  [fill("#EFE6D6"), { type: "grain", seed: 61, amount: 6000, color: "#6B5543", opacity: 0.08 },
    P,
    { type: "photoCorners", slot: "kiri", size: 50, color: C.dark },
    { type: "photoCorners", slot: "kanan", size: 50, color: C.dark },
    { type: "photoCorners", slot: "bawah", size: 50, color: C.dark },
    tx("{name1}", 240, 740, { font: "script", size: 64, maxWidth: 300 }),
    tx("& {name2}", 240, 830, { font: "script", size: 64, maxWidth: 300 }),
    tx("{date}", 1260, 750, { italic: true, size: 34, color: "#6B5543", maxWidth: 300 }),
    tx("{message}", 1260, 820, { font: "sans", size: 20, spacing: 6, upper: true, color: C.muted, maxWidth: 300 })],
  "Album keluarga");

T("pilar-klasik", "Pilar Klasik", "classic-wedding", "S", "Foto lengkung diapit dua pilar klasik bergaya Yunani.",
  [slot("main", 260, 420, 560, 960, "arch")],
  [fill(C.ivory), tx("{message}", 540, 260, { italic: true, size: 44, color: C.muted }),
    { type: "pillar", x: 105, y: 420, w: 100, h: 960, fill: C.beige, stroke: "#B9A48A" },
    { type: "pillar", x: 875, y: 420, w: 100, h: 960, fill: C.beige, stroke: "#B9A48A" },
    { type: "shape", shape: "arch", x: 230, y: 390, w: 620, h: 1020, stroke: C.gold, lineWidth: 2 },
    P,
    tx(NAMES, 540, 1545, { font: "caps", size: 56, spacing: 6, upper: true, maxWidth: 920 }),
    { type: "divider", x: 540, y: 1615, w: 300, color: C.gold },
    tx("{date}", 540, 1685, { italic: true, size: 40, color: C.muted })],
  "Janji di hadapan keluarga");

T("monogram-klasik", "Monogram Klasik", "classic-wedding", "R", "Monogram inisial pasangan dalam lingkaran emas di atas foto.",
  [slot("main", 150, 560, 900, 900)],
  [fill("#FBF8F2"), { type: "shape", shape: "circle", x: 450, y: 80, w: 300, h: 300, stroke: C.gold, lineWidth: 2 },
    { type: "shape", shape: "circle", x: 470, y: 100, w: 260, h: 260, stroke: C.gold, lineWidth: 1 },
    tx("{i1}", 572, 225, { weight: 500, size: 130, align: "right", maxWidth: 120 }),
    tx("&", 600, 262, { italic: true, size: 56, color: C.gold, maxWidth: 60 }),
    tx("{i2}", 628, 225, { weight: 500, size: 130, align: "left", maxWidth: 120 }),
    { type: "flourish", x: 600, y: 470, w: 400, color: C.gold, lineWidth: 1.8 },
    P, frame("main", C.gold, 1.5, 12),
    tx(NAMES, 600, 1565, { font: "caps", size: 46, spacing: 8, upper: true, maxWidth: 1000 }),
    tx("{date}", 600, 1645, { italic: true, size: 38, color: C.muted })]);

// ===================== SOFT PASTEL (6) =====================
T("awan-kapas", "Awan Kapas", "soft-pastel", "Q", "Langit pastel dengan awan kapas yang menyelimuti foto bulat.",
  [slot("main", 290, 130, 500, 500, "circle")],
  [fill(["#DCE6EE", "#F4E7EE"]),
    { type: "cloud", x: 170, y: 190, s: 0.8, fill: "#FFFFFF", opacity: 0.85 }, { type: "cloud", x: 930, y: 160, s: 0.7, fill: "#FFFFFF", opacity: 0.85 },
    { type: "cloud", x: 190, y: 560, s: 1.2, fill: "#FFFFFF" }, { type: "cloud", x: 900, y: 540, s: 1.05, fill: "#FFFFFF" },
    { type: "scatter", shape: "sparkle", count: 16, seed: 8, area: [0, 0, 1080, 760], colors: ["#FFFFFF"], size: [6, 14], avoidSlots: true, margin: 30 },
    P, frame("main", "#FFFFFF", 8, 8),
    { type: "cloud", x: 560, y: 650, s: 1.5, fill: "#FFFFFF" },
    tx(NAMES, 540, 860, { weight: 500, size: 74, color: "#6E6178" }),
    tx("{date}", 540, 940, { font: "sans", size: 24, spacing: 8, upper: true, color: "#8F8590" })]);

T("gelombang-lembut", "Gelombang Lembut", "soft-pastel", "S", "Tiga lapis gelombang pastel mengalir di bawah foto.",
  [slot("main", 150, 200, 780, 980, "rect", 60)],
  [fill("#FBF1EC"), shadow("main", { color: "rgba(150,120,140,0.25)" }), P,
    { type: "waves", y: 1260, amp: 30, wave: 360, fill: "#EED9E2" },
    { type: "waves", y: 1345, amp: 26, wave: 300, fill: "#DCE6EE", phase: 1.2 },
    { type: "waves", y: 1440, amp: 22, wave: 420, fill: "#E7EDE2", phase: 2.4 },
    tx(NAMES, 540, 1560, { weight: 500, size: 96, color: "#5F4F5C" }),
    tx("{date}", 540, 1665, { font: "sans", size: 28, spacing: 8, upper: true, color: "#7D7280" }),
    tx("{message}", 540, 1780, { italic: true, size: 40, color: "#7D7280" })],
  "Mengalir bersama");

T("pelangi-pastel", "Pelangi Pastel", "soft-pastel", "P", "Pelangi pastel melengkung di belakang foto berbentuk lengkung.",
  [slot("main", 290, 300, 500, 700, "arch")],
  [fill("#FFFBF6"),
    { type: "rainbow", x: 540, y: 560, r: 400, width: 30, colors: ["#F2C9C4", "#F6DDBF", "#EEF0C8", "#CFE3D0", "#CBDCEB"] },
    { type: "cloud", x: 200, y: 570, s: 0.9, fill: "#FFFFFF" }, { type: "cloud", x: 880, y: 570, s: 0.9, fill: "#FFFFFF" },
    P, frame("main", "#FFFFFF", 8, 8),
    tx(NAMES, 540, 1115, { font: "script", size: 100, color: "#6B5B66" }),
    tx("{date}", 540, 1200, { font: "sans", size: 26, spacing: 8, upper: true, color: "#8F8590" }),
    tx("{message}", 540, 1265, { font: "sans", weight: 300, size: 26, lower: true, color: "#8F8590" })],
  "setelah hujan, ada kita");

T("kotak-permen", "Kotak Permen", "soft-pastel", "L", "Dua foto manis di atas garis diagonal pastel, dengan label pil.",
  [slot("kiri", 140, 140, 560, 620, "rect", 40), slot("kanan", 800, 140, 560, 620, "rect", 40)],
  [fill("#FFF5F2"), { type: "stripes", x: 0, y: 0, w: 1500, h: 1000, width: 40, gap: 40, angle: 45, color: "#FBE6EC" },
    shadow("kiri"), shadow("kanan"), P, frame("kiri", "#FFFFFF", 14, 8), frame("kanan", "#FFFFFF", 14, 8),
    { type: "heart", x: 750, y: 450, s: 64, fill: "#F2C9C4", stroke: "#FFFFFF", lineWidth: 5 },
    { type: "rect", x: 430, y: 815, w: 640, h: 110, r: 55, fill: "#E7B9C7" },
    tx(NAMES, 750, 870, { font: "sans", weight: 500, size: 36, spacing: 3, upper: true, color: C.white, maxWidth: 580 })]);

T("bunga-kertas", "Bunga Kertas", "soft-pastel", "R", "Foto belah ketupat dikelilingi bunga dan daisy berwarna pastel.",
  [slot("main", 200, 250, 800, 1000, "rhombus")],
  [fill("#FBF4F6"), P, frame("main", "#FFFFFF", 6, 14),
    { type: "flower", x: 320, y: 420, r: 80, palette: "pastel", petals: 7 },
    { type: "flower", x: 880, y: 1080, r: 80, palette: "pastel", petals: 7, rot: 20 },
    { type: "flower", x: 900, y: 400, r: 54, style: "daisy", color: "#FFFFFF", center: "#E3CB98" },
    { type: "flower", x: 300, y: 1100, r: 54, style: "daisy", color: "#FFFFFF", center: "#E3CB98" },
    { type: "sprig", x: 230, y: 520, angle: 60, len: 180, leaves: 6, color: "#BFCBB8" },
    { type: "sprig", x: 960, y: 980, angle: 240, len: 180, leaves: 6, color: "#BFCBB8" },
    tx(NAMES, 600, 1420, { font: "script", size: 110, color: "#6B5B66", maxWidth: 1000 }),
    tx("{date}", 600, 1530, { font: "sans", size: 28, spacing: 8, upper: true, color: "#8F8590" }),
    tx("{message}", 600, 1620, { italic: true, size: 40, color: "#8F8590" })],
  "Mekar di hati");

T("mimpi-lavender", "Mimpi Lavender", "soft-pastel", "V", "Bokeh lembut dan tangkai lavender mengapit foto oval.",
  [slot("main", 240, 190, 600, 760, "circle")],
  [fill(["#F1ECF5", "#FBF6F1"]), { type: "bokeh", count: 18, seed: 6, colors: ["#E3D6EE", "#F4DCE4", "#FFFFFF"], size: [30, 90] },
    P, frame("main", "#FFFFFF", 6, 12),
    { type: "sprig", x: 230, y: 1010, angle: -72, len: 360, leaves: 14, color: "#B9A7C9", round: true, leafScale: 0.6 },
    { type: "sprig", x: 850, y: 1010, angle: -108, len: 360, leaves: 14, color: "#B9A7C9", round: true, leafScale: 0.6, bend: -0.18 },
    tx(NAMES, 540, 1125, { weight: 500, size: 78, color: "#5F4F6E" }),
    tx("{date}", 540, 1205, { font: "sans", size: 26, spacing: 8, upper: true, color: "#8C7F9A" }),
    tx("{message}", 540, 1285, { italic: true, size: 40, color: "#8C7F9A" })],
  "Seperti mimpi yang jadi nyata");

// ===================== RUSTIC WEDDING (7) =====================
T("papan-kayu", "Papan Kayu", "rustic-wedding", "P", "Latar papan kayu, foto bermatras, dan label kertas.",
  [slot("main", 170, 170, 740, 800)],
  [fill("#8A6446"), { type: "wood", x: 0, y: 0, w: 1080, h: 1350, plank: 135, colors: ["#9A7356", "#8A6446", "#A57E5F"], seed: 5 },
    { type: "line", x1: 0, y1: 100, x2: 1080, y2: 130, stroke: C.kraft, lineWidth: 3 },
    shadow("main", { grow: 22, fill: C.cream }), P,
    { type: "tape", x: 540, y: 158, w: 200, h: 50, rot: -2, color: "rgba(217,195,160,0.9)" },
    { type: "rect", x: 240, y: 1060, w: 600, h: 200, r: 12, fill: C.cream, shadow: { blur: 18, y: 6 } },
    tx(NAMES, 540, 1135, { font: "script", size: 78, color: "#5A4636", maxWidth: 560 }),
    tx("{date}", 540, 1210, { font: "sans", weight: 500, size: 22, spacing: 6, upper: true, color: C.wood, maxWidth: 560 })]);

T("papan-kapur", "Papan Kapur", "rustic-wedding", "S", "Papan tulis kapur berbingkai kayu dengan coretan tangan.",
  [slot("main", 170, 380, 740, 900)],
  [fill("#2F3632"), { type: "grain", seed: 71, amount: 9000, color: "#FFFFFF", opacity: 0.05 },
    { type: "rect", x: 25, y: 25, w: 1030, h: 1870, stroke: "#8A6446", lineWidth: 30 },
    tx("{message}", 540, 200, { font: "script", size: 92, color: "#F3F0E8" }),
    { type: "squiggle", x: 340, y: 292, w: 400, amp: 8, wave: 50, color: "#F3F0E8", lineWidth: 3 },
    P, frame("main", "#F3F0E8", 3, 14, { dash: [12, 8] }),
    { type: "heart", x: 880, y: 1330, s: 70, rot: 10, stroke: "#F2C9C4", lineWidth: 4 },
    tx(NAMES, 540, 1440, { font: "caps", size: 56, spacing: 6, upper: true, color: "#F3F0E8", maxWidth: 860 }),
    tx("{date}", 540, 1530, { font: "sans", size: 30, spacing: 8, color: "#F2C9C4" }),
    { type: "sprig", x: 290, y: 1720, angle: -15, len: 220, leaves: 7, color: "#DCE5D5" },
    { type: "sprig", x: 790, y: 1720, angle: 195, len: 220, leaves: 7, color: "#DCE5D5", bend: -0.18 }],
  "Akhirnya menikah!");

T("burlap-renda", "Burlap & Renda", "rustic-wedding", "Q", "Tekstur karung goni dengan pita renda yang memuat nama.",
  [slot("main", 290, 120, 500, 500, "circle")],
  [fill("#C8AE88"), { type: "grain", seed: 81, amount: 14000, color: "#8A6E4F", opacity: 0.25 },
    { type: "stripes", x: 0, y: 0, w: 1080, h: 1080, width: 2, gap: 6, angle: 0, color: "rgba(138,110,79,0.12)" },
    { type: "stripes", x: 0, y: 0, w: 1080, h: 1080, width: 2, gap: 6, angle: 90, color: "rgba(138,110,79,0.12)" },
    P, frame("main", C.cream, 10, 10),
    { type: "lace", x: 0, y: 700, w: 1080, h: 130, fill: C.cream, holeColor: "rgba(138,110,79,0.25)", scallop: 18 },
    tx(NAMES, 540, 765, { font: "script", size: 84, color: "#5A4636", maxWidth: 900 }),
    tx("{date}", 540, 920, { font: "sans", weight: 500, size: 24, spacing: 6, upper: true, color: C.cream }),
    tx("{message}", 540, 990, { italic: true, size: 36, color: C.cream })],
  "Sederhana tapi bermakna");

T("lumbung-senja", "Lumbung Senja", "rustic-wedding", "L", "Langit senja hangat, untaian lampu, dan siluet ranting gandum.",
  [slot("main", 420, 170, 660, 680)],
  [fill(["#F4C9A0", "#E8A27C", "#B5654A"]),
    { type: "garland", x1: 0, y1: 50, x2: 1500, y2: 50, sag: 70, count: 15, wire: "#5A4636", bulb: "#FFF1C9" },
    P, frame("main", C.cream, 14, 7),
    tx("{name1}", 210, 470, { font: "script", size: 90, color: C.cream, maxWidth: 360, shadow: "rgba(90,50,30,0.5)" }),
    tx("{name2}", 1290, 470, { font: "script", size: 90, color: C.cream, maxWidth: 360, shadow: "rgba(90,50,30,0.5)" }),
    tx("{date}", 750, 930, { font: "sans", weight: 500, size: 26, spacing: 6, upper: true, color: C.cream }),
    { type: "sprig", x: 110, y: 990, angle: -75, len: 280, leaves: 9, color: "#5A4636" },
    { type: "sprig", x: 1390, y: 990, angle: -105, len: 280, leaves: 9, color: "#5A4636", bend: -0.18 }]);

T("kraft-dua", "Jemuran Kenangan", "rustic-wedding", "V", "Dua foto bermatras digantung jepit kayu di tali rami.",
  [slot("kiri", 120, 230, 400, 500), slot("kanan", 560, 310, 400, 500)],
  [fill(C.kraft), { type: "grain", seed: 91, amount: 9000, color: "#6B5543", opacity: 0.15 },
    { type: "line", x1: 40, y1: 150, x2: 1040, y2: 330, stroke: C.wood, lineWidth: 3 },
    { type: "rect", x: 100, y: 210, w: 440, h: 620, fill: C.cream, shadow: { blur: 18, y: 6 } },
    { type: "rect", x: 540, y: 290, w: 440, h: 620, fill: C.cream, shadow: { blur: 18, y: 6 } },
    P,
    { type: "rect", x: 305, y: 170, w: 30, h: 70, r: 4, fill: "#A57E5F" },
    { type: "rect", x: 745, y: 250, w: 30, h: 70, r: 4, fill: "#A57E5F" },
    tx("{name1}", 320, 785, { font: "script", size: 56, color: "#4A3B30", maxWidth: 380 }),
    tx("{name2}", 760, 865, { font: "script", size: 56, color: "#4A3B30", maxWidth: 380 }),
    tx("{message}", 540, 1050, { italic: true, size: 44, color: "#4A3B30" }),
    tx("{date}", 540, 1130, { font: "sans", weight: 500, size: 26, spacing: 6, upper: true, color: "#5A4636" }),
    { type: "sprig", x: 120, y: 1350, angle: -40, len: 240, leaves: 8, color: "#7F8B70" },
    { type: "flower", x: 930, y: 1300, r: 34, style: "daisy", color: C.cream, center: C.rust }],
  "Kisah kita, dicetak di hati");

T("bunga-kering", "Bunga Kering", "rustic-wedding", "R", "Rangkaian bunga kering dan label kertas bertali di bawah foto lengkung.",
  [slot("main", 260, 220, 680, 980, "arch")],
  [fill("#EADBC4"), { type: "grain", seed: 95, amount: 8000, color: "#6B5543", opacity: 0.1 },
    P, frame("main", C.cream, 10, 12),
    { type: "sprig", x: 950, y: 300, angle: -60, len: 260, leaves: 8, color: "#9AA58A" },
    { type: "flowerCluster", x: 300, y: 1180, s: 1.2, rot: 200, palette: "rust" },
    { type: "rect", x: 330, y: 1300, w: 540, h: 260, r: 18, fill: C.cream, rot: -3, shadow: { blur: 16, y: 6 } },
    { type: "shape", shape: "circle", x: 352, y: 1402, w: 26, h: 26, fill: "#EADBC4" },
    tx(NAMES, 610, 1405, { font: "script", size: 82, color: "#5A4636", maxWidth: 440, rot: -3 }),
    tx("{date}", 610, 1485, { font: "sans", weight: 500, size: 22, spacing: 6, upper: true, color: C.wood, maxWidth: 440, rot: -3 }),
    tx("{message}", 600, 1660, { italic: true, size: 38, color: "#6B5543" })],
  "Dirangkai dengan sederhana");

T("irisan-kayu", "Irisan Kayu", "rustic-wedding", "Q", "Foto bulat di atas irisan batang kayu dengan cincin tahunnya.",
  [slot("main", 290, 150, 500, 500, "circle")],
  [fill("#E9DCC6"), { type: "grain", seed: 99, amount: 7000, color: "#6B5543", opacity: 0.1 },
    { type: "woodSlice", x: 540, y: 400, r: 330, seed: 4 },
    P, frame("main", "#5A4636", 3, 6),
    { type: "sprig", x: 430, y: 735, angle: 170, len: 230, leaves: 8, color: "#7F8B70" },
    { type: "sprig", x: 650, y: 735, angle: 10, len: 230, leaves: 8, color: "#9AA58A", bend: -0.18 },
    tx(NAMES, 540, 860, { font: "script", size: 88, color: "#5A4636" }),
    tx("{date}", 540, 945, { font: "sans", weight: 500, size: 24, spacing: 6, upper: true, color: C.wood }),
    tx("{message}", 540, 1010, { italic: true, size: 32, color: "#6B5543" })],
  "Akar yang kuat, cinta yang hangat");

// ===================== PHOTOBOOTH STRIP (7) =====================
const strip4 = (x, w, h, y0, gap, n, shape = "rect", r) => Array.from({ length: n }, (_, i) => slot(`foto-${i + 1}`, x, y0 + i * (h + gap), w, h, shape, r));

T("strip-pink", "Strip Pink", "photobooth-strip", "T", "Strip empat foto bersudut bulat di latar merah muda bertabur hati.",
  strip4(50, 500, 340, 60, 20, 4, "rect", 24),
  [fill("#F9DCD8"), { type: "scatter", shape: "heart", count: 16, seed: 14, area: [0, 0, 600, 1800], colors: ["#FFFFFF", "#EBC4BF"], size: [14, 26], avoidSlots: true, margin: 12 },
    P, ...[1, 2, 3, 4].map((i) => frame(`foto-${i}`, "#FFFFFF", 8, 4)),
    tx(NAMES, 300, 1590, { font: "script", size: 66, maxWidth: 520 }),
    tx("{date}", 300, 1670, { font: "sans", weight: 500, size: 20, spacing: 5, upper: true, color: C.rose, maxWidth: 520 })]);

T("strip-ganda", "Strip Ganda 4R", "photobooth-strip", "R", "Dua strip identik dalam satu cetakan 4R (enam foto) dengan garis potong.",
  [0, 1].flatMap((c) => [0, 1, 2].map((r) => slot(`k${c + 1}-${r + 1}`, 40 + c * 580, 40 + r * 480, 540, 460))),
  [fill(C.white), P,
    { type: "line", x1: 600, y1: 0, x2: 600, y2: 1800, stroke: C.beige, lineWidth: 2, dash: [10, 10] },
    tx(NAMES, 310, 1570, { font: "script", size: 58, maxWidth: 520 }), tx(NAMES, 890, 1570, { font: "script", size: 58, maxWidth: 520 }),
    tx("{date}", 310, 1650, { font: "sans", size: 18, spacing: 5, upper: true, color: C.muted, maxWidth: 520 }),
    tx("{date}", 890, 1650, { font: "sans", size: 18, spacing: 5, upper: true, color: C.muted, maxWidth: 520 })]);

T("strip-lengkung-emas", "Strip Lengkung Emas", "photobooth-strip", "T", "Strip tiga foto berbentuk lengkung dengan bingkai emas tipis.",
  strip4(80, 440, 460, 80, 60, 3, "arch"),
  [fill("#FBF8F2"), { type: "rect", x: 20, y: 20, w: 560, h: 1760, stroke: C.gold, lineWidth: 2 },
    { type: "rect", x: 32, y: 32, w: 536, h: 1736, stroke: C.gold, lineWidth: 1 },
    P, ...[1, 2, 3].map((i) => frame(`foto-${i}`, C.gold, 1.5, 8)),
    tx(NAMES, 300, 1665, { font: "caps", size: 30, spacing: 4, upper: true, maxWidth: 500 }),
    tx("{date}", 300, 1722, { italic: true, size: 26, color: C.muted, maxWidth: 500 })]);

T("kisi-booth", "Kisi Booth", "photobooth-strip", "Q", "Empat foto photobooth dalam kisi dengan lencana nama di tengah.",
  [slot("foto-1", 60, 60, 470, 470, "rect", 30), slot("foto-2", 550, 60, 470, 470, "rect", 30), slot("foto-3", 60, 550, 470, 470, "rect", 30), slot("foto-4", 550, 550, 470, 470, "rect", 30)],
  [fill(C.brown), P,
    { type: "shape", shape: "circle", x: 390, y: 390, w: 300, h: 300, fill: C.cream },
    { type: "shape", shape: "circle", x: 405, y: 405, w: 270, h: 270, stroke: C.gold, lineWidth: 2 },
    tx("{name1}", 540, 495, { font: "script", size: 54, maxWidth: 230 }),
    tx("&", 540, 540, { italic: true, size: 34, color: C.gold, maxWidth: 40 }),
    tx("{name2}", 540, 588, { font: "script", size: 54, maxWidth: 230 }),
    tx("{date}", 540, 640, { font: "sans", size: 14, spacing: 3, upper: true, color: C.muted, maxWidth: 220 })]);

T("strip-mini-dua", "Strip Mini Dua", "photobooth-strip", "T", "Strip dua foto besar dengan ikon cincin dan ruang nama yang lega.",
  strip4(50, 500, 620, 60, 40, 2),
  [fill("#F1E9DD"), P,
    { type: "rings", x: 300, y: 1445, r: 26, stroke: C.gold, lineWidth: 3 },
    tx(NAMES, 300, 1565, { font: "script", size: 70, maxWidth: 520 }),
    tx("{message}", 300, 1645, { font: "sans", weight: 500, size: 20, spacing: 6, upper: true, color: C.muted, maxWidth: 520 }),
    tx("{date}", 300, 1705, { italic: true, size: 28, color: C.muted, maxWidth: 520 })],
  "Photobooth");

T("booth-story", "Booth Story", "photobooth-strip", "S", "Empat foto photobooth dalam format story dengan judul di atas.",
  [slot("foto-1", 60, 330, 470, 620), slot("foto-2", 550, 330, 470, 620), slot("foto-3", 60, 970, 470, 620), slot("foto-4", 550, 970, 470, 620)],
  [fill(C.white),
    tx("{message}", 540, 150, { font: "caps", size: 56, spacing: 10, upper: true }),
    tx(NAMES, 540, 245, { font: "script", size: 66 }),
    P,
    tx("{date}", 540, 1690, { font: "sans", size: 28, spacing: 10, upper: true, color: C.muted }),
    { type: "heart", x: 540, y: 1790, s: 50, fill: C.pink }],
  "Photobooth");

T("strip-horizontal", "Strip Horizontal", "photobooth-strip", "H", "Strip lanskap empat foto dengan nama berdiri di ujung kanan.",
  [0, 1, 2, 3].map((i) => slot(`foto-${i + 1}`, 40 + i * 400, 40, 380, 520)),
  [fill(C.brown), P,
    tx(NAMES, 1700, 300, { font: "caps", size: 30, spacing: 4, upper: true, color: C.ivory, rot: 90, maxWidth: 520 }),
    tx("{date}", 1760, 300, { font: "sans", size: 18, spacing: 5, upper: true, color: C.gold, rot: 90, maxWidth: 520 })]);

const target = join(dirname(fileURLToPath(import.meta.url)), "../assets/data/templates-koleksi-2.json");
await writeFile(target, JSON.stringify({ version: 1, collection: "Koleksi 2", templates: out }, null, 2) + "\n");
console.log(`${out.length} template ditulis ke ${target}`);
