// Editor foto: memuat template, mengelola foto per slot, interaksi sentuh/mouse/keyboard,
// teks, undo/redo, pratinjau, unduh, dan berbagi.
import { loadCatalog } from "./template-registry.js";
import {
  renderTemplate, hitSlot, clampTransform, zoomAround, textTokensOf, resolveText,
  preloadTemplateAssets, TEXT_LIMITS, MIN_ZOOM, MAX_ZOOM,
} from "./renderer.js";
import { ensureFonts, fontsForTemplate } from "./fonts.js";
import { loadPhoto, releasePhoto, PhotoError } from "./image-loader.js";
import { History } from "./history.js";
import { renderBlob, downloadBlob, fileName, exportSize } from "./export.js";
import { lazyThumbnails } from "./thumbnails.js";
import { getEnhanced, isNeutral, DEFAULT_ADJUST, forgetPhoto, describeResolution } from "./enhance.js";
import { el, toast, debounce, hydrateIcons } from "./app.js";

hydrateIcons();

const $ = (id) => document.getElementById(id);
const canvas = $("canvas");
const ctx = canvas.getContext("2d");
const stage = $("stage");
const fileInput = $("file");
const filesInput = $("files");

const history = new History(40);
const photos = new Map(); // photoId -> { source, width, height, name }
let catalog = null;
let tpl = null;
let state = null; // { templateId, slots: { [slotId]: {photoId, zoom, ox, oy, rot} }, text: {} }
let activeSlot = null;
let pickTarget = null;
let viewScale = 1;
let photoSeq = 0;
let busy = false;

const TEXT_LABELS = { name1: "Nama mempelai pertama", name2: "Nama mempelai kedua", date: "Tanggal", message: "Judul / pesan" };

const emptySlot = () => ({ photoId: null, zoom: 1, ox: 0, oy: 0, rot: 0 });
const slotDef = (id) => tpl.photoSlots.find((s) => s.id === id);
const slotLabel = (i) => (tpl.photoSlots.length === 1 ? "Foto" : `Foto ${i + 1}`);
const entryOf = (id) => state.slots[id];
const photoOf = (id) => photos.get(entryOf(id)?.photoId);

// ---------- Optimalisasi foto (tampilan) ----------
// Editor menampilkan versi pratinjau (≤1400 px) yang diproses di Web Worker; ekspor memakai resolusi penuh.
let showOriginal = false;
const ready = new Map();      // `${photoId}|${adjustJSON}` -> kanvas pratinjau
const lastShown = new Map();  // photoId -> kanvas pratinjau terakhir (mencegah kedip saat slider digeser)
const jobs = new Map();       // photoId -> { busy, key, next }
const adjKey = (id, a) => `${id}|${JSON.stringify(a)}`;

function displaySource(e, p) {
  if (showOriginal || isNeutral(e.adjust)) return p.source;
  const key = adjKey(e.photoId, e.adjust);
  const c = ready.get(key);
  if (c) return c;
  requestEnhance(e.photoId, p, e.adjust, key);
  return lastShown.get(e.photoId) || p.source;
}

function requestEnhance(photoId, p, adjust, key) {
  let j = jobs.get(photoId);
  if (!j) jobs.set(photoId, (j = { busy: false, key: null, next: null }));
  if (j.key === key) return;
  if (j.busy) { j.next = { p, adjust: { ...adjust }, key }; return; }
  runEnhance(j, photoId, p, { ...adjust }, key);
}

function runEnhance(j, photoId, p, adjust, key) {
  j.busy = true;
  j.key = key;
  getEnhanced(photoId, p, adjust, "preview")
    .then((c) => {
      ready.set(key, c);
      while (ready.size > 24) ready.delete(ready.keys().next().value);
      lastShown.set(photoId, c);
      requestDraw();
    })
    .catch((err) => console.warn("Optimalisasi gagal:", err))
    .finally(() => {
      j.busy = false;
      j.key = null;
      const n = j.next;
      j.next = null;
      if (n && !ready.has(n.key) && photos.has(photoId)) runEnhance(j, photoId, n.p, n.adjust, n.key);
    });
}

/** Foto per slot untuk renderer. srcFor menentukan sumber gambar (pratinjau teroptimasi atau versi penuh). */
function photosForRender(srcFor = displaySource) {
  const out = {};
  for (const s of tpl.photoSlots) {
    const e = state.slots[s.id];
    const p = e && photos.get(e.photoId);
    if (p) out[s.id] = { ...e, photo: { source: srcFor(e, p), width: p.width, height: p.height } };
  }
  return out;
}

