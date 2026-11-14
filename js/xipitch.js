// Starting XI on a modern pitch: jersey shapes with the role (LW, CB…) or shirt number on them,
// a clean name chip under each (Bangla or English), the captain marked, the team's flag waving in the header.
// Tournament look (SAFF blue, green and gold by default), no player photos.
//
// Players: keeper first, then each line from left to right as you look at the card (left back first),
// forwards last. Optional extras on a line: a shirt number in front ("10 Hamza"), "(C)" for the captain,
// and "| LW" at the end to set the role yourself. Without a role, it is worked out from the formation.
window.BPG = window.BPG || {};

(function () {
  const L = BPG.LAYOUTS, PAD = 56;
  const BN = '"Anek Bangla", "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  const cap = (s) => String(s == null ? "" : s).toUpperCase();
  const full = (n) => (BPG.teamName && BPG.teamName(n)) || String(n || "").trim();
  const GOLD = "#FFD23F", CREAM = "#FFE6BF";

  // Bangla fonts load on first use; redraw once they are ready so the names never show in a fallback font.
  const asked = new Set();
  function ensure(spec, text) {
    if (!document.fonts || !document.fonts.load || asked.has(spec)) return;
    asked.add(spec);
    document.fonts.load(spec, text).then(() => { if (BPG.draw) BPG.draw(); }, () => {});
  }

  // Roles from the formation: [4,2,1,3] -> defenders, two midfield lines, forwards.
  function rolesFor(lines) {
    const out = [["GK"]], n = lines.length;
    lines.forEach((c, i) => {
      if (i === 0) out.push({ 1: ["CB"], 2: ["CB", "CB"], 3: ["CB", "CB", "CB"], 4: ["LB", "CB", "CB", "RB"], 5: ["LWB", "CB", "CB", "CB", "RWB"] }[c] || Array(c).fill("DF"));
      else if (i === n - 1) out.push({ 1: ["ST"], 2: ["ST", "ST"], 3: ["LW", "CF", "RW"], 4: ["LW", "ST", "ST", "RW"] }[c] || Array(c).fill("FW"));
      else {
        const mids = n - 2, pos = i - 1; // which midfield line, from the back
        const deep = mids > 1 && pos === 0, high = mids > 1 && pos === mids - 1;
        if (deep) out.push({ 1: ["DM"], 2: ["CM", "CM"], 3: ["DM", "DM", "DM"] }[c] || Array(c).fill("DM"));
        else if (high) out.push({ 1: ["AM"], 2: ["AM", "AM"], 3: ["LW", "AM", "RW"], 4: ["LM", "AM", "AM", "RM"] }[c] || Array(c).fill("AM"));
        else out.push({ 1: ["CM"], 2: ["CM", "CM"], 3: ["CM", "CM", "CM"], 4: ["LM", "CM", "CM", "RM"], 5: ["LM", "CM", "CM", "CM", "RM"] }[c] || Array(c).fill("MF"));
      }
    });
    return out;
  }

  // A football shirt, centred on (cx, top) with width w (height is about w * 0.92).
  function shirtPath(ctx, cx, top, w) {
    const h = w * 0.92, x = cx - w / 2, P = (a, b) => [x + a * w, top + b * h];
    ctx.beginPath();
    ctx.moveTo(...P(0.36, 0.0));
    ctx.quadraticCurveTo(...P(0.5, 0.13), ...P(0.64, 0.0));   // collar dip
    ctx.lineTo(...P(0.84, 0.06));
    ctx.quadraticCurveTo(...P(0.95, 0.12), ...P(1.0, 0.3));   // shoulder to sleeve end
    ctx.lineTo(...P(0.83, 0.4));
    ctx.lineTo(...P(0.8, 0.34));
    ctx.lineTo(...P(0.8, 0.94));
    ctx.quadraticCurveTo(...P(0.8, 1.0), ...P(0.74, 1.0));
    ctx.lineTo(...P(0.26, 1.0));
    ctx.quadraticCurveTo(...P(0.2, 1.0), ...P(0.2, 0.94));
    ctx.lineTo(...P(0.2, 0.34));
    ctx.lineTo(...P(0.17, 0.4));
    ctx.lineTo(...P(0.0, 0.3));
    ctx.quadraticCurveTo(...P(0.05, 0.12), ...P(0.16, 0.06));
    ctx.closePath();
    return h;
  }

  function drawShirt(k, cx, top, w, gk) {
    const ctx = k.ctx, h = w * 0.92;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10;
    shirtPath(ctx, cx, top, w);
    const gr = ctx.createLinearGradient(cx - w / 2, top, cx + w / 2, top + h);
    if (gk) { gr.addColorStop(0, "#FFE680"); gr.addColorStop(1, "#F2B705"); }
    else { gr.addColorStop(0, "#3BE07A"); gr.addColorStop(0.55, "#16B358"); gr.addColorStop(1, "#0B8A43"); }
    ctx.fillStyle = gr; ctx.fill(); ctx.restore();
    ctx.save(); shirtPath(ctx, cx, top, w); ctx.clip();
    // a soft diagonal sheen and a darker hem, so the shirt reads as fabric, not a flat icon
    const sh = ctx.createLinearGradient(cx - w / 2, top, cx + w * 0.1, top + h * 0.7);
    sh.addColorStop(0, "rgba(255,255,255,0.28)"); sh.addColorStop(0.5, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(0,0,0,0.12)");
    ctx.fillStyle = sh; ctx.fillRect(cx - w / 2, top, w, h);
    // sleeve cuffs and side panels in the trim colour
    ctx.strokeStyle = gk ? "#0B1E6B" : GOLD; ctx.lineWidth = w * 0.045;
    const x = cx - w / 2;
    ctx.beginPath(); ctx.moveTo(x + w * 0.02, top + h * 0.27); ctx.lineTo(x + w * 0.19, top + h * 0.38); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w * 0.98, top + h * 0.27); ctx.lineTo(x + w * 0.81, top + h * 0.38); ctx.stroke();
    ctx.restore();
    // collar
    ctx.save(); ctx.strokeStyle = gk ? "#0B1E6B" : GOLD; ctx.lineWidth = w * 0.05; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx - w * 0.14, top + h * 0.005); ctx.quadraticCurveTo(cx, top + h * 0.13, cx + w * 0.14, top + h * 0.005); ctx.stroke();
    ctx.restore();
    // thin light outline
    ctx.save(); shirtPath(ctx, cx, top, w); ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.stroke(); ctx.restore();
    return h;
  }

  // The pitch: mowing stripes that fade into the card at the top, faint lines, a glow in the centre circle.
  function pitch(k, g, top, bot) {
    const ctx = k.ctx, { W } = g, ph = bot - top;
    ctx.save();
    const off = document.createElement("canvas"); off.width = W; off.height = Math.ceil(ph);
    const o = off.getContext("2d"), n = 10;
    for (let i = 0; i < n; i++) { o.fillStyle = i % 2 ? "rgba(18,150,80,0.55)" : "rgba(24,170,92,0.55)"; o.fillRect(0, (ph / n) * i, W, ph / n + 1); }
    // lines
    o.strokeStyle = "rgba(255,255,255,0.38)"; o.lineWidth = 3;
    const m = 34;
    o.strokeRect(m, m * 0.5, W - 2 * m, ph - m);
    o.beginPath(); o.moveTo(m, ph / 2); o.lineTo(W - m, ph / 2); o.stroke();
    o.beginPath(); o.arc(W / 2, ph / 2, ph * 0.1, 0, Math.PI * 2); o.stroke();
    o.fillStyle = "rgba(255,255,255,0.5)"; o.beginPath(); o.arc(W / 2, ph / 2, 6, 0, Math.PI * 2); o.fill();
    const bw = W * 0.56, bh = ph * 0.14, sw = W * 0.28, sh = ph * 0.055;
    o.strokeRect((W - bw) / 2, ph - m * 0.5 - bh, bw, bh); o.strokeRect((W - sw) / 2, ph - m * 0.5 - sh, sw, sh);
    o.beginPath(); o.arc(W / 2, ph - m * 0.5 - bh, ph * 0.06, Math.PI * 1.15, Math.PI * 1.85); o.stroke();
    o.strokeRect((W - bw) / 2, m * 0.5, bw, bh); o.strokeRect((W - sw) / 2, m * 0.5, sw, sh);
    o.beginPath(); o.arc(W / 2, m * 0.5 + bh, ph * 0.06, Math.PI * 0.15, Math.PI * 0.85); o.stroke();
    // fade the top and bottom edges into the card colour
    o.globalCompositeOperation = "destination-in";
    const fade = o.createLinearGradient(0, 0, 0, ph);
    fade.addColorStop(0, "rgba(0,0,0,0)"); fade.addColorStop(0.12, "rgba(0,0,0,1)"); fade.addColorStop(0.9, "rgba(0,0,0,1)"); fade.addColorStop(1, "rgba(0,0,0,0.2)");
    o.fillStyle = fade; o.fillRect(0, 0, W, ph);
    ctx.drawImage(off, 0, top);
    // floodlight glow from the top
    const glow = ctx.createRadialGradient(W / 2, top + ph * 0.45, 0, W / 2, top + ph * 0.45, W * 0.75);
    glow.addColorStop(0, "rgba(255,255,255,0.10)"); glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, top, W, ph);
    ctx.restore();
  }

  L.xipitch = {
    standard: false, tourLook: true, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, { W } = g, { tourBg, teamBadge } = BPG.tour, tall = g.H / W > 1.5;
      tourBg(k, g, true);
      const title = String(g.val("title") || "").trim(), tname = String(g.val("teamname") || "").trim() || full(g.val("team"));
      const opp = String(g.val("opp") || "").trim(), team = full(g.val("team"));
      ensure(`800 40px "Anek Bangla"`, title + tname + String(g.val("players")));

      // ---------- header: small tag, big team name, match line; the waving flag on the right ----------
      const top = g.st + (tall ? 10 : 30);
      const flagSize = tall ? 210 : 180, flagCx = W - PAD - flagSize * 0.5, textMax = W - PAD * 2 - flagSize - 30;
      let y = top;
      ctx.save(); ctx.textAlign = "left";
      if (title) {
        const ts = tall ? 40 : 36;
        ctx.font = k.font(ts, BN, 800); ctx.fillStyle = GOLD;
        ctx.fillRect(PAD, y + ts * 0.25, 34, 6);
        ctx.fillText(title, PAD + 48, y + ts * 0.62, textMax - 48);
        y += ts + 6;
      }
      const ns = k.fit(tname, textMax, tall ? 136 : 128, BN, 800, 60);
      ctx.font = k.font(ns, BN, 800); ctx.fillStyle = "#FFFFFF"; ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 18;
      ctx.fillText(tname, PAD - 4, y + ns * 0.92);
      ctx.shadowBlur = 0;
      y += ns * 1.08 + (tall ? 44 : 38);
      const ml = [opp ? `${cap(team)} VS ${cap(full(opp))}` : cap(team), cap(g.val("tournament"))].filter(Boolean);
      ctx.font = k.font(tall ? 32 : 28, k.C, 700); k.spaced(3);
      let mx = PAD;
      ml.forEach((part, i) => {
        if (i) { ctx.fillStyle = GOLD; ctx.fillText("  •  ", mx, y); mx += ctx.measureText("  •  ").width; }
        ctx.fillStyle = i ? "rgba(255,230,191,0.9)" : "#FFFFFF"; ctx.fillText(part, mx, y, W - PAD - mx - 10); mx += Math.min(ctx.measureText(part).width, W - PAD - mx - 10);
      });
      k.spaced(0); ctx.restore();
      const headBot = y + 14;
      // flag + formation chip
      const fCy = top + flagSize * 0.36;
      if (team || g.photos[2]) teamBadge(k, g, flagCx, fCy, flagSize, team, g.photos[2]);
      const form = String(g.val("formation") || "").trim();
      if (form) {
        ctx.save(); ctx.font = k.font(tall ? 34 : 30, k.C, 700); k.spaced(2);
        const fw = ctx.measureText(form).width + 34, fh = tall ? 50 : 46, fx = flagCx - fw / 2, fy = fCy + flagSize * 0.42;
        ctx.fillStyle = GOLD; k.roundRect(fx, fy, fw, fh, fh / 2); ctx.fill();
        ctx.fillStyle = "#0B1E6B"; ctx.textAlign = "center"; ctx.fillText(form, flagCx + 1, fy + fh * 0.72); k.spaced(0); ctx.restore();
      }

      // ---------- pitch + players ----------
      const pTop = headBot + (tall ? 16 : 6), pBot = g.footerY - (tall ? 70 : 58);
      pitch(k, g, pTop - 30, pBot + 20);
      const lines = String(form || "4-3-3").split(/[^\d]+/).map((n) => parseInt(n, 10)).filter((n) => n > 0);
      const shape = [1, ...lines], roles = rolesFor(lines);
      const list = String(g.val("players") || "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
        let role = "", num = "", c = false;
        const pipe = l.split("|"); if (pipe.length > 1) { role = pipe.slice(1).join("|").trim().toUpperCase(); l = pipe[0].trim(); }
        l = l.replace(/\s*[([]\s*(c|ক|অধিনায়ক)\s*[)\]]\s*/i, () => { c = true; return " "; }).trim();
        const m = l.match(/^(\d{1,2})[.)\-:\s]+(.*)$/); if (m) { num = m[1]; l = m[2].trim(); }
        return { name: l, role, num, c };
      });
      const rows = shape.length, rowH = (pBot - pTop) / rows;
      const maxPer = Math.max(...shape);
      const sw = Math.min(tall ? 150 : 128, rowH * 0.62, (W - 2 * PAD) / maxPer * 0.62);
      const nameS = tall ? 36 : 32, chipH = nameS + 18;
      let idx = 0;
      shape.forEach((count, row) => {
        const slotTop = pBot - rowH * (row + 1);
        const block = sw * 0.92 + 10 + chipH, sy = slotTop + (rowH - block) / 2;
        // wide lines spread across the card; narrow lines sit closer to the middle like a real shape
        const gap = count === 3 ? W * 0.3 : W * 0.25;
        for (let j = 0; j < count; j++) {
          const p = list[idx++]; if (!p) continue;
          const cx = count >= 4 ? PAD + (W - 2 * PAD) * ((j + 0.5) / count) : W / 2 + (j - (count - 1) / 2) * gap;
          const gk = row === 0, role = p.role || (roles[row] && roles[row][j]) || "";
          const h = drawShirt(k, cx, sy, sw, gk);
          // on the shirt: the number big with the role small above, or the role big
          ctx.save(); ctx.textAlign = "center"; ctx.fillStyle = gk ? "#0B1E6B" : "#FFFFFF";
          if (!gk) { ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 6; }
          if (p.num) {
            ctx.font = k.font(Math.round(sw * 0.15), k.C, 700); k.spaced(2); ctx.fillText(role, cx, sy + h * 0.38); k.spaced(0);
            ctx.font = k.font(Math.round(sw * 0.4), k.D); ctx.fillText(p.num, cx, sy + h * 0.82);
          } else {
            ctx.font = k.font(k.fit(role, sw * 0.5, Math.round(sw * 0.3), k.D, "", 18), k.D); ctx.fillText(role, cx, sy + h * 0.7);
          }
          ctx.restore();
          // captain's armband badge
          if (p.c) {
            const r = sw * 0.13, bx = cx - sw * 0.36, by = sy + h * 0.14;
            ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fillStyle = GOLD; ctx.fill(); ctx.shadowBlur = 0;
            ctx.lineWidth = 3; ctx.strokeStyle = "#0B1E6B"; ctx.stroke();
            ctx.fillStyle = "#0B1E6B"; ctx.textAlign = "center"; ctx.font = k.font(Math.round(r * 1.25), k.C, 700); ctx.fillText("C", bx, by + r * 0.45);
            ctx.restore();
          }
          // name chip
          const maxW = Math.min(count >= 4 ? (W - 2 * PAD) / count - 14 : 300, 300);
          ctx.save(); ctx.textAlign = "center";
          const fs = k.fit(p.name, maxW - 36, nameS, BN, 800, 18);
          ctx.font = k.font(fs, BN, 800);
          const tw = Math.min(ctx.measureText(p.name).width, maxW - 36) + 40, cy = sy + h + 10;
          ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
          ctx.fillStyle = "rgba(7,18,70,0.92)"; k.roundRect(cx - tw / 2, cy, tw, chipH, chipH / 2); ctx.fill();
          ctx.shadowColor = "transparent";
          ctx.lineWidth = 2.5; ctx.strokeStyle = p.c ? GOLD : "rgba(255,255,255,0.35)"; k.roundRect(cx - tw / 2, cy, tw, chipH, chipH / 2); ctx.stroke();
          ctx.fillStyle = "#FFFFFF"; ctx.fillText(p.name, cx, cy + chipH * 0.5 + fs * 0.36, maxW - 36);
          ctx.restore();
        }
      });
      if (g.val("coach")) {
        ctx.save(); ctx.font = k.font(tall ? 32 : 28, BN, 800); ctx.fillStyle = CREAM;
        ctx.fillText(String(g.val("coach")), PAD, g.footerY - (tall ? 40 : 34), W * 0.55); ctx.restore();
      }
      BPG.tour2.bottom(k, g);
    },
  };

  BPG.TEMPLATES.xipitch = { cat: "football", name: "Starting XI (modern pitch)", layout: "xipitch", photo2: "Team crest (optional, the flag is used for countries)", photo3: "Tournament logo (optional, kept on this phone)", noCut: true, noMain: true,
    hint: "Names in Bangla or English. Keeper first, then each line from left to right as you look at the card (left back first), forwards last. Add (C) for the captain, a number in front for the shirt (\"10 হামজা\"), or \"| LW\" at the end to set the role yourself. \"Team\" (in English) picks the flag; \"Name on the card\" is what shows big.",
    fields: [["title","Small heading","শুরুর একাদশ"],["teamname","Name on the card","বাংলাদেশ"],["team","Team (English, sets the flag)","Bangladesh"],["opp","Opponent (optional)","Pakistan"],["formation","Formation","4-2-1-3"],
      ["players","Players","শ্রাবণ\nজায়ান\nজিদান\nতারিক\nরহমত\nশমিত\nকাজেম\nহামজা (C)\nফারহান\nশুকি\nরাকিব",true,"area"],
      ["coach","Coach line (optional)",""],["tournament","Tournament","SAFF Championship 2026",true],["info","Info line (optional)","",true],["bgc","Card colour (optional)",""]] };
})();
