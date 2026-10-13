// Membaca foto dari perangkat secara lokal: validasi ukuran & tanda tangan file (bukan hanya MIME),
// decode, lalu perkecil ke ukuran kerja agar hemat memori. Object URL selalu dicabut setelah dipakai.

export const MAX_BYTES = 30 * 1024 * 1024;
export const MAX_SIDE = 2800; // cukup untuk ekspor resolusi tinggi, aman untuk memori HP
export const LOW_RES_SIDE = 600;

export class PhotoError extends Error {}

async function sniff(file) {
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = (from, to) => String.fromCharCode(...b.slice(from, to));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return "png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (ascii(4, 8) === "ftyp" && /^(heic|heix|hevc|mif1|msf1|heis)$/.test(ascii(8, 12))) return "heic";
  return null;
}

function decode(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode"));
    img.src = url;
  });
}

/**
 * @returns {Promise<{source: HTMLCanvasElement, width:number, height:number, name:string, lowRes:boolean}>}
 */
export async function loadPhoto(file) {
  if (!file) throw new PhotoError("Tidak ada file yang dipilih.");
  if (file.size === 0) throw new PhotoError("File kosong atau tidak dapat dibaca.");
  if (file.size > MAX_BYTES) {
    throw new PhotoError(`Ukuran file ${(file.size / 1048576).toFixed(1)} MB melebihi batas 30 MB. Pilih foto yang lebih kecil.`);
  }
  const kind = await sniff(file);
  if (kind === "heic") {
    throw new PhotoError("Foto berformat HEIC belum bisa dibaca browser ini. Pilih foto lewat aplikasi Foto/Galeri (biasanya otomatis jadi JPG) atau ubah Pengaturan › Kamera › Format ke “Paling Kompatibel”.");
  }
  if (!kind) throw new PhotoError("File ini bukan gambar JPG, PNG, atau WebP.");

  const url = URL.createObjectURL(file);
  try {
    // Browser modern menerapkan orientasi EXIF otomatis pada <img> dan saat digambar ke kanvas.
    const img = await decode(url);
    const w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) throw new Error("dimensi");
    const k = Math.min(1, MAX_SIDE / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * k));
    canvas.height = Math.max(1, Math.round(h * k));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("kanvas");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = "";
    return { source: canvas, width: canvas.width, height: canvas.height, origWidth: w, origHeight: h, name: file.name || "foto", lowRes: Math.max(w, h) < LOW_RES_SIDE };
  } catch (e) {
    throw new PhotoError("Gambar tidak dapat dibuka. File mungkin rusak atau terlalu besar untuk memori perangkat ini.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Lepaskan memori bitmap foto yang tidak dipakai lagi. */
export function releasePhoto(photo) {
  if (photo?.source) {
    photo.source.width = 0;
    photo.source.height = 0;
  }
}
