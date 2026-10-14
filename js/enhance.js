// Photo sharpening. Small photos get stretched to fill a 1080 x 1350 card, which makes them soft.
// When a photo is picked we make a bigger copy once: scaled up smoothly, then sharpened (unsharp mask),
// so the card stays crisp. BPG.enhancePhoto(img) returns { img, w, h, small }.
window.BPG = window.BPG || {};

(() => {
  const TARGET = 2000; // long side we aim for; a card needs about 1350-1920 px of photo height

  // Scale in steps of at most 2x with high-quality smoothing (one big jump looks blocky).
  function upscale(img, w, h) {
    let src = img, sw = img.naturalWidth || img.width, sh = img.naturalHeight || img.height;
    while (sw < w || sh < h) {
      const nw = Math.min(w, sw * 2), nh = Math.min(h, sh * 2), c = document.createElement("canvas");
      c.width = Math.round(nw); c.height = Math.round(nh);
      const x = c.getContext("2d"); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
      x.drawImage(src, 0, 0, c.width, c.height);
      src = c; sw = c.width; sh = c.height;
    }
    return src;
  }

  // Unsharp mask: add back the difference between the photo and a blurred copy of it.
  function sharpen(c, amount) {
    const x = c.getContext("2d"), W = c.width, H = c.height, d = x.getImageData(0, 0, W, H), p = d.data;
    const b = new Float32Array(W * H * 3), t = new Float32Array(W * H * 3);
    // 1-2-1 blur, across then down.
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
      const l = Math.max(0, i - 1), r = Math.min(W - 1, i + 1), o = (y * W + i) * 3;
      for (let k = 0; k < 3; k++) t[o + k] = (p[(y * W + l) * 4 + k] + 2 * p[(y * W + i) * 4 + k] + p[(y * W + r) * 4 + k]) / 4;
    }
    for (let y = 0; y < H; y++) {
      const u = Math.max(0, y - 1), v = Math.min(H - 1, y + 1);
      for (let i = 0; i < W; i++) { const o = (y * W + i) * 3; for (let k = 0; k < 3; k++) b[o + k] = (t[(u * W + i) * 3 + k] + 2 * t[o + k] + t[(v * W + i) * 3 + k]) / 4; }
    }
    for (let j = 0, n = W * H; j < n; j++) for (let k = 0; k < 3; k++) {
      const v = p[j * 4 + k], diff = v - b[j * 3 + k];
      // Skip tiny differences so noise and JPEG blocks aren't sharpened too.
      if (Math.abs(diff) > 3) p[j * 4 + k] = v + diff * amount;
    }
    x.putImageData(d, 0, 0);
  }

  BPG.enhancePhoto = (img) => {
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, long = Math.max(w, h);
    const small = Math.min(w, h) < 900;
    if (long >= TARGET * 0.9) return { img, w, h, small: false };
    try {
      const s = TARGET / long, c = upscale(img, Math.round(w * s), Math.round(h * s));
      sharpen(c, s > 2 ? 0.9 : 0.6);
      return { img: c, w, h, small };
    } catch (e) { return { img, w, h, small }; }
  };
})();
