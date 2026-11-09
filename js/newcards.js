// Cards Sports Timeline doesn't have, in the Borhan style (full clear photo, fade only behind the text,
// small tag, compact text, small logo) or the tournament look for team-vs-team cards.
// Chase tracker, Partnership, Countdown, On this day, Player profile, Debut cap, Head to head,
// Ke jitbe? poll, and the 5-slide Match story carousel.
window.BPG = window.BPG || {};

(function () {
  const L = BPG.LAYOUTS, PAD = 56;
  const cap = (s) => String(s == null ? "" : s).toUpperCase();
  const num = (s) => parseFloat(String(s).replace(/[^\d.\-]/g, "")) || 0;
  const full = (n) => (BPG.teamName && BPG.teamName(n)) || String(n || "").trim();
  const short = (n) => { const f = full(n); return (BPG.teamShort && BPG.TEAM_COLORS[f] ? BPG.teamShort(f) : cap(f).slice(0, 3)) || ""; };
  const teamCol = (n, fb) => { const tc = BPG.TEAM_COLORS[full(n)]; return tc ? tc.accent : fb; };
  const pairs = (s, max) => String(s || "").split(/,|\n/).map((x) => x.split(":").map((y) => y.trim())).filter((x) => x[0]).slice(0, max).map(([a, b]) => [a, b || ""]);

  // ---------- Building blocks for photo cards ----------
  // A card is a list of blocks drawn top to bottom, ending just above the info line.
  // The photo fills the card and fades into dark only behind the blocks.
  function photoCard(k, g, blocks, o) {
    o = o || {};
    const ctx = k.ctx, infoY = g.footerY, list = blocks.filter(Boolean);
    const total = list.reduce((s, b) => s + b.h, 0);
    let y = infoY - (o.bottomGap || 52) - total;
    const photoTop = y - 30;
    const gp = o.photo !== undefined ? Object.assign({}, g, { photo: o.photo }) : g;
    // o.drawPhoto replaces the one photo with something else, e.g. a collage (collage.js).
    if (!(o.drawPhoto ? o.drawPhoto(photoTop) : k.bleedPhoto(gp, photoTop, o.grey))) k.photoHint(g, g.st + (photoTop - g.st) / 2);
    g.subj = gp.subj;
    if (o.after) o.after(photoTop);
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 16;
    list.forEach((b) => { ctx.save(); b.draw(y); ctx.restore(); y += b.h; });
    ctx.restore();
    if (o.foot) o.foot(infoY); else info(k, g, g.val("info"), infoY);
    k.brandCorner(g, infoY);
  }
  function info(k, g, text, y) {
    const ctx = k.ctx; if (!text) return;
    ctx.save(); ctx.font = k.font(26, k.C, 700); k.spaced(3); ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(cap(text), PAD, y, g.W * 0.58); k.spaced(0); ctx.restore();
  }
  const B = {
    gap: (h) => ({ h, draw() {} }),
    // Small spaced tag in the accent colour.
    tag: (k, g, text, colour) => text ? { h: 48, draw(y) {
      const ctx = k.ctx; ctx.font = k.font(28, k.C, 700); k.spaced(5); ctx.fillStyle = colour || g.accent;
      ctx.fillText(cap(text), PAD, y + 28, g.W - 2 * PAD); k.spaced(0);
    } } : null,
    // Anton headline, *stars* in the accent colour.
    head: (k, g, text, size, lines, min) => {
      if (!String(text || "").trim()) return null;
      const lay = k.layoutRich(cap(text), g.W - 2 * PAD, size, k.D, lines || 2, min || 40);
      return { h: lay.lines.length * lay.size + 8, draw(y) { k.drawRich(lay, PAD, y + lay.size * 0.88, lay.size, k.D, "#FFFFFF", g.accent, "left"); } };
    },
    // Body text in normal sentence case.
    text: (k, g, text, size, lines, weight, colour) => {
      if (!String(text || "").trim()) return null;
      const lay = k.layoutRich(String(text), g.W - 2 * PAD, size, k.B, lines || 3, 24, weight || 600), lh = lay.size * 1.28;
      return { h: lay.lines.length * lh + 6, draw(y) { k.drawRich(lay, PAD, y + lay.size, lh, k.B, colour || "rgba(255,255,255,0.9)", g.accent, "left", weight || 600); } };
    },
    stats: (k, g, items, colour) => items.length ? { h: 100, draw(y) { k.stats(colour ? Object.assign({}, g, { accent: colour }) : g, items, y + 4, 88); } } : null,
    // A huge number in the accent colour with a word next to it, e.g. "10 DAYS TO GO".
    bigNum: (k, g, big, unit, maxSize, colour) => {
      big = cap(big); if (!big) return null;
      const ctx = k.ctx; ctx.font = k.font(48, k.D); const uw = unit ? ctx.measureText(cap(unit)).width + 24 : 0;
      const s = k.fit(big, Math.max(200, g.W - 2 * PAD - Math.min(uw, g.W * 0.45)), maxSize || 280, k.D, "", 110);
      return { h: s * 0.92, draw(y) {
        const base = y + s * 0.88; ctx.font = k.font(s, k.D); ctx.fillStyle = colour || g.accent; ctx.fillText(big, PAD - 6, base);
        if (unit) {
          const bw = ctx.measureText(big).width, us = unit.split("\n");
          ctx.fillStyle = "#FFFFFF"; ctx.font = k.font(k.fit(cap(us[0]), g.W - PAD * 2 - bw - 24, 52, k.D, "", 26), k.D);
          ctx.fillText(cap(us[0]), PAD + bw + 18, base - (us[1] ? 46 : 4), g.W - PAD * 2 - bw - 24);
          if (us[1]) { ctx.font = k.font(26, k.C, 700); k.spaced(3); ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillText(cap(us[1]), PAD + bw + 20, base - 6, g.W - PAD * 2 - bw - 24); k.spaced(0); }
        }
      } };
    },
  };
  BPG.blocks = { photoCard, B, info };

  // A bar split in two colours with the names and numbers at the ends.
  function splitBar(k, g, y, a, b, la, lb, ca, cb) {
    const ctx = k.ctx, { W } = g, tot = a + b || 1, bx = PAD, bw = W - 2 * PAD, bh = 16, split = bx + bw * (a / tot);
    ctx.font = k.font(30, k.C, 700); k.spaced(2);
    ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "left"; ctx.fillText(la, bx, y + 26, bw / 2 - 10);
    ctx.textAlign = "right"; ctx.fillText(lb, bx + bw, y + 26, bw / 2 - 10); ctx.textAlign = "left"; k.spaced(0);
    const by = y + 42;
    ctx.fillStyle = ca; k.roundRect(bx, by, Math.max(bh, split - bx - 3), bh, bh / 2); ctx.fill();
    ctx.fillStyle = cb; k.roundRect(split + 3, by, Math.max(bh, bx + bw - split - 3), bh, bh / 2); ctx.fill();
  }
  // Second colour that still stands apart from the first.
  function apart(c1, c2, fb) {
    const p = (h) => [0, 2, 4].map((i) => parseInt(String(h).slice(1 + i, 3 + i), 16) || 0);
    const x = p(c1), y = p(c2);
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 120 ? fb : c2;
  }

  // ---------- Chase tracker ----------
  // "Need 42 off 30": required rate is worked out, the win chance bar is optional.
  L.chase = {
    standard: false,
    draw(k, g) {
      const need = num(g.val("need")), balls = num(g.val("balls")), wk = String(g.val("wkts")).trim();
      const rrr = balls ? ((need / balls) * 6).toFixed(2) : "";
      const items = [["Req. rate", rrr], wk ? ["Wkts left", wk] : null, g.val("target") ? ["Target", g.val("target")] : null, g.val("score") ? ["Score", g.val("score")] : null].filter((x) => x && x[1] !== "");
      const win = String(g.val("win")).trim(), w = Math.max(0, Math.min(100, num(win)));
      const line = `NEED *${need}* OFF *${balls}*`;
      photoCard(k, g, [
        B.tag(k, g, [g.val("tag") || "Chase on", g.val("t1") && g.val("t2") ? `${short(g.val("t1"))} vs ${short(g.val("t2"))}` : ""].filter(Boolean).join("  ·  ")),
        B.head(k, g, line, 150, 1, 70),
        B.gap(10),
        B.stats(k, g, items.slice(0, 4)),
        win ? { h: 90, draw(y) {
          const c1 = teamCol(g.val("t1"), g.accent), c2 = apart(c1, teamCol(g.val("t2"), "#9AA3B5"), "#9AA3B5");
          splitBar(k, g, y + 14, w, 100 - w, `${short(g.val("t1")) || "BAT"} ${Math.round(w)}%`, `${Math.round(100 - w)}% ${short(g.val("t2")) || "BOWL"}`, c1, c2);
        } } : null,
      ]);
    },
  };

  // ---------- Partnership ----------
  L.partnership = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, { W } = g, runs = g.val("runs"), balls = g.val("balls");
      const r1 = num(String(g.val("r1")).split("(")[0]), r2 = num(String(g.val("r2")).split("(")[0]);
      photoCard(k, g, [
        B.tag(k, g, [g.val("wkt") ? `${g.val("wkt")} wicket` : "", g.val("tag") || "Partnership"].filter(Boolean).join(" ")),
        B.bigNum(k, g, runs, balls ? `Runs\noff ${balls} balls` : "Runs", 240),
        B.gap(14),
        { h: 150, draw(y) {
          const row = (name, score, yy) => {
            ctx.font = k.font(k.fit(cap(name), W * 0.6, 50, k.D, "", 26), k.D); ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "left"; ctx.fillText(cap(name), PAD, yy);
            ctx.font = k.font(50, k.D); ctx.fillStyle = g.accent; ctx.textAlign = "right"; ctx.fillText(String(score), W - PAD, yy); ctx.textAlign = "left";
          };
          row(g.val("b1"), g.val("r1"), y + 46); row(g.val("b2"), g.val("r2"), y + 106);
          if (r1 + r2) { ctx.shadowBlur = 0; splitBar(k, g, y + 104, r1, r2, "", "", g.accent, "rgba(255,255,255,0.55)"); }
        } },
      ]);
    },
  };

  // ---------- Countdown ----------
  L.countdown = {
    standard: false,
    draw(k, g) {
      photoCard(k, g, [
        B.tag(k, g, g.val("tag") || "Countdown"),
        B.bigNum(k, g, g.val("number"), g.val("unit") || "Days to go", 300),
        B.gap(8),
        B.head(k, g, g.val("event"), 80, 2, 40),
        B.text(k, g, g.val("line"), 34, 2, 600, "rgba(255,255,255,0.85)"),
      ]);
    },
  };

  // ---------- On this day ----------
  // The photo goes black and white; "X years ago" is worked out from the year.
  L.onthisday = {
    standard: false,
    draw(k, g) {
      const yr = parseInt(g.val("year"), 10), ago = yr ? new Date().getFullYear() - yr : 0;
      photoCard(k, g, [
        B.tag(k, g, ["On this day", g.val("date")].filter(Boolean).join("  ·  ")),
        B.bigNum(k, g, g.val("year"), ago > 0 ? `${ago} years\nago today` : "", 220),
        B.gap(10),
        B.head(k, g, g.val("headline"), 70, 2, 38),
        B.text(k, g, g.val("line"), 34, 3, 500, "rgba(255,255,255,0.85)"),
      ], { grey: g.val("colour") && /^(y|yes|colour|color|on)$/i.test(g.val("colour")) ? 0 : 1 });
    },
  };

  // ---------- Player profile ----------
  L.profile = {
    standard: false,
    draw(k, g) {
      const items = pairs(g.val("stats"), 8), half = items.length > 4 ? Math.ceil(items.length / 2) : items.length;
      photoCard(k, g, [
        B.tag(k, g, g.val("role") || "Profile"),
        B.head(k, g, g.val("player"), 110, 2, 50),
        B.text(k, g, g.val("line"), 32, 2, 600, "rgba(255,255,255,0.8)"),
        B.gap(6),
        B.stats(k, g, items.slice(0, half)),
        items.length > half ? B.gap(14) : null,
        B.stats(k, g, items.slice(half)),
      ]);
    },
  };

  // ---------- Debut cap ----------
  // A gold cap medal with the cap number, the name beside it.
  L.debut = {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, { W } = g, gold = "#F5C542", R = 104;
      const nm = cap(g.val("player")), tx = PAD + R * 2 + 36, tw = W - PAD - tx;
      const lay = k.layoutRich(nm, tw, 96, k.D, 2, 44);
      photoCard(k, g, [
        B.tag(k, g, g.val("tag") || "Welcome to the team", gold),
        { h: R * 2 + 16, draw(y) {
          const cx = PAD + R, cy = y + R + 4;
          const gr = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
          gr.addColorStop(0, "#FFE08A"); gr.addColorStop(0.5, gold); gr.addColorStop(1, "#B8860B");
          ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill();
          ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.arc(cx, cy, R - 12, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(60,40,0,0.45)"; ctx.stroke();
          ctx.textAlign = "center"; ctx.fillStyle = "#3A2A00";
          ctx.font = k.font(24, k.C, 700); k.spaced(4); ctx.fillText(cap(g.val("format") || "") + " CAP", cx, cy - R * 0.38, R * 1.5); k.spaced(0);
          const n = "#" + String(g.val("cap") || "").replace(/^#/, "");
          ctx.font = k.font(k.fit(n, R * 1.55, 96, k.D, "", 40), k.D); ctx.fillText(n, cx, cy + R * 0.42);
          ctx.textAlign = "left"; ctx.shadowBlur = 16;
          const top = cy - (lay.lines.length * lay.size) / 2 + lay.size * 0.86;
          k.drawRich(lay, tx, top, lay.size, k.D, "#FFFFFF", gold, "left");
        } },
        B.text(k, g, g.val("line"), 36, 2, 600, "rgba(255,255,255,0.88)"),
      ], {});
    },
  };

  // ---------- Tournament-look cards: Head to head, Ke jitbe? poll ----------
  const T = () => BPG.tour, T2 = () => BPG.tour2;

  L.h2h = {
    standard: false, tourLook: true, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, { W } = g, { tourBg, teamBadge, C } = T(), { top, glass, bottom } = T2(), tall = g.H / W > 1.5;
      tourBg(k, g, true);
      let y = top(k, g, g.val("title") || "Head to head");
      const fs = tall ? 200 : 160, xs = [W * 0.2, W * 0.8];
      // Rows of the panel, worked out first so the whole block can sit in the middle of the space.
      const rows = [["Played", g.val("played")], [g.val("dlabel") || "Draws", g.val("draws")]].filter((r) => String(r[1]).trim() !== "");
      const last = String(g.val("last5") || "").toUpperCase().split(/[\s,\-]+/).filter((x) => /^[WLDNT]$/.test(x)).slice(-6);
      const rh = tall ? 130 : 108, ph = rows.length * rh + (last.length ? rh + 30 : 0) + 30;
      const head = fs * 0.36 + 110 + (tall ? 150 : 120), slack = g.footerY - 70 - y - head - ph;
      const fy = y + (tall ? 150 : 120) + Math.max(0, slack * 0.4);
      teamBadge(k, g, xs[0], fy, fs, g.val("t1"), null); teamBadge(k, g, xs[1], fy, fs, g.val("t2"), null);
      const w1 = g.val("w1"), w2 = g.val("w2");
      ctx.save(); ctx.textAlign = "center"; ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 14;
      ctx.font = k.font(tall ? 150 : 128, k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(`${w1}-${w2}`, W / 2, fy + 46);
      ctx.font = k.font(26, k.C, 700); k.spaced(4); ctx.fillStyle = C.gold; ctx.fillText("WINS", W / 2, fy + 92); k.spaced(0);
      [g.val("t1"), g.val("t2")].forEach((t, i) => { const n = cap(full(t)); ctx.font = k.font(k.fit(n, W * 0.34, 44, k.D, "", 22), k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(n, xs[i], fy + fs * 0.36 + 60); });
      ctx.restore();
      // panel: played / draws / last five
      const pTop = fy + fs * 0.36 + 110, space = g.footerY - 70 - pTop, scale = Math.min(1, space / ph);
      glass(k, 60, pTop, W - 120, ph * scale, 32);
      let cy = pTop + 15;
      const c1 = teamCol(g.val("t1"), C.gold), c2 = apart(c1, teamCol(g.val("t2"), C.cyan), C.cyan), a = num(w1), b = num(w2);
      ctx.save();
      // split bar of the wins
      if (a + b) { const bx = 100, bw = W - 200, bh = 14, sp = bx + bw * (a / (a + b)); ctx.fillStyle = c1; k.roundRect(bx, cy + 6, Math.max(bh, sp - bx - 3), bh, 7); ctx.fill(); ctx.fillStyle = c2; k.roundRect(sp + 3, cy + 6, Math.max(bh, bx + bw - sp - 3), bh, 7); ctx.fill(); cy += 30; }
      rows.forEach(([l, v]) => {
        ctx.textAlign = "left"; ctx.font = k.font(Math.round(rh * 0.3 * scale), k.C, 700); k.spaced(3); ctx.fillStyle = C.cream; ctx.fillText(cap(l), 100, cy + rh * 0.6 * scale); k.spaced(0);
        ctx.textAlign = "right"; ctx.font = k.font(Math.round(rh * 0.5 * scale), k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(String(v), W - 100, cy + rh * 0.66 * scale);
        cy += rh * scale;
      });
      if (last.length) {
        ctx.textAlign = "left"; ctx.font = k.font(Math.round(rh * 0.26 * scale), k.C, 700); k.spaced(3); ctx.fillStyle = C.cream;
        ctx.fillText(`LAST ${last.length} (${short(g.val("t1"))})`, 100, cy + rh * 0.62 * scale); k.spaced(0);
        const r = Math.round(rh * 0.27 * scale);
        last.forEach((x, i) => {
          const cx = W - 100 - r - (last.length - 1 - i) * (r * 2 + 14), yy = cy + rh * 0.52 * scale;
          ctx.beginPath(); ctx.arc(cx, yy, r, 0, Math.PI * 2); ctx.fillStyle = x === "W" ? "#22C55E" : x === "L" ? "#EF4444" : "#9AA3B5"; ctx.fill();
          ctx.textAlign = "center"; ctx.font = k.font(Math.round(r * 1.1), k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(x, cx, yy + r * 0.4);
        });
      }
      ctx.restore();
      bottom(k, g);
    },
  };

  // "Ke jitbe?": two teams, comment 1 or 2. Works on Instagram and Facebook alike (no reactions needed).
  L.poll = {
    standard: false, tourLook: true, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, { W } = g, { tourBg, teamBadge, C } = T(), { top, glass, bottom } = T2(), tall = g.H / W > 1.5;
      tourBg(k, g);
      const y = top(k, g, g.val("question") || "Ke jitbe?");
      const ml = cap(g.val("match"));
      if (ml) { ctx.save(); ctx.textAlign = "center"; ctx.font = k.font(30, k.C, 700); k.spaced(4); ctx.fillStyle = "#FFFFFF"; ctx.fillText(ml, W / 2, y + 50, W - 2 * PAD); k.spaced(0); ctx.restore(); }
      const pTop = y + (ml ? 90 : 50), pBot = g.footerY - (tall ? 190 : 150), ph = pBot - pTop, gw = (W - 120 - 30) / 2;
      [[g.val("t1"), "1", 60], [g.val("t2"), "2", 60 + gw + 30]].forEach(([t, n, x]) => {
        glass(k, x, pTop, gw, ph, 32);
        const fs = Math.min(gw * 0.62, ph * 0.42), cx = x + gw / 2;
        teamBadge(k, g, cx, pTop + ph * 0.34, fs, t, null);
        ctx.save(); ctx.textAlign = "center"; ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 12;
        const nm = cap(full(t)); ctx.font = k.font(k.fit(nm, gw - 40, 54, k.D, "", 24), k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(nm, cx, pTop + ph * 0.66);
        const r = Math.min(56, ph * 0.1), by = pTop + ph * 0.84;
        ctx.beginPath(); ctx.arc(cx, by, r, 0, Math.PI * 2); ctx.fillStyle = C.gold; ctx.fill();
        ctx.shadowBlur = 0; ctx.font = k.font(Math.round(r * 1.2), k.D); ctx.fillStyle = "#1A1A1A"; ctx.fillText(n, cx, by + r * 0.42);
        ctx.restore();
      });
      ctx.save(); ctx.textAlign = "center"; ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 12;
      const cta = cap(g.val("cta") || "Comment 1 or 2");
      ctx.font = k.font(k.fit(cta, W - 2 * PAD, tall ? 68 : 58, k.D, "", 30), k.D); ctx.fillStyle = C.cream; ctx.fillText(cta, W / 2, pBot + (tall ? 100 : 80));
      ctx.restore();
      bottom(k, g);
    },
  };

  // ---------- Match story (5-slide carousel) ----------
  // One set of fields, five slides: cover, turning point, star, numbers, Borhan's verdict.
  // Photo 1 goes on slides 1, 3 and 5; photo 2 (if added) on 2 and 4.
  const SLIDES = ["Cover", "Turning point", "Star", "Numbers", "Verdict"];
  BPG.STORY_SLIDES = SLIDES;
  L.story = {
    standard: false, ownSweep: true, // no brush strokes: the slides carry more text
    draw(k, g) {
      const ctx = k.ctx, { W } = g, n = Math.min(5, Math.max(1, parseInt(g.val("slide"), 10) || 1));
      const p1 = g.photos[1], p2 = g.photos[2] || g.photos[1];
      // Dots on top: which slide this is.
      const pager = () => {
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 10;
        // With the logo at the top right, the dots move to the left with the match line under them.
        const r = 9, gap = 30, x0 = g.logoTop && k.logoSide(g) === "right" ? PAD + 10 : W - PAD - (SLIDES.length - 1) * gap, y = g.st + (g.logoTop ? (g.H / W > 1.5 ? 30 : 50) : 44);
        SLIDES.forEach((_, i) => { ctx.beginPath(); ctx.arc(x0 + i * gap, y, i + 1 === n ? r + 2 : r - 2, 0, Math.PI * 2); ctx.fillStyle = i + 1 === n ? g.accent : "rgba(255,255,255,0.6)"; ctx.fill(); });
        ctx.font = k.font(26, k.C, 700); k.spaced(3); ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "left";
        if (g.val("tag")) { if (g.logoTop && k.logoSide(g) === "right") ctx.fillText(cap(g.val("tag")), PAD, y + 52, W * 0.5); else if (g.logoTop) { ctx.textAlign = "right"; ctx.fillText(cap(g.val("tag")), W - PAD, y + 52, W * 0.5); } else ctx.fillText(cap(g.val("tag")), PAD, y + 9, x0 - PAD - 40); }
        k.spaced(0); ctx.restore();
      };
      // "Swipe" on slides 1-4, the info line on the last one.
      const foot = (y) => {
        if (n < 5) { ctx.save(); ctx.font = k.font(28, k.C, 700); k.spaced(4); ctx.fillStyle = g.accent; ctx.fillText(cap(g.val("swipe") || "Swipe") + "  →", PAD, y); k.spaced(0); ctx.restore(); }
        else info(k, g, g.val("info"), y);
      };
      const o = (photo) => ({ photo, foot, after: pager });
      if (n === 1) {
        photoCard(k, g, [
          B.tag(k, g, "Match story"),
          B.head(k, g, g.val("headline"), 120, 3, 56),
          B.text(k, g, g.val("result"), 36, 2, 600),
        ], o(p1));
      } else if (n === 2) {
        photoCard(k, g, [
          B.tag(k, g, g.val("turnHead") || "Turning point"),
          B.text(k, g, g.val("turn"), 48, 5, 700, "#FFFFFF"),
        ], o(p2));
      } else if (n === 3) {
        photoCard(k, g, [
          B.tag(k, g, g.val("starTag") || "Star of the match"),
          B.head(k, g, g.val("star"), 110, 2, 50),
          B.gap(6),
          B.stats(k, g, pairs(g.val("starStats"), 4)),
        ], o(p1));
      } else if (n === 4) {
        const rows = String(g.val("numbers") || "").split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((r) => r[0]).slice(0, 4);
        photoCard(k, g, [
          B.tag(k, g, g.val("numTag") || "In numbers"),
          ...rows.map(([v, l]) => ({ h: 118, draw(y) {
            ctx.font = k.font(96, k.D); ctx.fillStyle = g.accent; ctx.fillText(cap(v), PAD, y + 92, W * 0.42);
            const vw = Math.min(ctx.measureText(cap(v)).width, W * 0.42);
            const lay = k.layoutRich(String(l || ""), W - 2 * PAD - vw - 30, 34, k.B, 2, 22, 600);
            k.drawRich(lay, PAD + vw + 28, y + 92 - (lay.lines.length - 1) * lay.size * 1.2 - 4, lay.size * 1.2, k.B, "#FFFFFF", g.accent, "left", 600);
          } })),
        ], o(p2));
      } else {
        photoCard(k, g, [
          B.tag(k, g, g.val("verdictTag") || "Borhan's verdict"),
          B.text(k, g, g.val("verdict"), 52, 4, 700, "#FFFFFF"),
          B.gap(8),
          B.text(k, g, g.val("question"), 34, 2, 700, g.accent),
        ], o(p1));
      }
    },
  };
})();
