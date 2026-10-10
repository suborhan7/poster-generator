// Cricket card designs: fifty, century, knock, wicket, five-for, overs, score update, innings break, result, form, toss.
// Each card draws its whole poster (standard: false) so every one can have its own shape.
// The text is laid out from the bottom up, and the photo takes whatever space is left above it,
// so the same design works for Instagram (1080 x 1350) and TikTok (1080 x 1920).
window.BPG = window.BPG || {};

(function () {
  const L = BPG.LAYOUTS, PAD = 56;
  const cap = (s) => String(s == null ? "" : s).toUpperCase();
  const num = (s) => parseInt(String(s).replace(/[^\d-]/g, ""), 10) || 0;

  // ---------- Shared pieces ----------

  // Photo over the top of the card, fading into the background between fadeFrom and fadeTo.
  // grey: 0 to 1 takes the colour out (used for wickets and ducks).
  function photo(k, g, fadeFrom, fadeTo, grey) {
    const ctx = k.ctx, { W, bg } = g;
    if (k.bleedPhoto(g, fadeTo - 40, grey)) return;
    if (g.photo) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, g.H); ctx.clip();
      k.coverImg(g.photo.img, 0, 0, W, g.H);
      if (grey) {
        ctx.globalCompositeOperation = "saturation"; ctx.globalAlpha = grey; ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, W, g.H);
        ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = 0.35; ctx.fillStyle = g.accent; ctx.fillRect(0, 0, W, g.H);
      }
      ctx.restore();
      if (g.shade > 0) { ctx.fillStyle = k.hexA(bg, Math.min(0.9, g.shade)); ctx.fillRect(0, 0, W, g.H); }
    } else k.photoHint(g, g.st + (fadeFrom - g.st) / 2 + 60);
    const top = ctx.createLinearGradient(0, 0, 0, g.st + 200);
    top.addColorStop(0, k.hexA(bg, 0.7)); top.addColorStop(1, k.hexA(bg, 0));
    ctx.fillStyle = top; ctx.fillRect(0, 0, W, g.st + 200);
    if (g.photo) k.scrim(g, fadeFrom, fadeTo + 160);
  }

  // Slanted colour band with a big word, plus an optional small line after it.
  function ribbon(k, g, text, top, h, sub) {
    const ctx = k.ctx, t = cap(text), s = cap(sub), sl = h * 0.3, ink = k.inkOn(g.accent);
    ctx.font = k.font(24, k.C, 700); k.spaced(3);
    const sw = s ? Math.min(ctx.measureText(s).width, g.W * 0.42) + 34 : 0; k.spaced(0);
    const size = k.fit(t, g.W - 2 * PAD - 70 - sw, Math.round(h * 0.8), k.D, "", 40);
    ctx.font = k.font(size, k.D); k.spaced(1);
    const tw = ctx.measureText(t).width, w = tw + 60 + sw, x = PAD - 8;
    ctx.fillStyle = g.accent; ctx.beginPath();
    ctx.moveTo(x + sl, top); ctx.lineTo(x + w + sl, top); ctx.lineTo(x + w, top + h); ctx.lineTo(x, top + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = ink; ctx.fillText(t, x + 28, top + h / 2 + size * 0.37); k.spaced(0);
    if (s) {
      ctx.globalAlpha = 0.72; ctx.fillRect(x + 28 + tw + 16, top + h * 0.28, 3, h * 0.44);
      ctx.font = k.font(24, k.C, 700); k.spaced(3);
      ctx.fillText(s, x + 28 + tw + 34, top + h / 2 + 9, g.W * 0.42); k.spaced(0); ctx.globalAlpha = 1;
    }
  }

  // First names small, surname big: "NAJMUL HOSSAIN" over "SHANTO". Returns the top of the block.
  function playerName(k, g, full, base, max, draw) {
    // One line: first names in soft white, surname in white.
    const ctx = k.ctx, parts = cap(full).trim().split(/\s+/), last = parts.pop() || "", first = parts.length ? parts.join(" ") + " " : "";
    const size = k.fit(first + last, g.W - 2 * PAD, Math.min(max || 80, 80), k.D, "", 40);
    if (draw !== false) {
      ctx.font = k.font(size, k.D); ctx.fillStyle = "rgba(255,255,255,0.72)"; ctx.fillText(first, PAD - 2, base);
      ctx.fillStyle = "#FFFFFF"; ctx.fillText(last, PAD - 2 + ctx.measureText(first).width, base);
    }
    return base - size * 0.76;
  }

  // Rounded label chip. Returns its width.
  function chip(k, g, text, x, top, filled, align) {
    const ctx = k.ctx, t = cap(text);
    ctx.font = k.font(32, k.C, 700); k.spaced(3);
    const w = ctx.measureText(t).width + 44, left = align === "right" ? x - w : x;
    k.roundRect(left, top, w, 58, 29);
    if (filled) { ctx.fillStyle = g.accent; ctx.fill(); ctx.fillStyle = k.inkOn(g.accent); }
    else { ctx.lineWidth = 3; ctx.strokeStyle = k.hexA(g.accent, 0.9); ctx.stroke(); ctx.fillStyle = "#FFFFFF"; }
    ctx.fillText(t, left + 22, top + 40); k.spaced(0);
    return w;
  }

  // How the runs came: one bar split into sixes, fours and running between the wickets.
  function runsBar(k, g, y, runs, fours, sixes, extra) {
    const ctx = k.ctx, w = g.W - 2 * PAD, f = fours * 4, s6 = sixes * 6, run = Math.max(0, runs - f - s6), tot = Math.max(runs, f + s6, 1);
    const segs = [[s6, g.accent, `${s6} in sixes`], [f, k.hexA(g.accent, 0.5), `${f} in fours`], [run, "rgba(255,255,255,0.3)", `${run} running`]];
    ctx.font = k.font(22, k.C, 700); k.spaced(2);
    let x = PAD;
    segs.forEach(([, c, lab]) => {
      ctx.fillStyle = c; ctx.fillRect(x, y - 30, 14, 14);
      ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.fillText(cap(lab), x + 22, y - 16); x += ctx.measureText(cap(lab)).width + 48;
    });
    if (extra) { ctx.textAlign = "right"; ctx.fillStyle = g.accent; ctx.fillText(cap(extra), g.W - PAD, y - 16); ctx.textAlign = "left"; }
    k.spaced(0);
    ctx.save(); k.roundRect(PAD, y, w, 12, 6); ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(PAD, y, w, 12);
    x = PAD;
    segs.forEach(([v, c]) => { const sw = (w * v) / tot; ctx.fillStyle = c; ctx.fillRect(x, y, sw, 12); x += sw; });
    ctx.restore();
  }

  // A cricket ball with its stitched seam. o: { white, alpha, label, ring }
  function ball(k, cx, cy, r, o) {
    o = o || {};
    const ctx = k.ctx, c = o.white ? ["#FFFFFF", "#AEB3BD", "#C8202E"] : ["#E5414B", "#5E0911", "#F6E7D2"];
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (o.ring) { ctx.beginPath(); ctx.arc(cx, cy, r + 10, 0, Math.PI * 2); ctx.lineWidth = 7; ctx.strokeStyle = o.ring; ctx.stroke(); }
    const gr = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.08, cx, cy, r);
    gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill(); ctx.clip();
    const R = r * 2.4, span = Math.asin(1 / 2.4) + 0.05;
    ctx.strokeStyle = c[2]; ctx.lineWidth = Math.max(1.5, r * 0.04);
    [-0.1, 0.1].forEach((d) => { ctx.beginPath(); ctx.arc(cx + R + d * r, cy, R, Math.PI - span, Math.PI + span); ctx.stroke(); });
    for (let a = -span; a <= span; a += span / 6) {
      const ax = cx + R - R * Math.cos(a), ay = cy - R * Math.sin(a);
      ctx.beginPath(); ctx.moveTo(ax - r * 0.17, ay); ctx.lineTo(ax + r * 0.17, ay); ctx.stroke();
    }
    ctx.restore();
    if (o.label) {
      const t = String(o.label);
      ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = k.font(Math.round(r * (t.length > 1 ? 0.78 : 1.02)), k.D);
      ctx.lineJoin = "round"; ctx.lineWidth = r * 0.16; ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.strokeText(t, cx, cy + r * 0.05);
      ctx.fillStyle = "#FFFFFF"; ctx.fillText(t, cx, cy + r * 0.05); ctx.restore();
    }
  }

  // Sun rays behind a century.
  function rays(k, cx, cy, R, n, color, alpha) {
    const ctx = k.ctx; ctx.save(); ctx.fillStyle = k.hexA(color, alpha);
    for (let i = 0; i < n; i++) {
      const a0 = (i * 2 * Math.PI) / n, a1 = a0 + Math.PI / n;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a0), cy + R * Math.sin(a0)); ctx.lineTo(cx + R * Math.cos(a1), cy + R * Math.sin(a1)); ctx.fill();
    }
    ctx.restore();
  }

  // Printed-dot texture that grows towards the bottom right.
  function halftone(k, x, y, w, h, color, alpha) {
    return; // switched off: the text panel stays clean
    const ctx = k.ctx, step = 22; ctx.save(); ctx.fillStyle = k.hexA(color, alpha);
    for (let py = y; py < y + h; py += step) for (let px = x; px < x + w; px += step) {
      const t = ((px - x) / w + (py - y) / h) / 2, r = step * 0.42 * t;
      if (r > 0.6) { ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }

  // The milestone number. Filled behind a cutout player, outlined over a normal photo.
  function giant(k, g, text, base, behind) {
    const ctx = k.ctx, t = String(text); if (!t) return;
    const s = k.fit(t, g.W * 0.96, 820, k.D, "", 100);
    ctx.font = k.font(s, k.D); ctx.textAlign = "center";
    if (behind) { ctx.fillStyle = g.photo ? g.accent : k.hexA(g.accent, 0.16); ctx.fillText(t, g.W / 2, base); }
    // over a normal photo the number is left out, so it never covers the player
    ctx.textAlign = "left";
  }

  // Three stumps with the middle one knocked back and the bails flying.
  function stumps(k, cx, base, h, color) {
    const ctx = k.ctx, sw = h * 0.075, gap = h * 0.2;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 18;
    [[-1, -0.06], [0, -0.34], [1, 0.14]].forEach(([i, a]) => {
      ctx.save(); ctx.translate(cx + i * gap, base); ctx.rotate(a);
      const gr = ctx.createLinearGradient(-sw / 2, 0, sw / 2, 0); gr.addColorStop(0, "#FFF6E0"); gr.addColorStop(1, "#C9B48A");
      ctx.fillStyle = gr; k.roundRect(-sw / 2, -h, sw, h, sw / 2); ctx.fill(); ctx.restore();
    });
    ctx.fillStyle = color;
    [[-gap * 0.9, -h - 60, -0.8], [gap * 0.8, -h - 120, 0.5]].forEach(([dx, dy, a]) => {
      ctx.save(); ctx.translate(cx + dx, base + dy); ctx.rotate(a); k.roundRect(-gap * 0.55, -sw * 0.32, gap * 1.1, sw * 0.64, sw * 0.32); ctx.fill(); ctx.restore();
    });
    ctx.shadowBlur = 0; ctx.strokeStyle = k.hexA(color, 0.8); ctx.lineWidth = 5; ctx.lineCap = "round";
    [[-gap * 1.6, -h - 10, -gap * 2.3, -h - 40], [-gap * 1.5, -h - 60, -gap * 2.4, -h - 75], [gap * 1.6, -h - 90, gap * 2.4, -h - 130], [gap * 1.8, -h - 40, gap * 2.6, -h - 60]]
      .forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(cx + a, base + b); ctx.lineTo(cx + c, base + d); ctx.stroke(); });
    ctx.restore();
  }

  // Small value + label column, right-aligned at x.
  function statCol(k, g, value, label, x, base) {
    const ctx = k.ctx; ctx.textAlign = "right";
    ctx.font = k.font(50, k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(String(value), x, base - 28);
    ctx.font = k.font(20, k.C, 700); k.spaced(3); ctx.fillStyle = g.accent; ctx.fillText(cap(label), x, base); k.spaced(0);
    ctx.textAlign = "left";
  }

  const fadeFor = (g, textTop) => [Math.max(g.st + 120, textTop - 320), textTop + 60];
  const vs = (g) => [g.val("team"), g.val("opp")].filter(Boolean).join(" vs ");

  // ---------- Fifty / Century ----------
  L.batting = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, runs = num(g.val("runs")), balls = num(g.val("balls")), fours = num(g.val("fours")), sixes = num(g.val("sixes"));
      const ton = Number(g.t.milestone) >= 100, sr = balls ? ((runs / balls) * 100).toFixed(1) : "-";
      const barY = g.footerY - 60, scoreBase = barY - 48, nameBase = scoreBase - 90;
      const nameTop = playerName(k, g, g.val("player"), nameBase, 80, false), ribH = 62, ribTop = nameTop - 24 - ribH;
      const behind = !g.photo || g.photo.cut, [f0, f1] = fadeFor(g, ribTop);

      if (ton) rays(k, g.W / 2, ribTop - 260, g.W * 1.2, 32, g.accent, 0.09);
      if (behind) giant(k, g, g.t.milestone, ribTop + 50, true);
      photo(k, g, f0, f1);
      if (!behind) giant(k, g, g.t.milestone, ribTop + 50, false);
      halftone(k, g.W * 0.45, ribTop, g.W * 0.55, g.footerY - ribTop, g.accent, 0.1);
      k.header(g);

      ribbon(k, g, g.big, ribTop, ribH, vs(g));
      playerName(k, g, g.val("player"), nameBase, 80);
      const r = String(runs) + (String(g.val("runs")).includes("*") ? "*" : "");
      ctx.font = k.font(88, k.D); ctx.fillStyle = g.accent; ctx.fillText(r, PAD - 4, scoreBase);
      const rw = ctx.measureText(r).width;
      ctx.font = k.font(42, k.C, 700); ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillText(`(${balls})`, PAD + rw + 8, scoreBase);
      statCol(k, g, sr, "Strike rate", g.W - PAD, scoreBase);
      statCol(k, g, sixes, "Sixes", g.W - PAD - 160, scoreBase);
      statCol(k, g, fours, "Fours", g.W - PAD - 260, scoreBase);
      runsBar(k, g, barY, runs, fours, sixes);
      k.footer(g);
    },
  };

  // ---------- Knock (X off Y) ----------
  L.knock = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, raw = String(g.val("runs")), runs = num(raw), balls = num(g.val("balls"));
      const duck = runs === 0 && !raw.includes("*"), sr = balls ? ((runs / balls) * 100).toFixed(1) : "-";
      const barY = g.footerY - 60, figBase = barY - 48, figSize = 170, nameBase = figBase - figSize * 0.76 - 30;
      const nameTop = playerName(k, g, g.val("player"), nameBase, 80, false), labBase = nameTop - 20;
      const [f0, f1] = fadeFor(g, labBase - 40);

      photo(k, g, f0, f1, duck ? 0.9 : 0);
      halftone(k, g.W * 0.5, labBase - 40, g.W * 0.5, g.footerY - labBase, g.accent, 0.1);
      k.header(g);
      if (duck) k.stamp("DUCK", g.W / 2, f0 - 20, 190, g.accent, -0.14);

      ctx.font = k.font(24, k.C, 700); k.spaced(5); ctx.fillStyle = g.accent; ctx.fillText(cap(vs(g)), PAD, labBase); k.spaced(0);
      playerName(k, g, g.val("player"), nameBase, 80);
      const r = raw.trim() || "0";
      ctx.font = k.font(figSize, k.D); ctx.fillStyle = duck ? "#FFFFFF" : g.accent; ctx.fillText(r, PAD - 6, figBase);
      const x = PAD + ctx.measureText(r).width + 24;
      ctx.font = k.font(30, k.C, 700); k.spaced(5); ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillText("OFF", x, figBase - 80); k.spaced(0);
      ctx.font = k.font(90, k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(String(balls), x - 4, figBase);
      const bw = ctx.measureText(String(balls)).width;
      ctx.font = k.font(28, k.C, 700); k.spaced(4); ctx.fillText("BALLS", x + bw + 10, figBase); k.spaced(0);
      runsBar(k, g, barY, runs, num(g.val("fours")), num(g.val("sixes")), `Strike rate ${sr}`);
      k.footer(g);
    },
  };

  // ---------- Wicket ----------
  L.wicket = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, runs = num(g.val("runs")), balls = num(g.val("balls"));
      const panH = 100, panTop = g.footerY - 44 - panH, nameBase = panTop - 32;
      const nameTop = playerName(k, g, g.val("batter"), nameBase, 80, false), big = cap(g.big);
      const bigSize = k.fit(big, g.W * 0.5, 130, k.D, "", 60), bigBase = nameTop - 22;
      const [f0, f1] = fadeFor(g, bigBase - bigSize * 0.76);

      photo(k, g, f0, f1, 0.85);
      k.header(g);
      stumps(k, g.W - 160, bigBase + 6, Math.min(200, bigBase - g.st - 200), g.accent);

      ctx.save(); ctx.translate(PAD - 6, bigBase); ctx.rotate(-0.05);
      ctx.font = k.font(bigSize, k.D); ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 24; ctx.fillStyle = g.accent; ctx.fillText(big, 0, 0); ctx.restore();
      playerName(k, g, g.val("batter"), nameBase, 80);

      ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(PAD, panTop, g.W - 2 * PAD, panH);
      ctx.fillStyle = g.accent; ctx.fillRect(PAD, panTop, 10, panH);
      ctx.font = k.font(k.fit(String(g.val("how")), g.W - 2 * PAD - 260, 38, k.C, 700, 24), k.C, 700); ctx.fillStyle = "#FFFFFF";
      ctx.fillText(String(g.val("how")), PAD + 32, panTop + 48);
      ctx.font = k.font(20, k.C, 700); k.spaced(3); ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fillText(cap(`Score ${g.val("score")}  ·  SR ${balls ? ((runs / balls) * 100).toFixed(1) : "-"}`), PAD + 32, panTop + 80, g.W - 2 * PAD - 260); k.spaced(0);
      ctx.textAlign = "right"; ctx.font = k.font(66, k.D); ctx.fillStyle = g.accent; ctx.fillText(String(runs), g.W - PAD - 100, panTop + 74);
      ctx.font = k.font(34, k.C, 700); ctx.fillStyle = "#FFFFFF"; ctx.fillText(`(${balls})`, g.W - PAD - 24, panTop + 74); ctx.textAlign = "left";
      k.footer(g);
    },
  };

  // ---------- Five-wicket haul ----------
  L.bowling = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, w = num(g.val("wkts")), r = num(g.val("runs")), b = k.oversToBalls(g.val("overs"));
      const chipTop = g.footerY - 50 - 58, figBase = chipTop - 28, figSize = 150, nameBase = figBase - figSize * 0.76 - 30;
      const nameTop = playerName(k, g, g.val("player"), nameBase, 80, false), ribH = 62, ribTop = nameTop - 24 - ribH;
      const behind = !g.photo || g.photo.cut, [f0, f1] = fadeFor(g, ribTop);

      if (behind) giant(k, g, w, ribTop + 50, true);
      photo(k, g, f0, f1);
      halftone(k, g.W * 0.45, ribTop, g.W * 0.55, g.footerY - ribTop, g.accent, 0.1);
      k.header(g);

      ribbon(k, g, g.big, ribTop, ribH, vs(g));
      playerName(k, g, g.val("player"), nameBase, 80);
      ctx.font = k.font(figSize, k.D); ctx.fillStyle = g.accent; ctx.fillText(String(w), PAD - 6, figBase);
      let x = PAD - 6 + ctx.measureText(String(w)).width;
      ctx.fillStyle = "#FFFFFF"; ctx.fillText("/" + r, x, figBase); x += ctx.measureText("/" + r).width + 30;
      const n = Math.min(w, 10), rows = n > 5 ? 2 : 1, br = rows > 1 ? 20 : 26, step = br * 2 + 10;
      for (let i = 0; i < n; i++) {
        const row = rows > 1 ? Math.floor(i / 5) : 0, col = rows > 1 ? i % 5 : i;
        if (x + col * step + br * 2 > g.W - PAD) continue;
        ball(k, x + br + col * step, figBase - figSize * 0.38 + (rows > 1 ? (row - 0.5) * (br * 2 + 10) : 0), br);
      }
      x = PAD;
      x += chip(k, g, `${g.val("overs")} overs`, x, chipTop, true) + 14;
      x += chip(k, g, `Economy ${b ? (r / (b / 6)).toFixed(2) : "-"}`, x, chipTop) + 14;
      k.footer(g);
    },
  };

  // ---------- Brilliant over / Bad over ----------
  L.over = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, o = k.parseOver(g.val("balls")), n = Math.max(o.balls.length, 6), gap = 14;
      const d = Math.min(104, (g.W - 2 * PAD - gap * (n - 1)) / n), cumBase = g.footerY - 50, cy = cumBase - 36 - d / 2;
      const figBase = cy - d / 2 - 36, figSize = 150, nameBase = figBase - figSize * 0.76 - 30;
      const nameTop = playerName(k, g, g.val("player"), nameBase, 80, false), ribH = 62, ribTop = nameTop - 24 - ribH;
      const [f0, f1] = fadeFor(g, ribTop);

      photo(k, g, f0, f1);
      const glow = ctx.createRadialGradient(g.W / 2, g.H, 0, g.W / 2, g.H, g.H * 0.6);
      glow.addColorStop(0, k.hexA(g.accent, 0.28)); glow.addColorStop(1, k.hexA(g.accent, 0));
      ctx.fillStyle = glow; ctx.fillRect(0, 0, g.W, g.H);
      k.header(g);

      ribbon(k, g, g.big, ribTop, ribH, `Over ${g.val("over")} · vs ${g.val("opp")}`);
      playerName(k, g, g.val("player"), nameBase, 80);
      const wkFirst = o.wk >= 1 && o.runs < 8, main = String(wkFirst ? o.wk : o.runs);
      ctx.font = k.font(figSize, k.D); ctx.fillStyle = g.accent; ctx.fillText(main, PAD - 6, figBase);
      const x = PAD + ctx.measureText(main).width + 22;
      ctx.font = k.font(54, k.D); ctx.fillStyle = "#FFFFFF";
      ctx.fillText(wkFirst ? (o.wk > 1 ? "WICKETS" : "WICKET") : (o.runs === 1 ? "RUN" : "RUNS"), x, figBase - 60);
      ctx.font = k.font(26, k.C, 700); k.spaced(3); ctx.fillStyle = "rgba(255,255,255,0.82)";
      const second = wkFirst ? `${o.runs} run${o.runs === 1 ? "" : "s"} given` : o.wk ? `and ${o.wk} wicket${o.wk > 1 ? "s" : ""}` : "in one over";
      ctx.fillText(cap(second), x, figBase - 14, g.W - PAD - x); k.spaced(0);

      let total = 0;
      o.balls.forEach((bl, i) => {
        const t = bl.toUpperCase(), cx = PAD + d / 2 + i * (d + gap);
        const v = t === "W" ? 0 : /^(WD|NB)/.test(t) ? 1 + (parseInt(t.slice(2)) || 0) : parseInt(t) || 0;
        total += v;
        const hot = t === "W" || t === "6" || t === "4";
        ball(k, cx, cy, d / 2 - 4, { white: true, alpha: t === "0" ? 0.45 : 1, label: t === "0" ? "•" : t, ring: hot ? g.accent : null });
        ctx.textAlign = "center"; ctx.font = k.font(22, k.C, 700); k.spaced(2);
        ctx.fillStyle = t === "W" ? g.accent : "rgba(255,255,255,0.7)"; ctx.fillText(t === "W" ? "OUT" : String(total), cx, cumBase - 2); k.spaced(0);
        ctx.textAlign = "left";
      });
      k.footer(g);
    },
  };

  // ---------- Score update (TV score bar) ----------
  L.scoreupd = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, detail = g.val("detail"), barH = 128, barBottom = detail ? g.footerY - 96 : g.footerY - 50, barTop = barBottom - barH;
      const chipTop = barTop - 24 - 46, [f0, f1] = fadeFor(g, chipTop - 20);
      photo(k, g, f0, f1);
      k.header(g);

      const st = cap(g.val("status")), live = /LIVE/.test(st);
      ctx.font = k.font(24, k.C, 700); k.spaced(3);
      const cw = ctx.measureText(st).width + 36 + (live ? 28 : 0); k.spaced(0);
      ctx.fillStyle = g.accent; k.roundRect(PAD, chipTop, cw, 46, 23); ctx.fill();
      if (live) { ctx.beginPath(); ctx.arc(PAD + 24, chipTop + 23, 8, 0, Math.PI * 2); ctx.fillStyle = "#E3262F"; ctx.fill(); }
      ctx.font = k.font(24, k.C, 700); k.spaced(3); ctx.fillStyle = k.inkOn(g.accent); ctx.fillText(st, PAD + 18 + (live ? 28 : 0), chipTop + 32); k.spaced(0);

      const bw = 200;
      ctx.fillStyle = "rgba(8,10,16,0.88)"; ctx.fillRect(PAD, barTop, g.W - 2 * PAD, barH);
      ctx.fillStyle = g.accent; ctx.beginPath(); ctx.moveTo(PAD, barTop); ctx.lineTo(PAD + bw + 30, barTop); ctx.lineTo(PAD + bw, barBottom); ctx.lineTo(PAD, barBottom); ctx.closePath(); ctx.fill();
      const ab = cap(g.val("abbr")), ink = k.inkOn(g.accent);
      ctx.textAlign = "center"; ctx.font = k.font(k.fit(ab, bw - 40, 76, k.D), k.D); ctx.fillStyle = ink; ctx.fillText(ab, PAD + bw / 2, barTop + 80);
      ctx.font = k.font(20, k.C, 700); k.spaced(3); ctx.fillText(cap(g.val("team")), PAD + bw / 2, barTop + 110, bw - 30); k.spaced(0);
      ctx.textAlign = "left";
      const sc = String(g.val("score")), runs = num(sc.split("/")[0]), b = k.oversToBalls(g.val("overs"));
      ctx.font = k.font(k.fit(sc, g.W - PAD - 300 - (PAD + bw + 50), 100, k.D), k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(sc, PAD + bw + 50, barTop + 100);
      statCol(k, g, b ? (runs / (b / 6)).toFixed(2) : "-", "Run rate", g.W - PAD - 24, barTop + 100);
      statCol(k, g, g.val("overs"), "Overs", g.W - PAD - 160, barTop + 100);
      if (detail) { ctx.font = k.font(32, k.C, 600); ctx.fillStyle = "rgba(255,255,255,0.88)"; ctx.fillText(detail, PAD, g.footerY - 50, g.W - 2 * PAD); }
      k.footer(g);
    },
  };

  // ---------- Innings break ----------
  L.innings = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, score = String(g.val("score")), target = num(score.split("/")[0]) + 1;
      const overs = parseFloat(g.val("overs")) || 0, balls = k.oversToBalls(g.val("overs"));
      const cardH = 96, cardTop = g.footerY - 44 - cardH, tBase = cardTop - 34, tSize = 170;
      const teamBase = tBase - tSize * 0.76 - 28, ribH = 60, ribTop = teamBase - 48 - 24 - ribH;
      const [f0, f1] = fadeFor(g, ribTop);
      photo(k, g, f0, f1);
      halftone(k, g.W * 0.45, ribTop, g.W * 0.55, g.footerY - ribTop, g.accent, 0.1);
      k.header(g);

      ribbon(k, g, "Innings break", ribTop, ribH);
      const tm = cap(g.val("team")) + " ";
      ctx.font = k.font(k.fit(tm + score, g.W - 2 * PAD, 64, k.D), k.D);
      ctx.fillStyle = "#FFFFFF"; ctx.fillText(tm, PAD - 4, teamBase);
      ctx.fillStyle = g.accent; ctx.fillText(score, PAD - 4 + ctx.measureText(tm).width, teamBase);

      ctx.font = k.font(tSize, k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(String(target), PAD - 6, tBase);
      const x = PAD + ctx.measureText(String(target)).width + 24;
      ctx.font = k.font(56, k.D); ctx.fillStyle = g.accent; ctx.fillText("TARGET", x, tBase - 74);
      ctx.font = k.font(26, k.C, 700); k.spaced(3); ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(cap(`${target} off ${balls} balls`), x, tBase - 36, g.W - PAD - x);
      ctx.fillStyle = g.accent; ctx.fillText(cap(`Required rate ${overs ? (target / (balls / 6)).toFixed(2) : "-"}`), x, tBase - 2, g.W - PAD - x); k.spaced(0);

      const cw = (g.W - 2 * PAD - 20) / 2;
      [["Top scorer", g.val("topbat")], ["Top bowler", g.val("topbowl")]].forEach(([lab, v], i) => {
        const cx = PAD + i * (cw + 20);
        ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(cx, cardTop, cw, cardH);
        ctx.fillStyle = g.accent; ctx.fillRect(cx, cardTop, 8, cardH);
        ctx.font = k.font(20, k.C, 700); k.spaced(4); ctx.fillText(cap(lab), cx + 26, cardTop + 34); k.spaced(0);
        ctx.font = k.font(k.fit(String(v), cw - 50, 44, k.D), k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(String(v), cx + 24, cardTop + 80);
      });
      k.footer(g);
    },
  };

  // ---------- Match result ----------
  L.result = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, potTop = g.footerY - 36, rowH = 80, row2Top = potTop - 26 - rowH, row1Top = row2Top - 10 - rowH;
      const hd = cap(g.val("headline"));
      let lay = k.layoutRich(hd, g.W - 2 * PAD, 96, k.D, 2, 50);
      const hBase = row1Top - 30, hTop = hBase - (lay.lines.length - 1) * lay.size * 0.95 - lay.size * 0.76;
      const [f0, f1] = fadeFor(g, hTop - 20);
      photo(k, g, f0, f1);
      halftone(k, g.W * 0.45, hTop, g.W * 0.55, g.footerY - hTop, g.accent, 0.1);
      k.header(g);
      k.drawRich(lay, PAD - 4, hBase - (lay.lines.length - 1) * lay.size * 0.95, lay.size * 0.95, k.D, "#FFFFFF", g.accent, "left");

      [[g.val("t1"), g.val("s1"), true], [g.val("t2"), g.val("s2"), false]].forEach(([tm, sc, won], i) => {
        const y = i ? row2Top : row1Top, sl = 26, ink = won ? k.inkOn(g.accent) : "rgba(255,255,255,0.72)";
        ctx.fillStyle = won ? g.accent : "rgba(255,255,255,0.08)";
        ctx.beginPath(); ctx.moveTo(PAD + sl, y); ctx.lineTo(g.W - PAD, y); ctx.lineTo(g.W - PAD - sl, y + rowH); ctx.lineTo(PAD, y + rowH); ctx.closePath(); ctx.fill();
        ctx.font = k.font(k.fit(cap(tm), g.W * 0.45, 50, k.D), k.D); ctx.fillStyle = ink; ctx.fillText(cap(tm), PAD + 34, y + 59);
        if (won) { const tw = ctx.measureText(cap(tm)).width; ctx.font = k.font(20, k.C, 700); k.spaced(4); ctx.globalAlpha = 0.7; ctx.fillText("WON", PAD + 50 + tw, y + 57); ctx.globalAlpha = 1; k.spaced(0); }
        ctx.textAlign = "right"; ctx.font = k.font(k.fit(String(sc), g.W * 0.36, 50, k.D), k.D); ctx.fillStyle = ink; ctx.fillText(String(sc), g.W - PAD - 40, y + 59); ctx.textAlign = "left";
      });

      if (g.val("potm")) {
        ctx.font = k.font(22, k.C, 700); k.spaced(4); const lab = "★ " + (g.t.subLabel || "PLAYER OF THE MATCH");
        ctx.fillStyle = g.accent; ctx.fillText(lab, PAD, potTop + 34); const lw = ctx.measureText(lab).width; k.spaced(0);
        ctx.font = k.font(36, k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(cap(g.val("potm")), PAD + lw + 18, potTop + 36, g.W - 2 * PAD - lw - 24 - 260); // leaves room for the logo on the right
      }
      k.footer(g);
    },
  };

  // ---------- Recent form (bar chart) ----------
  L.form = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx;
      const items = String(g.val("scores")).split(",").map((x) => x.trim()).filter(Boolean).slice(0, 15)
        .map((x) => { const m = x.split(/\s+/); return { s: m[0], o: cap(m[1] || ""), r: num(m[0]), no: m[0].includes("*") }; }).reverse();
      const base = g.footerY - 84, chartH = g.H > 1500 ? 380 : 250, n = Math.max(items.length, 1);
      const max = Math.max(100, ...items.map((i) => i.r)), cw = (g.W - 2 * PAD) / n, bw = Math.min(70, cw * 0.62);
      const statBase = base - chartH - 50, nameBase = statBase - 64;
      const nameTop = playerName(k, g, g.val("player"), nameBase, 72, false), ribH = 56, ribTop = nameTop - 22 - ribH;
      const [f0, f1] = fadeFor(g, ribTop);
      photo(k, g, f0, f1);
      ctx.fillStyle = k.hexA(g.bg, 0.6); ctx.fillRect(0, statBase + 20, g.W, base - statBase + 60);
      k.header(g);

      ribbon(k, g, g.val("title"), ribTop, ribH);
      playerName(k, g, g.val("player"), nameBase, 72);
      const outs = items.filter((i) => !i.no).length, total = items.reduce((a, i) => a + i.r, 0);
      const hs = items.reduce((a, i) => (i.r > a.r || (i.r === a.r && i.no) ? i : a), { r: -1, s: "-" });
      let x = PAD;
      [["Average", outs ? (total / outs).toFixed(1) : "-"], ["50s", items.filter((i) => i.r >= 50).length], ["Best", hs.s]].forEach(([lab, v]) => {
        ctx.font = k.font(46, k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(String(v), x, statBase);
        const vw = ctx.measureText(String(v)).width;
        ctx.font = k.font(20, k.C, 700); k.spaced(3); ctx.fillStyle = g.accent; ctx.fillText(cap(lab), x + vw + 10, statBase); x += vw + ctx.measureText(cap(lab)).width + 60; k.spaced(0);
      });
      ctx.font = k.font(24, k.C, 700); k.spaced(3); ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.textAlign = "right";
      ctx.fillText("OLDEST  →  NEWEST", g.W - PAD, statBase); ctx.textAlign = "left"; k.spaced(0);

      const y50 = base - (chartH - 50) * (50 / max);
      ctx.save(); ctx.setLineDash([12, 10]); ctx.strokeStyle = k.hexA(g.accent, 0.7); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(PAD, y50); ctx.lineTo(g.W - PAD, y50); ctx.stroke(); ctx.restore();
      items.forEach((it, i) => {
        const cx = PAD + cw * i + cw / 2, h = Math.max(6, (chartH - 50) * (it.r / max)), good = it.r >= 50;
        ctx.fillStyle = good ? g.accent : "rgba(255,255,255,0.75)"; k.roundRect(cx - bw / 2, base - h, bw, h, Math.min(10, bw / 2)); ctx.fill();
        ctx.textAlign = "center";
        ctx.font = k.font(k.fit(it.s, cw - 6, 36, k.D, "", 18), k.D); ctx.fillStyle = good ? g.accent : "#FFFFFF"; ctx.fillText(it.s, cx, base - h - 12);
        ctx.font = k.font(k.fit(it.o, cw - 6, 20, k.C, 700, 12), k.C, 700); ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fillText(it.o, cx, base + 28);
        ctx.textAlign = "left";
      });
      k.footer(g);
    },
  };

  // ---------- Toss ----------
  L.toss = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, detail = g.val("detail"), txt = cap(g.val("stamp"));
      const lay = k.layoutRich(txt, g.W - 2 * PAD, 96, k.D, 3, 50), lh = lay.size * 0.95;
      const hBase = (detail ? g.footerY - 92 : g.footerY - 50) - (lay.lines.length - 1) * lh;
      const hTop = hBase - lay.size * 0.76, labBase = hTop - 22;
      const [f0, f1] = fadeFor(g, labBase - 40);
      photo(k, g, f0, f1);
      k.header(g);

      const r = 100, cx = g.W - PAD - r, cy = labBase - 40 - r;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.25); ctx.scale(1, 0.9);
      ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(0, 18, r, 0, Math.PI * 2); ctx.fillStyle = "#8A6416"; ctx.fill(); ctx.shadowBlur = 0;
      const gr = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 10, 0, 0, r);
      gr.addColorStop(0, "#FFF0B8"); gr.addColorStop(0.6, "#E8B947"); gr.addColorStop(1, "#B9862A");
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, r - 12, 0, Math.PI * 2); ctx.lineWidth = 4; ctx.strokeStyle = "rgba(110,72,8,0.55)"; ctx.stroke();
      ctx.fillStyle = "rgba(110,72,8,0.55)";
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; ctx.beginPath(); ctx.arc(Math.cos(a) * (r - 26), Math.sin(a) * (r - 26), 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.textAlign = "center"; ctx.font = k.font(56, k.D); ctx.fillStyle = "#6B4A0E"; ctx.fillText("TOSS", 0, 20);
      ctx.restore();

      if (g.val("player")) { ctx.font = k.font(28, k.C, 700); k.spaced(6); ctx.fillStyle = g.accent; ctx.fillText(cap(g.val("player")), PAD, labBase, g.W - 2 * PAD); k.spaced(0); }
      k.drawRich(lay, PAD - 4, hBase, lh, k.D, "#FFFFFF", g.accent, "left");
      if (detail) { ctx.font = k.font(30, k.C, 600); ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillText(cap(detail), PAD, g.footerY - 50, g.W - 2 * PAD); }
      k.footer(g);
    },
  };
  // ---------- Bold & minimal (team colours + paint sweep) ----------
  // Draws pieces of text side by side, each with its own colour and size, on one baseline.
  // parts: [[text, colour, sizeFactor]]; align "left" | "center". Returns the total width.
  function runs(k, parts, x, base, size, align) {
    const ctx = k.ctx, widths = parts.map(([t, , f]) => { ctx.font = k.font(Math.round(size * (f || 1)), k.H, 900); return ctx.measureText(t).width; });
    const total = widths.reduce((a, b) => a + b, 0); let cx = align === "center" ? x - total / 2 : x;
    parts.forEach(([t, col, f], i) => { ctx.font = k.font(Math.round(size * (f || 1)), k.H, 900); ctx.fillStyle = col; ctx.fillText(t, cx, base); cx += widths[i]; });
    return total;
  }
  const fitRuns = (k, parts, maxW, size, min) => {
    const ctx = k.ctx; let s = size;
    const w = () => parts.reduce((a, [t, , f]) => { ctx.font = k.font(Math.round(s * (f || 1)), k.H, 900); return a + ctx.measureText(t).width; }, 0);
    while (s > min && w() > maxW) s -= 4;
    return s;
  };
  // "Match 10 | WI CH v BAN CH | WCL 2026" with the bars in the accent colour.
  function infoLine(k, g, text, x, base, align) {
    const ctx = k.ctx, bits = String(text || "").split("|").map((b) => b.trim()).filter(Boolean);
    if (!bits.length) return;
    const parts = []; bits.forEach((b, i) => { if (i) parts.push(["  |  ", g.accent]); parts.push([cap(b), "rgba(255,255,255,0.92)"]); });
    ctx.font = k.font(30, k.C, 700); k.spaced(2);
    const total = parts.reduce((a, [t]) => a + ctx.measureText(t).width, 0), sc = Math.min(1, (g.W - 2 * PAD - (align === "center" ? 0 : 250)) / total);
    ctx.font = k.font(Math.round(30 * sc), k.C, 700);
    let cx = align === "center" ? x - (total * sc) / 2 : x;
    parts.forEach(([t, col]) => { ctx.fillStyle = col; ctx.fillText(t, cx, base); cx += ctx.measureText(t).width; });
    k.spaced(0);
  }

  // Big knock, bold: name small, "43 OFF 21" huge in the team's colour, one info line.
  L.bigknock = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, r = String(g.val("runs") || "").trim(), b = String(g.val("balls") || "").trim();
      const runsN = num(r), ballsN = num(b), fours = num(g.val("fours")), sixes = num(g.val("sixes"));
      const hasSplit = fours + sixes > 0, sr = ballsN ? `SR ${((runsN / ballsN) * 100).toFixed(1)}` : "";
      // Bottom up: info line on the logo's row, fours/sixes/strike rate above it, then the big figure and the name.
      const barY = g.footerY - 88, bigBase = (hasSplit ? barY - 60 : g.footerY - 58) - 46;
      const parts = b ? [[r, g.accent], [" OFF ", "#FFFFFF", 0.62], [b, g.accent]] : [[r, g.accent], [" RUNS", "#FFFFFF", 0.62]];
      const size = fitRuns(k, parts, g.W - 2 * PAD, 170, 80), nameBase = bigBase - size * 0.74 - 24;
      if (!k.bleedPhoto(g, nameTopOf(nameBase) - 40)) k.photoHint(g, g.st + (nameBase - g.st) / 2);
      k.paintSweep(g, nameBase - 170, "right");
      k.header(g);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 20;
      ctx.font = k.font(40, k.H, 800); k.spaced(1); ctx.fillStyle = "#FFFFFF"; ctx.fillText(cap(g.val("player")), PAD, nameBase, g.W - 2 * PAD); k.spaced(0);
      runs(k, parts, PAD - 4, bigBase, size, "left");
      ctx.restore();
      infoLine(k, g, g.val("info"), PAD, hasSplit ? g.footerY : g.footerY - 58, "left");
      // Fours, sixes and strike rate in a row: number on top, small label in the team colour under it.
      if (hasSplit) {
        let x = PAD;
        [[fours, "Fours"], [sixes, "Sixes"], [sr.replace("SR ", ""), "Strike rate"]].filter(([v]) => v !== "").forEach(([v, lab]) => {
          ctx.font = k.font(48, k.H, 900); ctx.fillStyle = "#FFFFFF"; ctx.fillText(String(v), x, barY - 2);
          const vw = ctx.measureText(String(v)).width;
          ctx.font = k.font(20, k.C, 700); k.spaced(3); ctx.fillStyle = g.accent; ctx.fillText(cap(lab), x, barY + 26);
          const lw = ctx.measureText(cap(lab)).width; k.spaced(0);
          x += Math.max(vw, lw) + 56;
        });
      }
      k.brandCorner(g, g.footerY);
    },
  };
  const nameTopOf = (nameBase) => nameBase - 40;

  // Result, bold: "WEST INDIES / BEAT INDIA!" centred, the verb in the team's colour.
  L.bigresult = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, cx = g.W / 2, w = cap(g.val("winner")), l = cap(g.val("loser")), verb = cap(g.val("verb") || "beat");
      const infoBase = g.footerY - 58, line2 = infoBase - 52;
      const p1 = [[w, "#FFFFFF"]], p2 = [[verb + " ", g.accent], [l + (g.val("bang") === "no" ? "" : "!"), "#FFFFFF"]];
      const size = Math.min(fitRuns(k, p1, g.W - 2 * PAD, 112, 56), fitRuns(k, p2, g.W - 2 * PAD, 112, 56)), line1 = line2 - size * 1.0;
      const top = line1 - size * 0.76;
      if (!k.bleedPhoto(g, top - 40)) k.photoHint(g, g.st + (top - g.st) / 2);
      k.paintSweep(g, top - 130, "left");
      k.header(g);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 20;
      runs(k, p1, cx, line1, size, "center"); runs(k, p2, cx, line2, size, "center");
      ctx.restore();
      infoLine(k, g, [g.val("margin"), g.val("info")].filter(Boolean).join(" | "), cx, infoBase, "center");
      k.brandCorner(g, g.footerY);
    },
  };
})();
