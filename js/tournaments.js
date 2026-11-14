// Tournaments section: each tournament gets its own set of cards in its own look, with its logo
// kept on the phone once. To add a tournament, add an entry to BPG.TOURNAMENTS below.
//   name     shown on the tournament button
//   edition  the default "Tournament" line on its cards (shown when no logo is added)
//   bg       the card colour (the ribbons and dial ring sit on top of it)
//   cards    which tournament-look cards it has (keys of BPG.TEMPLATES to copy)
//   example  example values that fit this tournament, per field id
window.BPG = window.BPG || {};

BPG.TOURNAMENTS = {
  saff: {
    name: "SAFF Championship", edition: "SAFF Championship 2026", bg: "#1640C8",
    cards: ["matchcard", "lineup", "pitch", "fixtures", "tgroup", "tstats", "h2h", "poll", "tframe"],
    example: { t1: "Bangladesh", t2: "India", team: "Bangladesh", opp: "India" },
  },
};

(function () {
  const L = BPG.LAYOUTS, T = BPG.TEMPLATES, PAD = 56;
  const cap = (s) => String(s == null ? "" : s).toUpperCase();
  const full = (n) => (BPG.teamName && BPG.teamName(n)) || String(n || "").trim();

  // ---------- Group table (tournament look) ----------
  // One team per line: Team | P | W | D | L | GD | Pts. The top two rows (or "qualify" count) are highlighted.
  L.tgroup = {
    standard: false, tourLook: true, ownSweep: true,
    draw(k, g) {
      const ctx = k.ctx, { W } = g, { tourBg, teamBadge, C } = BPG.tour, { top, glass, bottom } = BPG.tour2, tall = g.H / W > 1.5;
      tourBg(k, g, true);
      const y0 = top(k, g, g.val("title") || "Group A");
      const rows = String(g.val("rows") || "").split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((r) => r[0]).slice(0, 8);
      const cols = ["P", "W", "D", "L", "GD", "PTS"], q = parseInt(g.val("qualify"), 10);
      const nq = isNaN(q) ? 2 : q;
      const pTop = y0 + (tall ? 50 : 36), pBot = g.footerY - 70, hh = 56;
      const rh = Math.min(tall ? 210 : 160, (pBot - pTop - hh - 20) / Math.max(1, rows.length));
      glass(k, 60, pTop, W - 120, hh + rows.length * rh + 20, 30);
      const cw = tall ? 84 : 76, cx0 = W - 100 - cw * (cols.length - 1);
      ctx.save();
      ctx.font = k.font(24, k.C, 700); k.spaced(3); ctx.fillStyle = C.cream; ctx.textAlign = "center";
      cols.forEach((c, i) => ctx.fillText(c, cx0 + i * cw, pTop + 40));
      ctx.textAlign = "left"; ctx.fillText("TEAM", 100, pTop + 40); k.spaced(0);
      rows.forEach((r, i) => {
        const y = pTop + hh + i * rh, cy = y + rh / 2, inQ = i < nq;
        if (inQ) { ctx.fillStyle = "rgba(255,210,63,0.16)"; k.roundRect(72, y + 4, W - 144, rh - 8, 18); ctx.fill(); ctx.fillStyle = C.gold; k.roundRect(72, y + 14, 8, rh - 28, 4); ctx.fill(); }
        else if (i) { ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(90, y, W - 180, 2); }
        const fs = Math.min(rh * 0.62, 84);
        teamBadge(k, g, 104 + fs * 0.5, cy, fs, r[0], null);
        const nm = cap(full(r[0])), nx = 104 + fs + 22;
        ctx.textAlign = "left"; ctx.font = k.font(k.fit(nm, cx0 - nx - cw * 0.85, Math.round(rh * 0.34), k.D, "", 20), k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(nm, nx, cy + rh * 0.12);
        ctx.textAlign = "center";
        cols.forEach((c, j) => {
          const v = r[j + 1] == null ? "" : r[j + 1], last = j === cols.length - 1;
          ctx.font = last ? k.font(Math.round(rh * 0.36), k.D) : k.font(Math.round(rh * 0.27), k.C, 700);
          ctx.fillStyle = last ? (inQ ? C.gold : "#FFFFFF") : "rgba(255,255,255,0.88)";
          ctx.fillText(String(v), cx0 + j * cw, cy + rh * (last ? 0.13 : 0.1));
        });
      });
      ctx.restore();
      bottom(k, g);
    },
  };
  T.tgroup = { cat: "football", name: "Group table (tournament look)", layout: "tgroup", noMain: true, photo3: "Tournament logo (optional, kept on this phone)",
    hint: "One team per line: Team | P | W | D | L | GD | Pts, top of the table first. The top rows that go through are highlighted.",
    fields: [["tournament","Tournament","SAFF Championship 2026",true],["title","Heading","Group A"],
      ["rows","Table","Bangladesh | 2 | 2 | 0 | 0 | +3 | 6\nBhutan | 2 | 1 | 0 | 1 | 0 | 3\nMaldives | 2 | 0 | 1 | 1 | -1 | 1\nSri Lanka | 2 | 0 | 1 | 1 | -2 | 1",true,"area"],
      ["qualify","How many go through","2"],["info","Info line (optional)","After match day 2",true],["bgc","Card colour (optional)",""]] };

  // ---------- The section and its cards ----------
  // Each tournament gets a copy of each card, filled with its own name and colour.
  BPG.CATS = Object.assign({}, ...Object.entries(BPG.CATS).flatMap(([k, v]) => k === "football" ? [{ [k]: v }, { tour: "Tournaments" }] : [{ [k]: v }]));
  Object.entries(BPG.TOURNAMENTS).forEach(([id, tr]) => {
    tr.cards.forEach((base) => {
      const b = T[base]; if (!b) return;
      const name = b.name.replace(/\s*\(tournament look\)/i, "").replace(/^Tournament photo frame$/, "Photo frame");
      const fields = b.fields.map((f) => {
        const c = f.slice();
        if (c[0] === "tournament") { c[2] = tr.edition; c[1] = "Tournament (shows when no logo is added)"; }
        if (c[0] === "bgc") c[2] = "";
        if (tr.example && tr.example[c[0]] !== undefined && /^(t1|t2|team|opp)$/.test(c[0]) && !["pitch", "lineup", "tstats", "matchcard"].includes(base)) c[2] = tr.example[c[0]];
        return c;
      });
      T[`${id}_${base}`] = Object.assign({}, b, { cat: "tour", tour: id, name, fields,
        photo3: `${tr.name} logo (add it once, every ${tr.name} card uses it)` });
    });
  });
})();
