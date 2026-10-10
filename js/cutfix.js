// Fixing a cutout by hand: drag a box over a part the cutout missed (a bat, the stumps) to bring it back,
// or over leftover background to erase it. Inside the box, colours that match the background just outside
// it are treated as background; everything else is the player.
window.BPG = window.BPG || {};

(() => {
  // A few typical background colours, from a band just outside the box where the cutout is already see-through.
  function bgColours(px, al, W, H, r) {
    const pts = [], pad = 14, step = 2;
    const take = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; if (al[i] < 40) pts.push([px[i * 4], px[i * 4 + 1], px[i * 4 + 2]]); };
    for (let y = r.y - pad; y < r.y + r.h + pad; y += step) for (let k = 1; k <= pad; k += step) { take(r.x - k, y); take(r.x + r.w + k, y); }
    for (let x = r.x; x < r.x + r.w; x += step) for (let k = 1; k <= pad; k += step) { take(x, r.y - k); take(x, r.y + r.h + k); }
    if (pts.length < 20) return null;
    // k-means, 10 colours, a few rounds is plenty.
    const K = Math.min(10, pts.length);
    let c = Array.from({ length: K }, (_, i) => pts[Math.floor((i + 0.5) * pts.length / K)].slice());
    for (let it = 0; it < 10; it++) {
      const sum = c.map(() => [0, 0, 0, 0]);
      pts.forEach((p) => { let b = 0, bd = 1e9; c.forEach((q, j) => { const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; if (d < bd) { bd = d; b = j; } }); const s = sum[b]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++; });
      c = c.map((q, j) => (sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]] : q));
    }
    return c;
  }

  // mode "add": bring back what isn't background. mode "erase": remove what is background.
  BPG.fixCutout = (cut, orig, r, mode) => {
    const W = cut.width, H = cut.height, cx = cut.getContext("2d");
    r = { x: Math.max(0, Math.round(r.x)), y: Math.max(0, Math.round(r.y)) , w: Math.round(r.w), h: Math.round(r.h) };
    r.w = Math.min(W - r.x, r.w); r.h = Math.min(H - r.y, r.h);
    if (r.w < 4 || r.h < 4) return false;
    const o = document.createElement("canvas"); o.width = W; o.height = H; o.getContext("2d").drawImage(orig, 0, 0, W, H);
    const src = o.getContext("2d").getImageData(0, 0, W, H).data;
    const img = cx.getImageData(0, 0, W, H), px = img.data, al = new Uint8ClampedArray(W * H);
    for (let i = 0; i < W * H; i++) al[i] = px[i * 4 + 3];
    const C = bgColours(src, al, W, H, r);
    if (!C) return false;
    // How "not background" each pixel in the box is, 0..1, then smoothed so the edge isn't jagged.
    let f = new Float32Array(r.w * r.h);
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
      const i = ((r.y + y) * W + r.x + x) * 4; let d = 1e9;
      for (const q of C) { const e = (src[i] - q[0]) ** 2 + (src[i + 1] - q[1]) ** 2 + (src[i + 2] - q[2]) ** 2; if (e < d) d = e; }
      f[y * r.w + x] = Math.min(1, Math.max(0, (Math.sqrt(d) - 28) / 30));
    }
    for (let pass = 0; pass < 2; pass++) {
      const g = new Float32Array(f.length);
      for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
        let s = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && xx >= 0 && yy < r.h && xx < r.w) { s += f[yy * r.w + xx]; n++; } }
        g[y * r.w + x] = s / n;
      }
      f = g;
    }
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
      const k = (r.y + y) * W + r.x + x, i = k * 4, v = Math.round(Math.min(1, Math.max(0, (f[y * r.w + x] - 0.2) / 0.6)) * 255);
      if (mode === "add" && v > px[i + 3]) { px[i] = src[i]; px[i + 1] = src[i + 1]; px[i + 2] = src[i + 2]; px[i + 3] = v; }
      if (mode === "erase" && v < px[i + 3]) px[i + 3] = v;
    }
    cx.putImageData(img, 0, 0);
    return true;
  };

  // The editor: a full-screen sheet with the cutout over a faint copy of the original, so you can see what's missing.
  BPG.editCutout = (photo, done) => {
    const work = document.createElement("canvas"); work.width = photo.cutImg.width; work.height = photo.cutImg.height;
    work.getContext("2d").drawImage(photo.cutImg, 0, 0);
    const history = [];
    const sheet = document.createElement("div"); sheet.className = "cut-editor";
    sheet.innerHTML = `<p class="cut-tip">Drag a box over the part that's missing (a bat, the stumps) to bring it back.<br>Pick Erase and drag over leftover background to remove it.</p>
      <canvas></canvas>
      <div class="cut-tools"><div class="seg"><button type="button" data-m="add" aria-pressed="true">Bring back</button><button type="button" data-m="erase" aria-pressed="false">Erase</button></div>
      <button type="button" class="ghost" data-a="undo">Undo</button><button type="button" class="primary" data-a="done">Done</button></div>`;
    document.body.append(sheet);
    const cv = sheet.querySelector("canvas"), ctx = cv.getContext("2d");
    let mode = "add", drag = null;
    const fit = () => {
      const maxW = Math.min(window.innerWidth - 32, 900), maxH = window.innerHeight - 190, s = Math.min(maxW / work.width, maxH / work.height);
      cv.width = Math.round(work.width * s); cv.height = Math.round(work.height * s);
      paint();
    };
    function paint() {
      ctx.fillStyle = "#16301F"; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.globalAlpha = 0.28; ctx.drawImage(photo.orig, 0, 0, cv.width, cv.height); ctx.globalAlpha = 1;
      ctx.drawImage(work, 0, 0, cv.width, cv.height);
      if (drag) {
        const x = Math.min(drag.x0, drag.x1), y = Math.min(drag.y0, drag.y1);
        ctx.strokeStyle = mode === "add" ? "#FFD23F" : "#FF5A5A"; ctx.lineWidth = 3; ctx.setLineDash([10, 6]);
        ctx.strokeRect(x, y, Math.abs(drag.x1 - drag.x0), Math.abs(drag.y1 - drag.y0)); ctx.setLineDash([]);
      }
    }
    const pos = (e) => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * (cv.width / b.width), (e.clientY - b.top) * (cv.height / b.height)]; };
    cv.addEventListener("pointerdown", (e) => { cv.setPointerCapture(e.pointerId); const [x, y] = pos(e); drag = { x0: x, y0: y, x1: x, y1: y }; paint(); });
    cv.addEventListener("pointermove", (e) => { if (!drag) return; [drag.x1, drag.y1] = pos(e); paint(); });
    cv.addEventListener("pointerup", () => {
      if (!drag) return;
      const s = work.width / cv.width, r = { x: Math.min(drag.x0, drag.x1) * s, y: Math.min(drag.y0, drag.y1) * s, w: Math.abs(drag.x1 - drag.x0) * s, h: Math.abs(drag.y1 - drag.y0) * s };
      drag = null;
      const before = work.getContext("2d").getImageData(0, 0, work.width, work.height);
      if (BPG.fixCutout(work, photo.orig, r, mode)) history.push(before);
      paint();
    });
    sheet.querySelectorAll("[data-m]").forEach((b) => b.addEventListener("click", () => {
      mode = b.dataset.m; sheet.querySelectorAll("[data-m]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    }));
    sheet.querySelector('[data-a="undo"]').addEventListener("click", () => { const h = history.pop(); if (h) { work.getContext("2d").putImageData(h, 0, 0); paint(); } });
    sheet.querySelector('[data-a="done"]').addEventListener("click", () => { window.removeEventListener("resize", fit); sheet.remove(); done(work); });
    window.addEventListener("resize", fit);
    fit();
  };
})();
