// Photo library: player photos saved on this phone (IndexedDB), found again by the player's name.
// BPG.lib.add(name, blob), BPG.lib.find(name), BPG.lib.remove(id), BPG.lib.count().
// Nothing is uploaded. Clearing the browser's site data deletes the library.
window.BPG = window.BPG || {};

(() => {
  const DB = "bpg_library", STORE = "photos";
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
    r.onsuccess = () => res(r.result);
    r.onerror = () => { dbp = null; rej(r.error); };
  }));
  const tx = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(STORE, mode), out = fn(t.objectStore(STORE));
      t.oncomplete = () => res(out && "result" in out ? out.result : undefined);
      t.onerror = () => rej(t.error);
    });
  };

  // "Shakib Al Hasan", "shakib al-hasan" and "Shakib  Al Hasan" are the same player.
  const norm = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-zঀ-৿]+/g, " ").trim();
  // How well a saved name matches what was typed: 3 same name, 2 every typed word is in it ("Shakib" → Shakib Al Hasan), 1 a long word matches.
  const score = (saved, q) => {
    const a = norm(saved), b = norm(q);
    if (!a || !b) return 0;
    if (a === b) return 3;
    const aw = a.split(" "), bw = b.split(" ");
    if (bw.every((w) => aw.includes(w)) || aw.every((w) => bw.includes(w))) return 2;
    return bw.some((w) => w.length >= 4 && aw.includes(w)) ? 1 : 0;
  };

  // Big phone photos are shrunk to 2000 px on the long side before saving, so the library doesn't fill the phone.
  async function shrink(blob) {
    if (blob.type === "image/png") return blob; // a cutout keeps its see-through background
    try {
      const img = await createImageBitmap(blob), s = Math.min(1, 2000 / Math.max(img.width, img.height));
      if (s === 1 && blob.size < 1.5e6) return blob;
      const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      return await new Promise((res) => c.toBlob((b) => res(b || blob), "image/jpeg", 0.92));
    } catch (e) { return blob; }
  }

  BPG.lib = {
    ok: () => "indexedDB" in window,
    norm,
    // src marks where a photo came from (zip name + path), so importing the same zip twice doesn't double it.
    async add(name, blob, src) {
      const clean = String(name || "").trim().replace(/\s+/g, " ");
      if (!clean) throw new Error("Type the player's name first.");
      const small = await shrink(blob);
      return tx("readwrite", (s) => s.add({ name: clean, key: norm(clean), blob: small, added: Date.now(), src: src || "" }));
    },
    all: () => tx("readonly", (s) => s.getAll()),
    // Best matches first, newest first within a match.
    async find(q) {
      const all = await tx("readonly", (s) => s.getAll());
      return all.map((p) => ({ ...p, score: score(p.name, q) })).filter((p) => p.score > 0)
        .sort((x, y) => y.score - x.score || y.added - x.added);
    },
    remove: (id) => tx("readwrite", (s) => s.delete(id)),
    count: () => tx("readonly", (s) => s.count()),
  };
})();
