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

  // Auto framing: finds where the player is, so every card can place them well without the sliders.
  // Sports photos keep the player sharp and the crowd blurred, so we look for the sharpest region
  // (plus a pull towards the middle). A cutout is easier: the player is wherever the photo isn't see-through.
  // Returns { l, t, r, b, cx, cy } as fractions of the photo, or null when nothing stands out.
  BPG.findSubject = (img) => {
    try {
      const W0 = img.naturalWidth || img.width, H0 = img.naturalHeight || img.height, sc = 160 / Math.max(W0, H0);
      const W = Math.max(8, Math.round(W0 * sc)), H = Math.max(8, Math.round(H0 * sc));
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const x = c.getContext("2d"); x.drawImage(img, 0, 0, W, H);
      const p = x.getImageData(0, 0, W, H).data, n = W * H, m = new Float32Array(n);
      let see = 0; for (let i = 0; i < n; i++) if (p[i * 4 + 3] < 128) see++;
      if (see > n * 0.05) { // cutout
        for (let i = 0; i < n; i++) m[i] = p[i * 4 + 3] >= 128 ? 1 : 0;
        return box(m, W, H, 0.5);
      }
      const L = new Float32Array(n);
      for (let i = 0; i < n; i++) L[i] = 0.299 * p[i * 4] + 0.587 * p[i * 4 + 1] + 0.114 * p[i * 4 + 2];
      for (let y = 1; y < H - 1; y++) for (let i = 1; i < W - 1; i++) {
        const o = y * W + i;
        const gx = L[o - W + 1] + 2 * L[o + 1] + L[o + W + 1] - L[o - W - 1] - 2 * L[o - 1] - L[o + W - 1];
        const gy = L[o + W - 1] + 2 * L[o + W] + L[o + W + 1] - L[o - W - 1] - 2 * L[o - W] - L[o - W + 1];
        m[o] = Math.sqrt(gx * gx + gy * gy);
      }
      // Smooth into regions, then favour the middle of the frame a little.
      const r = Math.max(3, Math.round(Math.max(W, H) / 22)), sm = blur(m, W, H, r);
      for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
        const dx = (i / W - 0.5) / 0.42, dy = (y / H - 0.45) / 0.5;
        sm[y * W + i] *= Math.exp(-(dx * dx + dy * dy) / 2) * 0.6 + 0.4;
      }
      let mx = 0, sum = 0; for (let i = 0; i < n; i++) { mx = Math.max(mx, sm[i]); sum += sm[i]; }
      if (!mx || mx < (sum / n) * 1.6) return null; // nothing stands out: keep the plain centred crop
      return box(sm, W, H, mx * 0.45);
    } catch (e) { return null; }
  };
  function blur(a, W, H, r) {
    const t = new Float32Array(W * H), o = new Float32Array(W * H);
    for (let y = 0; y < H; y++) { let s = 0; for (let i = -r; i <= r; i++) s += a[y * W + Math.min(W - 1, Math.max(0, i))];
      for (let i = 0; i < W; i++) { t[y * W + i] = s / (2 * r + 1); s += a[y * W + Math.min(W - 1, i + r + 1)] - a[y * W + Math.max(0, i - r)]; } }
    for (let i = 0; i < W; i++) { let s = 0; for (let y = -r; y <= r; y++) s += t[Math.min(H - 1, Math.max(0, y)) * W + i];
      for (let y = 0; y < H; y++) { o[y * W + i] = s / (2 * r + 1); s += t[Math.min(H - 1, y + r + 1) * W + i] - t[Math.max(0, y - r) * W + i]; } }
    return o;
  }
  // Bounding box of the connected region above `thr` that holds the strongest point.
  function box(m, W, H, thr) {
    let best = 0; for (let i = 1; i < m.length; i++) if (m[i] > m[best]) best = i;
    if (m[best] < thr) return null;
    const seen = new Uint8Array(m.length), st = [best]; seen[best] = 1;
    let l = W, t = H, r = 0, b = 0, sx = 0, sy = 0, cnt = 0;
    while (st.length) {
      const o = st.pop(), x = o % W, y = (o / W) | 0;
      l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y); sx += x; sy += y; cnt++;
      for (const q of [o - 1, o + 1, o - W, o + W]) {
        if (q < 0 || q >= m.length || seen[q] || m[q] < thr) continue;
        if ((q === o - 1 && x === 0) || (q === o + 1 && x === W - 1)) continue;
        seen[q] = 1; st.push(q);
      }
    }
    return { l: l / W, t: t / H, r: (r + 1) / W, b: (b + 1) / H, cx: sx / cnt / W, cy: sy / cnt / H };
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