/** Versi resolusi penuh untuk ekspor (menunggu semua optimalisasi selesai). */
async function photosForExport() {
  const full = new Map();
  await Promise.all(
    tpl.photoSlots.map(async (s) => {
      const e = state.slots[s.id];
      const p = e && photos.get(e.photoId);
      if (p) full.set(s.id, await getEnhanced(e.photoId, p, e.adjust, "full"));
    })
  );
  return photosForRender((e, p) => {
    const id = tpl.photoSlots.find((s) => state.slots[s.id] === e)?.id;
    return full.get(id) || p.source;
  });
}

// ---------- Render ----------

let rafId = 0;
function requestDraw() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderTemplate(ctx, tpl, { mode: "edit", scale: viewScale, photos: photosForRender(), text: state.text, activeSlot });
  });
}

function layoutCanvas() {
  if (!tpl) return;
  const cs = getComputedStyle(stage);
  const availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  if (availW <= 0 || availH <= 0) return;
  const ratio = tpl.canvas.width / tpl.canvas.height;
  let w = availW, h = w / ratio;
  if (h > availH) { h = availH; w = h * ratio; }
  canvas.style.width = `${Math.floor(w)}px`;
  canvas.style.height = `${Math.floor(h)}px`;
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  // Batasi ukuran kanvas tampilan; ekspor tetap memakai resolusi penuh template.
  const px = Math.min(Math.round(w * dpr), tpl.canvas.width * 1.25);
  canvas.width = px;
  canvas.height = Math.round(px / ratio);
  viewScale = canvas.width / tpl.canvas.width;
  requestDraw();
}

// ---------- State & riwayat ----------

function commit() {
  if (history.commit(state)) prunePhotos();
  updateControls();
}

function prunePhotos() {
  const keep = history.referencedPhotoIds();
  for (const [id, p] of photos) {
    if (!keep.has(id)) {
      releasePhoto(p);
      photos.delete(id);
      forgetPhoto(id);
      lastShown.delete(id);
      jobs.delete(id);
      for (const k of [...ready.keys()]) if (k.startsWith(`${id}|`)) ready.delete(k);
    }
  }
}

function initialState(t) {
  return { templateId: t.id, slots: Object.fromEntries(t.photoSlots.map((s) => [s.id, emptySlot()])), text: {} };
}

async function applyTemplate(t) {
  tpl = t;
  if (!tpl.photoSlots.some((s) => s.id === activeSlot)) activeSlot = tpl.photoSlots[0].id;
  $("tpl-name").textContent = tpl.name;
  document.title = `${tpl.name} — Editor | Novi & Wahyu Wedding Photo Studio`;
  canvas.setAttribute("aria-label", `Kanvas bingkai ${tpl.name}. Pilih area foto lalu gunakan tombol panah untuk menggeser, plus atau minus untuk zoom.`);
  const url = new URL(location.href);
  url.searchParams.set("t", tpl.id);
  window.history.replaceState(null, "", url);
  buildSlotChips();
  buildTextFields();
  markTemplatePicker();
  updateResolutionLabels();
  layoutCanvas();
  updateControls();
  await Promise.all([ensureFonts(fontsForTemplate(tpl)), preloadTemplateAssets(tpl)]);
  requestDraw();
}

function setActiveSlot(id) {
  if (activeSlot === id) return;
  activeSlot = id;
  updateControls();
  requestDraw();
}

// ---------- Foto ----------

function openPicker(slotId) {
  pickTarget = slotId;
  fileInput.value = "";
  fileInput.click();
}

async function addPhotoToSlot(file, slotId, { silent = false } = {}) {
  const photo = await loadPhoto(file);
  const id = `p${++photoSeq}`;
  photos.set(id, photo);
  state.slots[slotId] = { photoId: id, zoom: 1, ox: 0, oy: 0, rot: 0, adjust: { ...DEFAULT_ADJUST } };
  if (!silent) {
    toast(photo.lowRes
      ? "Foto dimasukkan dan dioptimalkan otomatis. Resolusinya rendah, jadi akan diperbesar halus saat ekspor."
      : "Foto dimasukkan dan dioptimalkan otomatis. Atur di tab Kualitas, geser foto untuk posisinya.", photo.lowRes ? "info" : "success", 4500);
  }
  return photo;
}

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  const target = pickTarget || activeSlot;
  fileInput.value = "";
  if (!file) return;
  setLoading("Membaca foto…");
  try {
    await addPhotoToSlot(file, target);
    activeSlot = target;
    commit();
    requestDraw();
  } catch (e) {
    toast(e instanceof PhotoError ? e.message : "Foto gagal dimuat. Coba foto lain.", "error", 6000);
  } finally {
    setLoading(null);
  }
});

