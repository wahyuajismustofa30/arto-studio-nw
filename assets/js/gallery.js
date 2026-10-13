// Galeri template: filter kategori, pencarian (debounce), pengurutan, favorit, dan empty state.
import { loadCatalog, categoryName, ratioLabel, photoCountLabel } from "./template-registry.js";
import { lazyThumbnails } from "./thumbnails.js";
import { getFavorites, toggleFavorite } from "./storage.js";
import { el, icon, debounce, hydrateIcons, initNav, toast } from "./app.js";

hydrateIcons();
initNav();

const grid = document.getElementById("grid");
const chipsBox = document.getElementById("chips");
const search = document.getElementById("search");
const sort = document.getElementById("sort");
const countEl = document.getElementById("result-count");
const empty = document.getElementById("empty");

const params = new URLSearchParams(location.search);
const state = { category: params.get("kategori") || "all", query: params.get("q") || "", sort: "featured" };
search.value = state.query;

const RATIO_ORDER = ["4:5", "3:4", "2:3", "1:1", "9:16", "3:2", "1:3", "3:1"];
const normalize = (s) => s.toLocaleLowerCase("id-ID").normalize("NFD").replace(/[̀-ͯ]/g, "");

function card(t, catalog, favs) {
  const fav = favs.has(t.id);
  const href = `editor.html?t=${encodeURIComponent(t.id)}`;
  const favBtn = el("button", { class: "fav-btn", type: "button", "aria-pressed": String(fav), "aria-label": `${fav ? "Hapus" : "Tambah"} ${t.name} ${fav ? "dari" : "ke"} favorit`, dataset: { fav: t.id } }, icon("heart"));
  return el("li", {},
    el("article", { class: "tcard" },
      el("a", { class: "thumb", href, tabindex: "-1", "aria-hidden": "true" },
        t.featured ? el("span", { class: "badge" }, "Pilihan") : null,
        el("img", { alt: "", width: 400, height: 500, dataset: { thumb: t.id } })),
      el("div", { class: "tcard-body" },
        el("div", { class: "tcard-title" }, el("h3", {}, t.name), favBtn),
        el("p", { class: "tcard-meta" }, `${categoryName(catalog, t.category)} · ${ratioLabel(t)} · ${photoCountLabel(t)}`),
        el("a", { class: "btn btn-secondary", href, "aria-label": `Gunakan template ${t.name}` }, "Gunakan Template"))));
}

function render(catalog) {
  const favs = getFavorites();
  const q = normalize(state.query.trim());
  let list = catalog.templates.filter((t) => {
    if (state.category === "favorites" && !favs.has(t.id)) return false;
    if (state.category !== "all" && state.category !== "favorites" && t.category !== state.category) return false;
    if (!q) return true;
    return normalize(`${t.name} ${categoryName(catalog, t.category)}`).includes(q);
  });
  const byName = (a, b) => a.name.localeCompare(b.name, "id");
  if (state.sort === "name") list = [...list].sort(byName);
  else if (state.sort === "ratio") list = [...list].sort((a, b) => RATIO_ORDER.indexOf(a.aspectRatio) - RATIO_ORDER.indexOf(b.aspectRatio) || byName(a, b));
  else if (state.sort === "photos") list = [...list].sort((a, b) => b.photoSlots.length - a.photoSlots.length || byName(a, b));
  else list = [...list].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));

  grid.replaceChildren(...list.map((t) => card(t, catalog, favs)));
  lazyThumbnails(grid, catalog, 400);
  countEl.textContent = `${list.length} template ditampilkan`;

  empty.hidden = list.length > 0;
  if (!list.length) {
    const isFav = state.category === "favorites" && !q;
    empty.replaceChildren(
      el("div", { class: "empty-state" },
        el("h2", {}, isFav ? "Belum ada favorit" : "Template tidak ditemukan"),
        el("p", {}, isFav ? "Ketuk ikon hati pada kartu template untuk menyimpannya di sini." : "Coba kata kunci lain atau tampilkan semua kategori."),
        el("button", { class: "btn btn-secondary", type: "button", onclick: () => { state.query = ""; search.value = ""; setCategory("all", catalog); } }, "Tampilkan semua template"))
    );
  }
  const url = new URL(location.href);
  state.category === "all" ? url.searchParams.delete("kategori") : url.searchParams.set("kategori", state.category);
  state.query ? url.searchParams.set("q", state.query) : url.searchParams.delete("q");
  history.replaceState(null, "", url);
}

function setCategory(id, catalog) {
  state.category = id;
  chipsBox.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.cat === id)));
  render(catalog);
}

loadCatalog()
  .then((catalog) => {
    if (!["all", "favorites", ...catalog.categories.map((c) => c.id)].includes(state.category)) state.category = "all";
    const cats = [{ id: "all", name: "Semua" }, ...catalog.categories.filter((c) => catalog.templates.some((t) => t.category === c.id)), { id: "favorites", name: "Favorit saya" }];
    chipsBox.replaceChildren(
      ...cats.map((c) => el("button", { class: "chip", type: "button", "aria-pressed": String(c.id === state.category), dataset: { cat: c.id }, onclick: () => setCategory(c.id, catalog) }, c.name))
    );
    chipsBox.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: "nearest", inline: "center" });
    search.addEventListener("input", debounce(() => { state.query = search.value; render(catalog); }, 220));
    sort.addEventListener("change", () => { state.sort = sort.value; render(catalog); });
    grid.addEventListener("click", (e) => {
      const b = e.target.closest("[data-fav]");
      if (!b) return;
      const on = toggleFavorite(b.dataset.fav);
      const name = catalog.byId.get(b.dataset.fav)?.name || "";
      b.setAttribute("aria-pressed", String(on));
      b.setAttribute("aria-label", `${on ? "Hapus" : "Tambah"} ${name} ${on ? "dari" : "ke"} favorit`);
      toast(on ? `${name} ditambahkan ke favorit` : `${name} dihapus dari favorit`, "success", 2200);
      if (state.category === "favorites" && !on) render(catalog);
    });
    render(catalog);
  })
  .catch((e) => grid.replaceWith(el("p", { class: "error-box", role: "alert" }, e.message)));
