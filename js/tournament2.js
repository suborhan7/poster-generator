// More cards in the tournament look (see tournament.js): fixtures, team stats, the XI on the pitch.
window.BPG = window.BPG || {};

(function () {
  const L = BPG.LAYOUTS, PAD = 56;
  const T = () => BPG.tour;
  const cap = (s) => String(s == null ? "" : s).toUpperCase();
  const num = (s) => parseFloat(String(s).replace(/[^\d.\-]/g, "")) || 0;
  const full = (n) => (BPG.teamName && BPG.teamName(n)) || String(n || "").trim();
  const colourOf = (n, fb) => { const tc = BPG.TEAM_COLORS[full(n)]; return tc ? tc.accent : fb; };

  // Logo or name on top, then a cream heading. Returns the y under it.
  function top(k, g, heading) {
    const ctx = k.ctx, { W } = g, tall = g.H / W > 1.5, { tourTop, C } = T();
    let y = tourTop(k, g, W / 2, g.st + (tall ? 30 : 10), W * 0.46, tall ? 200 : 150, "center");
    const h = cap(heading);
    if (h) {
      const s = k.fit(h, W - 2 * PAD, tall ? 100 : 88, k.D, "", 40); y += s + (tall ? 30 : 20);
      ctx.save(); ctx.textAlign = "center"; ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 16;
      ctx.font = k.font(s, k.D); ctx.fillStyle = C.cream; ctx.fillText(h, W / 2, y); ctx.restore();
    }
    return y;
  }
  function glass(k, x, y, w, h, r) {
    const ctx = k.ctx; ctx.save();
    const pg = ctx.createLinearGradient(0, y, 0, y + h);
    pg.addColorStop(0, "rgba(255,255,255,0.18)"); pg.addColorStop(1, "rgba(255,255,255,0.07)");
    ctx.fillStyle = pg; k.roundRect(x, y, w, h, r); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.45)"; k.roundRect(x, y, w, h, r); ctx.stroke(); ctx.restore();
  }
  function bottom(k, g) {
    T().infoLine(k, g, g.val("info"), PAD, g.footerY);
    k.brandCorner(Object.assign({}, g, { accent: T().C.gold }), g.footerY);
  }

  // ---------- Fixtures ----------
  // One match per line: "Sat 8 Nov | 7:00 PM | Bangladesh vs India" (the parts in any order).
  L.fixtures = {
    standard: false, tourLook: true, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, { W } = g, { tourBg, teamBadge, C } = T(), tall = g.H / W > 1.5;
      tourBg(k, g);
      const y0 = top(k, g, g.val("title") || "Fixtures");
      const rows = String(g.val("matches") || "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 7).map((l) => {
        const parts = l.split("|").map((x) => x.trim()).filter(Boolean);
        const m = parts.find((p) => /\s(vs?\.?|v)\s/i.test(p)) || "", rest = parts.filter((p) => p !== m);
        const [a, b] = m.split(/\s(?:vs?\.?|v)\s/i).map((x) => x.trim());
        return { a: a || "", b: b || "", when: rest };
      });
      const area = g.footerY - 70 - (y0 + 40), gap = 16, rh = Math.min(tall ? 230 : 190, (area - gap * (rows.length - 1)) / Math.max(1, rows.length));
      rows.forEach((r, i) => {
        const y = y0 + 40 + i * (rh + gap), cy = y + rh / 2, x = 60, w = W - 120;
        glass(k, x, y, w, rh, 28);
        // when, on the left
        const dw = 230;
        ctx.save(); ctx.textAlign = "center";
        r.when.slice(0, 2).forEach((t, j) => {
          ctx.font = k.font(j ? Math.round(rh * 0.2) : Math.round(rh * 0.24), j ? k.C : k.D, j ? 700 : ""); ctx.fillStyle = j ? "#FFFFFF" : C.gold;
          ctx.fillText(cap(t), x + dw / 2, cy + (r.when.length > 1 ? (j ? rh * 0.26 : -rh * 0.04) : rh * 0.08), dw - 30);
        });
        ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fillRect(x + dw, y + 18, 2, rh - 36);
        // teams: flag NAME  vs  NAME flag
        const fs = Math.round(rh * 0.5), mx = x + dw + (w - dw) / 2;
        teamBadge(k, g, x + dw + 30 + fs * 0.55, cy, fs, r.a, null);
        teamBadge(k, g, x + w - 30 - fs * 0.55, cy, fs, r.b, null);
        const nw = (w - dw) / 2 - fs * 1.1 - 95; // keeps clear of the VS in the middle
        ctx.font = k.font(Math.round(rh * 0.2), k.D); ctx.fillStyle = C.cream; ctx.fillText("VS", mx, cy + rh * 0.07);
        ctx.font = k.font(k.fit(cap(r.a), nw, Math.round(rh * 0.26), k.D, "", 18), k.D); ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "left";
        ctx.fillText(cap(r.a), x + dw + 40 + fs * 1.1, cy + rh * 0.09, nw);
        ctx.font = k.font(k.fit(cap(r.b), nw, Math.round(rh * 0.26), k.D, "", 18), k.D); ctx.textAlign = "right";
        ctx.fillText(cap(r.b), x + w - 40 - fs * 1.1, cy + rh * 0.09, nw);
        ctx.restore();
      });
      bottom(k, g);
    },
  };

  // ---------- Team stats ----------
  // "Possession | 58 | 42", one per line. Bars in each team's colour; the bigger share in front.
  L.tstats = {
    standard: false, tourLook: true, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, { W } = g, { tourBg, teamBadge, C } = T(), tall = g.H / W > 1.5;
      tourBg(k, g, true);
      let y = top(k, g, g.val("title") || "Match stats");
      // teams and score
      const fy = y + (tall ? 130 : 110), fs = tall ? 170 : 150, xs = [W * 0.2, W * 0.8];
      teamBadge(k, g, xs[0], fy, fs, g.val("t1"), null); teamBadge(k, g, xs[1], fy, fs, g.val("t2"), null);
      ctx.save(); ctx.textAlign = "center"; ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 14;
      const sc = [g.val("s1"), g.val("s2")].every((v) => String(v).trim() !== "") ? `${g.val("s1")} - ${g.val("s2")}` : "VS";
      ctx.font = k.font(tall ? 120 : 104, k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(sc, W / 2, fy + 38);
      ctx.font = k.font(k.fit(cap(full(g.val("t1"))), W * 0.34, 44, k.D, "", 22), k.D); ctx.fillText(cap(full(g.val("t1"))), xs[0], fy + fs * 0.34 + 62);
      ctx.font = k.font(k.fit(cap(full(g.val("t2"))), W * 0.34, 44, k.D, "", 22), k.D); ctx.fillText(cap(full(g.val("t2"))), xs[1], fy + fs * 0.34 + 62);
      ctx.restore();
      // rows
      const rows = String(g.val("stats") || "").split("\n").map((l) => l.split(/[|:]/).map((x) => x.trim())).filter((r) => r.length >= 3 && r[0]).slice(0, 8);
      const c1 = colourOf(g.val("t1"), C.gold);
      // The away bar takes the team's other colour when both teams share one (e.g. two yellows), else cyan.
      const near = (a, b) => { const p = (h) => [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16)); const x = p(a), y = p(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 120; };
      let c2 = colourOf(g.val("t2"), C.cyan);
      if (near(c1, c2)) { const tc = BPG.TEAM_COLORS[full(g.val("t2"))]; c2 = tc && !near(c1, tc.stroke) ? tc.stroke : C.cyan; }
      const pTop = fy + fs * 0.34 + 100, pBot = g.footerY - 64, rh = Math.min(tall ? 150 : 128, (pBot - pTop - 30) / Math.max(1, rows.length));
      glass(k, 60, pTop, W - 120, rows.length * rh + 30, 32);
      rows.forEach(([label, a, b], i) => {
        const cy = pTop + 15 + i * rh, va = num(a), vb = num(b), tot = va + vb || 1;
        ctx.save(); ctx.textAlign = "center"; ctx.font = k.font(Math.round(rh * 0.24), k.C, 700); k.spaced(3); ctx.fillStyle = C.cream;
        ctx.fillText(cap(label), W / 2, cy + rh * 0.42, W * 0.5); k.spaced(0);
        ctx.font = k.font(Math.round(rh * 0.36), k.D); ctx.fillStyle = va >= vb ? "#FFFFFF" : "rgba(255,255,255,0.7)"; ctx.textAlign = "left"; ctx.fillText(a, 100, cy + rh * 0.46);
        ctx.fillStyle = vb >= va ? "#FFFFFF" : "rgba(255,255,255,0.7)"; ctx.textAlign = "right"; ctx.fillText(b, W - 100, cy + rh * 0.46);
        // split bar
        const bx = 100, bw = W - 200, by = cy + rh * 0.62, bh = Math.max(10, rh * 0.12), split = bx + bw * (va / tot);
        ctx.fillStyle = "rgba(255,255,255,0.12)"; k.roundRect(bx, by, bw, bh, bh / 2); ctx.fill();
        ctx.fillStyle = c1; k.roundRect(bx, by, Math.max(bh, split - bx - 3), bh, bh / 2); ctx.fill();
        ctx.fillStyle = c2; k.roundRect(split + 3, by, Math.max(bh, bx + bw - split - 3), bh, bh / 2); ctx.fill();
        ctx.restore();
      });
      bottom(k, g);
    },
  };

  // The XI on the pitch lives in xipitch.js (modern perspective pitch).
  BPG.tour2 = { top, glass, bottom };
})();