filesInput.addEventListener("change", async () => {
  const files = [...(filesInput.files || [])];
  filesInput.value = "";
  if (!files.length) return;
  const empties = tpl.photoSlots.map((s) => s.id).filter((id) => !entryOf(id)?.photoId);
  const targets = empties.length ? empties : tpl.photoSlots.map((s) => s.id);
  let ok = 0, failed = 0;
  setLoading("Membaca foto…");
  for (let i = 0; i < Math.min(files.length, targets.length); i++) {
    try { await addPhotoToSlot(files[i], targets[i], { silent: true }); ok++; } catch { failed++; }
  }
  setLoading(null);
  commit();
  requestDraw();
  const extra = Math.max(0, files.length - targets.length);
  const parts = [`${ok} foto dimasukkan`];
  if (failed) parts.push(`${failed} gagal dibaca`);
  if (extra) parts.push(`${extra} tidak dipakai karena area foto sudah penuh`);
  toast(parts.join(", ") + ".", failed ? "error" : "success", 5000);
});

// ---------- Interaksi kanvas ----------

const pointers = new Map();
let gesture = null;

function toTpl(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * tpl.canvas.width, y: ((e.clientY - r.top) / r.height) * tpl.canvas.height };
}

function applyTransform(slotId, t) {
  const p = photoOf(slotId);
  if (!p) return;
  Object.assign(state.slots[slotId], clampTransform(slotDef(slotId), p, t));
  requestDraw();
  updateZoomUI();
}

canvas.addEventListener("pointerdown", (e) => {
  if (!tpl || (e.pointerType === "mouse" && e.button !== 0)) return;
  const p = toTpl(e);
  if (!pointers.size) {
    const slot = hitSlot(tpl, p.x, p.y);
    if (!slot) return;
    setActiveSlot(slot.id);
    gesture = { slotId: slot.id, start: p, moved: false, pinch: null };
  }
  if (!gesture) return;
  e.preventDefault();
  try { canvas.setPointerCapture(e.pointerId); } catch { /* pointer sintetis/tidak valid */ }
  pointers.set(e.pointerId, p);
  if (pointers.size === 2) startPinch();
});

function startPinch() {
  const [a, b] = [...pointers.values()];
  const e = entryOf(gesture.slotId);
  gesture.moved = true;
  gesture.pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom: e.zoom, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
}

canvas.addEventListener("pointermove", (e) => {
  if (!gesture || !pointers.has(e.pointerId)) return;
  const prev = pointers.get(e.pointerId);
  const p = toTpl(e);
  pointers.set(e.pointerId, p);
  const id = gesture.slotId;
  const photo = photoOf(id);
  if (Math.hypot(p.x - gesture.start.x, p.y - gesture.start.y) > 8 * (tpl.canvas.width / canvas.clientWidth)) gesture.moved = true;
  if (!photo) return;
  const cur = entryOf(id);
  if (pointers.size >= 2 && gesture.pinch) {
    const [a, b] = [...pointers.values()];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const z = zoomAround(slotDef(id), photo, cur, gesture.pinch.zoom * (dist / gesture.pinch.dist), mid.x, mid.y);
    z.ox += mid.x - gesture.pinch.mid.x;
    z.oy += mid.y - gesture.pinch.mid.y;
    gesture.pinch.mid = mid;
    applyTransform(id, z);
  } else if (pointers.size === 1) {
    applyTransform(id, { ...cur, ox: cur.ox + (p.x - prev.x), oy: cur.oy + (p.y - prev.y) });
  }
});

function endPointer(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (!gesture) return;
  if (pointers.size === 1) { gesture.pinch = null; return; }
  if (pointers.size) return;
  const g = gesture;
  gesture = null;
  if (!g.moved && e.type === "pointerup") {
    if (!entryOf(g.slotId)?.photoId) openPicker(g.slotId);
  } else {
    commit();
  }
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);
canvas.addEventListener("lostpointercapture", endPointer);

const commitSoon = debounce(commit, 450);

canvas.addEventListener("wheel", (e) => {
  if (!tpl) return;
  const p = toTpl(e);
  const slot = hitSlot(tpl, p.x, p.y);
  if (!slot || !photoOf(slot.id)) return;
  e.preventDefault();
  setActiveSlot(slot.id);
  const cur = entryOf(slot.id);
  applyTransform(slot.id, zoomAround(slot, photoOf(slot.id), cur, cur.zoom * Math.exp(-e.deltaY * 0.0015), p.x, p.y));
  commitSoon();
}, { passive: false });

