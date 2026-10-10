// Card designs. Each layout is one entry in BPG.LAYOUTS.
//
//   standard: true  → the app draws the background, photo (top part), fade, top row and bottom row for you,
//                     and your draw(k, g) only adds the middle text.
//   standard: false → draw(k, g) draws everything after the background (full control).
//   giant(g)        → optional: big number drawn behind a cutout player (standard layouts only).
//
// `k` is the toolkit from engine.js, `g` is everything about the current card:
//   g.W, g.H                size of the poster
//   g.st, g.sb              top and bottom of the safe zone
//   g.blockTop, g.bigBase, g.nameBase, g.subBase, g.statsTop, g.footerY   standard text rows (y positions)
//   g.accent, g.bg          colours
//   g.val("id")             what the user typed in a field
//   g.big                   the big headline word
//   g.t                     the card definition from templates.js
//   g.photo, g.photos[2]    uploaded photos ({ img, cut }) or null
// Cricket designs live in cricket.js.
window.BPG = window.BPG || {};
const num = (v) => parseInt(String(v).replace(/[^\d-]/g, ""), 10) || 0;

BPG.LAYOUTS = {

  status: {
    standard: true,
    draw(k, g) {
      const ctx = k.ctx, top = g.blockTop + 20;
      if (g.val("player")) { ctx.font = k.font(60, k.C, 700); k.spaced(3); ctx.fillStyle = "#FFFFFF"; ctx.fillText(String(g.val("player")).toUpperCase(), 56, top + 50, g.W - 112); k.spaced(0); }
      const stTop = top + 80, txt = String(g.val("stamp")).toUpperCase();
      let lay = k.layoutRich(txt, g.W - 112, 200, k.D, 2, 60);
      while (lay.lines.length * lay.size > g.footerY - 120 - stTop && lay.size > 60) lay = k.layoutRich(txt, g.W - 112, lay.size - 6, k.D, 2, 60);
      k.drawRich(lay, 52, stTop + lay.size * 0.88, lay.size, k.D, "#FFFFFF", g.accent, "left");
      if (g.val("detail")) {
        ctx.font = k.font(44, k.C, 600); ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText(String(g.val("detail")).toUpperCase(), 56, Math.min(g.footerY - 62, stTop + lay.lines.length * lay.size + 46), g.W - 112);
      }
      if (g.t.coin) {
        const cx = g.W - 190, cy = g.blockTop - 90, r = 110;
        const gr = ctx.createRadialGradient(cx - 30, cy - 30, 10, cx, cy, r);
        gr.addColorStop(0, "#FFE9A3"); gr.addColorStop(1, "#C9962B");
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, r - 16, 0, Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = "rgba(120,80,10,0.6)"; ctx.stroke();
        ctx.textAlign = "center"; ctx.font = k.font(64, k.D); ctx.fillStyle = "#6B4A0E"; ctx.fillText("TOSS", cx, cy + 24); ctx.textAlign = "left";
      }
    },
  },

  goal: {
    standard: true,
    draw(k, g) {
      const ctx = k.ctx, big = g.big.toUpperCase();
      const s = k.bigText(g, big, g.bigBase, 220);
      ctx.font = k.font(s, k.D); const gw = ctx.measureText(big).width;
      ctx.font = k.font(44, k.D); const mw = ctx.measureText(g.val("minute")).width;
      if (52 + gw + 30 + mw + 30 < g.W - 56) {
        ctx.fillStyle = "#FFFFFF"; k.roundRect(52 + gw + 22, g.bigBase - 64, mw + 28, 60, 10); ctx.fill();
        ctx.fillStyle = "#0B0F18"; ctx.fillText(g.val("minute"), 52 + gw + 36, g.bigBase - 16);
      }
      k.nameText(g, g.val("player"), g.nameBase);
      k.subText(g, `${g.val("team")} vs ${g.val("opp")}`, g.subBase);
      k.stats(g, [["Score", String(g.val("score")).replace(/^[^\d]*?(\d+\s*-\s*\d+).*$/, "$1")], ["Minute", g.val("minute")], ["Assist", String(g.val("assist")).split(" ").slice(-1)[0] || "-"]], g.statsTop);
    },
  },

  fscore: {
    standard: true,
    draw(k, g) {
      // Everything centred: headline, then  2  FT  1, team names under the numbers, scorers at the bottom.
      const ctx = k.ctx, cx = g.W / 2, s1 = num(g.val("s1")), s2 = num(g.val("s2"));
      const scorersY = g.footerY - 44, namesY = scorersY - 46, nb = namesY - 44, ns = 150;
      const gap = 150, xs = [cx - gap, cx + gap];
      if (g.val("headline")) {
        const lay = k.layoutRich(String(g.val("headline")).toUpperCase(), g.W - 112, 64, k.D, 2, 40);
        k.drawRich(lay, cx, nb - ns * 0.76 - 40 - (lay.lines.length - 1) * lay.size, lay.size, k.D, "#FFFFFF", g.accent, "center");
      }
      ctx.textAlign = "center";
      [[g.val("s1"), g.val("t1"), s1 >= s2], [g.val("s2"), g.val("t2"), s2 >= s1]].forEach(([n, tm, won], i) => {
        ctx.font = k.font(k.fit(String(n), 260, ns, k.D), k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(String(n), xs[i], nb);
        ctx.font = k.font(k.fit(String(tm).toUpperCase(), 360, 34, k.C, 700, 20), k.C, 700); k.spaced(6);
        ctx.fillStyle = won ? g.accent : "rgba(255,255,255,0.7)"; ctx.fillText(String(tm).toUpperCase(), xs[i], namesY); k.spaced(0);
      });
      ctx.fillStyle = g.accent; k.roundRect(cx - 36, nb - ns * 0.38 - 22, 72, 44, 22); ctx.fill();
      ctx.font = k.font(26, k.D); ctx.fillStyle = k.inkOn(g.accent); ctx.fillText("FT", cx, nb - ns * 0.38 + 10);
      if (g.val("potm")) { ctx.font = k.font(26, k.B, 500); ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillText(g.val("potm"), cx, scorersY, g.W - 112); }
      ctx.textAlign = "left";
    },
  },


  redcard: {
    standard: true,
    draw(k, g) {
      const ctx = k.ctx, big = g.big.toUpperCase();
      const s = k.bigText(g, big, g.bigBase, 200);
      ctx.font = k.font(s, k.D); const gw = ctx.measureText(big).width;
      if (52 + gw + 120 < g.W - 56) {
        ctx.save(); ctx.translate(52 + gw + 80, g.bigBase - s * 0.42); ctx.rotate(0.18);
        ctx.fillStyle = g.accent; k.roundRect(-38, -s * 0.42, 76, s * 0.84, 8); ctx.fill(); ctx.restore();
      }
      k.nameText(g, g.val("player"), g.nameBase);
      k.subText(g, `${g.val("team")} vs ${g.val("opp")} · ${g.val("reason")}`, g.subBase);
      k.stats(g, [["Minute", g.val("minute")], ["Team", g.val("team")]], g.statsTop);
    },
  },

  rating: {
    standard: true,
    giant: (g) => g.val("rating"),
    draw(k, g) {
      k.bigText(g, g.val("rating") + "/10", g.bigBase, 200);
      k.nameText(g, g.val("player"), g.nameBase);
      k.subText(g, `${g.val("team")} vs ${g.val("opp")} · player rating`, g.subBase);
      const items = String(g.val("stats")).split(",").map((x) => x.split(":").map((y) => y.trim())).filter((x) => x[0]).slice(0, 4).map(([a, b]) => [a, b || ""]);
      k.stats(g, items, g.statsTop);
    },
  },

  breaking: {
    standard: true,
    draw(k, g) {
      const ctx = k.ctx;
      ctx.fillStyle = g.accent; ctx.fillRect(56, g.bigBase - 70, 280, 62);
      ctx.font = k.font(50, k.D); ctx.fillStyle = k.inkOn(g.accent); ctx.fillText(g.big.toUpperCase(), 74, g.bigBase - 18, 250);
      const room = g.footerY - 110 - (g.bigBase + 20), hd = String(g.val("headline")).toUpperCase();
      let r = k.layoutRich(hd, g.W - 112, 76, k.D, 3, 44);
      while (r.lines.length * r.size > room && r.size > 50) r = k.layoutRich(hd, g.W - 112, r.size - 4, k.D, 3, 50);
      k.drawRich(r, 54, g.bigBase + 20 + r.size, r.size, k.D, "#FFFFFF", g.accent, "left");
      ctx.font = k.font(30, k.C, 600); ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.fillText(g.val("detail"), 56, g.bigBase + 20 + r.lines.length * r.size + 44, g.W - 112);
    },
  },

  // ---------- Full-control layouts ----------

  hottake: {
    standard: false,
    // Plaantik-style: clear photo, small tag, the take in normal sentence case, your name under it.
    draw(k, g) {
      const ctx = k.ctx, W = g.W, x = 56;
      const q = k.layoutRich(g.val("quote"), W - 2 * x, 46, k.B, 5, 30, 600), lh = q.size * 1.25;
      const byY = g.footerY, textBase = byY - 58 - (q.lines.length - 1) * lh, tagY = textBase - q.size - 30;
      if (!k.bleedPhoto(g, tagY - 60)) k.photoHint(g, (g.st + tagY) / 2);
      k.header(g);
      ctx.font = k.font(64, k.D); ctx.fillStyle = g.accent; ctx.fillText("“", x - 4, tagY + 26);
      ctx.font = `italic ${k.font(26, k.C, 700)}`; k.spaced(3); ctx.fillText(String(g.big || "Hot take").toUpperCase(), x + 40, tagY); k.spaced(0);
      k.drawRich(q, x, textBase, lh, k.B, "#FFFFFF", g.accent, "left", 600);
      if (g.val("by")) { ctx.font = k.font(28, k.C, 700); k.spaced(2); ctx.fillStyle = g.accent; ctx.fillText("— " + g.val("by"), x, byY); k.spaced(0); }
      k.brandCorner(g, byY);
    },
  },

  quote: {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, W = g.W;
      const q = k.layoutRich(g.val("quote"), W - 160, 36, k.B, 6, 26, 500);
      const panelTop = g.footerY - 60 - q.lines.length * q.size * 1.3 - 190;
      if (!k.bleedPhoto(g, panelTop + 20)) k.photoHint(g, (g.st + panelTop) / 2);
      k.header(g);
      if (g.photos[2]) k.circlePhoto(g.photos[2].img, 56 + 110, panelTop - 80, 110, g.accent);
      const nm = String(g.val("name")).toUpperCase();
      ctx.textAlign = "center";
      ctx.font = k.font(k.fit(nm, W - 112, 76, k.D), k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(nm, W / 2, panelTop + 90);
      const dy = panelTop + 130;
      ctx.font = k.font(70, k.D); ctx.fillStyle = g.accent; ctx.fillText("“ ”", W / 2, dy + 34);
      k.drawRich(q, W / 2, panelTop + 196, q.size * 1.3, k.B, "#FFFFFF", g.accent, "center", 500);
      if (g.val("context")) {
        ctx.font = k.font(24, k.C, 700); k.spaced(4); ctx.fillStyle = k.hexA("#FFFFFF", 0.6);
        ctx.fillText(String(g.val("context")).toUpperCase(), W / 2, panelTop + 196 + q.lines.length * q.size * 1.3 + 10); k.spaced(0);
      }
      ctx.textAlign = "left";
      k.footer(g);
    },
  },

  toplist: {
    standard: false,
    // Compact ranked list at the bottom; the photo stays clear above it.
    draw(k, g) {
      const ctx = k.ctx, W = g.W, x = 56;
      const rows = String(g.val("items")).split("\n").map((r) => r.split("|").map((t) => t.trim())).filter((r) => r[0]).slice(0, 5);
      const rowH = g.H > 1500 ? 88 : 74, listTop = g.footerY - 56 - rows.length * rowH;
      const tl = k.layoutRich(String(g.val("title")).toUpperCase(), W - 2 * x, 64, k.D, 2, 40), tlh = tl.size * 0.98;
      const titleBase = listTop - 26 - (tl.lines.length - 1) * tlh, titleTop = titleBase - tl.size * 0.76;
      if (!k.bleedPhoto(g, titleTop - 30)) k.photoHint(g, (g.st + titleTop) / 2);
      k.header(g);
      k.drawRich(tl, x - 2, titleBase, tlh, k.D, "#FFFFFF", g.accent, "left");
      rows.forEach(([v, n], i) => {
        const y = listTop + i * rowH, mid = y + rowH / 2, first = i === 0;
        if (first) { ctx.fillStyle = g.accent; ctx.beginPath(); ctx.moveTo(x + 18, y + 6); ctx.lineTo(W - x, y + 6); ctx.lineTo(W - x - 18, y + rowH - 6); ctx.lineTo(x, y + rowH - 6); ctx.closePath(); ctx.fill(); }
        const ink = first ? k.inkOn(g.accent) : "#FFFFFF";
        ctx.font = k.font(32, k.D); ctx.fillStyle = first ? ink : g.accent; ctx.fillText(String(i + 1), x + 24, mid + 12);
        const nm = String(n || "").toUpperCase();
        ctx.font = k.font(k.fit(nm, W * 0.5, 38, k.C, 700), k.C, 700); k.spaced(1); ctx.fillStyle = ink; ctx.fillText(nm, x + 70, mid + 13); k.spaced(0);
        ctx.textAlign = "right"; ctx.font = k.font(k.fit(String(v), W * 0.3, first ? 50 : 44, k.D), k.D); ctx.fillStyle = ink; ctx.fillText(String(v), W - x - 34, mid + 17); ctx.textAlign = "left";
      });
      k.footer(g);
    },
  },

  versus: {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, { W, H, st, sb, accent, bg } = g, half = W / 2, ph = sb - 330;
      [1, 2].forEach((n) => {
        const x = n === 1 ? 0 : half, p = n === 1 ? g.photo : g.photos[2];
        ctx.save(); ctx.beginPath(); ctx.rect(x, 0, half, ph); ctx.clip();
        if (p) { k.coverImg(p.img, x, 0, half, ph); ctx.fillStyle = k.hexA(bg, g.shade); ctx.fillRect(x, 0, half, ph); }
        else { ctx.font = k.font(30, k.C, 600); ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillText(`Add photo ${n}`, x + half / 2, ph / 2); ctx.textAlign = "left"; }
        ctx.restore();
      });
      k.fadeBottom(g, ph - 380, ph + 10);
      ctx.fillStyle = accent; ctx.fillRect(half - 4, st + 110, 8, ph - st - 200);
      ctx.beginPath(); ctx.arc(half, ph - 330, 92, 0, Math.PI * 2); ctx.fill();
      ctx.font = k.font(96, k.D); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = k.inkOn(accent); ctx.fillText("VS", half, ph - 324);
      ctx.textBaseline = "alphabetic";
      [[g.val("p1"), half / 2], [g.val("p2"), half + half / 2]].forEach(([nm, cx]) => {
        const t = String(nm).toUpperCase();
        ctx.font = k.font(k.fit(t, half - 80, 110, k.D), k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(t, cx, ph - 110);
      });
      ctx.textAlign = "left";
      k.header(g);
      const q = String(g.val("question")).toUpperCase();
      ctx.font = k.font(k.fit(q, W - 112, 130, k.D), k.D); ctx.fillStyle = accent; ctx.textAlign = "center"; ctx.fillText(q, half, g.footerY - 90); ctx.textAlign = "left";
      k.footer(g);
      void H;
    },
  },

  frame: {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, hl = g.val("headline");
      const lay = hl ? k.layoutRich(String(hl).toUpperCase(), g.W - 112, 130, k.D, 2, 60) : null;
      const pb = lay ? g.footerY - 90 - lay.lines.length * lay.size * 1.02 : g.H;
      if (!k.bleedPhoto(g, pb + 20)) k.photoHint(g, g.H / 2);
      ctx.lineWidth = 10; ctx.strokeStyle = g.accent; ctx.strokeRect(28, 28, g.W - 56, g.H - 56);
      k.header(g);
      if (lay) {
        k.drawRich(lay, 54, g.footerY - 60 - (lay.lines.length - 1) * lay.size * 1.02, lay.size * 1.02, k.D, "#FFFFFF", g.accent, "left");
      }
      k.footer(g);
    },
  },

  // Your own "Match reaction" style: brand bar, score pill, big take, rant meter.
  reaction: {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, { W, H, st, sb, accent, bg } = g, s = BPG.state();
      const cream = "#F2EFE8", muted = "#C4C7CE", panel = "#1B1D23";

      // Text first, from the bottom up; the photo takes everything above it.
      const meterY = H > 1500 ? sb - 20 : H - 52;
      const tag = String(g.val("tag")).toUpperCase();
      const body = g.val("body") ? k.layoutRich(g.val("body"), W - 112, 30, k.B, 3, 24, 500) : null;
      const stats = String(g.val("stats")).split(",").map((x) => x.split(":").map((y) => y.trim())).filter((x) => x[0] && x[1]).slice(0, 4);
      const statH = 96, tagH = tag ? 58 : 0, maxText = (meterY - st) * 0.3;
      let hl, textH;
      for (let size = 84; ; size -= 4) {
        hl = k.layoutRich(String(g.val("headline")).toUpperCase(), W - 112, size, k.D, 3, 50);
        textH = tagH + hl.lines.length * hl.size * 0.98 + (body ? 12 + body.lines.length * body.size * 1.4 : 0) + (stats.length ? 24 + statH : 0);
        if (textH <= maxText || size <= 52) break;
      }
      const textTop = meterY - 56 - textH, ph = 92, pillTop = textTop - 34 - ph, photoBottom = pillTop + ph * 0.7;

      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      if (!k.bleedPhoto(g, textTop - 10)) { ctx.fillStyle = panel; ctx.fillRect(0, 0, W, photoBottom); k.photoHint(g, photoBottom / 2); }

      const ly = Math.max(28, st - 20);

      // Photo credit
      if (g.val("credit")) {
        ctx.font = k.font(22, k.B, 500); const cw = ctx.measureText("Photo: " + g.val("credit")).width + 24;
        ctx.fillStyle = "rgba(10,10,12,0.75)"; ctx.fillRect(W - 32 - cw, ly + 8, cw, 40);
        ctx.fillStyle = "#FFFFFF"; ctx.fillText("Photo: " + g.val("credit"), W - 32 - cw + 12, ly + 35);
      }

      // Score pill, half over the photo
      if (g.val("score")) {
        const py = pillTop, team = String(g.val("team")).toUpperCase(), score = String(g.val("score"));
        ctx.save(); ctx.transform(1, 0, -0.12, 1, 0, 0);
        ctx.font = k.font(66, k.D); const w1 = ctx.measureText(team + " ").width, w2 = ctx.measureText(score).width;
        const bw = w1 + w2 + 60, px = 62 + py * 0.12;
        ctx.fillStyle = "#0E0F12"; ctx.fillRect(px, py, bw, ph);
        ctx.fillStyle = cream; ctx.fillText(team, px + 30, py + 70);
        ctx.fillStyle = accent; ctx.fillText(score, px + 30 + w1, py + 70);
        const l1 = String(g.val("line1")).toUpperCase(), l2 = String(g.val("line2")).toUpperCase();
        if (l1 || l2) {
          ctx.font = k.font(28, k.C, "italic 700"); k.spaced(3);
          const lw = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width) + 50;
          ctx.fillStyle = accent; ctx.fillRect(px + bw, py, lw, ph);
          ctx.fillStyle = "#14151A"; ctx.fillText(l1, px + bw + 25, py + 40); ctx.fillText(l2, px + bw + 25, py + 74); k.spaced(0);
        }
        ctx.restore();
      }

      // Tag as the heading, then headline, body, stats
      let y = textTop;
      if (tag) {
        ctx.font = k.font(30, k.C, "italic 700"); k.spaced(5); ctx.fillStyle = accent;
        ctx.fillRect(56, y + 4, 6, 30); ctx.fillText(tag, 76, y + 30); k.spaced(0); y += tagH;
      }
      y += hl.size * 0.8;
      k.drawRich(hl, 54, y, hl.size * 0.98, k.D, cream, accent, "left");
      y += (hl.lines.length - 1) * hl.size * 0.98;
      if (body) { y += 12 + body.size * 1.25; k.drawRich(body, 56, y, body.size * 1.4, k.B, muted, accent, "left", 500); y += (body.lines.length - 1) * body.size * 1.4; }
      if (stats.length) {
        const top = y + 24, gap = 16, bw = (W - 112 - gap * (stats.length - 1)) / stats.length;
        stats.forEach(([lab, v], i) => {
          const bx = 56 + i * (bw + gap);
          ctx.fillStyle = panel; ctx.fillRect(bx, top, bw, statH);
          ctx.textAlign = "center";
          ctx.font = k.font(k.fit(v, bw - 30, 58, k.D), k.D); ctx.fillStyle = accent; ctx.fillText(v, bx + bw / 2, top + 58);
          ctx.font = k.font(22, k.C, 700); k.spaced(4); ctx.fillStyle = muted; ctx.fillText(lab.toUpperCase(), bx + bw / 2, top + 84, bw - 20); k.spaced(0);
          ctx.textAlign = "left";
        });
      }

      // Rant meter + handle (or your verdict)
      ctx.font = k.font(26, k.C, 700); k.spaced(5); ctx.fillStyle = muted; ctx.fillText("RANT METER", 56, meterY); k.spaced(0);
      const lvl = Math.max(0, Math.min(5, parseInt(g.val("rant")) || 0));
      for (let i = 0; i < 5; i++) {
        const bh = 14 + i * 9, bx = 236 + i * 32;
        ctx.save(); ctx.transform(1, 0, -0.18, 1, 0, 0);
        ctx.fillStyle = i < lvl ? accent : "#3A3D45"; ctx.fillRect(bx + meterY * 0.18, meterY + 4 - bh, 24, bh); ctx.restore();
      }
      ctx.font = k.font(28, k.C, 700); k.spaced(2); ctx.fillStyle = cream; ctx.textAlign = "right";
      if (s.verdict) ctx.fillText(s.verdict, W - 56 - 270, meterY, W - 760); ctx.textAlign = "left"; k.spaced(0);
      k.brandCorner(g, meterY);
    },
  },
};
