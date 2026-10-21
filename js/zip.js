// Zip files for the photo library, read and written in the browser (no library needed).
// BPG.unzip(file) → [{ path, blob }] for every photo in the zip. BPG.zip([{ path, blob }]) → a .zip Blob (not compressed: photos are already).
window.BPG = window.BPG || {};

(() => {
  const TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", heic: "image/heic", avif: "image/avif" };
  const ext = (p) => (p.split(".").pop() || "").toLowerCase();

  BPG.unzip = async (file) => {
    // The list of files sits at the end of a zip; read the last 64 KB (+ comment room) to find it.
    const tailLen = Math.min(file.size, 65557 + 22), tail = new DataView(await file.slice(file.size - tailLen).arrayBuffer());
    let eocd = -1;
    for (let i = tailLen - 22; i >= 0; i--) if (tail.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error("That doesn't look like a zip file.");
    const count = tail.getUint16(eocd + 10, true), cdSize = tail.getUint32(eocd + 12, true), cdOff = tail.getUint32(eocd + 16, true);
    if (cdOff === 0xffffffff) throw new Error("This zip is too big. Split it into smaller zips (under 4 GB).");
    const cd = new DataView(await file.slice(cdOff, cdOff + cdSize).arrayBuffer()), out = [];
    const utf8 = new TextDecoder("utf-8"), latin = new TextDecoder("latin1");
    let p = 0;
    for (let n = 0; n < count && p + 46 <= cd.byteLength; n++) {
      if (cd.getUint32(p, true) !== 0x02014b50) break;
      const flags = cd.getUint16(p + 8, true), method = cd.getUint16(p + 10, true), csize = cd.getUint32(p + 20, true);
      const nl = cd.getUint16(p + 28, true), xl = cd.getUint16(p + 30, true), cl = cd.getUint16(p + 32, true), local = cd.getUint32(p + 42, true);
      const raw = new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nl), path = (flags & 0x800 ? utf8 : (() => { try { return new TextDecoder("utf-8", { fatal: true }); } catch (e) { return latin; } })()).decode(raw);
      p += 46 + nl + xl + cl;
      const parts = path.split("/"), base = parts[parts.length - 1];
      if (!base || base.startsWith(".") || parts.includes("__MACOSX") || !TYPES[ext(base)]) continue;
      out.push({ path, method, csize, local });
    }
    return out.map((e) => ({
      path: e.path,
      // Each photo is unpacked only when it is used, so a big zip doesn't fill the phone's memory.
      async blob() {
        const h = new DataView(await file.slice(e.local, e.local + 30).arrayBuffer());
        const start = e.local + 30 + h.getUint16(26, true) + h.getUint16(28, true), data = file.slice(start, start + e.csize);
        const type = TYPES[ext(e.path)];
        if (e.method === 0) return new Blob([data], { type });
        if (e.method === 8 && "DecompressionStream" in window) return new Blob([await new Response(data.stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer()], { type });
        throw new Error("Can't unpack " + e.path);
      },
    }));
  };

  const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc32 = (u8) => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

  BPG.zip = async (files) => {
    const enc = new TextEncoder(), parts = [], central = [];
    let off = 0;
    for (const f of files) {
      const data = new Uint8Array(await f.blob.arrayBuffer()), name = enc.encode(f.path), crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x800, true); lh.setUint16(8, 0, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x800, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true); ch.setUint32(42, off, true);
      parts.push(lh.buffer, name, f.blob); central.push(ch.buffer, name);
      off += 30 + name.length + data.length;
    }
    const cdSize = central.reduce((s, b) => s + b.byteLength, 0), end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, off, true);
    return new Blob([...parts, ...central, end.buffer], { type: "application/zip" });
  };

  // Which player a photo in a zip belongs to: its folder ("Shakib Al Hasan/1.jpg") or its file name ("shakib-al-hasan-2.jpg").
  const fromFile = (base) => base.replace(/\.[^.]+$/, "").replace(/[_\-.]+/g, " ").replace(/\d+/g, " ")
    .replace(/\b(img|image|images|photo|photos|pic|pics|copy|dsc|dcim|edited|hd|final|whatsapp|screenshot|pxl|getty|imago)\b/gi, " ").replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
  const title = (s) => s.replace(/(^|\s)(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  BPG.zipNames = (paths) => {
    const byFolder = {};
    paths.forEach((p) => { const parts = p.split("/"); const dir = parts.slice(0, -1).join("/"); (byFolder[dir] = byFolder[dir] || []).push(fromFile(parts[parts.length - 1]).toLowerCase()); });
    return paths.map((p) => {
      const parts = p.split("/"), dir = parts.slice(0, -1).join("/"), folder = parts[parts.length - 2] || "", own = fromFile(parts[parts.length - 1]);
      if (!folder) return title(own);
      if (!own) return title(fromFile(folder));
      // "Shakib Al Hasan/shakib_celebration.jpg": the file starts like the folder, so the folder has the full name.
      const fw = fromFile(folder).toLowerCase().split(" ");
      if (own.toLowerCase().split(" ").some((w) => w.length >= 3 && fw.includes(w))) return title(fromFile(folder));
      // A folder holding several players' photos is just a wrapper: use the file names.
      return new Set(byFolder[dir].filter(Boolean)).size > 1 ? title(own) : title(fromFile(folder));
    });
  };
})();