canvas.addEventListener("keydown", (e) => {
  if (!tpl || !activeSlot) return;
  const step = (e.shiftKey ? 60 : 15) * (tpl.canvas.width / 1080);
  const map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (map[e.key]) {
    e.preventDefault();
    nudge(...map[e.key], step);
  } else if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomBy(1.1); }
  else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomBy(1 / 1.1); }
  else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    openPicker(activeSlot);
  }
});

// Seret-lepas file (tambahan untuk desktop; bukan satu-satunya cara memasukkan foto)
stage.addEventListener("dragover", (e) => {
  if (![...(e.dataTransfer?.types || [])].includes("Files")) return;
  e.preventDefault();
  stage.classList.add("is-dragover");
});
stage.addEventListener("dragleave", (e) => { if (!stage.contains(e.relatedTarget)) stage.classList.remove("is-dragover"); });
stage.addEventListener("drop", async (e) => {
  e.preventDefault();
  stage.classList.remove("is-dragover");
  const file = e.dataTransfer?.files?.[0];
  if (!file || !tpl) return;
  const p = toTpl(e);
  const slot = hitSlot(tpl, p.x, p.y) || slotDef(activeSlot);
  setLoading("Membaca foto…");
  try {
    await addPhotoToSlot(file, slot.id);
    activeSlot = slot.id;
    commit();
    requestDraw();
  } catch (err) {
    toast(err instanceof PhotoError ? err.message : "Foto gagal dimuat.", "error", 6000);
  } finally {
    setLoading(null);
  }
});

// ---------- Kontrol panel ----------

function nudge(dx, dy, step = 15 * (tpl.canvas.width / 1080)) {
  const cur = entryOf(activeSlot);
  if (!photoOf(activeSlot)) return;
  applyTransform(activeSlot, { ...cur, ox: cur.ox + dx * step, oy: cur.oy + dy * step });
  commitSoon();
}

function zoomTo(z) {
  const s = slotDef(activeSlot), p = photoOf(activeSlot);
  if (!p) return;
  applyTransform(activeSlot, zoomAround(s, p, entryOf(activeSlot), z, s.x + s.width / 2, s.y + s.height / 2));
}
function zoomBy(k) {
  if (!photoOf(activeSlot)) return;
  zoomTo(entryOf(activeSlot).zoom * k);
  commitSoon();
}

$("pick").addEventListener("click", () => openPicker(activeSlot));
$("pick-many").addEventListener("click", () => { filesInput.value = ""; filesInput.click(); });
$("remove").addEventListener("click", () => {
  state.slots[activeSlot] = emptySlot();
  commit();
  requestDraw();
  toast("Foto dihapus dari area ini. Gunakan Urungkan untuk mengembalikan.");
});
$("zoom").addEventListener("input", (e) => zoomTo(Number(e.target.value) / 100));
$("zoom").addEventListener("change", commit);
$("zoom-in").addEventListener("click", () => zoomBy(1.15));
$("zoom-out").addEventListener("click", () => zoomBy(1 / 1.15));
$("rotate").addEventListener("click", () => {
  const cur = entryOf(activeSlot);
  applyTransform(activeSlot, { ...cur, rot: ((cur.rot || 0) + 90) % 360, ox: 0, oy: 0 });
  commit();
});
$("reset-pos").addEventListener("click", () => {
  applyTransform(activeSlot, { ...entryOf(activeSlot), zoom: 1, ox: 0, oy: 0 });
  commit();
});
document.querySelectorAll("[data-nudge]").forEach((b) =>
  b.addEventListener("click", () => {
    const [dx, dy] = b.dataset.nudge.split(",").map(Number);
    nudge(dx, dy, 30 * (tpl.canvas.width / 1080));
  })
);

$("undo").addEventListener("click", undo);
$("redo").addEventListener("click", redo);
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, select")) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
});

function restore(next) {
  if (!next) return;
  state = next;
  const t = catalog.byId.get(state.templateId);
  if (t && t !== tpl) applyTemplate(t);
  else { buildSlotChips(); refreshTextFields(); updateControls(); requestDraw(); }
}
function undo() { restore(history.undo()); }
function redo() { restore(history.redo()); }

function updateZoomUI() {
  const e = entryOf(activeSlot);
  const has = !!photoOf(activeSlot);
  const z = has ? e.zoom : 1;
  $("zoom").value = String(Math.round(z * 100));
  $("zoom-val").textContent = `${Math.round(z * 100)}%`;
  $("zoom-in").disabled = !has || z >= MAX_ZOOM - 0.001;
  $("zoom-out").disabled = !has || z <= MIN_ZOOM + 0.001;
}

