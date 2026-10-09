// Drawing toolkit shared by every layout. You rarely need to edit this file.
// layouts.js receives this kit as `k` and uses its helpers to draw cards.
window.BPG = window.BPG || {};

BPG.createKit = function (ctx, env) {
  const F = BPG.FONTS, D = F.display, C = F.condensed;
  const k = { ctx, D, C, B: F.body };

  k.font = (size, fam, weight) => `${weight || ""} ${size}px ${fam}`.trim();
  k.spaced = (px) => { try { ctx.letterSpacing = px + "px"; } catch (e) {} };

  // Shrink text until it fits maxW; returns the size used.
  k.fit = (text, maxW, size, fam, weight, min) => {
    let s = size;
    ctx.font = k.font(s, fam, weight);
    while (ctx.measureText(text).width > maxW && s > (min || 24)) { s -= 4; ctx.font = k.font(s, fam, weight); }
    return s;
  };

  k.hexA = (hex, a) => {
    const h = hex.replace("#", ""); const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  // Dark or white text, whichever reads on this colour.
  k.inkOn = (hex) => {
    const n = parseInt(hex.replace("#", ""), 16);
    const l = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
    return l > 150 ? "#0B0F18" : "#FFFFFF";
  };
  k.roundRect = (x, y, w, h, r) => {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };

  // Photo filling a box, using the zoom / move sliders.
  k.coverImg = (img, x, y, w, h, useSliders = true) => {
    const a = useSliders ? env.adjust() : { zoom: 1, offx: 0, offy: 0 };
    const s = Math.max(w / img.width, h / img.height) * a.zoom;
    const dw = img.width * s, dh = img.height * s;
    ctx.drawImage(img, x + (w - dw) / 2 + (a.offx / 100) * w, y + (h - dh) / 2 + (a.offy / 100) * h, dw, dh);
  };
  k.circlePhoto = (img, cx, cy, r, ring) => {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    const s = Math.max((2 * r) / img.width, (2 * r) / img.height);
    ctx.drawImage(img, cx - (img.width * s) / 2, cy - (img.height * s) / 2, img.width * s, img.height * s); ctx.restore();
    if (ring) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.lineWidth = 10; ctx.strokeStyle = ring; ctx.stroke(); }
  };
  // Draws the main photo into the top `h` pixels, then darkens it by the slider plus `extraShade`.
  k.photoArea = (g, h, extraShade = 0) => {
    if (!g.photo) return false;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, g.W, h); ctx.clip();
    k.coverImg(g.photo.img, 0, 0, g.W, h); ctx.restore();
    const shade = env.adjust().shade + extraShade;
    if (shade > 0) { ctx.fillStyle = k.hexA(g.bg, Math.min(0.9, shade)); ctx.fillRect(0, 0, g.W, h); }
    return true;
  };
  k.photoHint = (g, y) => {
    ctx.font = k.font(34, C, 600); ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText("Add a player photo", g.W / 2, y); ctx.textAlign = "left";
  };

  k.background = (g) => {
    const { W, H, bg, accent } = g;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const gr = ctx.createRadialGradient(W * 0.85, H * 0.15, 0, W * 0.85, H * 0.15, W * 0.9);
    gr.addColorStop(0, k.hexA(accent, 0.28)); gr.addColorStop(1, k.hexA(accent, 0));
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.045)"; ctx.lineWidth = 18;
    for (let i = -H; i < W + H; i += 64) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - H * 0.6, H); ctx.stroke(); }
    ctx.restore();
  };
  // Fades the photo into the background colour from `from` to `to`, solid below.
  k.fadeBottom = (g, from, to) => {
    const gr = ctx.createLinearGradient(0, from, 0, to);
    gr.addColorStop(0, k.hexA(g.bg, 0)); gr.addColorStop(1, k.hexA(g.bg, 1));
    ctx.fillStyle = gr; ctx.fillRect(0, from, g.W, to - from); ctx.fillStyle = g.bg; ctx.fillRect(0, to, g.W, g.H - to);
  };
  // The two diagonal accent lines that sit between photo and text.
  k.slash = (g, y) => {
    ctx.save(); ctx.strokeStyle = g.accent; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(0, y + 40); ctx.lineTo(g.W, y - 50); ctx.stroke();
    ctx.globalAlpha = 0.45; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, y + 62); ctx.lineTo(g.W, y - 28); ctx.stroke(); ctx.restore();
  };

  // Top row: match tag pill on the left, handle or logo on the right.
  k.header = (g) => {
    const { W, st: top, accent } = g, s = env.state(), logo = env.logo();
    const kick = (s.kicker || "").toUpperCase();
    if (kick) {
      ctx.font = k.font(36, C, 700); k.spaced(3);
      const w = Math.min(ctx.measureText(kick).width, W - 360);
      ctx.fillStyle = accent; k.roundRect(56, top + 18, w + 44, 58, 29); ctx.fill();
      ctx.fillStyle = k.inkOn(accent); ctx.textBaseline = "middle";
      ctx.fillText(kick, 78, top + 49, W - 360); k.spaced(0);
    }
    if (logo) {
      const sc = 96 / Math.max(logo.width, logo.height);
      ctx.drawImage(logo, W - 56 - logo.width * sc, top, logo.width * sc, logo.height * sc);
    } else {
      ctx.font = k.font(36, C, 700); ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(s.brand.handle || "", W - 56, top + 49); ctx.textAlign = "left";
    }
    ctx.textBaseline = "alphabetic";
  };
  // Bottom row: your verdict if you typed one, otherwise the page name.
  k.footer = (g) => {
    const { W, footerY: y, accent } = g, s = env.state();
    ctx.fillStyle = accent; ctx.fillRect(56, y - 22, 22, 22);
    const v = (s.verdict || "").trim();
    if (v) {
      ctx.font = k.font(30, C, 700); k.spaced(4); ctx.fillStyle = accent;
      const lab = BPG.BRAND.verdictLabel; ctx.fillText(lab, 92, y);
      const lw = ctx.measureText(lab).width; k.spaced(0);
      ctx.font = k.font(k.fit(v, W - 92 - lw - 90, 40, C, 700, 22), C, 700); ctx.fillStyle = "#FFFFFF";
      ctx.fillText(v, 92 + lw + 22, y + 2);
      return;
    }
    ctx.font = k.font(28, C, 700); k.spaced(5); ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.fillText((s.brand.name || "").toUpperCase(), 92, y); k.spaced(0);
  };

  // ---- Text ----
  // Rich text: words wrapped in *stars* are drawn in the accent colour.
  k.richWords = (text) => {
    const out = []; let hl = false;
    String(text).split(/\s+/).filter(Boolean).forEach((w) => {
      const starts = w.startsWith("*"), ends = w.endsWith("*") && w.length > 1;
      if (starts) hl = true;
      out.push({ w: w.replace(/\*/g, ""), hl });
      if (ends || (starts && w.length > 1 && w.slice(1).includes("*"))) hl = false;
    });
    return out;
  };
  // Wraps rich text into at most maxLines, shrinking the font as needed.
  k.layoutRich = (text, maxW, size, fam, maxLines, min, weight) => {
    const words = k.richWords(text);
    for (let s = size; ; s -= 4) {
      ctx.font = k.font(s, fam, weight);
      const sp = ctx.measureText(" ").width, lines = [[]]; let cur = 0;
      words.forEach((wd) => {
        const ww = ctx.measureText(wd.w).width;
        if (cur && cur + sp + ww > maxW) { lines.push([]); cur = 0; }
        lines[lines.length - 1].push(wd); cur += (cur ? sp : 0) + ww;
      });
      if (lines.length <= maxLines || s <= (min || 30)) return { size: s, lines };
    }
  };
  k.drawRich = (lay, x, y, lineH, fam, base, hi, align, weight) => {
    ctx.font = k.font(lay.size, fam, weight); k.spaced(0);
    const prev = ctx.textAlign; ctx.textAlign = "left";
    const sp = ctx.measureText(" ").width;
    lay.lines.forEach((ln, i) => {
      const total = ln.reduce((a, wd, j) => a + ctx.measureText(wd.w).width + (j ? sp : 0), 0);
      let cx = align === "center" ? x - total / 2 : x;
      ln.forEach((wd) => { ctx.fillStyle = wd.hl ? hi : base; ctx.fillText(wd.w, cx, y + i * lineH); cx += ctx.measureText(wd.w).width + sp; });
    });
    ctx.textAlign = prev;
  };
  k.bigText = (g, text, y, size) => {
    const s = k.fit(text.toUpperCase(), g.W - 112, size || 200, D);
    ctx.font = k.font(s, D); ctx.fillStyle = g.accent; ctx.fillText(text.toUpperCase(), 52, y); return s;
  };
  k.nameText = (g, text, y, size) => {
    const s = k.fit(String(text).toUpperCase(), g.W - 112, size || 120, D);
    ctx.font = k.font(s, D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(String(text).toUpperCase(), 54, y);
  };
  k.subText = (g, text, y) => {
    ctx.font = k.font(44, C, 600); ctx.fillStyle = "rgba(255,255,255,0.82)"; ctx.fillText(text, 56, y, g.W - 112);
  };
  k.label = (text, x, y, color, size = 48) => {
    ctx.font = k.font(size, C, 700); k.spaced(4); ctx.fillStyle = color; ctx.fillText(String(text).toUpperCase(), x, y); k.spaced(0);
  };

  // A row of stat columns: [["Runs", "52"], ["Balls", "38"], ...]
  k.stats = (g, items, y, h = 130) => {
    const pad = 56, n = items.length; if (!n) return;
    const cw = (g.W - pad * 2) / n;
    items.forEach(([label, value], i) => {
      const x = pad + i * cw;
      if (i) { ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fillRect(x, y + 14, 2, h - 28); }
      ctx.textAlign = "center";
      ctx.font = k.font(k.fit(String(value), cw - 24, 76, D), D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(String(value), x + cw / 2, y + h * 0.58);
      ctx.font = k.font(26, C, 700); k.spaced(3); ctx.fillStyle = g.accent;
      ctx.fillText(String(label).toUpperCase(), x + cw / 2, y + h * 0.9, cw - 16); k.spaced(0);
      ctx.textAlign = "left";
    });
  };
  // A rotated outlined stamp, like "GONE!" or "DUCK".
  k.stamp = (text, cx, cy, size, color, angle = -0.16) => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
    ctx.font = k.font(size, D); const tw = ctx.measureText(text).width;
    ctx.lineWidth = Math.max(6, size / 18); ctx.strokeStyle = color; k.roundRect(-tw / 2 - size * 0.18, -size * 0.92, tw + size * 0.36, size * 1.12, 16); ctx.stroke();
    ctx.fillStyle = color; ctx.textAlign = "center"; ctx.fillText(text, 0, 0); ctx.restore();
  };

  // ---- Cricket maths ----
  k.oversToBalls = (o) => { const [a, b] = String(o).split("."); return (parseInt(a) || 0) * 6 + (parseInt(b) || 0); };
  k.parseOver = (s) => {
    const balls = String(s).trim().split(/\s+/).filter(Boolean);
    let runs = 0, wk = 0;
    balls.forEach((b) => {
      const t = b.toLowerCase();
      if (t === "w") wk++;
      else if (t === "wd" || t === "nb") runs += 1;
      else if (/^(wd|nb)\d+$/.test(t)) runs += 1 + parseInt(t.slice(2));
      else if (!isNaN(parseInt(t))) runs += parseInt(t);
    });
    return { balls, runs, wk };
  };
  k.overBalls = (g, balls, y) => {
    const { W, accent } = g;
    const n = Math.max(balls.length, 6), gap = 16, d = Math.min(130, (W - 112 - gap * (n - 1)) / n);
    balls.forEach((b, i) => {
      const cx = 56 + d / 2 + i * (d + gap), cy = y + d / 2, t = b.toUpperCase();
      ctx.beginPath(); ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
      let fill = "rgba(255,255,255,0.10)", ink = "#FFFFFF", stroke = null;
      if (t === "W" || t === "6") { fill = accent; ink = k.inkOn(accent); }
      else if (t === "4") { fill = "rgba(255,255,255,0)"; stroke = accent; }
      ctx.fillStyle = fill; ctx.fill();
      if (stroke) { ctx.lineWidth = 6; ctx.strokeStyle = stroke; ctx.stroke(); }
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const label = t === "0" ? "•" : t;
      ctx.font = k.font(k.fit(label, d - 22, d * 0.5, D), D); ctx.fillStyle = ink; ctx.fillText(label, cx, cy + 3);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    });
  };

  return k;
};
