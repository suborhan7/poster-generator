// Test cricket cards, made for white kits: the red-ball look (user's pick, 2026-10-19). Deep cherry red
// like a new Test ball, a big stitched seam curving behind the player, cream lettering, so the whites
// stand out. Same bottom-up layout as the other cards, so the photo takes whatever space is left
// in both Instagram and TikTok sizes.
window.BPG = window.BPG || {};

(function () {
  const L = BPG.LAYOUTS, PAD = 56;
  const BG = "#4A0A10", GOLD = "#FFB27A", CREAM = "#FFF4E6", RED = "#B8242C";
  const cap = (s) => String(s == null ? "" : s).trim().toUpperCase();
  const num = (s) => parseInt(String(s).replace(/[^\d-]/g, ""), 10) || 0;
  const team = (name) => (BPG.teamName && BPG.teamName(name)) || String(name || "");
  const short = (name) => (BPG.teamShort ? BPG.teamShort(team(name)) : cap(name).slice(0, 3));

  // The ball's seam: two curves with stitches across them, sweeping across the card.
  function seamOn(ctx, g, alpha) {
    const cx = g.W * 1.05, cy = g.H * 0.95, r = g.W * 0.95;
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = "round"; ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,236,214,0.55)"; ctx.lineWidth = 5;
    [-1, 1].forEach((side) => { ctx.beginPath(); ctx.arc(cx, cy, r + side * 26, Math.PI * 0.95, Math.PI * 1.75); ctx.stroke(); });
    ctx.strokeStyle = "rgba(255,236,214,0.8)"; ctx.lineWidth = 4;
    for (let a = Math.PI * 0.97; a < Math.PI * 1.74; a += 0.035) {
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (r - 20), cy + Math.sin(a) * (r - 20));
      ctx.lineTo(cx + Math.cos(a + 0.02) * (r + 20), cy + Math.sin(a + 0.02) * (r + 20)); ctx.stroke();
    }
    ctx.restore();
  }

  // Draws the seam fading out smoothly before the text, so it never runs through the words.
  function seam(k, g, alpha, textTop) {
    const c = document.createElement("canvas"); c.width = g.W; c.height = g.H;
    const x = c.getContext("2d"); seamOn(x, g, alpha);
    const fade = x.createLinearGradient(0, textTop - 260, 0, textTop - 40);
    fade.addColorStop(0, "rgba(0,0,0,1)"); fade.addColorStop(1, "rgba(0,0,0,0)");
    x.globalCompositeOperation = "destination-in"; x.fillStyle = fade; x.fillRect(0, 0, g.W, g.H);
    k.ctx.drawImage(c, 0, 0);
  }

  // The red: a cherry glow, the seam, then the photo, re-tinted red where it fades so the bottom isn't flat.
  // The seam goes over the photo again, faintly.
  function board(k, g, textTop) {
    const ctx = k.ctx;
    g.bg = BG; g.accent = GOLD; g.sweep = false;
    const gr = ctx.createRadialGradient(g.W * 0.62, g.H * 0.3, 0, g.W * 0.62, g.H * 0.3, g.H * 0.8);
    gr.addColorStop(0, "#A3172A"); gr.addColorStop(0.55, "#6E0F1A"); gr.addColorStop(1, BG);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, g.W, g.H);
    seam(k, g, 0.9, textTop);
    const has = k.bleedPhoto(g, textTop);
    if (g.photo) {
      const tint = ctx.createLinearGradient(0, textTop - 260, 0, g.H);
      tint.addColorStop(0, "rgba(110,15,26,0)"); tint.addColorStop(1, "rgba(110,15,26,0.55)");
      ctx.fillStyle = tint; ctx.fillRect(0, textTop - 260, g.W, g.H);
      seam(k, g, 0.4, textTop);
    }
    return has;
  }

  // A small red ball with its seam. (x, y) is the centre.
  function ball(k, x, y, r) {
    const ctx = k.ctx;
    ctx.save(); ctx.shadowBlur = 0;
    const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    gr.addColorStop(0, "#E0505A"); gr.addColorStop(1, RED);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = CREAM; ctx.lineWidth = Math.max(2, r * 0.14); ctx.stroke(); // ring so it shows on the red
    ctx.strokeStyle = "rgba(255,240,220,0.75)"; ctx.lineWidth = Math.max(1, r * 0.12);
    [-0.28, 0.28].forEach((o) => { ctx.beginPath(); ctx.ellipse(x + o * r, y, r * 0.22, r * 0.92, 0, -Math.PI / 2, Math.PI / 2, o < 0); ctx.stroke(); });
    ctx.restore();
  }

  // Team badge: the short name in the team's own colours. Returns its width.
  function badge(k, x, base, name, size = 24) {
    const ctx = k.ctx, tc = BPG.TEAM_COLORS[team(name)], t = short(name);
    if (!t) return 0;
    ctx.save(); ctx.shadowBlur = 0;
    ctx.font = k.font(size, k.C, 700); k.spaced(2);
    const w = ctx.measureText(t).width + 22, h = size + 12;
    ctx.fillStyle = tc ? tc.bg : "#22302A"; k.roundRect(x, base - h + 6, w, h, 6); ctx.fill();
    ctx.strokeStyle = tc ? tc.accent : GOLD; ctx.lineWidth = 2; k.roundRect(x, base - h + 6, w, h, 6); ctx.stroke();
    ctx.fillStyle = tc ? tc.accent : GOLD; ctx.fillText(t, x + 11, base - 1);
    k.spaced(0); ctx.restore();
    return w;
  }

  // Small heading above the name: the moment (HUNDRED), then "BAN v SA".
  function tagLine(k, g, base, label, a, b) {
    const ctx = k.ctx;
    ctx.font = k.font(30, k.C, 700); k.spaced(6); ctx.fillStyle = CREAM;
    const t = cap(label); ctx.fillText(t, PAD, base);
    const vs = a && b ? `·  ${short(a)} v ${short(b)}` : "";
    if (vs) { ctx.fillStyle = "rgba(255,244,230,0.6)"; ctx.fillText(vs, PAD + ctx.measureText(t).width + 22, base); }
    k.spaced(0);
  }

  // The name in bold condensed capitals, shrunk to fit one line. Returns the size used.
  function name(k, g, text, base, max = 92) {
    const ctx = k.ctx, t = cap(text) || "PLAYER NAME";
    const size = k.fit(t, g.W - 2 * PAD, max, k.C, 700, 44);
    ctx.font = k.font(size, k.C, 700); ctx.fillStyle = CREAM; ctx.fillText(t, PAD - 2, base);
    return size;
  }

  // A row of small figures: the number in cream, its label in peach.
  function stats(k, base, items) {
    const ctx = k.ctx; let x = PAD;
    items.filter(([, v]) => v !== "" && v != null).forEach(([lab, v]) => {
      ctx.font = k.font(40, k.C, 700); ctx.fillStyle = CREAM; ctx.fillText(String(v), x, base);
      x += ctx.measureText(String(v)).width + 10;
      const l = cap(String(v).trim() === "1" ? lab.replace(/es$|s$/, "") : lab); // 1 SIX, not 1 SIXES
      ctx.font = k.font(22, k.C, 700); k.spaced(3); ctx.fillStyle = GOLD; ctx.fillText(l, x, base - 3);
      x += ctx.measureText(l).width + 38; k.spaced(0);
    });
  }

  // Bottom row: the match line (1st Test · Day 2 · Mirpur) on the left, logo on the right.
  function foot(k, g, info) {
    const ctx = k.ctx, t = cap(String(info || "").replace(/\s*\|\s*/g, " · "));
    if (t) { ctx.font = k.font(22, k.C, 600); k.spaced(4); ctx.fillStyle = "rgba(255,244,230,0.6)"; ctx.fillText(t, PAD, g.footerY, g.W * 0.6); k.spaced(0); }
    k.brandCorner(g, g.footerY);
  }

  const shadow = (k) => { k.ctx.shadowColor = "rgba(0,0,0,0.55)"; k.ctx.shadowBlur = 16; };

  // ---------- Test hundred / fifty ----------
  L.testmile = {
    standard: false, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, raw = String(g.val("runs")), runs = num(raw), balls = num(g.val("balls"));
      const statY = g.footerY - 64, scoreBase = statY - 60, figSize = 210;
      const nameBase = scoreBase - figSize * 0.78 - 30, tagBase = nameBase - 92;
      board(k, g, tagBase - 40);
      ctx.save(); shadow(k);
      tagLine(k, g, tagBase, g.big, g.val("team"), g.val("opp"));
      name(k, g, g.val("player"), nameBase, 84);
      const r = String(runs) + (raw.includes("*") ? "*" : "");
      ctx.font = k.font(figSize, k.D); ctx.fillStyle = CREAM; ctx.fillText(r, PAD - 6, scoreBase);
      const rw = ctx.measureText(r).width;
      if (balls) { ctx.font = k.font(48, k.C, 600); ctx.fillStyle = "rgba(255,244,230,0.75)"; ctx.fillText(`(${balls})`, PAD + rw + 14, scoreBase); }
      stats(k, statY, [["fours", g.val("fours")], ["sixes", g.val("sixes")], ["strike rate", balls ? ((runs / balls) * 100).toFixed(1) : ""]]);
      ctx.restore();
      foot(k, g, g.val("info"));
    },
  };

  // ---------- Test bowling: five-for, ten in the match ----------
  L.testbowl = {
    standard: false, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, w = num(g.val("wkts")), r = num(g.val("runs")), balls = k.oversToBalls(g.val("overs"));
      const statY = g.footerY - 64, figBase = statY - 60, figSize = 210;
      const nameBase = figBase - figSize * 0.78 - 30, tagBase = nameBase - 92;
      board(k, g, tagBase - 40);
      ctx.save(); shadow(k);
      tagLine(k, g, tagBase, g.big, g.val("team"), g.val("opp"));
      name(k, g, g.val("player"), nameBase, 84);
      ctx.font = k.font(figSize, k.D); ctx.fillStyle = CREAM; ctx.fillText(String(w), PAD - 6, figBase);
      const x = PAD - 6 + ctx.measureText(String(w)).width;
      ctx.fillStyle = "rgba(255,244,230,0.6)"; ctx.fillText("/" + r, x, figBase);
      // One red ball per wicket, beside the figures.
      const fw = x + ctx.measureText("/" + r).width + 34, n = Math.min(w, 10), rr = n > 5 ? 15 : 19;
      for (let i = 0; i < n; i++) {
        const row = n > 5 ? Math.floor(i / 5) : 0, col = n > 5 ? i % 5 : i, bx = fw + rr + col * (rr * 2 + 10);
        if (bx + rr < g.W - PAD) ball(k, bx, figBase - figSize * 0.36 + (n > 5 ? (row - 0.5) * (rr * 2 + 10) : 0), rr);
      }
      stats(k, statY, [["overs", g.val("overs")], ["maidens", g.val("maidens")], ["economy", balls ? ((r / balls) * 6).toFixed(2) : ""]]);
      ctx.restore();
      foot(k, g, g.val("info"));
    },
  };

  // ---------- Stumps / lunch / tea: where the match stands ----------
  L.stumps = {
    standard: false, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, line = String(g.val("line") || "").trim();
      const lineBase = g.footerY - 66, row2 = (line ? lineBase - 74 : g.footerY - 70), row1 = row2 - 92, tagBase = row1 - 92;
      const hasPhoto = board(k, g, tagBase - 50);
      if (!hasPhoto) {
        // No photo: the day, large and faint, like lettering on the board.
        const day = (/day\s*\d/i.exec(g.val("status")) || [""])[0].toUpperCase() || "STUMPS";
        ctx.font = k.font(k.fit(day, g.W * 0.9, 300, k.D), k.D); ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,244,230,0.08)"; ctx.fillText(day, g.W / 2, tagBase - 160); ctx.textAlign = "left";
      }
      ctx.save(); shadow(k);
      tagLine(k, g, tagBase, g.val("status") || "STUMPS", "", "");
      [[g.val("t1"), g.val("s1"), row1], [g.val("t2"), g.val("s2"), row2]].forEach(([t, s, y]) => {
        if (!t && !s) return;
        const bw = badge(k, PAD, y - 8, t, 24);
        const sc = String(s || "").trim();
        ctx.font = k.font(76, k.D); const sw = ctx.measureText(sc).width;
        ctx.fillStyle = CREAM; ctx.textAlign = "right"; ctx.fillText(sc, g.W - PAD, y); ctx.textAlign = "left";
        const nm = cap(team(t)), room = g.W - 2 * PAD - bw - 24 - sw - 30;
        ctx.font = k.font(k.fit(nm, room, 54, k.C, 700, 30), k.C, 700); ctx.fillStyle = CREAM;
        ctx.fillText(nm, PAD + bw + 20, y - 4);
      });
      if (line) { ctx.font = k.font(k.fit(line, g.W - 2 * PAD, 40, k.C, 600, 26), k.C, 600); ctx.fillStyle = "rgba(255,244,230,0.85)"; ctx.fillText(line, PAD, lineBase); }
      ctx.restore();
      foot(k, g, g.val("info"));
    },
  };

  // ---------- Test result ----------
  L.testresult = {
    standard: false, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, potm = String(g.val("potm") || "").trim(), series = String(g.val("series") || "").trim();
      let y = g.footerY - 66;
      const potmBase = potm ? y : null; if (potm) y -= 58;
      const seriesBase = series ? y : null; if (series) y -= 66;
      const wn = cap(team(g.val("winner"))) || "WINNER";
      const ws = k.fit(wn, g.W - 2 * PAD - 120, 130, k.D, "", 56);
      const marginBase = y - 6, beatBase = marginBase - 74, winBase = beatBase - 58, tagBase = winBase - ws * 0.88 - 34;
      board(k, g, tagBase - 50);
      ctx.save(); shadow(k);
      tagLine(k, g, tagBase, g.big || "TEST RESULT", "", "");
      ctx.font = k.font(ws, k.D); ctx.fillStyle = CREAM; ctx.fillText(wn, PAD - 4, winBase);
      badge(k, PAD + ctx.measureText(wn).width + 22, winBase - ws * 0.3, g.val("winner"), 24);
      ctx.font = k.font(44, k.C, 600); ctx.fillStyle = "rgba(255,244,230,0.8)"; k.spaced(2);
      ctx.fillText(`BEAT ${cap(team(g.val("loser")))}`, PAD, beatBase); k.spaced(0);
      const m = cap(g.val("margin"));
      ctx.font = k.font(k.fit(m, g.W - 2 * PAD, 60, k.C, 700, 30), k.C, 700); ctx.fillStyle = GOLD; ctx.fillText(m, PAD - 2, marginBase);
      if (series) { ctx.font = k.font(k.fit(series, g.W - 2 * PAD, 36, k.C, 600, 24), k.C, 600); ctx.fillStyle = CREAM; ctx.fillText(series, PAD, seriesBase); }
      if (potm) {
        ctx.font = k.font(22, k.C, 700); k.spaced(4); ctx.fillStyle = GOLD; const lab = "PLAYER OF THE MATCH";
        ctx.fillText(lab, PAD, potmBase); const lw = ctx.measureText(lab).width; k.spaced(0);
        ctx.font = k.font(34, k.C, 700); ctx.fillStyle = CREAM; ctx.fillText(potm, PAD + lw + 16, potmBase + 2);
      }
      ctx.restore();
      foot(k, g, g.val("info"));
    },
  };
})();