function updateControls() {
  if (!tpl || !state) return;
  const has = !!photoOf(activeSlot);
  const idx = tpl.photoSlots.findIndex((s) => s.id === activeSlot);
  $("pick-label").textContent = has ? `Ganti ${slotLabel(idx)}` : `Pilih ${slotLabel(idx)}`;
  $("remove").disabled = !has;
  $("zoom").disabled = !has;
  $("rotate").disabled = !has;
  $("reset-pos").disabled = !has;
  document.querySelectorAll("[data-nudge]").forEach((b) => (b.disabled = !has));
  $("adjust-hint").textContent = has
    ? `Mengatur ${slotLabel(idx).toLowerCase()}. Foto selalu menutupi seluruh area sehingga tidak ada bagian kosong.`
    : `${slotLabel(idx)} masih kosong. Tambahkan foto lewat tab Foto atau ketuk area foto di kanvas.`;
  $("undo").disabled = !history.canUndo;
  $("redo").disabled = !history.canRedo;
  $("pick-many").hidden = tpl.photoSlots.length < 2;
  document.querySelectorAll(".slot-chip").forEach((c) => {
    c.setAttribute("aria-pressed", String(c.dataset.slot === activeSlot));
    const filled = !!photoOf(c.dataset.slot);
    c.classList.toggle("is-filled", filled);
    c.setAttribute("aria-label", `${c.textContent}, ${filled ? "berisi foto" : "kosong"}`);
  });
  const empty = tpl.photoSlots.filter((s) => !photoOf(s.id)).length;
  $("save-hint").textContent = empty === tpl.photoSlots.length
    ? "Tambahkan minimal satu foto sebelum mengunduh."
    : empty
      ? `${empty} area foto masih kosong dan akan tampil sebagai bidang polos.`
      : "PNG menjaga kualitas terbaik; JPG berukuran lebih kecil dan cocok untuk dikirim lewat chat.";
  updateZoomUI();
  updateQualityUI();
}

// ---------- Panel kualitas ----------

const qSliders = [...document.querySelectorAll("[data-adj]")];

function updateQualityUI() {
  const e = entryOf(activeSlot);
  const p = photoOf(activeSlot);
  const idx = tpl.photoSlots.findIndex((s) => s.id === activeSlot);
  const a = (p && e.adjust) || {};
  $("q-auto").disabled = !p;
  $("q-auto").setAttribute("aria-pressed", String(!!a.auto));
  qSliders.forEach((r) => {
    r.disabled = !p;
    r.value = String(a[r.dataset.adj] || 0);
    r.nextElementSibling.textContent = String(a[r.dataset.adj] || 0);
  });
  $("q-compare").disabled = !p || isNeutral(a);
  $("q-reset").disabled = !p;
  const filled = tpl.photoSlots.filter((s) => photoOf(s.id)).length;
  $("q-all").hidden = filled < 2;
  $("q-target").textContent = p
    ? `Mengatur ${slotLabel(idx).toLowerCase()}${tpl.photoSlots.length > 1 ? " — pilih foto lain lewat tab Foto atau ketuk di kanvas" : ""}.`
    : `${slotLabel(idx)} masih kosong. Tambahkan foto terlebih dahulu untuk mengoptimalkan kualitasnya.`;
  $("q-info").textContent = p ? `${p.origWidth || p.width} × ${p.origHeight || p.height} px. ${describeResolution(p).text}` : "";
}

function setAdjust(patchObj, { commitNow = false } = {}) {
  const e = entryOf(activeSlot);
  if (!photoOf(activeSlot)) return;
  e.adjust = { ...DEFAULT_ADJUST, auto: false, ...(e.adjust || {}), ...patchObj };
  requestDraw();
  if (commitNow) commit();
  else updateQualityUI();
}

