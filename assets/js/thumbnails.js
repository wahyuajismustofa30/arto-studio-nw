// Thumbnail dibuat otomatis dari konfigurasi template (foto contoh abstrak), lalu di-cache per sesi.
// Template boleh memakai file thumbnail sendiri dengan mengisi "thumbnail": "assets/images/thumbnails/xxx.webp".
import { renderTemplate, preloadTemplateAssets } from "./renderer.js";
import { ensureFonts, fontsForTemplate } from "./fonts.js";

const urls = new Map();

export async function thumbnailURL(tpl, width = 420) {
  if (tpl.thumbnail && tpl.thumbnail !== "auto") return tpl.thumbnail;
  const key = `${tpl.id}@${width}`;
  if (urls.has(key)) return urls.get(key);
  const p = (async () => {
    await Promise.all([ensureFonts(fontsForTemplate(tpl)), preloadTemplateAssets(tpl)]);
    const scale = width / tpl.canvas.width;
    const c = document.createElement("canvas");
    c.width = Math.round(tpl.canvas.width * scale);
    c.height = Math.round(tpl.canvas.height * scale);
    renderTemplate(c.getContext("2d"), tpl, { mode: "thumb", scale });
    const blob = await new Promise((r) => c.toBlob(r, "image/webp", 0.86));
    c.width = c.height = 0;
    if (!blob) throw new Error("Thumbnail gagal dibuat");
    return URL.createObjectURL(blob);
  })();
  urls.set(key, p);
  p.catch(() => urls.delete(key));
  return p;
}

/** Isi <img data-thumb="id"> secara malas saat mendekati viewport. */
export function lazyThumbnails(root, catalog, width = 420) {
  const fill = (img) => {
    const tpl = catalog.byId.get(img.dataset.thumb);
    if (!tpl || img.dataset.loaded) return;
    img.dataset.loaded = "1";
    thumbnailURL(tpl, width)
      .then((u) => {
        img.src = u;
        img.closest(".thumb")?.classList.add("is-ready");
      })
      .catch(() => img.closest(".thumb")?.classList.add("is-error"));
  };
  const imgs = root.querySelectorAll("img[data-thumb]:not([data-loaded])");
  if (!("IntersectionObserver" in window)) return imgs.forEach(fill);
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && (io.unobserve(e.target), fill(e.target))),
    { rootMargin: "300px" }
  );
  imgs.forEach((i) => io.observe(i));
}
