// Stylish cards: one huge headline ("219* RUNS!") in a tall condensed font with a worn, printed texture,
// a small slanted name label above it and one info line below. Full photo, soft fade only behind the text.
// The headline font and the texture are picked in the form (Headline font / Texture) and remembered on this phone.
// All fonts are free (Google Fonts, SIL Open Font License) and saved in fonts/ so the studio works offline.
window.BPG = window.BPG || {};

(function () {
  const L = BPG.LAYOUTS, PAD = 56;
  const cap = (s) => String(s == null ? "" : s).toUpperCase();
  // Scripts and some serifs look wrong in ALL CAPS, so their headline goes in Title Case.
  const titleCase = (s) => String(s == null ? "" : s).toLowerCase().replace(/(^|[\s*(])([a-z])/g, (m, a, b) => a + b.toUpperCase());
  let bigCase = cap;
  const BN = '"Baloo Da 2", "Hind Siliguri"'; // Bangla letters fall back to these

  // The font library: ONE font for each kind of lettering a sports page needs (the user asked for every type,
  // but no look-alikes: Anton is the only tall-condensed one). All free (SIL OFL), saved in fonts/ for offline use.
  // type = what kind of font it is, use = what posts it suits, grp = how strongly the texture wears it (WEAR),
  // style "italic" for slanted fonts, title: true for scripts and serifs that look wrong in ALL CAPS.
  BPG.HEAD_FONTS = {
    anton: { label: "Anton", type: "Impact", use: "scores, milestones, big numbers", fam: "Anton", weight: 400, grp: "impact" },
    kanit: { label: "Kanit Italic", type: "Speed", use: "live updates, breaking news", fam: "Kanit", weight: 900, style: "italic", grp: "speed" },
    unbounded: { label: "Unbounded", type: "Wide", use: "results, finals, trophies", fam: "Unbounded", weight: 900, grp: "wide" },
    montserrat: { label: "Montserrat Black", type: "Clean modern", use: "stats, announcements, fixtures", fam: "Montserrat", weight: 900, grp: "wide" },
    playfair: { label: "Playfair", type: "Classic serif", use: "legends, tributes, retirements", fam: "Playfair Display", weight: 900, title: true, grp: "serif" },
    slab: { label: "Alfa Slab", type: "Vintage slab", use: "throwbacks, on this day, records", fam: "Alfa Slab One", weight: 400, grp: "serif" },
    dafoe: { label: "Mr Dafoe", type: "Signature", use: "player names, birthdays, emotion", fam: "Mr Dafoe", weight: 400, title: true, grp: "script" },
    vibes: { label: "Great Vibes", type: "Elegant script", use: "farewells, thank-you posts", fam: "Great Vibes", weight: 400, title: true, grp: "script" },
    marker: { label: "Permanent Marker", type: "Marker", use: "rants, hot takes, opinions", fam: "Permanent Marker", weight: 400, grp: "brush" },
    bangers: { label: "Bangers", type: "Comic", use: "memes, funny moments, BOOM", fam: "Bangers", weight: 400, grp: "brush" },
    spray: { label: "Rubik Spray Paint", type: "Spray paint", use: "fan reactions, street hype", fam: "Rubik Spray Paint", weight: 400, grp: "grunge" },
    graduate: { label: "Graduate", type: "Varsity", use: "jersey numbers, player spotlights", fam: "Graduate", weight: 400, wear: 0.5, grp: "jersey" },
    stencil: { label: "Black Ops", type: "Stencil", use: "squad drops, team news", fam: "Black Ops One", weight: 400, grp: "jersey" },
    bungee: { label: "Bungee", type: "Signboard", use: "matchday, countdowns, fixtures", fam: "Bungee", weight: 400, grp: "jersey" },
    galada: { label: "Galada", type: "Bangla stylish", use: "Bangla headlines with flair", fam: "Galada", weight: 400, grp: "bangla" },
    anek: { label: "Anek Bangla", type: "Bangla bold", use: "Bangla news and scores", fam: "Anek Bangla", weight: 800, grp: "bangla" },
    tiro: { label: "Tiro Bangla", type: "Bangla newspaper", use: "Bangla tributes, serious news", fam: "Tiro Bangla", weight: 400, wear: 0.5, grp: "bangla" },
  };
  BPG.FONT_GROUPS = {
    all: ["All fonts", "One font for each kind of post. Tap one to use it, ☆ to keep it in My fonts."],
    fav: ["★ My fonts", "Your starred fonts. Tap ☆ on any font to add it here."],
  };
  // How strongly the texture wears each group (thin letters fall apart at full strength).
  const WEAR = { grunge: 0.35, script: 0.4, serif: 0.6, brush: 0.7 };
  // Which scenario fits each Stylish card best, so the picker opens there.
  const KIND_SAMPLE = { runs: "219* RUNS!", wickets: "6 WKTS!", goal: "GOAL!", result: "WIN!", number: "950!" };
  BPG.HEAD_TEXTURES = { clean: ["Clean", 0], worn: ["Worn", 0.7], rough: ["Rough", 1.25] };
  const fontOf = (st) => BPG.HEAD_FONTS[st.hfont] || BPG.HEAD_FONTS.anton;
  // The texture is set per font and is off (Clean) until you turn it on for that font.
  const texOf = (st) => { const t = (st.htexBy || {})[BPG.HEAD_FONTS[st.hfont] ? st.hfont : "anton"]; return BPG.HEAD_TEXTURES[t] ? t : "clean"; };
  const stack = (f) => `"${f.fam}", ${BN}, Impact, sans-serif`;
  const LABEL_FAM = `"Oswald", ${BN}, "Arial Narrow", sans-serif`;

  // A font the canvas hasn't loaded yet draws as a plain fallback, so load it and redraw once it's ready.
  const asked = new Set();
  function ensure(spec) {
    if (!document.fonts || !document.fonts.check || asked.has(spec)) return;
    asked.add(spec);
    if (!document.fonts.check(spec)) document.fonts.load(spec).then(() => { if (BPG.draw) BPG.draw(); }, () => {});
  }

  // Wears the text away like an old print. A soft noise map decides where the wear gathers; there, lots of
  // small specks are erased, with a few bigger chips and thin scratches. Seeded by the text, so a card
  // never changes on redraw.
  function distress(c, box, size, level, seedText) {
    if (!level) return;
    let seed = 11; for (const ch of String(seedText)) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const { x, y, w, h } = box, u = size / 100;
    // Noise map: random values on a coarse grid, smoothly blended in between.
    const cell = size * 0.3, gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2, grid = [];
    for (let i = 0; i < gw * gh; i++) grid.push(rnd());
    const sm = (t) => t * t * (3 - 2 * t);
    const noise = (px, py) => {
      const fx = (px - x) / cell, fy = (py - y) / cell, ix = Math.floor(fx), iy = Math.floor(fy), tx = sm(fx - ix), ty = sm(fy - iy);
      const at = (a, b) => grid[Math.min(gh - 1, b) * gw + Math.min(gw - 1, a)];
      return (at(ix, iy) * (1 - tx) + at(ix + 1, iy) * tx) * (1 - ty) + (at(ix, iy + 1) * (1 - tx) + at(ix + 1, iy + 1) * tx) * ty;
    };
    c.save(); c.globalCompositeOperation = "destination-out";
    const step = Math.max(2, u * 2);
    for (let py = y; py < y + h; py += step) {
      for (let px = x; px < x + w; px += step) {
        const n = noise(px, py), p = Math.max(0, (n - 0.42) * 1.9) * level + 0.03 * level;
        if (rnd() > p) continue;
        const r = u * (0.3 + Math.pow(rnd(), 2.5) * 1.7 * (0.6 + n));
        c.globalAlpha = 0.75 + rnd() * 0.25;
        c.beginPath(); c.ellipse(px + (rnd() - 0.5) * step, py + (rnd() - 0.5) * step, r, r * (0.45 + rnd() * 0.55), rnd() * Math.PI, 0, Math.PI * 2); c.fill();
      }
    }
    // A few thin scratches.
    c.lineCap = "round";
    const scr = Math.round((w / size) * 1.2 * level);
    for (let i = 0; i < scr; i++) {
      const sx = x + rnd() * w, sy = y + rnd() * h, len = size * (0.1 + rnd() * 0.35), ang = (rnd() - 0.5) * 0.8;
      c.globalAlpha = 0.6 + rnd() * 0.4; c.lineWidth = u * (0.4 + rnd() * 0.9);
      c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + Math.cos(ang) * len * 0.5, sy + Math.sin(ang) * len * 0.5 + (rnd() - 0.5) * u * 6, sx + Math.cos(ang) * len, sy + Math.sin(ang) * len); c.stroke();
    }
    c.restore();
  }

  // Splits "*219* RUNS!" into words (starred ones in the accent colour) and lays them out on one line,
  // or two when one line would make the text too small. Returns { size, lines, capH }.
  function layoutBig(k, text, maxW, capMax, spec) {
    // text is a list of [words, inColour] pieces, or a string with *stars* typed by you.
    const ctx = k.ctx, words = typeof text === "string" ? k.richWords(bigCase(text))
      : text.flatMap(([t, hl]) => bigCase(t).split(/\s+/).filter(Boolean).map((w) => ({ w, hl })));
    ctx.font = spec(100); const capAt100 = ctx.measureText("H").actualBoundingBoxAscent || 72, sp = () => ctx.measureText(" ").width;
    const width = (ln, s) => { ctx.font = spec(s); return ln.reduce((a, wd, i) => a + ctx.measureText(wd.w).width + (i ? sp() : 0), 0); };
    const sizeFor = (lines, capT) => { let s = Math.round(capT / capAt100 * 100); const wMax = Math.max(...lines.map((ln) => width(ln, s))); if (wMax > maxW) s = Math.floor(s * maxW / wMax); return s; };
    const one = [words], s1 = sizeFor(one, capMax);
    if (words.length < 2 || s1 * capAt100 / 100 > capMax * 0.62) return { size: s1, lines: one, capH: s1 * capAt100 / 100 };
    // Two lines, split where they come out most even.
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const two = [words.slice(0, i), words.slice(i)], s = sizeFor(two, capMax * 0.8);
      if (!best || s > best.size) best = { size: s, lines: two };
    }
    return best.size > s1 ? { ...best, capH: best.size * capAt100 / 100 } : { size: s1, lines: one, capH: s1 * capAt100 / 100 };
  }

  // Draws the big headline centred, worn by the texture, with a soft shadow so it reads on the photo.
  function drawBig(k, g, lay, cx, base, lineH, spec, level) {
    const ctx = k.ctx, layer = document.createElement("canvas"); layer.width = g.W; layer.height = g.H;
    const c = layer.getContext("2d"); c.font = spec(lay.size); c.textBaseline = "alphabetic";
    try { c.letterSpacing = Math.round(lay.size * 0.01) + "px"; } catch (e) {}
    const sp = c.measureText(" ").width;
    let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity;
    lay.lines.forEach((ln, i) => {
      const y = base - (lay.lines.length - 1 - i) * lineH, total = ln.reduce((a, wd, j) => a + c.measureText(wd.w).width + (j ? sp : 0), 0);
      let x = cx - total / 2; left = Math.min(left, x); right = Math.max(right, x + total);
      top = Math.min(top, y - lay.capH * 1.25); bottom = Math.max(bottom, y + lay.size * 0.25);
      ln.forEach((wd) => { c.fillStyle = wd.hl ? g.accent : "#FFFFFF"; c.fillText(wd.w, x, y); x += c.measureText(wd.w).width + sp; });
    });
    distress(c, { x: left - 10, y: top, w: right - left + 20, h: bottom - top }, lay.size, level, lay.lines.flat().map((wd) => wd.w).join(" "));
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 4;
    ctx.drawImage(layer, 0, 0); ctx.restore();
  }

  // Small slanted label in the accent colour with the player's name, centred on cx. Returns its height.
  function nameLabel(k, g, text, cx, bottom) {
    const ctx = k.ctx, t = cap(text); if (!t) return 0;
    const size = k.fit(t, g.W - 2 * PAD - 80, 44, LABEL_FAM, 700, 26), h = Math.round(size * 1.45), sl = h * 0.28;
    ctx.font = k.font(size, LABEL_FAM, 700); k.spaced(2);
    const w = ctx.measureText(t).width + 56, x = cx - w / 2, y = bottom - h;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 16;
    ctx.fillStyle = g.accent; ctx.beginPath(); ctx.moveTo(x + sl, y); ctx.lineTo(x + w + sl, y); ctx.lineTo(x + w - sl, y + h); ctx.lineTo(x - sl, y + h); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = k.inkOn(g.accent); ctx.textAlign = "center"; ctx.fillText(t, cx, y + h / 2 + size * 0.36); ctx.textAlign = "left"; k.spaced(0);
    return h;
  }

  // "6/39 (24.4 OV) | 2nd Test | Mirpur", centred, with the bars in the accent colour.
  function infoLine(k, g, bits, cx, base) {
    const ctx = k.ctx; bits = bits.flatMap((b) => String(b || "").split("|")).map((b) => b.trim()).filter(Boolean);
    if (!bits.length) return;
    const parts = []; bits.forEach((b, i) => { if (i) parts.push(["  |  ", g.accent]); parts.push([cap(b), "rgba(255,255,255,0.94)"]); });
    ctx.font = k.font(32, LABEL_FAM, 500); k.spaced(1);
    const total = parts.reduce((a, [t]) => a + ctx.measureText(t).width, 0), sc = Math.min(1, (g.W - 2 * PAD) / total);
    ctx.font = k.font(Math.round(32 * sc), LABEL_FAM, 500);
    let x = cx - ctx.measureText(parts.map((p) => p[0]).join("")).width / 2;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 10;
    parts.forEach(([t, col]) => { ctx.fillStyle = col; ctx.fillText(t, x, base); x += ctx.measureText(t).width; });
    ctx.restore(); k.spaced(0);
  }

  // What each card puts in the label, the headline and the info line.
  const starred = (s) => (/\*/.test(s) ? s : `*${s}*`);
  const KINDS = {
    runs: (v) => ({ label: v("player"), big: [[v("runs"), true], [v("unit") || "RUNS!"]], info: [v("info")] }),
    wickets: (v) => ({ label: v("player"), big: [[v("wkts"), true], [v("unit") || "WICKETS!"]],
      info: [v("runs") !== "" ? `${v("wkts")}/${v("runs")}${v("overs") ? ` (${v("overs")} ov)` : ""}` : "", v("info")] }),
    goal: (v, g) => ({ label: v("player"), big: starred(g.big || "GOAL!"), info: [v("score"), v("minute"), v("info")] }),
    result: (v) => ({ label: v("tag"), big: [[v("winner"), true], [v("word") || "WIN!"]], info: [v("margin"), v("info")] }),
    number: (v) => ({ label: v("name"), big: [[v("number"), true], [v("unit")]], info: [v("info")] }),
  };

  L.grunge = {
    standard: false, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, st = BPG.state(), f = fontOf(st);
      // Gritty fonts are already worn and thin fonts break up, so the texture goes on lighter for them.
      const level = BPG.HEAD_TEXTURES[texOf(st)][1] * (f.wear != null ? f.wear : WEAR[f.grp] != null ? WEAR[f.grp] : 1);
      const v = (id) => String(g.val(id) == null ? "" : g.val(id)).trim(), parts = (KINDS[g.t.kind] || KINDS.runs)(v, g);
      const spec = (s) => `${f.style || "normal"} ${f.weight} ${s}px ${stack(f)}`;
      bigCase = f.title ? titleCase : cap;
      ensure(spec(100)); ensure(`700 40px ${LABEL_FAM}`); ensure(`500 40px ${LABEL_FAM}`);
      const cx = g.W / 2, hasInfo = parts.info.some(Boolean);
      // Bottom up: logo row, info line, the big headline, the name label. The photo fills the rest.
      const infoBase = g.footerY - 62, bigBase = (hasInfo ? infoBase - 52 : g.footerY - 70);
      const lay = layoutBig(k, parts.big, g.W - 2 * PAD, Math.round(g.W * 0.2), spec), lineH = lay.capH * 1.16;
      const bigTop = bigBase - lay.capH - (lay.lines.length - 1) * lineH;
      const labelBottom = bigTop - 26;
      const labelTop = parts.label ? labelBottom - 64 : bigTop;
      if (!k.bleedPhoto(g, labelTop - 30)) k.photoHint(g, g.st + (labelTop - g.st) / 2);
      k.header(g);
      drawBig(k, g, lay, cx, bigBase, lineH, spec, level);
      if (parts.label) nameLabel(k, g, parts.label, cx, labelBottom);
      infoLine(k, g, parts.info, cx, infoBase);
      k.brandCorner(g, g.footerY);
    },
  };

  // The font library shown in the form on these cards: scenario tabs, then a grid of tiles that each show
  // the headline in that font. Tap a tile to use it, tap ☆ to keep it in "My fonts". Remembered on this phone.
  BPG.fontPicker = (box, state, persist, draw, t) => {
    const kind = (t && t.kind) || "runs", favs = () => (Array.isArray(state.hfav) ? state.hfav : (state.hfav = []));
    if (!BPG.HEAD_FONTS[state.hfont]) state.hfont = "anton";
    let onFont = () => {};
    const d = document.createElement("div"); d.className = "field wide fontlib";
    const l = document.createElement("label"); const cur = document.createElement("span"); cur.className = "fontlib-cur";
    l.append("Headline font: ", cur);
    const tabs = document.createElement("div"); tabs.className = "seg fontlib-tabs"; tabs.setAttribute("role", "group"); tabs.setAttribute("aria-label", "Font scenario");
    const hint = document.createElement("p"); hint.className = "hint";
    const grid = document.createElement("div"); grid.className = "fontlib-grid";
    let grp = favs().length ? "fav" : "all";
    const showCur = () => { const f = BPG.HEAD_FONTS[state.hfont]; cur.textContent = `${f.label} (${f.type})`; };
    function render() {
      tabs.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.g === grp)));
      hint.textContent = BPG.FONT_GROUPS[grp][1];
      grid.innerHTML = "";
      const keys = Object.keys(BPG.HEAD_FONTS).filter((k) => (grp === "fav" ? favs().includes(k) : true));
      if (!keys.length) { const e = document.createElement("p"); e.className = "hint"; e.textContent = "No starred fonts yet. Open any group and tap ☆ on the ones you like."; grid.appendChild(e); }
      keys.forEach((key) => {
        const f = BPG.HEAD_FONTS[key], tile = document.createElement("div"); tile.className = "fontlib-tile";
        const pick = document.createElement("button"); pick.type = "button"; pick.setAttribute("aria-pressed", String(state.hfont === key));
        pick.setAttribute("aria-label", `${f.label}, ${f.type}`);
        const sample = document.createElement("span"); sample.className = "fontlib-sample"; sample.style.fontFamily = stack(f); sample.style.fontWeight = f.weight; sample.style.fontStyle = f.style || "normal";
        const smp = KIND_SAMPLE[kind] || "219* RUNS!";
        sample.textContent = f.grp === "bangla" ? "দারুণ জয়!" : f.title ? titleCase(smp) : smp;
        const name = document.createElement("span"); name.className = "fontlib-name"; name.innerHTML = ""; const ty = document.createElement("b"); ty.textContent = f.type; name.append(ty, ` · ${f.label}`, document.createElement("br"), f.use);
        pick.append(sample, name);
        pick.onclick = () => { state.hfont = key; persist(); showCur(); onFont(); grid.querySelectorAll(".fontlib-tile > button:first-child").forEach((x) => x.setAttribute("aria-pressed", String(x === pick))); draw(); };
        const star = document.createElement("button"); star.type = "button"; star.className = "fontlib-star";
        const on = favs().includes(key); star.textContent = on ? "★" : "☆"; star.setAttribute("aria-pressed", String(on));
        star.setAttribute("aria-label", (on ? "Remove from" : "Add to") + ` My fonts: ${f.label}`);
        star.onclick = () => { const list = favs(), i = list.indexOf(key); if (i >= 0) list.splice(i, 1); else list.push(key); persist(); render(); };
        tile.append(pick, star); grid.appendChild(tile);
        // Shrink the sample until it fits its tile, once the font has loaded.
        const fit = () => { let px = 26; sample.style.fontSize = px + "px"; while (sample.scrollWidth > sample.clientWidth + 1 && px > 13) sample.style.fontSize = --px + "px"; };
        requestAnimationFrame(fit);
        if (document.fonts && document.fonts.load) document.fonts.load(`${f.style || "normal"} ${f.weight} 26px "${f.fam}"`, sample.textContent).then(fit, () => {});
      });
    }
    Object.entries(BPG.FONT_GROUPS).forEach(([g, [lab]]) => {
      const b = document.createElement("button"); b.type = "button"; b.dataset.g = g; b.textContent = lab;
      b.onclick = () => { grp = g; render(); };
      tabs.appendChild(b);
    });
    showCur(); render();
    d.append(l, tabs, hint, grid);
    const tx = document.createElement("div"); tx.className = "field wide";
    const tl = document.createElement("label"); tl.textContent = "Texture";
    const seg = document.createElement("div"); seg.className = "seg"; seg.setAttribute("role", "group"); seg.setAttribute("aria-label", "Headline texture");
    const showTex = () => seg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.t === texOf(state))));
    Object.entries(BPG.HEAD_TEXTURES).forEach(([key, [lab]]) => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = lab; b.dataset.t = key;
      b.onclick = () => { state.htexBy = Object.assign({}, state.htexBy, { [state.hfont]: key }); persist(); showTex(); draw(); };
      seg.appendChild(b);
    });
    showTex(); onFont = showTex;
    const th = document.createElement("p"); th.className = "hint"; th.textContent = "Off (Clean) by default. Worn or Rough is remembered for this font only.";
    tx.append(tl, seg, th); box.append(d, tx);
  };
})();