$("q-auto").addEventListener("click", () => {
  const on = !(entryOf(activeSlot).adjust?.auto);
  setAdjust({ auto: on }, { commitNow: true });
  toast(on ? "Optimalisasi otomatis aktif." : "Optimalisasi otomatis dimatikan.", "info", 2000);
});
qSliders.forEach((r) => {
  r.addEventListener("input", () => {
    r.nextElementSibling.textContent = r.value;
    setAdjust({ [r.dataset.adj]: Number(r.value) });
  });
  r.addEventListener("change", commit);
});
$("q-reset").addEventListener("click", () =>
  setAdjust({ brightness: 0, contrast: 0, saturation: 0, warmth: 0, sharpness: 0 }, { commitNow: true })
);
$("q-all").addEventListener("click", () => {
  const a = { ...entryOf(activeSlot).adjust };
  let n = 0;
  for (const s of tpl.photoSlots) if (photoOf(s.id)) { state.slots[s.id].adjust = { ...a }; n++; }
  commit();
  requestDraw();
  toast(`Pengaturan kualitas diterapkan ke ${n} foto.`, "success");
});
// Tahan untuk membandingkan dengan foto asli (mouse, sentuh, atau keyboard).
const cmp = $("q-compare");
const setCompare = (on) => {
  if (showOriginal === on) return;
  showOriginal = on;
  cmp.setAttribute("aria-pressed", String(on));
  requestDraw();
};
cmp.addEventListener("pointerdown", (e) => { e.preventDefault(); setCompare(true); });
["pointerup", "pointerleave", "pointercancel"].forEach((t) => cmp.addEventListener(t, () => setCompare(false)));
cmp.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setCompare(true); } });
cmp.addEventListener("keyup", () => setCompare(false));
cmp.addEventListener("blur", () => setCompare(false));

function buildSlotChips() {
  const box = $("slot-chips");
  if (tpl.photoSlots.length < 2) return box.replaceChildren();
  box.replaceChildren(
    ...tpl.photoSlots.map((s, i) => el("button", { class: "slot-chip", type: "button", dataset: { slot: s.id }, "aria-pressed": "false", onclick: () => setActiveSlot(s.id) }, slotLabel(i)))
  );
}

// ---------- Teks ----------

const sanitize = (v, max) => v.replace(/[\u0000-\u001f\u007f​-‏‪-‮]/g, "").replace(/\s{2,}/g, " ").slice(0, max);

function buildTextFields() {
  const box = $("text-fields");
  const tokens = textTokensOf(tpl);
  $("reset-text").hidden = !tokens.length;
  if (!tokens.length) return box.replaceChildren(el("p", { class: "hint" }, "Template ini tidak memiliki teks yang dapat diubah."));
  const values = resolveText(tpl, state.text);
  box.replaceChildren(
    ...tokens.map((k) => {
      const id = `txt-${k}`;
      const counter = el("small", { id: `${id}-count` }, `${values[k].length}/${TEXT_LIMITS[k]}`);
      const input = el("input", { class: "input", id, type: "text", value: values[k], maxlength: TEXT_LIMITS[k], autocomplete: "off", "aria-describedby": `${id}-count`, dataset: { key: k } });
      input.addEventListener("input", () => {
        const v = sanitize(input.value, TEXT_LIMITS[k]);
        if (v !== input.value) input.value = v;
        state.text[k] = v;
        counter.textContent = `${v.length}/${TEXT_LIMITS[k]}`;
        requestDraw();
        commitSoon();
      });
      return el("div", { class: "field" }, el("label", { for: id }, TEXT_LABELS[k], counter), input);
    })
  );
}

function refreshTextFields() {
  const values = resolveText(tpl, state.text);
  document.querySelectorAll("#text-fields input[data-key]").forEach((i) => {
    i.value = values[i.dataset.key];
    $(`${i.id}-count`).textContent = `${i.value.length}/${TEXT_LIMITS[i.dataset.key]}`;
  });
}

$("reset-text").addEventListener("click", () => {
  state.text = {};
  refreshTextFields();
  commit();
  requestDraw();
});

// ---------- Ganti template ----------

function buildTemplatePicker() {
  const list = $("tpl-picker");
  list.replaceChildren(
    ...catalog.templates.map((t) =>
      el("li", {},
        el("button", { class: "tpl-option", type: "button", dataset: { id: t.id }, onclick: () => switchTemplate(t.id) },
          el("span", { class: "thumb" }, el("img", { alt: "", dataset: { thumb: t.id } })),
          el("span", {}, t.name)))
    )
  );
  lazyThumbnails(list, catalog, 200);
}

function markTemplatePicker() {
  document.querySelectorAll(".tpl-option").forEach((b) => b.setAttribute("aria-current", String(b.dataset.id === tpl.id)));
}

