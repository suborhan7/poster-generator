// Photo cards in the Borhan style: full clear photo, fading into dark only behind the text,
// small tag above the headline, small logo in the corner.
// Transfer, Instant news, Record, MVP / player of the month, Player vs player (stats).
window.BPG = window.BPG || {};

(function () {
  const L = BPG.LAYOUTS, PAD = 56;
  const cap = (s) => String(s == null ? "" : s).toUpperCase();
  const num = (s) => parseFloat(String(s).replace(/[^\d.\-]/g, "")) || 0;

  // Small spaced tag in the accent colour, e.g. "TRANSFER" or "BREAKING".
  function tag(k, g, text, x, y, align) {
    const ctx = k.ctx; if (!text) return;
    ctx.save(); ctx.textAlign = align || "left"; ctx.font = k.font(28, k.C, 700); k.spaced(5); ctx.fillStyle = g.accent;
    ctx.fillText(cap(text), x, y, g.W - 2 * PAD); k.spaced(0); ctx.restore();
  }
  function info(k, g, text, y) {
    const ctx = k.ctx; if (!text) return;
    ctx.save(); ctx.font = k.font(26, k.C, 700); k.spaced(3); ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(cap(text), PAD, y, g.W * 0.58); k.spaced(0); ctx.restore();
  }
  // A club as a round disc: the uploaded crest on white, or the short name in the team's colours.
  function clubDisc(k, g, cx, cy, r, team, pic) {
    const ctx = k.ctx, full = (BPG.teamName && BPG.teamName(team)) || team, tc = BPG.TEAM_COLORS[full];
    const flag = !pic && BPG.flagImg && BPG.flagImg(full);
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 24;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = pic ? "#FFFFFF" : (tc ? tc.bg : "#14171F"); ctx.fill(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    if (pic) { const im = pic.plain || pic.img, sc = Math.min((r * 1.45) / im.width, (r * 1.45) / im.height); ctx.drawImage(im, cx - (im.width * sc) / 2, cy - (im.height * sc) / 2, im.width * sc, im.height * sc); }
    else if (flag) { const sc = Math.max((2 * r) / flag.width, (2 * r) / flag.height); ctx.drawImage(flag, cx - (flag.width * sc) / 2, cy - (flag.height * sc) / 2, flag.width * sc, flag.height * sc); }
    else {
      const sh = BPG.teamShort ? BPG.teamShort(full) : cap(full).slice(0, 3);
      ctx.textAlign = "center"; ctx.font = k.font(k.fit(sh, r * 1.5, Math.round(r * 0.75), k.D), k.D); ctx.fillStyle = tc ? tc.accent : g.accent; ctx.fillText(sh, cx, cy + r * 0.27);
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = tc ? tc.accent : "rgba(255,255,255,0.8)"; ctx.stroke();
  }
  // Headline in Anton, *stars* in the accent colour, up to `lines` lines, drawn upwards from `base`. Returns its top.
  function headline(k, g, text, base, size, lines, align) {
    const x = align === "center" ? g.W / 2 : PAD;
    let lay = k.layoutRich(cap(text), g.W - 2 * PAD, size, k.D, lines || 2, 40);
    const top = base - (lay.lines.length - 1) * lay.size * 1.0;
    k.drawRich(lay, x, top, lay.size * 1.0, k.D, "#FFFFFF", g.accent, align || "left");
    return top - lay.size * 0.82;
  }

  // ---------- Transfer ----------
  L.transfer = {
    standard: false, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, { W } = g, r = 62;
      const infoY = g.footerY, rowY = infoY - 64 - r, nameBase = rowY - r - 40;
      const nameSize = k.fit(cap(g.val("player")), W - 2 * PAD, 110, k.D, "", 50), tagY = nameBase - nameSize * 0.9 - 18;
      if (!k.bleedPhoto(g, tagY - 50)) k.photoHint(g, g.st + (tagY - g.st) / 2);
      if (g.teamTheme) k.paintSweep(g, tagY - 40, "right");
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 16;
      tag(k, g, g.val("tag") || "Transfer", PAD, tagY);
      ctx.font = k.font(nameSize, k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(cap(g.val("player")), PAD, nameBase);
      // old club → new club, then the fee
      const x1 = PAD + r, x2 = PAD + r * 3 + 90;
      clubDisc(k, g, x1, rowY, r, g.val("from"), null);
      clubDisc(k, g, x2, rowY, r, g.val("to"), g.photos[2] && g.photos[2].tpl === "transfer" ? g.photos[2] : null); // only a crest added on this card
      ctx.strokeStyle = g.accent; ctx.lineWidth = 8; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x1 + r + 18, rowY); ctx.lineTo(x2 - r - 22, rowY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2 - r - 40, rowY - 16); ctx.lineTo(x2 - r - 20, rowY); ctx.lineTo(x2 - r - 40, rowY + 16); ctx.stroke();
      const fee = cap(g.val("fee"));
      if (fee) {
        const fx = x2 + r + 40;
        ctx.font = k.font(k.fit(fee, W - PAD - fx, 92, k.D, "", 36), k.D); ctx.fillStyle = g.accent; ctx.fillText(fee, fx, rowY + 20);
        if (g.val("feeLabel")) { ctx.font = k.font(24, k.C, 700); k.spaced(4); ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillText(cap(g.val("feeLabel")), fx, rowY + 54, W - PAD - fx); k.spaced(0); }
      }
      ctx.restore();
      const st = cap(g.val("stamp"));
      if (st) k.stamp(st, W - 200, tagY - 50, 54, g.accent, -0.12);
      info(k, g, g.val("info"), infoY);
      k.brandCorner(g, infoY);
    },
  };

  // ---------- Instant news ----------
  L.news = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, { W } = g;
      const body = k.layoutRich(String(g.val("body") || ""), W - 2 * PAD, 34, k.B, 4, 24, 500), lh = body.size * 1.32;
      const infoY = g.footerY, bodyTop = infoY - 54 - (body.lines.length ? body.lines.length * lh : 0);
      const hl = k.layoutRich(cap(g.val("headline")), W - 2 * PAD, 84, k.D, 3, 44);
      const hlBase = bodyTop - 14 - (body.lines.length ? 6 : 0), hlTop = hlBase - (hl.lines.length - 1) * hl.size, tagY = hlTop - hl.size * 0.86 - 20;
      if (!k.bleedPhoto(g, tagY - 50)) k.photoHint(g, g.st + (tagY - g.st) / 2);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 16;
      tag(k, g, g.val("tag") || "News", PAD, tagY);
      k.drawRich(hl, PAD, hlTop, hl.size, k.D, "#FFFFFF", g.accent, "left");
      if (body.lines.length) k.drawRich(body, PAD, bodyTop + body.size, lh, k.B, "rgba(255,255,255,0.88)", g.accent, "left", 500);
      ctx.restore();
      info(k, g, g.val("info"), infoY);
      k.brandCorner(g, infoY);
    },
  };

  // ---------- Record / achievement ----------
  // The big number sits behind the bottom of the photo, the record line under the name.
  L.record = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, { W } = g;
      const line = k.layoutRich(String(g.val("line") || ""), W - 2 * PAD, 40, k.B, 3, 26, 600), lh = line.size * 1.25;
      const infoY = g.footerY, lineTop = infoY - 54 - line.lines.length * lh;
      const nm = cap(g.val("player")), ns = k.fit(nm, W - 2 * PAD, 76, k.D, "", 36), nameBase = lineTop - 16;
      const big = cap(g.val("number")), bs = k.fit(big, W - 2 * PAD + 20, 300, k.D, "", 120), bigBase = nameBase - ns - 6;
      const tagY = bigBase - bs * 0.86 - 22;
      if (!k.bleedPhoto(g, bigBase - bs * 0.45)) k.photoHint(g, g.st + (tagY - g.st) / 2);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 22;
      tag(k, g, g.val("tag") || "Record", PAD, tagY);
      ctx.font = k.font(bs, k.D); ctx.fillStyle = g.accent; ctx.fillText(big, PAD - 6, bigBase);
      if (g.val("unit")) { const bw = ctx.measureText(big).width; ctx.font = k.font(44, k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(cap(g.val("unit")), PAD + bw + 14, bigBase, W - PAD - bw - 70); }
      ctx.font = k.font(ns, k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(nm, PAD, nameBase);
      if (line.lines.length) k.drawRich(line, PAD, lineTop + line.size, lh, k.B, "rgba(255,255,255,0.9)", g.accent, "left", 600);
      ctx.restore();
      info(k, g, g.val("info"), infoY);
      k.brandCorner(g, infoY);
    },
  };

  // ---------- MVP / player of the month ----------
  L.mvp = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, { W } = g, gold = "#F5C542";
      const items = String(g.val("stats") || "").split(",").map((x) => x.split(":").map((y) => y.trim())).filter((x) => x[0]).slice(0, 4).map(([a, b]) => [a, b || ""]);
      const infoY = g.footerY, statsTop = infoY - 52 - (items.length ? 96 : 0);
      const nm = cap(g.val("player")), ns = k.fit(nm, W - 2 * PAD, 112, k.D, "", 50), nameBase = statsTop - 22;
      const tagY = nameBase - ns * 0.9 - 20;
      if (!k.bleedPhoto(g, tagY - 60)) k.photoHint(g, g.st + (tagY - g.st) / 2);
      const gg = Object.assign({}, g, { accent: gold });
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 16;
      tag(k, gg, [g.val("title") || "Player of the month", g.val("period")].filter(Boolean).join("  |  "), PAD, tagY);
      ctx.font = k.font(ns, k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(nm, PAD, nameBase);
      ctx.restore();
      if (items.length) k.stats(gg, items, statsTop, 88);
      const st = cap(g.val("stamp"));
      if (st) k.stamp(st, W - 210, tagY - 70, 46, gold, -0.12);
      info(k, g, g.val("info"), infoY);
      k.brandCorner(gg, infoY);
    },
  };

  // ---------- Player vs player (stats) ----------
  // Two photos side by side, blending into each other in the middle; the stats under them as bars.
  // Add ↓ (or "lower") to a stat's label when the lower number is better (economy, average against).
  L.compare = {
    standard: false, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, { W, H } = g;
      const rows = String(g.val("stats") || "").split("\n").map((l) => l.split(/[|:]/).map((x) => x.trim())).filter((r) => r.length >= 3 && r[0]).slice(0, 6);
      const rowH = H / W > 1.5 ? 74 : 62, infoY = g.footerY, statsTop = infoY - 56 - rows.length * rowH;
      const namesY = statsTop - 26, photoBottom = namesY - 40;
      // photos
      const halves = [[g.photos[1], 0], [g.photos[2], W / 2]];
      halves.forEach(([p, x]) => {
        if (!p) return;
        ctx.save(); ctx.beginPath(); ctx.rect(x, 0, W / 2, photoBottom + 60); ctx.clip();
        k.coverImg(p.img, x, 0, W / 2, photoBottom + 60, false); ctx.restore();
      });
      if (!g.photos[1]) { ctx.font = k.font(30, k.C, 600); ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillText("Player 1 photo", W / 4, H * 0.3); ctx.textAlign = "left"; }
      if (!g.photos[2]) { ctx.font = k.font(30, k.C, 600); ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillText("Player 2 photo (second photo)", W * 0.75, H * 0.3); ctx.textAlign = "left"; }
      // soft seam in the middle and the fade at the bottom
      const seam = ctx.createLinearGradient(W / 2 - 60, 0, W / 2 + 60, 0);
      seam.addColorStop(0, k.hexA(g.bg, 0)); seam.addColorStop(0.5, k.hexA(g.bg, 0.85)); seam.addColorStop(1, k.hexA(g.bg, 0));
      ctx.fillStyle = seam; ctx.fillRect(W / 2 - 60, 0, 120, photoBottom + 60);
      k.fadeBottom(g, photoBottom - 300, photoBottom + 40);
      const top = ctx.createLinearGradient(0, 0, 0, g.st + 160); top.addColorStop(0, k.hexA(g.bg, 0.6)); top.addColorStop(1, k.hexA(g.bg, 0));
      ctx.fillStyle = top; ctx.fillRect(0, 0, W, g.st + 160);
      // title + VS
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 16; ctx.textAlign = "center";
      if (g.val("title")) { ctx.font = k.font(28, k.C, 700); k.spaced(5); ctx.fillStyle = g.accent; ctx.fillText(cap(g.val("title")), W / 2, g.st + 40, W - 2 * PAD); k.spaced(0); }
      ctx.font = k.font(90, k.D); ctx.fillStyle = g.accent; ctx.fillText("VS", W / 2, namesY - 70);
      const n1 = cap(g.val("p1")), n2 = cap(g.val("p2"));
      ctx.font = k.font(k.fit(n1, W / 2 - 80, 60, k.D, "", 28), k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(n1, W / 4, namesY);
      ctx.font = k.font(k.fit(n2, W / 2 - 80, 60, k.D, "", 28), k.D); ctx.fillText(n2, W * 0.75, namesY);
      ctx.restore();
      // stat rows: value | bar ← label → bar | value; the better number in the accent colour
      const midW = 230, barMax = W / 2 - midW / 2 - PAD - 110;
      rows.forEach(([label, a, b], i) => {
        const y = statsTop + i * rowH + rowH * 0.62, low = /↓|lower|\(l\)/i.test(label), lab = cap(label.replace(/↓|\(l\)|lower/gi, "").trim());
        const va = num(a), vb = num(b), max = Math.max(va, vb) || 1, aWin = low ? va < vb : va > vb, bWin = low ? vb < va : vb > va;
        if (i) { ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(PAD, statsTop + i * rowH, W - 2 * PAD, 2); }
        ctx.textAlign = "center"; ctx.font = k.font(k.fit(lab, midW - 10, 24, k.C, 700, 16), k.C, 700); k.spaced(2); ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillText(lab, W / 2, y - 4); k.spaced(0);
        const la = (va / max) * barMax, lb = (vb / max) * barMax, bh = 12, by = y - 14;
        ctx.fillStyle = aWin ? g.accent : "rgba(255,255,255,0.35)"; k.roundRect(W / 2 - midW / 2 - la, by, la, bh, 6); ctx.fill();
        ctx.fillStyle = bWin ? g.accent : "rgba(255,255,255,0.35)"; k.roundRect(W / 2 + midW / 2, by, lb, bh, 6); ctx.fill();
        ctx.font = k.font(46, k.D);
        ctx.textAlign = "left"; ctx.fillStyle = aWin ? g.accent : "#FFFFFF"; ctx.fillText(a, PAD, y + 8);
        ctx.textAlign = "right"; ctx.fillStyle = bWin ? g.accent : "#FFFFFF"; ctx.fillText(b, W - PAD, y + 8);
        ctx.textAlign = "left";
      });
      info(k, g, g.val("info"), infoY);
      k.brandCorner(g, infoY);
    },
  };
})();
