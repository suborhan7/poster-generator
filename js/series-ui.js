// The Series box: create a series, add fixtures, type or paste results, and jump to cards made from them.
window.BPG = window.BPG || {};

(() => {
  const S = BPG.series, $ = (id) => document.getElementById(id);
  const el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => { if (k === "on") Object.entries(v).forEach(([ev, fn]) => e.addEventListener(ev, fn)); else if (k in e && k !== "list") e[k] = v; else e.setAttribute(k, v); });
    kids.flat().forEach((c) => c != null && e.append(c));
    return e;
  };
  const field = (label, input, wide) => el("div", { className: "field" + (wide ? " wide" : "") }, el("label", { textContent: label, htmlFor: input.id || "" }), input);
  let creating = false, openMatch = null;

  const EXAMPLE = {
    cricket: "SL 182/8 (20)\nUdara 91(55) 8x4 5x6\nShaheen 3/24 (4)\nPAK 183/7 (19.2)\nBabar Azam 52(38) 5x4 2x6\nHasaranga 2/30 (4)\nPOTM: Babar Azam",
    football: "ARG 2-1 BRA\nMessi 67' ARG (Alvarez)\nAlvarez 81' ARG\nVinicius 74' BRA",
  };

  function datalists() {
    ["dl_players", "dl_teams"].forEach((id) => { if (!$(id)) document.body.append(el("datalist", { id })); });
    $("dl_players").replaceChildren(...S.playerNames().map((n) => el("option", { value: n })));
    $("dl_teams").replaceChildren(...S.teamNames().map((n) => el("option", { value: n })));
  }

  function newForm() {
    const name = el("input", { type: "text", id: "sr_name", placeholder: "PAK vs SL T20I series" });
    const sport = el("select", { id: "sr_sport" }, el("option", { value: "cricket", textContent: "Cricket" }), el("option", { value: "football", textContent: "Football" }));
    const overs = el("select", { id: "sr_overs" }, ...[["20", "T20"], ["50", "ODI"], ["10", "T10"], ["90", "Test"]].map(([v, t]) => el("option", { value: v, textContent: t })));
    const count = el("input", { type: "number", id: "sr_count", min: "1", max: "100", placeholder: "3" });
    const teams = el("input", { type: "text", id: "sr_teams", placeholder: "PAK, SL" });
    const go = el("button", { type: "button", className: "primary", textContent: "Create series", on: { click() {
      const list = teams.value.split(/[,\n]+/).map((x) => x.trim()).filter(Boolean);
      S.create({ name: name.value, sport: sport.value, overs: overs.value, teams: list, matches: count.value });
      const s = S.current(); const n = parseInt(count.value, 10) || 0;
      if (n && list.length === 2) for (let i = 0; i < n; i++) S.addMatch(s, { t1: BPG.teamName(list[0]) || list[0], t2: BPG.teamName(list[1]) || list[1] });
      creating = false; refresh(); BPG.app.draw();
    } } });
    sport.addEventListener("change", () => { overs.parentNode.hidden = sport.value === "football"; });
    return el("div", { className: "fields" }, field("Series or tournament name", name, true), field("Sport", sport), field("Format", overs),
      field("Teams (short names work, comma between)", teams, true), field("Number of matches (optional)", count),
      el("div", { className: "field wide row2" }, go, el("button", { type: "button", className: "ghost", textContent: "Cancel", on: { click() { creating = false; refresh(); } } })));
  }

  function matchRow(s, m) {
    const o = S.outcome(s, m), teams = [m.t1, m.t2].filter(Boolean).map((t) => BPG.teamShort(BPG.teamName(t) || t)).join(" vs ") || "Teams TBC";
    const when = [m.date, m.time && m.time + " BD", m.venue].filter(Boolean).join(" · ");
    const status = o ? (o.winner ? `${BPG.teamShort(o.winner)} won${o.margin ? " by " + o.margin : ""}` : o.text) : "No result yet";
    const open = openMatch === m.id;
    const row = el("div", { className: "match" + (open ? " open" : "") },
      el("button", { type: "button", className: "match-head", on: { click() { openMatch = open ? null : m.id; refresh(); } } },
        el("strong", { textContent: `Match ${m.no} · ${teams}` }), el("span", { textContent: status + (when ? " · " + when : "") })));
    if (!open) return row;

    const t1 = el("input", { type: "text", value: m.t1, list: "dl_teams", placeholder: "PAK" }); t1.setAttribute("list", "dl_teams");
    const t2 = el("input", { type: "text", value: m.t2, placeholder: "SL" }); t2.setAttribute("list", "dl_teams");
    const date = el("input", { type: "date", value: m.date }), time = el("input", { type: "time", value: m.time });
    const venue = el("input", { type: "text", value: m.venue, placeholder: "Gaddafi Stadium, Lahore" });
    const text = el("textarea", { rows: 7, value: m.text, placeholder: EXAMPLE[s.sport] });
    const note = el("p", { className: "hint" });
    const cards = el("div", { className: "cardlist" });
    const showCards = () => {
      const list = S.cardsFrom(s, m);
      cards.replaceChildren(...(list.length ? [el("span", { className: "label", textContent: "Make a card from this match" })] : []),
        ...list.map((c) => el("button", { type: "button", className: "ghost", textContent: c.label, on: { click() { BPG.app.open(c.tpl, c.values, c.big); window.scrollTo({ top: 0, behavior: "smooth" }); } } })));
    };
    const save = el("button", { type: "button", className: "primary", textContent: "Save match", on: { click() {
      Object.assign(m, { t1: BPG.teamName(t1.value) || t1.value.trim(), t2: BPG.teamName(t2.value) || t2.value.trim(), date: date.value, time: time.value, venue: venue.value.trim() });
      if (text.value.trim()) {
        const r = S.save_result(s, m, text.value), o2 = S.outcome(s, m);
        note.textContent = s.sport === "football"
          ? (r.score ? `Read ${o2.text} and ${r.goals.length} goal${r.goals.length === 1 ? "" : "s"}.` : "Couldn't find the score line, e.g. ARG 2-1 BRA.")
          : (r.innings.length === 2 ? `Read 2 innings, ${r.bat.length} batters, ${r.bowl.length} bowlers. ${o2 && o2.winner ? o2.winner + " won by " + o2.margin + "." : ""}` : "Need two score lines like PAK 183/7 (19.2).");
      } else { m.result = null; m.text = ""; S.save(); note.textContent = "Fixture saved."; }
      datalists(); showCards(); BPG.app.draw();
      row.querySelector(".match-head span").textContent = "Saved";
    } } });
    const del = el("button", { type: "button", className: "ghost", textContent: "Delete match", on: { click() {
      if (del.dataset.sure) { S.removeMatch(s, m.id); openMatch = null; refresh(); BPG.app.draw(); } else { del.dataset.sure = "1"; del.textContent = "Tap again to delete"; }
    } } });
    showCards();
    row.append(el("div", { className: "fields" }, field("Team 1", t1), field("Team 2", t2), field("Date", date), field("Time (BD)", time), field("Venue", venue, true),
      field(s.sport === "football" ? "Result: score line, then one goal per line" : "Result: one line per innings, batter or bowler (paste from Cricbuzz works line by line)", text, true),
      el("div", { className: "field wide row2" }, save, del), el("div", { className: "field wide" }, note, cards)));
    return row;
  }

  function refresh() {
    datalists();
    const box = $("seriesBox"), st = BPG.app.state();
    box.hidden = st.cat !== "series";
    if (box.hidden) return;
    const s = S.current();
    const pick = el("select", { id: "sr_pick", on: { change(e) { S.select(e.target.value); openMatch = null; refresh(); BPG.app.draw(); } } },
      ...S.all().map((x) => el("option", { value: x.id, textContent: x.name, selected: s && x.id === s.id })));
    const head = el("div", { className: "row2" }, S.all().length ? pick : el("span", { className: "hint", textContent: "No series yet." }),
      el("button", { type: "button", className: "ghost", textContent: "+ New series", on: { click() { creating = true; refresh(); } } }));
    const parts = [el("span", { className: "label", textContent: "Your series" }), head];
    if (creating || !s) parts.push(creating ? newForm() : el("p", { className: "hint", textContent: "Make one for a series or tournament. Add results after each match and the leaderboards, points table and series score fill themselves." }));
    if (s && !creating) {
      parts.push(el("p", { className: "hint", textContent: `${s.sport === "football" ? "Football" : "Cricket"} · ${s.teams.map((t) => BPG.teamShort(t)).join(", ") || "no teams yet"} · ${s.matches.filter((m) => m.result).length}/${s.total || s.matches.length} played` }));
      parts.push(el("div", { className: "matches" }, ...s.matches.map((m) => matchRow(s, m))));
      parts.push(el("div", { className: "row2" },
        el("button", { type: "button", className: "ghost", textContent: "+ Add match", on: { click() { const last = s.matches[s.matches.length - 1] || {}; const m = S.addMatch(s, { t1: last.t1 || s.teams[0] || "", t2: last.t2 || s.teams[1] || "" }); openMatch = m.id; refresh(); } } }),
        el("button", { type: "button", className: "ghost", textContent: "Backup", on: { click: backup } }),
        el("label", { className: "ghost filebtn", textContent: "Restore" }, el("input", { type: "file", accept: "application/json,.json", hidden: true, on: { change: restore } }))));
      const del = el("button", { type: "button", className: "ghost danger", textContent: "Delete this series", on: { click() {
        if (del.dataset.sure) { S.remove(s.id); refresh(); BPG.app.draw(); } else { del.dataset.sure = "1"; del.textContent = "Tap again to delete " + s.name; }
      } } });
      parts.push(del);
    }
    box.replaceChildren(...parts);
  }

  async function backup() {
    const blob = new Blob([S.backup()], { type: "application/json" }), name = `borhan-series-${new Date().toISOString().slice(0, 10)}.json`;
    try {
      const d = window.claude && window.claude.use ? await window.claude.use("downloads") : null;
      if (d) { await d.save({ filename: name, data: blob }); return; }
    } catch (e) {}
    const a = el("a", { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove();
  }
  function restore(e) {
    const f = e.target.files[0]; if (!f) return;
    f.text().then((t) => { S.restore(t); refresh(); BPG.app.draw(); }).catch(() => { e.target.closest("section").querySelector(".hint").textContent = "That file isn't a series backup."; });
  }

  BPG.seriesUI = { refresh };
  refresh(); BPG.app.draw();
})();