function switchTemplate(id) {
  const next = catalog.byId.get(id);
  if (!next || next === tpl) return;
  const old = tpl.photoSlots.map((s) => state.slots[s.id]);
  const slots = {};
  next.photoSlots.forEach((s, i) => {
    const o = old[i];
    slots[s.id] = o?.photoId ? { photoId: o.photoId, zoom: 1, ox: 0, oy: 0, rot: o.rot || 0, adjust: o.adjust } : emptySlot();
  });
  const dropped = old.slice(next.photoSlots.length).filter((o) => o?.photoId).length;
  state = { ...state, templateId: next.id, slots };
  activeSlot = next.photoSlots[0].id;
  applyTemplate(next);
  commit();
  toast(dropped
    ? `Template diganti. ${dropped} foto tidak dipakai karena template ini hanya punya ${next.photoSlots.length} area foto — tekan Urungkan untuk kembali.`
    : `Template diganti ke ${next.name}.`, "info", dropped ? 6500 : 2500);
}

// ---------- Tab ----------

const tabs = [...document.querySelectorAll(".ed-tab")];
function selectTab(tab, focus = false) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    $(t.getAttribute("aria-controls")).hidden = !on;
  });
  if (focus) tab.focus();
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => selectTab(t));
  t.addEventListener("keydown", (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (d) { e.preventDefault(); selectTab(tabs[(i + d + tabs.length) % tabs.length], true); }
  });
});

// ---------- Simpan, pratinjau, bagikan ----------

const resolution = () => document.querySelector('input[name="res"]:checked')?.value || "standard";

function updateResolutionLabels() {
  const s = exportSize(tpl, "standard"), h = exportSize(tpl, "high");
  $("res-standard").textContent = `${s.width} × ${s.height} px`;
  $("res-high").textContent = `${h.width} × ${h.height} px`;
}

function setLoading(msg) {
  const box = $("loading");
  box.hidden = !msg;
  if (msg) box.textContent = msg;
}

const actionButtons = ["dl-png", "dl-jpg", "share", "preview"].map($);
function setBusy(on, btn) {
  busy = on;
  actionButtons.forEach((b) => (b.disabled = on));
  if (btn) btn.setAttribute("aria-busy", String(on));
  setLoading(on ? "Mengoptimalkan foto & membuat gambar…" : null);
}

function hasAnyPhoto() {
  return tpl.photoSlots.some((s) => photoOf(s.id));
}

function guardPhotos() {
  if (hasAnyPhoto()) return true;
  toast("Tambahkan minimal satu foto terlebih dahulu.", "error");
  selectTab($("tab-foto"));
  return false;
}

async function produce(format, res = resolution()) {
  const exportPhotos = await photosForExport();
  return renderBlob(tpl, { photos: exportPhotos, text: state.text }, { format, resolution: res });
}

let dialogUrl = null;
function showImageDialog(dialogId, imgId, blob) {
  if (dialogUrl) URL.revokeObjectURL(dialogUrl);
  dialogUrl = URL.createObjectURL(blob);
  $(imgId).src = dialogUrl;
  openDialog($(dialogId));
}

async function doDownload(format, btn) {
  if (busy || !guardPhotos()) return;
  setBusy(true, btn);
  try {
    const { blob, width, height } = await produce(format);
    const name = fileName(tpl, state.text, format);
    downloadBlob(blob, name);
    $("dlg-result-text").textContent =
      `Unduhan “${name}” (${width} × ${height} px, ${(blob.size / 1024 / 1024).toFixed(1)} MB) sudah dimulai. ` +
      "Jika file tidak muncul — misalnya di browser bawaan Instagram atau WhatsApp — tekan lama gambar di bawah lalu pilih Simpan Gambar.";
    showImageDialog("dlg-result", "dlg-result-img", blob);
  } catch (e) {
    console.error(e);
    toast(e.message || "Gambar gagal dibuat.", "error", 6000);
  } finally {
    setBusy(false, btn);
  }
}

$("dl-png").addEventListener("click", (e) => doDownload("png", e.currentTarget));
$("dl-jpg").addEventListener("click", (e) => doDownload("jpg", e.currentTarget));

$("preview").addEventListener("click", async (e) => {
  if (busy) return;
  setBusy(true, e.currentTarget);
  try {
    const { blob } = await produce("png", "standard");
    showImageDialog("dlg-preview", "dlg-preview-img", blob);
  } catch (err) {
    toast(err.message || "Pratinjau gagal dibuat.", "error");
  } finally {
    setBusy(false, e.currentTarget);
  }
});

let shareFile = null;
const shareData = (file) => ({ files: [file], title: "Novi & Wahyu Wedding Photo Studio", text: "Kenangan dari pernikahan Novi & Wahyu, 16 Oktober 2026" });

async function tryShare(file) {
  try {
    await navigator.share(shareData(file));
    return "ok";
  } catch (e) {
    if (e.name === "AbortError") return "aborted";
    if (e.name === "NotAllowedError") return "gesture"; // aktivasi pengguna kedaluwarsa saat menunggu render
    return "failed";
  }
}

