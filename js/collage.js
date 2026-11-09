// Photo collage cards: 2, 3 or 4 photos on one card (side by side, top and bottom, before / after,
// one big plus small ones, a 2 x 2 grid). The photos fill the card with a thin gap between them and
// fade into dark only behind the text at the bottom, like every other photo card.
// The photos come from the "Collage photos" picker (app.js), held in g.collage: [{ img, adj }, ...].
window.BPG = window.BPG || {};

(function () {
  const L = BPG.LAYOUTS, T = BPG.TEMPLATES, PAD = 56, GAP = 8;
  const cap = (s) => String(s == null ? "" : s).toUpperCase();

  // Cell boxes as fractions of the photo area (x, y, w, h). The area runs from the top of the card
  // down into the text fade, so cells that touch the bottom are a little taller to make up for it.
  const SHAPES = {
    duo: [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]],
    stack: [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]],
    trio: [[0, 0, 0.6, 1], [0.6, 0, 0.4, 0.5], [0.6, 0.5, 0.4, 0.5]],
    row3: [[0, 0, 1 / 3, 1], [1 / 3, 0, 1 / 3, 1], [2 / 3, 0, 1 / 3, 1]],
    grid4: [[0, 0, 0.5, 0.46], [0.5, 0, 0.5, 0.46], [0, 0.46, 0.5, 0.54], [0.5, 0.46, 0.5, 0.54]],
    big3: [[0, 0, 0.62, 1], [0.62, 0, 0.38, 0.32], [0.62, 0.32, 0.38, 0.32], [0.62, 0.64, 0.38, 0.36]],
  };
  BPG.COLLAGE_SHAPES = SHAPES;

  // One photo inside its cell, the player found and framed by k.place, then that photo's own zoom / move.
  function cell(k, g, p, x, y, w, h, n, bottomFade) {
    const ctx = k.ctx;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    if (p && p.img) {
      const a = Object.assign({ zoom: 1, offx: 0, offy: 0 }, p.adj); a.zoom = Math.max(1, a.zoom); // never smaller than the cell, so no empty strips
      // Head near the top of the cell; the player fills down to where the text fade starts.
      const head = y < g.st ? g.st - y + (g.logoTop ? 120 : 50) : 40;
      const pl = k.place(p.img, w, h, a, head, Math.max(head + 120, Math.min(h, bottomFade - y) - 30));
      ctx.drawImage(p.img, x + pl.x, y + pl.y, pl.dw, pl.dh);
      if (BPG.grain && BPG.proFinish && BPG.proFinish()) BPG.grain(ctx, x, y, w, h);
    } else {
      // Empty slot: a soft tile that says which photo goes there.
      ctx.fillStyle = k.hexA("#FFFFFF", 0.06); ctx.fillRect(x, y, w, h);
      const cy = Math.min(y + h / 2, bottomFade - 160);
      ctx.font = k.font(34, k.C, 700); ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText("+ Photo " + n, x + w / 2, Math.max(y + 60, cy)); ctx.textAlign = "left";
    }
    ctx.restore();
  }

  // Small label chip at the top of a cell, e.g. BEFORE / AFTER or 2015 / 2026.
  function chip(k, g, text, x, y, colour) {
    const ctx = k.ctx; text = cap(text).trim(); if (!text) return;
    ctx.save(); ctx.font = k.font(30, k.C, 700); k.spaced(4);
    const tw = Math.min(ctx.measureText(text).width, 360), h = 48, w = tw + 36;
    ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 14;
    ctx.fillStyle = colour; k.roundRect(x, y, w, h, 10); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = k.inkOn(colour); ctx.fillText(text, x + 18, y + 34, 360); k.spaced(0); ctx.restore();
  }

  // The whole collage: cells, then the fade into the text area (same fade as k.bleedPhoto).
  function drawCollage(k, g, shape, textTop) {
    const ctx = k.ctx, pics = g.collage || [], cells = SHAPES[shape];
    const bh = Math.min(g.H, textTop + 80), shade = (g.shade || 0);
    ctx.fillStyle = g.bg; ctx.fillRect(0, 0, g.W, bh);
    const boxes = cells.map(([fx, fy, fw, fh]) => {
      const x = Math.round(fx * g.W), y = Math.round(fy * bh), r = Math.round((fx + fw) * g.W), b = Math.round((fy + fh) * bh);
      // A thin gap between photos; none along the card's edges.
      const l = x + (fx > 0 ? GAP / 2 : 0), t = y + (fy > 0 ? GAP / 2 : 0);
      return { x: l, y: t, w: r - (fx + fw < 0.999 ? GAP / 2 : 0) - l, h: b - (fy + fh < 0.999 ? GAP / 2 : 0) - t };
    });
    boxes.forEach((bx, i) => cell(k, g, pics[i], bx.x, bx.y, bx.w, bx.h, i + 1, textTop - 120));
    if (shade > 0) { ctx.fillStyle = k.hexA(g.bg, Math.min(0.9, shade)); ctx.fillRect(0, 0, g.W, bh); }
    // Fade into dark only behind the text, a little shorter than on one-photo cards so the lower photos stay clear.
    const from = Math.round(textTop - 300), to = Math.round(textTop + 40), gr = ctx.createLinearGradient(0, from, 0, to);
    gr.addColorStop(0, k.hexA(g.bg, 0)); gr.addColorStop(0.4, k.hexA(g.bg, 0.3)); gr.addColorStop(0.75, k.hexA(g.bg, 0.8)); gr.addColorStop(1, k.hexA(g.bg, 1));
    ctx.fillStyle = gr; ctx.fillRect(0, from, g.W, to - from);
    ctx.fillStyle = g.bg; ctx.fillRect(0, to - 2, g.W, g.H - to + 2);
    const top = ctx.createLinearGradient(0, 0, 0, g.st + 120);
    top.addColorStop(0, k.hexA(g.bg, 0.45)); top.addColorStop(1, k.hexA(g.bg, 0));
    ctx.fillStyle = top; ctx.fillRect(0, 0, g.W, g.st + 120);
    // Labels on the photos, if typed (comma between): one per photo, in order.
    const labels = String(g.val("labels") || "").split(",").map((s) => s.trim());
    const second = BPG.TEAM_COLORS && g.hot ? g.hot : "#FFFFFF";
    boxes.forEach((bx, i) => { if (labels[i]) chip(k, g, labels[i], bx.x + 24, Math.max(bx.y, g.st - 20) + 24 + (g.logoTop && bx.y < g.st ? 90 : 0), i % 2 ? second : g.accent); });
    if (g.sweep && !g.swept) { g.swept = true; k.paintSweep(g, textTop - 90, "right"); }
    return true;
  }

  function collageLayout(shape) {
    return {
      standard: false,
      draw(k, g) {
        const { photoCard, B } = BPG.blocks;
        photoCard(k, g, [
          B.tag(k, g, g.val("tag")),
          B.head(k, g, g.val("headline"), 92, 2, 52),
          B.text(k, g, g.val("text"), 36, 2),
        ], { drawPhoto: (top) => drawCollage(k, g, shape, top) });
      },
    };
  }
  Object.keys(SHAPES).forEach((s) => { L["collage_" + s] = collageLayout(s); });

  const base = (tag, head, text, labels) => [
    ["tag", "Small heading (optional)", tag, true],
    ["headline", "Headline (*stars* colour words)", head, true],
    ["text", "Line under it (optional)", text, true, "area"],
    ["labels", "Labels on the photos (optional, comma between)", labels, true],
    ["info", "Info line (optional, bottom left)", "", true],
  ];
  const hint = (n) => `Pick up to ${n} photos under Collage photos. Tap a photo there to move it with the zoom and move sliders; the arrows change the order.`;
  Object.assign(T, {
    col_duo: { cat: "collage", name: "2 side by side", layout: "collage_duo", collage: 2, hint: hint(2),
      fields: base("Tonight's heroes", "*SHAKIB* AND *MIRAZ* DID IT", "", "") },
    col_ba: { cat: "collage", name: "Before / after", layout: "collage_duo", collage: 2, hint: hint(2),
      fields: base("Then and now", "FROM DEBUT TO *CAPTAIN*", "", "2015, 2026") },
    col_stack: { cat: "collage", name: "2 top and bottom", layout: "collage_stack", collage: 2, hint: hint(2),
      fields: base("Match moments", "THE CATCH THAT *WON IT*", "", "") },
    col_trio: { cat: "collage", name: "1 big + 2", layout: "collage_trio", collage: 3, hint: hint(3),
      fields: base("Player of the match", "*MEHIDY* SHOW IN MIRPUR", "", "") },
    col_row3: { cat: "collage", name: "3 in a row", layout: "collage_row3", collage: 3, hint: hint(3),
      fields: base("Top 3 of the series", "THE *BIG THREE*", "", "") },
    col_grid4: { cat: "collage", name: "4 grid", layout: "collage_grid4", collage: 4, hint: hint(4),
      fields: base("Best moments", "A NIGHT TO *REMEMBER*", "", "") },
    col_big3: { cat: "collage", name: "1 big + 3", layout: "collage_big3", collage: 4, hint: hint(4),
      fields: base("Matchday", "*TIGERS* WIN THE SERIES", "", "") },
  });
})();
