// Preferensi ringan di localStorage (hanya daftar ID template favorit). Foto TIDAK pernah disimpan di sini.
const KEY = "nw-studio:favorites";

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function getFavorites() {
  return new Set(read());
}

export function toggleFavorite(id) {
  const favs = getFavorites();
  favs.has(id) ? favs.delete(id) : favs.add(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...favs]));
  } catch {
    /* mode privat / penyimpanan penuh: favorit hanya berlaku di sesi ini */
  }
  return favs.has(id);
}
