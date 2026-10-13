// Beranda: pratinjau bingkai unggulan + daftar kategori dengan jumlah template.
import { loadCatalog } from "./template-registry.js";
import { lazyThumbnails } from "./thumbnails.js";
import { el, hydrateIcons, initNav } from "./app.js";

hydrateIcons();
initNav();

loadCatalog()
  .then((catalog) => {
    const showcase = document.getElementById("hero-showcase");
    const featured = catalog.templates.filter((t) => t.featured && t.aspectRatio === "4:5").slice(0, 3);
    for (const t of featured) {
      showcase.append(
        el("a", { class: "hero-card thumb", href: `editor.html?t=${encodeURIComponent(t.id)}`, "aria-label": `Gunakan template ${t.name}` },
          el("img", { alt: `Contoh bingkai ${t.name}`, width: 420, height: 525, dataset: { thumb: t.id } }))
      );
    }
    lazyThumbnails(showcase, catalog, 520);

    document.getElementById("koleksi-count").textContent = `Koleksi ${catalog.templates.length} bingkai`;
    const grid = document.getElementById("category-grid");
    for (const c of catalog.categories) {
      const n = catalog.templates.filter((t) => t.category === c.id).length;
      if (!n) continue;
      grid.append(
        el("li", {},
          el("a", { class: "category-link", href: `templates.html?kategori=${encodeURIComponent(c.id)}` },
            el("span", {}, c.name), el("span", { class: "count" }, `${n} desain`)))
      );
    }
  })
  .catch((e) => {
    document.getElementById("category-grid").replaceWith(el("p", { class: "error-box", role: "alert" }, e.message));
  });
