// Tournament cards: the clean "official broadcast" look (match card, starting XI).
// Rich royal-blue background with our own stadium-dial ring and ribbons, the tournament logo on top,
// a frosted panel with both teams, and big clear numbers. No brush strokes on these cards.
//
// Photos: 1 = home crest (match card) or a player photo (starting XI), 2 = away crest, 3 = tournament logo
// (kept on this phone, so it only has to be added once per tournament).
window.BPG = window.BPG || {};

(function () {
  const L = BPG.LAYOUTS, PAD = 56;
  const cap = (s) => String(s == null ? "" : s).toUpperCase();
  const num = (s) => parseInt(String(s).replace(/[^\d-]/g, ""), 10) || 0;
  const C = { cream: "#FFE6BF", gold: "#FFD23F", cyan: "#4FB3FF", live: "#FF3B3B" };

  // Card colour: typed hex, else royal blue.
  function baseColour(g) {
    const v = String(g.val("bgc") || "").trim().replace("#", "");
    const tr = g.t.tour && BPG.TOURNAMENTS && BPG.TOURNAMENTS[g.t.tour];
    return /^[0-9a-f]{6}$/i.test(v) ? "#" + v : (tr && tr.bg) || "#1640C8";
  }
  function mix(hex, to, f) {
    const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
    const ch = (s) => Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f);
    return "#" + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("");
  }

  // Background: gradient, floodlight glow, faint wave lines, a dial ring top-right and two ribbons bottom-left.
  function tourBg(k, g, noRibbon) {
    const ctx = k.ctx, { W, H } = g, base = baseColour(g);
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, mix(base, "#FFFFFF", 0.06)); gr.addColorStop(0.55, base); gr.addColorStop(1, mix(base, "#000000", 0.45));
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, -H * 0.05, 0, W / 2, -H * 0.05, H * 0.7);
    glow.addColorStop(0, "rgba(255,255,255,0.22)"); glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    // Faint wave lines across the whole card.
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.045)"; ctx.lineWidth = 2;
    for (let y = -40; y < H + 40; y += 26) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin(x / 90 + y / 70) * 14);
      ctx.stroke();
    }
    ctx.restore();
    saffEdges(k, g, { ribbons: !noRibbon });
  }

  // The tournament's edge graphics, drawn by us: a toothed dial ring top-right and broad twisting ribbons.
  // frame: true puts ribbons on all four sides (for the photo frame), with a gold ribbon beside each.
  function saffEdges(k, g, o) {
    const ctx = k.ctx, { W, H } = g;
    const rx = W * 1.0, ry = g.st + H * 0.14, rr = W * 0.3;
    ctx.save();
    ctx.beginPath(); ctx.arc(rx, ry, rr, 0, Math.PI * 2); ctx.lineWidth = 120; ctx.strokeStyle = o.frame ? "rgba(70,120,240,0.85)" : "rgba(130,180,255,0.30)"; ctx.stroke();
    ctx.fillStyle = o.frame ? "rgba(160,200,255,0.9)" : "rgba(190,220,255,0.30)";
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2, r1 = rr - 50, r2 = rr + 44, w = 0.045;
      ctx.beginPath();
      ctx.moveTo(rx + Math.cos(a - w) * r1, ry + Math.sin(a - w) * r1);
      ctx.lineTo(rx + Math.cos(a) * r2, ry + Math.sin(a) * r2);
      ctx.lineTo(rx + Math.cos(a + w) * r1, ry + Math.sin(a + w) * r1);
      ctx.fill();
    }
    ctx.beginPath(); ctx.arc(rx, ry, rr - 90, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(190,220,255,0.35)"; ctx.setLineDash([4, 14]); ctx.stroke();
    ctx.restore();
    if (!o.ribbons) return;
    const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; };
    // A ribbon along a curve: the bright face and the darker back show as it twists, zig-zags on the face.
    const band = (P, width, twist, front, back, tex) => {
      const N = 160, pts = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N, x = bez(P[0], P[2], P[4], P[6], t), y = bez(P[1], P[3], P[5], P[7], t);
        const t2 = Math.min(1, t + 0.004), dx = bez(P[0], P[2], P[4], P[6], t2) - x, dy = bez(P[1], P[3], P[5], P[7], t2) - y, l = Math.hypot(dx, dy) || 1;
        const c = Math.cos(t * Math.PI * twist + 0.35), hw = (width / 2) * (0.35 + 0.65 * Math.abs(c));
        pts.push({ x, y, nx: -dy / l, ny: dx / l, tx: dx / l, ty: dy / l, hw, face: Math.abs(c) > 0.32, t }); // the darker back shows only at the folds
      }
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 24;
      for (let i = 0; i < N; i++) {
        const a = pts[i], b = pts[i + 1];
        ctx.beginPath();
        ctx.moveTo(a.x + a.nx * a.hw, a.y + a.ny * a.hw); ctx.lineTo(b.x + b.nx * b.hw, b.y + b.ny * b.hw);
        ctx.lineTo(b.x - b.nx * b.hw, b.y - b.ny * b.hw); ctx.lineTo(a.x - a.nx * a.hw, a.y - a.ny * a.hw); ctx.closePath();
        ctx.fillStyle = a.face ? front(a.t) : back; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = ctx.fillStyle; ctx.stroke();
        if (i === 0) ctx.shadowBlur = 0;
      }
      if (tex) {
        // zig-zag rows across the face
        ctx.strokeStyle = "rgba(255,255,255,0.32)"; ctx.lineWidth = 3;
        for (let i = 2; i < N; i += 4) {
          const a = pts[i]; if (!a.face || a.hw < width * 0.15) continue;
          ctx.beginPath();
          for (let j = 0; j <= 8; j++) { const sgn = j / 8 * 2 - 1, z = j % 2 ? 9 : -9; const px = a.x + a.nx * a.hw * sgn * 0.9 + a.tx * z, py = a.y + a.ny * a.hw * sgn * 0.9 + a.ty * z; j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
          ctx.stroke();
        }
      }
      // light edge on the outer side
      ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, q.x + q.nx * q.hw, q.y + q.ny * q.hw));
      ctx.strokeStyle = "rgba(220,255,220,0.45)"; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    };
    const green = (t) => `rgb(${Math.round(24 + 40 * (1 - t))},${Math.round(196 + 50 * (1 - t))},${Math.round(84 + 20 * t)})`;
    const gold = () => "#F4C430", deep = "#11924A";
    const sw = o.frame ? 0.75 : 1; // thinner on a photo, so the photo stays the star
    // Left side, from the middle down to the bottom corner.
    band([-170, H * 0.42, W * 0.16 * sw, H * 0.5, -W * 0.08, H * 0.8, W * 0.22 * sw, H + 140], W * 0.24 * sw, 1.6, green, deep, true);
    band([-W * 0.08, H + 40, W * 0.06, H * 0.95, W * 0.22, H * 0.97, W * 0.34, H + 100], W * 0.07, 1.0, gold, "#C99A1A", false);
    if (!o.frame) return;
    // Bottom-right corner, rising up the right edge.
    band([W + 170, H * 0.62, W * 0.88, H * 0.72, W * 1.06, H * 0.9, W * 0.76, H + 140], W * 0.17, 1.5, green, deep, true);
    band([W + 60, H * 0.84, W * 0.93, H * 0.9, W * 0.9, H * 1.0, W * 0.82, H + 60], W * 0.06, 1.0, gold, "#C99A1A", false);
    // Top-left corner.
    band([-160, H * 0.16, W * 0.06, H * 0.1, W * 0.08, H * 0.02, W * 0.26, -120], W * 0.12, 1.3, green, deep, true);
  }

  // Tournament logo (photo 3), or the tournament name in heavy letters. Returns the bottom y.
  function tourTop(k, g, cx, top, maxW, maxH, align) {
    const ctx = k.ctx, logo = g.photos[3] && (g.photos[3].plain || g.photos[3].img), name = cap(g.val("tournament"));
    if (logo) {
      const sc = Math.min(maxW / logo.width, maxH / logo.height), w = logo.width * sc, h = logo.height * sc;
      ctx.drawImage(logo, align === "right" ? cx - w : cx - w / 2, top, w, h);
      return top + h;
    }
    if (!name) return top;
    ctx.save(); ctx.textAlign = align === "right" ? "right" : "center";
    const words = name.split(/\s+/), mid = Math.ceil(words.length / 2), lines = words.length > 2 ? [words.slice(0, mid).join(" "), words.slice(mid).join(" ")] : [name];
    let y = top;
    lines.forEach((l, i) => {
      const s = k.fit(l, maxW, i ? 40 : 56, k.H, 900, 22); y += s * (i ? 1.1 : 0.95);
      ctx.font = k.font(s, k.H, 900); ctx.fillStyle = i ? "rgba(255,255,255,0.85)" : "#FFFFFF"; ctx.fillText(l, cx, y);
    });
    ctx.restore();
    return y + 10;
  }

  // A team: the uploaded crest as it is, else the flag on a rounded tile, else the short name on a tile.
  // (cx, cy) is the centre; returns the half height used.
  function teamBadge(k, g, cx, cy, size, team, pic) {
    const ctx = k.ctx, full = (BPG.teamName && BPG.teamName(team)) || team;
    const crest = pic && (!pic.tpl || pic.tpl === g.t.layout) && (pic.plain || pic.orig || pic.img);
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    if (crest) {
      const sc = Math.min(size / crest.width, size / crest.height);
      ctx.drawImage(crest, cx - (crest.width * sc) / 2, cy - (crest.height * sc) / 2, crest.width * sc, crest.height * sc);
      ctx.restore(); return size / 2;
    }
    ctx.restore();
    const flag = BPG.flagImg && BPG.flagImg(full), shape = BPG.flagShape || "wave";
    // No flag (a club with no crest uploaded): the short name.
    const fallback = (x, y, w, h) => {
      ctx.fillStyle = "#0B1A4A"; ctx.fillRect(x, y, w, h);
      const sh = BPG.teamShort ? BPG.teamShort(full) : cap(full).slice(0, 3);
      ctx.textAlign = "center"; ctx.font = k.font(k.fit(sh, w * 0.7, Math.round(h * 0.5), k.D), k.D); ctx.fillStyle = C.cream; ctx.fillText(sh, cx, cy + h * 0.17); ctx.textAlign = "left";
    };
    const paintIn = (path, x, y, w, h) => {
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
      path(); ctx.fillStyle = "#FFFFFF"; ctx.fill(); ctx.restore();
      ctx.save(); path(); ctx.clip();
      if (flag) { const sc = Math.max(w / flag.width, h / flag.height); ctx.drawImage(flag, cx - (flag.width * sc) / 2, cy - (flag.height * sc) / 2, flag.width * sc, flag.height * sc); }
      else fallback(x, y, w, h);
      const gl = ctx.createLinearGradient(x, y, x + w * 0.6, y + h);
      gl.addColorStop(0, "rgba(255,255,255,0.3)"); gl.addColorStop(0.5, "rgba(255,255,255,0)"); gl.addColorStop(1, "rgba(0,0,0,0.25)");
      ctx.fillStyle = gl; ctx.fillRect(x, y, w, h); ctx.restore();
      ctx.save(); path(); ctx.lineWidth = 6; ctx.strokeStyle = "#FFFFFF"; ctx.stroke(); ctx.restore();
    };
    if (shape === "circle") {
      const r = size * 0.4;
      paintIn(() => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); }, cx - r, cy - r, 2 * r, 2 * r);
      return r + 4;
    }
    if (shape === "shield") {
      const w = size * 0.74, h = size * 0.86, x = cx - w / 2, y = cy - h / 2, rc = 18;
      paintIn(() => {
        ctx.beginPath(); ctx.moveTo(x + rc, y); ctx.lineTo(x + w - rc, y); ctx.quadraticCurveTo(x + w, y, x + w, y + rc);
        ctx.lineTo(x + w, y + h * 0.5); ctx.bezierCurveTo(x + w, y + h * 0.78, cx + w * 0.18, y + h * 0.9, cx, y + h);
        ctx.bezierCurveTo(cx - w * 0.18, y + h * 0.9, x, y + h * 0.78, x, y + h * 0.5);
        ctx.lineTo(x, y + rc); ctx.quadraticCurveTo(x, y, x + rc, y); ctx.closePath();
      }, x, y, w, h);
      return h / 2 + 4;
    }
    // "wave": the flag as cloth in the wind (thin strips nudged up and down and shaded), no frame.
    const w = Math.round(size * 1.02), h = Math.round(size * 0.68), amp = size * 0.05;
    const off = document.createElement("canvas"); off.width = w; off.height = h + 2 * amp + 4;
    const o = off.getContext("2d"), strip = 3;
    const src = document.createElement("canvas"); src.width = w; src.height = h;
    const sctx = src.getContext("2d");
    if (flag) sctx.drawImage(flag, 0, 0, w, h);
    else { sctx.fillStyle = "#0B1A4A"; sctx.fillRect(0, 0, w, h); const sh = BPG.teamShort ? BPG.teamShort(full) : cap(full).slice(0, 3); sctx.textAlign = "center"; sctx.font = k.font(Math.round(h * 0.5), k.D); sctx.fillStyle = C.cream; sctx.fillText(sh, w / 2, h * 0.68); }
    for (let x = 0; x < w; x += strip) {
      const t = x / w, ph = t * Math.PI * 2.1 + 0.4, dy = Math.sin(ph) * amp * (0.3 + t * 0.7);
      o.drawImage(src, x, 0, strip, h, x, amp + 2 + dy, strip + 0.6, h);
      const shd = Math.cos(ph);
      o.fillStyle = shd > 0 ? `rgba(255,255,255,${0.16 * shd})` : `rgba(0,0,0,${-0.3 * shd})`;
      o.fillRect(x, amp + 2 + dy, strip + 0.6, h);
    }
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 34; ctx.shadowOffsetY = 14;
    ctx.translate(cx, cy); ctx.rotate(-0.04); ctx.drawImage(off, -w / 2, -off.height / 2); ctx.restore();
    return h / 2 + amp;
  }

  function infoLine(k, g, text, x, base) {
    const ctx = k.ctx, bits = String(text || "").split("|").map((b) => b.trim()).filter(Boolean);
    if (!bits.length) return;
    ctx.save(); ctx.textAlign = "left"; ctx.font = k.font(28, k.C, 700); k.spaced(2);
    let cx = x;
    bits.forEach((b, i) => {
      if (i) { ctx.fillStyle = C.gold; ctx.fillText("  |  ", cx, base); cx += ctx.measureText("  |  ").width; }
      ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillText(cap(b), cx, base, g.W * 0.6); cx += Math.min(ctx.measureText(cap(b)).width, g.W * 0.6);
    });
    k.spaced(0); ctx.restore();
  }

  // ---------- Match card: full time, live, half time, or kick-off ----------
  L.matchcard = {
    standard: false, tourLook: true, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, { W } = g, cx = W / 2, tall = g.H / W > 1.5;
      tourBg(k, g);
      const s1 = String(g.val("s1") || "").trim(), s2 = String(g.val("s2") || "").trim(), played = s1 !== "" || s2 !== "";
      const status = cap(g.val("status")) || (played ? "FULL TIME" : "KICK OFF"), live = /LIVE/.test(status);
      const finished = played && /FULL|FT|AET|PEN/.test(status);

      // Top: tournament logo or name, then the stage in cream.
      let y = tourTop(k, g, cx, g.st + (tall ? 30 : 10), W * 0.5, tall ? 250 : 190, "center");
      const stage = cap(g.val("stage"));
      ctx.save(); ctx.textAlign = "center"; ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 16;
      if (stage) { const s = k.fit(stage, W - 2 * PAD, tall ? 104 : 92, k.D, "", 40); y += s + (tall ? 40 : 26); ctx.font = k.font(s, k.D); ctx.fillStyle = C.cream; ctx.fillText(stage, cx, y); }
      ctx.restore();

      // Bottom line (your line, or the winner worked out for you) sits under the panel.
      const typed = String(g.val("headline") || "").trim();
      const t1 = cap(g.val("t1")), t2 = cap(g.val("t2"));
      const auto = finished ? (num(s1) === num(s2) ? "*DRAW*" : `WINNER: *${num(s1) > num(s2) ? t1 : t2}*`) : "";
      const bottomText = typed ? cap(typed) : auto;

      // Work out the panel's content height first, so the panel hugs it and sits centred in the space.
      const split = (v) => String(v || "").split(/\n|·|,\s*(?=[^\d\s])/).map((x) => x.trim()).filter(Boolean).slice(0, 4);
      const lists = [split(g.val("g1")), split(g.val("g2"))], nSc = Math.max(lists[0].length, lists[1].length);
      const size = tall ? 270 : 240, xs = [W * 0.22, W * 0.78], px = 60, pw = W - 120;
      const ss = k.fit(status, pw - 80, tall ? 88 : 80, k.D, "", 36);
      let padTop = tall ? 44 : 34, gap = tall ? 70 : 56;
      const half = g.photos[1] || g.photos[2] ? size / 2 : size * 0.34 + 6;
      const nameOff = tall ? 96 : 84, scH = nSc ? (tall ? 52 : 46) + (nSc - 1) * (tall ? 42 : 38) : 0;
      const content = padTop + ss + gap + 2 * half + nameOff + scH + (tall ? 60 : 50);
      const avTop = y + (tall ? 60 : 44), avBot = g.footerY - (bottomText ? (tall ? 170 : 140) : 70);
      // Spare room: half of it opens up the panel (more air around the status and teams), the rest goes around it.
      const extra = Math.max(0, avBot - avTop - content), grow = extra * 0.55;
      padTop += grow * 0.25; gap += grow * 0.35;
      const ph = Math.min(content + grow, avBot - avTop), pt = Math.round(avTop + (avBot - avTop - ph) * 0.4), pb = pt + ph;
      ctx.save();
      const pg = ctx.createLinearGradient(0, pt, 0, pb);
      pg.addColorStop(0, "rgba(255,255,255,0.20)"); pg.addColorStop(1, "rgba(255,255,255,0.07)");
      ctx.fillStyle = pg; k.roundRect(px, pt, pw, ph, 46); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,0.55)"; k.roundRect(px, pt, pw, ph, 46); ctx.stroke();
      ctx.restore();

      // Status at the top of the panel.
      ctx.save(); ctx.textAlign = "center";
      const sy = pt + padTop + ss * 0.9;
      ctx.font = k.font(ss, k.D);
      if (live) {
        const tw = ctx.measureText(status).width;
        ctx.fillStyle = C.live; ctx.beginPath(); ctx.arc(cx - tw / 2 - 30, sy - ss * 0.36, ss * 0.16, 0, Math.PI * 2); ctx.fill();
        ctx.fillText(status, cx + 14, sy);
      } else { ctx.fillStyle = C.gold; ctx.fillText(status, cx, sy); }

      // Teams, score in the middle.
      const by = Math.round(sy + ss * 0.1 + gap + half);
      const halves = [teamBadge(k, g, xs[0], by, size, g.val("t1"), g.photos[1]), teamBadge(k, g, xs[1], by, size, g.val("t2"), g.photos[2])];
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 18; ctx.textAlign = "center";
      if (played) {
        const txt = `${s1 || "0"} - ${s2 || "0"}`, fs = k.fit(txt, W * 0.24, tall ? 200 : 180, k.D, "", 60);
        ctx.font = k.font(fs, k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(txt, cx, by + fs * 0.36);
      } else {
        ctx.font = k.font(tall ? 120 : 108, k.D); ctx.fillStyle = C.cream; ctx.fillText("VS", cx, by + 40);
      }
      // Names and scorers under each team.
      const nameY = by + Math.max(...halves) + nameOff - 6, colW = W * 0.4;
      [[t1, lists[0]], [t2, lists[1]]].forEach(([nm, list], i) => {
        if (nm) { ctx.font = k.font(k.fit(nm, colW, tall ? 72 : 64, k.D, "", 30), k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(nm, xs[i], nameY); }
        list.forEach((line, j) => {
          ctx.font = k.font(tall ? 34 : 30, k.C, 700); k.spaced(1); ctx.fillStyle = C.cream;
          ctx.fillText("⚽ " + cap(line), xs[i], nameY + (tall ? 52 : 46) + j * (tall ? 42 : 38), colW); k.spaced(0);
        });
      });
      ctx.restore(); ctx.restore();

      // Under the panel: the winner or your line, *stars* in gold.
      if (bottomText) {
        const lay = k.layoutRich(bottomText, W - 2 * PAD, tall ? 76 : 64, k.H, 1, 30, 900);
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 14;
        k.drawRich(lay, cx, Math.min(pb + (tall ? 110 : 92), g.footerY - 64), lay.size, k.H, "#FFFFFF", C.gold, "center", 900);
        ctx.restore();
      }
      infoLine(k, g, g.val("info"), PAD, g.footerY);
      k.brandCorner(Object.assign({}, g, { accent: C.gold }), g.footerY);
    },
  };

  // ---------- Starting XI ----------
  // "20 Gyeltshen Zangpo (GK)" one per line. Subs: one per line or comma between.
  L.lineup = {
    standard: false, tourLook: true, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, { W, H } = g, tall = H / W > 1.5;
      tourBg(k, g, true);
      // Optional player photo on the right, fading into the card colour.
      const base = baseColour(g), photo = g.photos[1] && g.photos[1].tpl !== "matchcard" && (g.photos[1].plain || g.photos[1].img);
      const photoTop = g.st + (tall ? 420 : 330);
      if (photo) {
        const bw = W * 0.6, bh = g.footerY - photoTop + 60, bx = W - bw;
        const sc = Math.max(bw / photo.width, bh / photo.height), dw = photo.width * sc, dh = photo.height * sc;
        const f = photo.bpgFocus, fx = f && isFinite(f.cx) ? f.cx : 0.5, fy = f && isFinite(f.t) ? f.t : 0.12; // focus is in 0..1 of the photo
        // Draw on its own layer and fade the left, top and bottom edges to see-through, so no edge shows.
        const lay = document.createElement("canvas"); lay.width = Math.round(bw); lay.height = Math.round(bh);
        const lc = lay.getContext("2d");
        lc.drawImage(photo, Math.min(0, Math.max(bw - dw, bw / 2 - dw * fx)), Math.min(0, Math.max(bh - dh, 40 - dh * fy)), dw, dh);
        lc.globalCompositeOperation = "destination-in";
        const mx = lc.createLinearGradient(0, 0, bw * 0.6, 0); mx.addColorStop(0, "rgba(0,0,0,0)"); mx.addColorStop(1, "rgba(0,0,0,1)");
        lc.fillStyle = mx; lc.fillRect(0, 0, bw, bh);
        const my = lc.createLinearGradient(0, 0, 0, bh); my.addColorStop(0, "rgba(0,0,0,0)"); my.addColorStop(0.22, "rgba(0,0,0,1)"); my.addColorStop(0.7, "rgba(0,0,0,1)"); my.addColorStop(1, "rgba(0,0,0,0)");
        lc.fillStyle = my; lc.fillRect(0, 0, bw, bh);
        ctx.drawImage(lay, bx, photoTop);
      }

      // Top-left: team vs opponent as small tiles.
      const tile = tall ? 150 : 132, ty = g.st + 40 + tile * 0.34;
      const hasTeam = String(g.val("team") || "").trim() || g.photos[2];
      if (hasTeam) {
        teamBadge(k, g, PAD + tile / 2, ty, tile, g.val("team"), g.photos[2]);
        ctx.save(); ctx.textAlign = "center"; ctx.font = k.font(tall ? 50 : 44, k.H, 900); ctx.fillStyle = "#FFFFFF";
        ctx.fillText("VS", PAD + tile + 62, ty + 16);
        ctx.restore();
      }
      if (hasTeam && g.val("opp")) teamBadge(k, g, PAD + tile * 1.5 + 124, ty, tile, g.val("opp"), null);
      // Top-right: tournament logo or name.
      tourTop(k, g, W - PAD, g.st + 20, W * 0.36, tall ? 300 : 250, "right");

      // STARTING / XI
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 14;
      const head = cap(g.val("title") || "Starting"), hs = k.fit(head, W * 0.5, tall ? 104 : 92, k.H, 900, 40);
      let y = ty + tile * 0.34 + 30 + hs * 0.9;
      ctx.font = k.font(hs, k.H, 900); ctx.fillStyle = "#FFFFFF"; ctx.fillText(head, PAD, y);
      const xiW = cap(g.val("xi") || "XI"), xiS = k.fit(xiW, W * 0.56, tall ? 300 : 250, k.D, "", 120); y += xiS * 0.84 + 22;
      ctx.font = k.font(xiS, k.D); ctx.fillText(xiW, PAD - 6, y);
      ctx.restore();

      // The eleven, sized to the space left.
      const rows = String(g.val("players") || "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 11).map((l) => {
        const m = l.match(/^(\d{1,2})[.)\-:\s]+(.*)$/); return m ? [m[1], m[2]] : ["", l];
      });
      const subs = String(g.val("subs") || "").split(/\n|,|\//).map((x) => x.trim()).filter(Boolean);
      const subsLines = Math.ceil(subs.length / 2), subsH = subs.length ? 70 + subsLines * (tall ? 40 : 34) : 0;
      const listTop = y + (tall ? 50 : 34), listBottom = g.footerY - 56;
      const step = Math.min(tall ? 74 : 62, (listBottom - listTop) / Math.max(1, rows.length));
      const fs = Math.round(step * 0.62), listW = (photo || subs.length ? W * 0.56 - 16 : W * 0.66) - PAD;
      rows.forEach(([n, name], i) => {
        const by = listTop + step * (i + 0.8);
        ctx.font = k.font(Math.round(fs * 1.25), k.D); ctx.fillStyle = C.cyan; ctx.fillText(n, PAD, by);
        const nw = listW - fs * 2.1, hs = k.fit(cap(name), nw, fs, k.H, 800, 16);
        // A long name switches to the narrow font instead of shrinking.
        if (hs < fs * 0.85) ctx.font = k.font(k.fit(cap(name), nw, Math.round(fs * 1.1), k.C, 700, 16), k.C, 700); else ctx.font = k.font(hs, k.H, 800);
        ctx.fillStyle = "#FFFFFF"; ctx.fillText(cap(name), PAD + fs * 2.1, by);
      });

      // Substitutes, bottom-right, two per line with the shirt numbers in colour.
      if (subs.length) {
        const sx = W * (photo ? 0.5 : 0.56), sw = W - PAD - sx, sTop = g.footerY - 56 - subsH;
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 12;
        ctx.font = k.font(k.fit("SUBSTITUTES", sw, tall ? 60 : 52, k.H, 900, 24), k.H, 900); ctx.fillStyle = "#FFFFFF"; ctx.fillText("SUBSTITUTES", sx, sTop + 48);
        const lineH = tall ? 40 : 34, sz = tall ? 30 : 26;
        for (let i = 0; i < subsLines; i++) {
          let x = sx; const by = sTop + 70 + lineH * (i + 0.7);
          subs.slice(i * 2, i * 2 + 2).forEach((s, j) => {
            const m = s.match(/^(\d{1,2})\s+(.*)$/), part = [[m ? m[1] + " " : "", C.cyan], [cap(m ? m[2] : s) + (j === 0 && subs[i * 2 + 1] ? " / " : ""), "#FFFFFF"]];
            part.forEach(([t, col]) => { ctx.font = k.font(sz, k.C, 700); ctx.fillStyle = col; const mw = Math.max(0, sx + sw - x); ctx.fillText(t, x, by, mw); x += Math.min(ctx.measureText(t).width, mw); });
          });
        }
        ctx.restore();
      }
      infoLine(k, g, g.val("info"), PAD, g.footerY);
      k.brandCorner(Object.assign({}, g, { accent: C.gold }), g.footerY);
    },
  };

  // ---------- Tournament photo frame ----------
  // Any photo from the tournament, full size, with the tournament's ribbons and ring around the edges.
  L.tframe = {
    standard: false, tourLook: true, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, { W, H } = g, cx = W / 2, tall = H / W > 1.5;
      const ph = g.photos[1] && g.photos[1].tpl !== "matchcard" ? g.photos[1] : null; // a crest is not a photo
      if (ph) {
        k.coverImg(ph.img, 0, 0, W, H);
        // Darken the very edges a little so the ribbons stand out.
        const vg = ctx.createRadialGradient(cx, H * 0.45, W * 0.35, cx, H * 0.45, W * 0.95);
        vg.addColorStop(0, "rgba(5,15,60,0)"); vg.addColorStop(1, "rgba(5,15,60,0.45)");
        ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      } else { tourBg(k, g, true); k.photoHint(g, H * 0.45); }
      const tag = cap(g.val("tag")), hl = String(g.val("headline") || "").trim();
      // Fade into deep blue only behind the text at the bottom.
      if (tag || hl) {
        const from = g.footerY - (tall ? 520 : 440), gr = ctx.createLinearGradient(0, from, 0, H);
        gr.addColorStop(0, "rgba(8,22,90,0)"); gr.addColorStop(0.5, "rgba(8,22,90,0.75)"); gr.addColorStop(1, "rgba(6,16,70,0.95)");
        ctx.fillStyle = gr; ctx.fillRect(0, from, W, H - from);
      }
      saffEdges(k, g, { ribbons: true, frame: true });
      // Tournament logo or name, small, top centre.
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 18;
      tourTop(k, g, cx, g.st + 20, W * 0.34, tall ? 170 : 140, "center");
      ctx.restore();
      // Tag and headline at the bottom, centred.
      let base = g.footerY - 62;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 16;
      if (hl) {
        let lay = k.layoutRich(cap(hl), W - 2 * PAD - 80, tall ? 96 : 84, k.D, 2, 44);
        const top = base - (lay.lines.length - 1) * lay.size * 1.02;
        k.drawRich(lay, cx, top, lay.size * 1.02, k.D, "#FFFFFF", C.gold, "center");
        base = top - lay.size - 14;
      }
      if (tag) { ctx.textAlign = "center"; ctx.font = k.font(k.fit(tag, W * 0.6, 36, k.C, 700, 20), k.C, 700); k.spaced(5); ctx.fillStyle = C.cream; ctx.fillText(tag, cx, base); k.spaced(0); }
      ctx.restore();
      infoLine(k, g, g.val("info"), PAD + 40, g.footerY);
      k.brandCorner(Object.assign({}, g, { accent: C.gold }), g.footerY);
    },
  };
  // Shared with tournament2.js (fixtures, team stats, XI on the pitch).
  BPG.tour = { tourBg, saffEdges, tourTop, teamBadge, infoLine, C, cap, num };
})();