$("share").addEventListener("click", async (e) => {
  if (busy || !guardPhotos()) return;
  setBusy(true, e.currentTarget);
  try {
    const { blob } = await produce("jpg");
    shareFile = new File([blob], fileName(tpl, state.text, "jpg"), { type: "image/jpeg" });
  } catch (err) {
    toast(err.message || "Gambar gagal dibuat.", "error");
    return;
  } finally {
    setBusy(false, e.currentTarget);
  }
  const canShareFiles = !!navigator.canShare?.(shareData(shareFile));
  const result = canShareFiles ? await tryShare(shareFile) : "unsupported";
  if (result === "ok" || result === "aborted") return;
  $("share-now").hidden = result !== "gesture";
  $("dlg-share-text").textContent =
    result === "gesture" ? "Gambar sudah siap. Ketuk “Bagikan sekarang” untuk memilih aplikasi tujuan."
      : result === "failed" ? "Berbagi langsung gagal di perangkat ini. Unduh gambarnya lalu kirim lewat aplikasi pilihanmu."
        : "Browser ini belum mendukung berbagi file gambar secara langsung. Unduh gambarnya lalu kirim lewat aplikasi pilihanmu, atau salin tautan website untuk dibagikan.";
  openDialog($("dlg-share"));
});

$("share-now").addEventListener("click", async () => {
  if (!shareFile) return;
  const r = await tryShare(shareFile);
  if (r === "ok" || r === "aborted") closeDialog($("dlg-share"));
  else toast("Berbagi langsung tidak tersedia. Silakan unduh gambarnya.", "error");
});
$("share-dl").addEventListener("click", () => {
  if (!shareFile) return;
  downloadBlob(shareFile, shareFile.name);
  toast("Unduhan dimulai.", "success");
});
$("share-copy").addEventListener("click", async () => {
  const link = new URL("index.html", location.href).href;
  try {
    await navigator.clipboard.writeText(link);
    toast("Tautan website disalin.", "success");
  } catch {
    window.prompt("Salin tautan ini:", link);
  }
});

$("reset-all").addEventListener("click", async () => {
  const dlg = $("dlg-confirm");
  dlg.returnValue = "";
  openDialog(dlg);
  dlg.addEventListener("close", function onClose() {
    dlg.removeEventListener("close", onClose);
    if (dlg.returnValue !== "ok") return;
    state = initialState(tpl);
    activeSlot = tpl.photoSlots[0].id;
    buildSlotChips();
    refreshTextFields();
    commit();
    requestDraw();
    toast("Desain dikosongkan. Tekan Urungkan bila ingin mengembalikan.");
  });
});

// ---------- Dialog ----------

function openDialog(d) {
  if (typeof d.showModal === "function") d.showModal();
  else d.setAttribute("open", "");
}
function closeDialog(d) {
  if (typeof d.close === "function") d.close();
  else d.removeAttribute("open");
}
document.querySelectorAll("dialog").forEach((d) => {
  d.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]") || e.target === d) closeDialog(d);
  });
  d.addEventListener("close", () => {
    if (d.id === "dlg-result" || d.id === "dlg-preview") {
      if (dialogUrl) { URL.revokeObjectURL(dialogUrl); dialogUrl = null; }
      d.querySelector("img")?.removeAttribute("src");
    }
  });
});

// ---------- Siklus hidup halaman ----------

window.addEventListener("beforeunload", (e) => {
  if (state && Object.values(state.slots).some((s) => s.photoId)) {
    e.preventDefault();
    e.returnValue = "";
  }
});

new ResizeObserver(() => layoutCanvas()).observe(stage);

async function start() {
  try {
    catalog = await loadCatalog();
  } catch (e) {
    setLoading(null);
    stage.replaceChildren(el("p", { class: "error-box", role: "alert" }, e.message));
    $("tpl-name").textContent = "Editor tidak dapat dimuat";
    return;
  }
  if (!catalog.templates.length) {
    setLoading(null);
    stage.replaceChildren(el("p", { class: "error-box", role: "alert" }, "Belum ada template yang aktif."));
    return;
  }
  const wanted = new URLSearchParams(location.search).get("t");
  let t = wanted && catalog.byId.get(wanted);
  if (wanted && !t) toast("Template tidak ditemukan. Menampilkan template bawaan.", "error");
  t = t || catalog.templates.find((x) => x.featured) || catalog.templates[0];
  state = initialState(t);
  history.reset(state);
  buildTemplatePicker();
  await applyTemplate(t);
  setLoading(null);
}

start();
