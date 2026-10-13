// Riwayat undo/redo berbasis state ringan (JSON berisi ID foto + transformasi + teks), bukan bitmap.
export class History {
  constructor(limit = 40) {
    this.limit = limit;
    this.past = [];
    this.future = [];
    this.current = null;
  }
  reset(state) {
    this.past = [];
    this.future = [];
    this.current = JSON.stringify(state);
  }
  /** Simpan state baru. Mengembalikan false bila tidak ada perubahan bermakna. */
  commit(state) {
    const s = JSON.stringify(state);
    if (s === this.current) return false;
    this.past.push(this.current);
    if (this.past.length > this.limit) this.past.shift();
    this.current = s;
    this.future = [];
    return true;
  }
  undo() {
    if (!this.past.length) return null;
    this.future.push(this.current);
    this.current = this.past.pop();
    return JSON.parse(this.current);
  }
  redo() {
    if (!this.future.length) return null;
    this.past.push(this.current);
    this.current = this.future.pop();
    return JSON.parse(this.current);
  }
  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }
  /** Semua ID foto yang masih dirujuk riwayat — foto lain boleh dilepas dari memori. */
  referencedPhotoIds() {
    const ids = new Set();
    for (const s of [...this.past, this.current, ...this.future]) {
      if (!s) continue;
      for (const m of s.matchAll(/"photoId":"([^"]+)"/g)) ids.add(m[1]);
    }
    return ids;
  }
}
