// Web Worker (module): menjalankan optimalisasi foto di luar thread UI agar slider tetap lancar.
import { processPixels } from "./enhance-core.js";

self.onmessage = (e) => {
  const { id, width, height, buffer, params, upscaled } = e.data;
  try {
    const px = new Uint8ClampedArray(buffer);
    processPixels(px, width, height, params, { upscaled });
    self.postMessage({ id, buffer: px.buffer }, [px.buffer]);
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message || err) });
  }
};
