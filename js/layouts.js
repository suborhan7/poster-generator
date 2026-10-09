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
      ctx.font = k.font(64, k.D); const mw = ctx.measureText(g.val("minute")).width;
      if (52 + gw + 40 + mw + 40 < g.W - 56) {
        ctx.fillStyle = "#FFFFFF"; k.roundRect(52 + gw + 30, g.bigBase - 92, mw + 40, 88, 12); ctx.fill();
        ctx.fillStyle = "#0B0F18"; ctx.fillText(g.val("minute"), 52 + gw + 50, g.bigBase - 22);
      }
      k.nameText(g, g.val("player"), g.nameBase);
      k.subText(g, `${g.val("team")} vs ${g.val("opp")}`, g.subBase);
      k.stats(g, [["Score", String(g.val("score")).replace(/^[^\d]*?(\d+\s*-\s*\d+).*$/, "$1")], ["Minute", g.val("minute")], ["Assist", String(g.val("assist")).split(" ").slice(-1)[0] || "-"]], g.statsTop);
    },
  },

  fscore: {
    standard: true,
    draw(k, g) {
      const ctx = k.ctx;
      if (g.val("headline")) {
        const lay = k.layoutRich(String(g.val("headline")).toUpperCase(), g.W - 112, 110, k.D, 2, 50);
        k.drawRich(lay, 52, g.blockTop + 100 - (lay.lines.length - 1) * lay.size, lay.size, k.D, "#FFFFFF", g.accent, "left");
      }
      const nb = g.statsTop + 10, xs = [g.W * 0.27, g.W * 0.73];
      ctx.textAlign = "center";
      [[g.val("s1"), g.val("t1")], [g.val("s2"), g.val("t2")]].forEach(([n, tm], i) => {
        ctx.font = k.font(k.fit(String(n), g.W * 0.4, 330, k.D), k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(String(n), xs[i], nb);
        ctx.font = k.font(k.fit(String(tm).toUpperCase(), g.W * 0.42, 58, k.D), k.D); ctx.fillText(String(tm).toUpperCase(), xs[i], nb + 72);
      });
      ctx.fillStyle = g.accent; k.roundRect(g.W / 2 - 50, nb - 190, 100, 64, 32); ctx.fill();
      ctx.font = k.font(40, k.D); ctx.fillStyle = k.inkOn(g.accent); ctx.fillText("FT", g.W / 2, nb - 141);
      ctx.font = k.font(32, k.C, 600); ctx.fillStyle = "rgba(255,255,255,0.78)"; ctx.fillText(g.val("potm"), g.W / 2, nb + 118, g.W - 112);
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
      ctx.fillStyle = g.accent; ctx.fillRect(56, g.bigBase - 110, 420, 96);
      ctx.font = k.font(78, k.D); ctx.fillStyle = k.inkOn(g.accent); ctx.fillText(g.big.toUpperCase(), 80, g.bigBase - 30, 380);
      const room = g.footerY - 150 - (g.bigBase + 30), hd = String(g.val("headline")).toUpperCase();
      let r = k.layoutRich(hd, g.W - 112, 104, k.D, 3, 50);
      while (r.lines.length * r.size > room && r.size > 50) r = k.layoutRich(hd, g.W - 112, r.size - 4, k.D, 3, 50);
      k.drawRich(r, 54, g.bigBase + 30 + r.size, r.size, k.D, "#FFFFFF", g.accent, "left");
      ctx.font = k.font(44, k.C, 600); ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.fillText(g.val("detail"), 56, g.bigBase + 30 + r.lines.length * r.size + 66, g.W - 112);
    },
  },

  // ---------- Full-control layouts ----------

  hottake: {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx;
      k.photoArea(g, g.H, 0.45);
      k.header(g);
      const top = g.st + 140;
      ctx.font = k.font(300, k.D); ctx.fillStyle = g.accent; ctx.fillText("“", 40, top + 220);
      k.label(g.big, 210, top + 70, g.accent, 42);
      const avail = g.sb - 200 - (top + 260);
      const lay = k.layoutRich(String(g.val("quote")).toUpperCase(), g.W - 112, 120, k.D, Math.max(3, Math.floor(avail / 90)), 48);
      k.drawRich(lay, 54, top + 260 + lay.size * 0.8, lay.size * 1.05, k.D, "#FFFFFF", g.accent, "left");
      ctx.font = k.font(48, k.C, 700); ctx.fillStyle = g.accent;
      ctx.fillText("— " + g.val("by"), 56, top + 260 + lay.lines.length * lay.size * 1.05 + lay.size * 0.8 + 50);
      k.footer(g);
    },
  },

  quote: {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, W = g.W;
      const q = k.layoutRich(g.val("quote"), W - 160, 50, k.B, 7, 32, 500);
      const panelTop = g.footerY - 80 - q.lines.length * q.size * 1.28 - 300;
      if (!k.photoArea(g, g.H)) k.photoHint(g, (g.st + panelTop) / 2);
      else k.scrim(g, panelTop - 200, panelTop + 160);
      k.slash(g, panelTop + 10);
      k.header(g);
      if (g.photos[2]) k.circlePhoto(g.photos[2].img, 56 + 150, panelTop - 120, 150, g.accent);
      const nm = String(g.val("name")).toUpperCase();
      ctx.textAlign = "center";
      ctx.font = k.font(k.fit(nm, W - 112, 120, k.D), k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(nm, W / 2, panelTop + 150);
      const dy = panelTop + 215;
      ctx.fillStyle = k.hexA("#FFFFFF", 0.5); ctx.fillRect(110, dy - 4, W / 2 - 200, 3); ctx.fillRect(W / 2 + 90, dy - 4, W / 2 - 200, 3);
      ctx.font = k.font(110, k.D); ctx.fillStyle = g.accent; ctx.fillText("“ ”", W / 2, dy + 52);
      k.drawRich(q, W / 2, panelTop + 300, q.size * 1.28, k.B, "#FFFFFF", g.accent, "center", 500);
      if (g.val("context")) {
        ctx.font = k.font(32, k.C, 700); k.spaced(4); ctx.fillStyle = k.hexA("#FFFFFF", 0.6);
        ctx.fillText(String(g.val("context")).toUpperCase(), W / 2, panelTop + 300 + q.lines.length * q.size * 1.28 + 20); k.spaced(0);
      }
      ctx.textAlign = "left";
      k.footer(g);
    },
  },

  toplist: {
    standard: false,
    draw(k, g) {
      const ctx = k.ctx, W = g.W;
      k.photoArea(g, g.H, 0.55);
      k.header(g);
      const tl = k.layoutRich(String(g.val("title")).toUpperCase(), W - 112, 110, k.D, 3, 50);
      k.drawRich(tl, 54, g.st + 230, tl.size * 1.02, k.D, "#FFFFFF", g.accent, "left");
      const rows = String(g.val("items")).split("\n").map((r) => r.split("|").map((x) => x.trim())).filter((r) => r[0]).slice(0, 5);
      const top = g.st + 230 + tl.lines.length * tl.size * 1.02 + 30, avail = g.footerY - 70 - top;
      const rh = Math.min(230, avail / Math.max(rows.length, 1));
      rows.forEach(([v, n], i) => {
        const y = top + i * rh;
        ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.fillRect(56, y + 10, W - 112, rh - 20);
        ctx.fillStyle = g.accent; ctx.fillRect(56, y + 10, 12, rh - 20);
        ctx.font = k.font(rh * 0.5, k.D); ctx.fillStyle = k.hexA(g.accent, 0.9); ctx.fillText(String(i + 1), 100, y + rh * 0.68);
        ctx.font = k.font(k.fit(String(v), W * 0.42, rh * 0.5, k.D), k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(String(v), 100 + rh * 0.42, y + rh * 0.68);
        const nm = String(n || "").toUpperCase();
        ctx.font = k.font(k.fit(nm, W * 0.36, 52, k.C, 700), k.C, 700); ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.textAlign = "right"; ctx.fillText(nm, W - 92, y + rh * 0.64); ctx.textAlign = "left";
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
      if (!k.photoArea(g, g.H)) k.photoHint(g, g.H / 2);
      if (hl) k.fadeBottom(g, g.H * 0.55, g.sb - 120);
      ctx.lineWidth = 10; ctx.strokeStyle = g.accent; ctx.strokeRect(28, 28, g.W - 56, g.H - 56);
      k.header(g);
      if (hl) {
        const lay = k.layoutRich(String(hl).toUpperCase(), g.W - 112, 130, k.D, 2, 60);
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

      // The photo fills the card; the text sits over its lower part, so it is laid out first from the bottom up.
      const barTop = H > 1500 ? st - 30 : 0, barH = 128;
      const meterY = H > 1500 ? sb - 30 : H - 70;
      const body = g.val("body") ? k.layoutRich(g.val("body"), W - 112, 34, k.B, 3, 26, 500) : null;
      const stats = String(g.val("stats")).split(",").map((x) => x.split(":").map((y) => y.trim())).filter((x) => x[0] && x[1]).slice(0, 4);
      const statH = 118, maxText = (meterY - barTop) * 0.46;
      let hl, textH;
      for (let size = 104; ; size -= 6) {
        hl = k.layoutRich(String(g.val("headline")).toUpperCase(), W - 112, size, k.D, 3, 54);
        textH = hl.lines.length * hl.size * 0.98 + (body ? 16 + body.lines.length * body.size * 1.4 : 0) + (stats.length ? 30 + statH : 0);
        if (textH <= maxText || size <= 60) break;
      }
      const textTop = meterY - 64 - textH, ph = 104, pillTop = textTop - 30 - ph;
      const photoBottom = textTop;

      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      if (g.photo) {
        k.coverImg(g.photo.img, 0, 0, W, H);
        if (g.shade > 0) { ctx.fillStyle = k.hexA(bg, g.shade); ctx.fillRect(0, 0, W, H); }
        k.scrim(g, pillTop - 260, textTop + 140);
      } else {
        ctx.fillStyle = panel; ctx.fillRect(0, barTop + barH, W, pillTop - barTop - barH);
        k.photoHint(g, (barTop + barH + pillTop) / 2);
      }
      const topShade = ctx.createLinearGradient(0, 0, 0, barTop + barH + 120);
      topShade.addColorStop(0, k.hexA(bg, 0.85)); topShade.addColorStop(1, k.hexA(bg, 0));
      ctx.fillStyle = topShade; ctx.fillRect(0, 0, W, barTop + barH + 120);
      const barBottom = barTop + barH;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 16;

      // Brand bar
      const logo = BPG.logoImage();
      let x = 58; const cy = barTop + barH / 2;
      if (logo) { const sc = 76 / Math.max(logo.width, logo.height); ctx.drawImage(logo, x, cy - (logo.height * sc) / 2, logo.width * sc, logo.height * sc); x += logo.width * sc + 22; }
      else {
        ctx.save(); ctx.translate(x + 38, cy - 4); ctx.rotate(-0.08);
        ctx.fillStyle = accent; k.roundRect(-38, -30, 76, 60, 10); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-18, 26); ctx.lineTo(-30, 46); ctx.lineTo(0, 28); ctx.fill();
        ctx.font = k.font(40, k.D); ctx.fillStyle = "#14151A"; ctx.textAlign = "center"; ctx.fillText("BR", 0, 15);
        ctx.strokeStyle = accent; ctx.lineWidth = 4; ctx.lineCap = "round";
        [[44, -30, 54, -42], [48, -18, 62, -20]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); });
        ctx.restore(); ctx.textAlign = "left"; x += 112;
      }
      const words = String(s.brand.name || "").toUpperCase().split(/\s+/);
      ctx.font = k.font(46, k.D); ctx.fillStyle = cream; ctx.fillText(words[0] || "", x, cy + 17); x += ctx.measureText((words[0] || "") + " ").width;
      ctx.fillStyle = accent; ctx.fillText(words[1] || "", x, cy + 17); x += ctx.measureText((words[1] || "") + " ").width;
      ctx.font = k.font(30, k.C, 600); k.spaced(6); ctx.fillStyle = muted; ctx.fillText(words.slice(2).join(" "), x + 4, cy + 15, W - x - 360); k.spaced(0);

      // Tag (slanted)
      const tag = String(g.val("tag")).toUpperCase();
      if (tag) {
        ctx.font = k.font(36, k.C, "italic 700"); k.spaced(5);
        const tw = ctx.measureText(tag).width + 70, tx = W - 58 - tw, ty = cy - 30;
        ctx.fillStyle = accent; ctx.beginPath(); ctx.moveTo(tx + 10, ty); ctx.lineTo(tx + tw, ty); ctx.lineTo(tx + tw - 10, ty + 60); ctx.lineTo(tx, ty + 60); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#14151A"; ctx.fillText(tag, tx + 34, ty + 43); k.spaced(0);
      }

      // Photo credit
      if (g.val("credit")) {
        ctx.font = k.font(24, k.B, 500); const cw = ctx.measureText("Photo: " + g.val("credit")).width + 28;
        ctx.fillStyle = "rgba(10,10,12,0.85)"; ctx.fillRect(W - 40 - cw, barBottom + 20, cw, 44);
        ctx.fillStyle = "#FFFFFF"; ctx.fillText("Photo: " + g.val("credit"), W - 40 - cw + 14, barBottom + 50);
      }

      // Score pill
      if (g.val("score")) {
        const py = pillTop, team = String(g.val("team")).toUpperCase(), score = String(g.val("score"));
        ctx.save(); ctx.transform(1, 0, -0.12, 1, 0, 0);
        ctx.font = k.font(76, k.D); const w1 = ctx.measureText(team + " ").width, w2 = ctx.measureText(score).width;
        const bw = w1 + w2 + 70, px = 62 + py * 0.12;
        ctx.fillStyle = "#0E0F12"; ctx.fillRect(px, py, bw, ph);
        ctx.fillStyle = cream; ctx.fillText(team, px + 36, py + 82);
        ctx.fillStyle = accent; ctx.fillText(score, px + 36 + w1, py + 82);
        const l1 = String(g.val("line1")).toUpperCase(), l2 = String(g.val("line2")).toUpperCase();
        if (l1 || l2) {
          ctx.font = k.font(32, k.C, "italic 700"); k.spaced(4);
          const lw = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width) + 60;
          ctx.fillStyle = accent; ctx.fillRect(px + bw, py, lw, ph);
          ctx.fillStyle = "#14151A"; ctx.fillText(l1, px + bw + 30, py + 45); ctx.fillText(l2, px + bw + 30, py + 84); k.spaced(0);
        }
        ctx.restore();
      }

      // Headline, body, stats
      let y = photoBottom + hl.size * 0.8;
      k.drawRich(hl, 54, y, hl.size * 0.98, k.D, cream, accent, "left");
      y += (hl.lines.length - 1) * hl.size * 0.98;
      if (body) { y += 16 + body.size * 1.25; k.drawRich(body, 56, y, body.size * 1.4, k.B, "#E4E6EB", accent, "left", 500); y += (body.lines.length - 1) * body.size * 1.4; }
      if (stats.length) {
        const top = y + 30, gap = 22, bw = (W - 112 - gap * (stats.length - 1)) / stats.length;
        stats.forEach(([lab, v], i) => {
          const bx = 56 + i * (bw + gap);
          ctx.fillStyle = k.hexA(panel, 0.72); ctx.fillRect(bx, top, bw, statH);
          ctx.textAlign = "center";
          ctx.font = k.font(k.fit(v, bw - 30, 72, k.D), k.D); ctx.fillStyle = accent; ctx.fillText(v, bx + bw / 2, top + 74);
          ctx.font = k.font(26, k.C, 700); k.spaced(4); ctx.fillStyle = muted; ctx.fillText(lab.toUpperCase(), bx + bw / 2, top + 106, bw - 20); k.spaced(0);
          ctx.textAlign = "left";
        });
      }

      // Rant meter + handle
      ctx.font = k.font(34, k.C, 700); k.spaced(6); ctx.fillStyle = muted; ctx.fillText("RANT METER", 56, meterY); k.spaced(0);
      const lvl = Math.max(0, Math.min(5, parseInt(g.val("rant")) || 0));
      for (let i = 0; i < 5; i++) {
        const bh = 20 + i * 14, bx = 300 + i * 46;
        ctx.save(); ctx.transform(1, 0, -0.18, 1, 0, 0);
        ctx.fillStyle = i < lvl ? accent : "#3A3D45"; ctx.fillRect(bx + meterY * 0.18, meterY + 8 - bh, 34, bh); ctx.restore();
      }
      ctx.font = k.font(36, k.C, 700); k.spaced(2); ctx.fillStyle = cream; ctx.textAlign = "right";
      ctx.fillText(s.verdict ? s.verdict : s.brand.handle || "", W - 56, meterY, W - 600); ctx.textAlign = "left"; k.spaced(0);
      ctx.restore();
    },
  },
};
