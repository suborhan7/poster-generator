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

  // "Pro finish": the look of an edited sports photo. Local contrast (clarity) so faces and kits pop,
  // a gentle S-curve, and vibrance (dull colours get more boost than already-strong ones, so skin stays natural).
  BPG.gradePhoto = (src) => {
    try {
      const W = src.width, H = src.height, c = document.createElement("canvas"); c.width = W; c.height = H;
      const x = c.getContext("2d"); x.drawImage(src, 0, 0);
      if (!("filter" in x)) return src;
      const b = document.createElement("canvas"); b.width = W; b.height = H;
      const bx = b.getContext("2d"); bx.filter = `blur(${Math.max(6, Math.round(Math.max(W, H) / 90))}px)`; bx.drawImage(src, 0, 0);
      const d = x.getImageData(0, 0, W, H), p = d.data, q = bx.getImageData(0, 0, W, H).data;
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) { const t = i / 255; curve[i] = 255 * (t + 0.22 * t * (1 - t) * (2 * t - 1) * 2); }
      for (let i = 0; i < p.length; i += 4) {
        let r = p[i], g = p[i + 1], bl = p[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * bl, blum = 0.299 * q[i] + 0.587 * q[i + 1] + 0.114 * q[i + 2];
        const lift = (lum - blum) * 0.35 * (1 - Math.abs(lum - 128) / 160); // clarity, kept off pure blacks and whites
        r += lift; g += lift; bl += lift;
        const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), sat = mx > 0 ? (mx - mn) / mx : 0, avg = (r + g + bl) / 3;
        const v = 0.28 * (1 - sat); // vibrance
        r += (r - avg) * v; g += (g - avg) * v; bl += (bl - avg) * v;
        p[i] = curve[Math.max(0, Math.min(255, r | 0))]; p[i + 1] = curve[Math.max(0, Math.min(255, g | 0))]; p[i + 2] = curve[Math.max(0, Math.min(255, bl | 0))];
      }
      x.putImageData(d, 0, 0);
      return c;
    } catch (e) { return src; }
  };

  // Fine film grain, laid over the photo when it is drawn. Hides the smoothness of scaled-up photos
  // and gives the card a printed, premium feel. One small tile, made once.
  let grainTile = null;
  BPG.grain = (ctx, x, y, w, h, strength = 0.07) => {
    if (!grainTile) {
      grainTile = document.createElement("canvas"); grainTile.width = grainTile.height = 256;
      const gx = grainTile.getContext("2d"), d = gx.createImageData(256, 256);
      let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 90; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      gx.putImageData(d, 0, 0);
    }
    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = strength;
    ctx.fillStyle = ctx.createPattern(grainTile, "repeat"); ctx.fillRect(x, y, w, h); ctx.restore();
  };

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
