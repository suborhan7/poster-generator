// Series mode: keep a tournament or series (teams, fixtures, results) on your phone,
// then make leaderboards, points tables, series-score and match-preview posters from it.
// Everything is saved in this browser only. Use Backup in the Series box to keep a copy.
window.BPG = window.BPG || {};

(function () {
  const KEY = "bpg_series";
  const S = (BPG.series = {});
  const uid = () => Math.random().toString(36).slice(2, 9);
  const cap = (s) => String(s == null ? "" : s).toUpperCase();
  const full = (s) => (BPG.teamName && BPG.teamName(s)) || String(s || "").trim();
  const short = (s) => (BPG.teamShort ? BPG.teamShort(full(s)) : cap(s).slice(0, 3));
  const sameTeam = (a, b) => a && b && full(a).toLowerCase() === full(b).toLowerCase();
  const balls = (o) => { const [a, b] = String(o || "0").split("."); return (parseInt(a, 10) || 0) * 6 + (parseInt(b, 10) || 0); };
  const oversOf = (b) => `${Math.floor(b / 6)}${b % 6 ? "." + (b % 6) : ""}`;

  // ---------- Storage ----------
  let db = { list: [], current: null };
  try { db = Object.assign(db, JSON.parse(localStorage.getItem(KEY) || "null") || {}); } catch (e) {}
  S.save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
  S.all = () => db.list;
  S.current = () => db.list.find((x) => x.id === db.current) || null;
  S.select = (id) => { db.current = id; S.save(); };
  S.create = ({ name, sport, overs, teams, matches }) => {
    const s = { id: uid(), name: name.trim() || "New series", sport: sport || "cricket", overs: parseInt(overs, 10) || 20,
      teams: teams.map(full).filter(Boolean), players: {}, total: parseInt(matches, 10) || 0, matches: [] };
    db.list.unshift(s); db.current = s.id; S.save(); return s;
  };
  S.remove = (id) => { db.list = db.list.filter((x) => x.id !== id); if (db.current === id) db.current = db.list[0] ? db.list[0].id : null; S.save(); };
  S.addMatch = (s, m) => { const x = Object.assign({ id: uid(), no: s.matches.length + 1, date: "", time: "", venue: "", t1: "", t2: "", text: "", result: null }, m); s.matches.push(x); S.save(); return x; };
  S.removeMatch = (s, id) => { s.matches = s.matches.filter((m) => m.id !== id); s.matches.forEach((m, i) => { m.no = i + 1; }); S.save(); };
  S.backup = () => JSON.stringify(db, null, 1);
  S.restore = (json) => { const d = JSON.parse(json); if (!Array.isArray(d.list)) throw new Error("Not a series backup"); db = d; S.save(); };

  // Every player we have seen, for the name suggestions in the form.
  S.playerNames = () => { const s = S.current(); return s ? Object.keys(s.players).sort() : []; };
  S.teamNames = () => { const s = S.current(); return s ? s.teams.slice() : []; };

  // ---------- Reading a typed or pasted result ----------
  // Cricket, one thing per line:
  //   PAK 183/7 (19.2)          an innings: the lines under it are that team's batters and the other team's bowlers
  //   Babar Azam 52(38) 5x4 2x6 a batter
  //   Shaheen Afridi 3/24 (4)   a bowler
  //   POTM: Babar Azam          player of the match
  // Football:
  //   ARG 2-1 BRA               the score
  //   Messi 67' ARG             a goal (team after the minute, or put goals under a line saying just "ARG")
  // A series team named anywhere in the line, by full name or short form.
  const teamIn = (s, line) => {
    const l = " " + line.toLowerCase() + " ";
    return s.teams.find((t) => l.includes(" " + t.toLowerCase() + " ") || new RegExp("\\s" + short(t).toLowerCase() + "\\s").test(l)) || "";
  };
  S.parseResult = (s, text) => {
    const lines = String(text || "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const r = { innings: [], bat: [], bowl: [], goals: [], potm: "", note: "", score: null };
    let cur = null, goalTeam = "";
    for (const line of lines) {
      const potm = line.match(/^(?:potm|pom|player of the match|mom|man of the match)\s*[:\-]?\s*(.+)$/i);
      if (potm) { r.potm = potm[1].trim(); continue; }
      if (/\b(won|win|wins|beat|tied|no result|abandoned|draw)\b/i.test(line) && !/\d+\s*\(/.test(line)) { r.note = line; continue; }
      // Score lines for any team name, including clubs the short-name list doesn't know (e.g. Rangpur Riders 183/7 (19.2)).
      const inn = line.match(/^(.+?)\s+(\d{1,3})\s*\/\s*(\d{1,2})\s*(?:\(\s*([\d.]+)\s*(?:ov|overs?)?\s*\))?$/i);
      if (inn && s.sport !== "football" && !/\d/.test(inn[1]) && (teamIn(s, inn[1]) || BPG.teamName(inn[1]) || (+inn[2] > 10 && +inn[2] > +inn[3]))) {
        cur = { team: full(inn[1]), runs: +inn[2], wkts: +inn[3], balls: balls(inn[4]), overs: inn[4] || "" };
        r.innings.push(cur); continue;
      }
      const fs = line.match(/^(.+?)\s+(\d{1,2})\s*-\s*(\d{1,2})\s+(.+)$/);
      if (fs && s.sport === "football" && !/\d/.test(fs[1] + fs[4])) { r.score = { t1: full(fs[1]), g1: +fs[2], t2: full(fs[4]), g2: +fs[3] }; continue; }
      const p = BPG.quickParse(line), known = teamIn(s, line);
      if (known && !p.team) p.team = known;
      if (known && p.player) p.player = p.player.replace(new RegExp("\\b" + known.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i"), "").trim();
      if (s.sport === "football") {
        if (p.goals1 !== undefined) { r.score = { t1: p.team, g1: +p.goals1, t2: p.opp, g2: +p.goals2 }; continue; }
        if (!p.minute && !p.player && p.team) { goalTeam = p.team; continue; }
        if (p.minute && p.player) {
          const assist = (line.match(/\((?:assist[: ]*)?([^)]+)\)/i) || [])[1] || "";
          const name = assist ? p.player.replace(new RegExp(assist.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i"), "").trim() : p.player;
          r.goals.push({ player: name, team: p.team || goalTeam, minute: p.minute, assist: assist.trim(), og: /\bog\b|own goal/i.test(line) });
        }
        continue;
      }
      if (p.score && p.team) {
        const [runs, wk] = p.score.split("/").map(Number);
        cur = { team: p.team, runs, wkts: wk, balls: balls(p.scoreOvers), overs: p.scoreOvers || "" };
        r.innings.push(cur); continue;
      }
      if (!p.player) continue;
      if (p.runs !== undefined) {
        r.bat.push({ player: p.player, team: p.team || (cur && cur.team) || "", runs: parseInt(p.runs, 10) || 0, notOut: String(p.runs).includes("*"),
          balls: parseInt(p.balls, 10) || 0, fours: parseInt(p.fours, 10) || 0, sixes: parseInt(p.sixes, 10) || 0 });
      } else if (p.wkts !== undefined) {
        const other = cur ? (s.teams.find((t) => !sameTeam(t, cur.team)) || "") : "";
        r.bowl.push({ player: p.player, team: p.team || other, wkts: +p.wkts, runs: +p.given, balls: balls(p.overs), overs: p.overs || "" });
      }
    }
    return r;
  };

  // Who won, and by how much.
  S.outcome = (s, m) => {
    const r = m.result; if (!r) return null;
    if (s.sport === "football") {
      if (!r.score) return null;
      const { t1, g1, t2, g2 } = r.score;
      const text = `${full(t1)} ${g1}-${g2} ${full(t2)}`;
      return g1 === g2 ? { draw: true, text } : { winner: g1 > g2 ? full(t1) : full(t2), loser: g1 > g2 ? full(t2) : full(t1), margin: `${Math.max(g1, g2)}-${Math.min(g1, g2)}`, text };
    }
    const [a, b] = r.innings;
    if (/no result|abandoned/i.test(r.note || "")) return { nr: true, text: "No result" };
    if (!a || !b) return null;
    if (a.runs === b.runs) return { tie: true, text: "Match tied" };
    if (b.runs > a.runs) return { winner: full(b.team), loser: full(a.team), margin: `${10 - b.wkts} wicket${10 - b.wkts === 1 ? "" : "s"}` };
    return { winner: full(a.team), loser: full(b.team), margin: `${a.runs - b.runs} run${a.runs - b.runs === 1 ? "" : "s"}` };
  };
  S.save_result = (s, m, text) => {
    m.text = text; m.result = S.parseResult(s, text);
    const add = (name, team) => { if (name) s.players[name] = full(team) || s.players[name] || ""; };
    m.result.bat.forEach((b) => add(b.player, b.team)); m.result.bowl.forEach((b) => add(b.player, b.team));
    m.result.goals.forEach((g) => { add(g.player, g.team); if (g.assist) add(g.assist, g.team); });
    const teams = m.result.innings.map((i) => i.team).concat(m.result.score ? [m.result.score.t1, m.result.score.t2] : []);
    teams.map(full).forEach((t) => { if (t && !s.teams.some((x) => sameTeam(x, t))) s.teams.push(t); });
    if (!m.t1 && teams[0]) { m.t1 = full(teams[0]); m.t2 = full(teams[1] || ""); }
    S.save(); return m.result;
  };

  // ---------- Numbers ----------
  const played = (s) => s.matches.filter((m) => m.result && S.outcome(s, m));

  S.batting = (s) => {
    const by = {};
    played(s).forEach((m) => m.result.bat.forEach((b) => {
      const x = (by[b.player] = by[b.player] || { name: b.player, team: b.team || s.players[b.player], runs: 0, inns: 0, outs: 0, balls: 0, fours: 0, sixes: 0, hs: 0, hsNo: false, fifties: 0, hundreds: 0 });
      x.runs += b.runs; x.inns++; x.outs += b.notOut ? 0 : 1; x.balls += b.balls; x.fours += b.fours; x.sixes += b.sixes;
      if (b.runs > x.hs || (b.runs === x.hs && b.notOut)) { x.hs = b.runs; x.hsNo = b.notOut; }
      if (b.runs >= 100) x.hundreds++; else if (b.runs >= 50) x.fifties++;
    }));
    return Object.values(by).map((x) => Object.assign(x, { avg: x.outs ? x.runs / x.outs : null, sr: x.balls ? (x.runs / x.balls) * 100 : null }))
      .sort((a, b) => b.runs - a.runs || (b.sr || 0) - (a.sr || 0));
  };
  S.bowling = (s) => {
    const by = {};
    played(s).forEach((m) => m.result.bowl.forEach((b) => {
      const x = (by[b.player] = by[b.player] || { name: b.player, team: b.team || s.players[b.player], wkts: 0, runs: 0, balls: 0, inns: 0, best: null });
      x.wkts += b.wkts; x.runs += b.runs; x.balls += b.balls; x.inns++;
      if (!x.best || b.wkts > x.best.w || (b.wkts === x.best.w && b.runs < x.best.r)) x.best = { w: b.wkts, r: b.runs };
    }));
    return Object.values(by).map((x) => Object.assign(x, { econ: x.balls ? x.runs / (x.balls / 6) : null, avg: x.wkts ? x.runs / x.wkts : null }))
      .sort((a, b) => b.wkts - a.wkts || (a.econ || 99) - (b.econ || 99));
  };
  S.scorers = (s, kind) => {
    const by = {};
    played(s).forEach((m) => m.result.goals.forEach((g) => {
      const name = kind === "assists" ? g.assist : g.og ? "" : g.player; if (!name) return;
      const x = (by[name] = by[name] || { name, team: g.team || s.players[name], n: 0 }); x.n++;
    }));
    return Object.values(by).sort((a, b) => b.n - a.n);
  };

  // Points table. Cricket: 2 for a win, 1 for a tie or no result, net run rate. Football: 3/1/0, goal difference.
  S.table = (s) => {
    const rows = {}, row = (t) => (rows[full(t)] = rows[full(t)] || { team: full(t), p: 0, w: 0, l: 0, d: 0, pts: 0, rf: 0, bf: 0, ra: 0, bb: 0, gf: 0, ga: 0 });
    s.teams.forEach(row);
    played(s).forEach((m) => {
      const o = S.outcome(s, m), r = m.result;
      if (s.sport === "football") {
        const { t1, g1, t2, g2 } = r.score, A = row(t1), B = row(t2);
        A.p++; B.p++; A.gf += g1; A.ga += g2; B.gf += g2; B.ga += g1;
        if (g1 === g2) { A.d++; B.d++; A.pts++; B.pts++; } else if (g1 > g2) { A.w++; B.l++; A.pts += 3; } else { B.w++; A.l++; B.pts += 3; }
        return;
      }
      const [a, b] = r.innings, A = row(a.team), B = row(b.team), q = s.overs * 6;
      A.p++; B.p++;
      if (o.nr || o.tie) { A.d++; B.d++; A.pts++; B.pts++; } else { row(o.winner).w++; row(o.winner).pts += 2; row(o.loser).l++; }
      if (o.nr) return;
      const fa = a.wkts >= 10 ? q : a.balls || q, fb = b.wkts >= 10 ? q : b.balls || q;
      A.rf += a.runs; A.bf += fa; A.ra += b.runs; A.bb += fb;
      B.rf += b.runs; B.bf += fb; B.ra += a.runs; B.bb += fa;
    });
    return Object.values(rows).map((x) => Object.assign(x, {
      nrr: x.bf && x.bb ? (x.rf / (x.bf / 6)) - (x.ra / (x.bb / 6)) : 0, gd: x.gf - x.ga,
    })).sort((a, b) => b.pts - a.pts || (s.sport === "football" ? b.gd - a.gd || b.gf - a.gf : b.nrr - a.nrr));
  };

  // "PAK lead 2-1", "Series level 1-1", "PAK win the series 3-0".
  S.seriesLine = (s) => {
    const wins = {}; s.teams.forEach((t) => { wins[t] = 0; });
    const games = played(s); games.forEach((m) => { const o = S.outcome(s, m); if (o.winner) wins[o.winner] = (wins[o.winner] || 0) + 1; });
    const [A, B] = Object.keys(wins).sort((a, b) => wins[b] - wins[a]);
    if (!A || !B) return { a: A || "", b: B || "", wa: 0, wb: 0, text: "" };
    const wa = wins[A], wb = wins[B], total = s.total || s.matches.length, left = total - games.length;
    let text = wa === wb ? `SERIES LEVEL ${wa}-${wb}` : `${cap(A)} LEAD ${wa}-${wb}`;
    if (wa !== wb && (left <= 0 || wa > wb + left)) text = `${cap(A)} ${left <= 0 ? "WIN" : "CLINCH"} THE SERIES ${wa}-${wb}`;
    if (!games.length) text = "SERIES STARTS";
    return { a: A, b: B, wa, wb, text, games };
  };

  S.nextMatch = (s, no) => (no ? s.matches.find((m) => m.no === parseInt(no, 10)) : s.matches.find((m) => !m.result)) || s.matches[s.matches.length - 1] || null;

  // Cards worth making from one match: fifties, hundreds, five-fors, goals and the result.
  S.cardsFrom = (s, m) => {
    const out = [], r = m.result; if (!r) return out;
    const o = S.outcome(s, m), opp = (team) => full((m.t1 && !sameTeam(m.t1, team) ? m.t1 : m.t2) || "");
    if (s.sport === "football") {
      r.goals.filter((g) => !g.og).forEach((g) => out.push({ label: `Goal: ${g.player} ${g.minute}`, tpl: "goal",
        values: { player: g.player, team: full(g.team), opp: opp(g.team), minute: g.minute, assist: g.assist, score: o ? o.text : "" } }));
      if (r.score) {
        const sc = r.score, list = r.goals.map((g) => `${g.player.split(" ").pop()} ${g.minute}`).join(", ");
        out.push({ label: "Full-time score", tpl: "fresult", values: { headline: o && o.winner ? `*${cap(o.winner)}* WIN` : "ALL SQUARE", t1: full(sc.t1), s1: String(sc.g1), t2: full(sc.t2), s2: String(sc.g2), potm: list } });
      }
      return out;
    }
    r.bat.forEach((b) => {
      if (b.runs < 50) return;
      out.push({ label: `${b.runs >= 100 ? "Hundred" : "Fifty"}: ${b.player} ${b.runs}${b.notOut ? "*" : ""}(${b.balls})`, tpl: b.runs >= 100 ? "century" : "fifty",
        values: { player: b.player, team: full(b.team), opp: opp(b.team), runs: b.runs + (b.notOut ? "*" : ""), balls: String(b.balls), fours: String(b.fours), sixes: String(b.sixes) } });
    });
    r.bowl.forEach((b) => {
      if (b.wkts < (s.overs <= 20 ? 4 : 5)) return;
      out.push({ label: `${b.wkts}-for: ${b.player} ${b.wkts}/${b.runs}`, tpl: "fifer", big: b.wkts >= 5 ? "FIVE-FOR" : `${b.wkts} WICKETS`,
        values: { player: b.player, team: full(b.team), opp: opp(b.team), wkts: String(b.wkts), runs: String(b.runs), overs: b.overs } });
    });
    if (o && o.winner) {
      const iw = r.innings.find((i) => sameTeam(i.team, o.winner)), il = r.innings.find((i) => sameTeam(i.team, o.loser));
      const sc = (i) => (i ? `${i.runs}/${i.wkts}${i.overs ? ` (${i.overs})` : ""}` : "");
      out.push({ label: "Match result", tpl: "cresult", values: { headline: `*${cap(o.winner)} WIN* BY ${cap(o.margin)}`, t1: o.winner, s1: sc(iw), t2: o.loser, s2: sc(il), potm: r.potm } });
    }
    return out;
  };

  // ---------- Poster designs ----------
  const L = BPG.LAYOUTS, PAD = 56;
  const none = (k, g, msg) => {
    const ctx = k.ctx; k.bleedPhoto(g, g.H * 0.55) || k.photoHint(g, g.H * 0.3);
    ctx.font = k.font(40, k.C, 700); ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "center";
    ctx.fillText(msg, g.W / 2, g.H * 0.72, g.W - 2 * PAD); ctx.textAlign = "left"; k.footer(g);
  };
  // Small italic tag + big headline, drawn upwards from `base`. Returns the top of the block.
  function heading(k, g, tag, title, base, align = "left", size = 84, draw = true) {
    const ctx = k.ctx, x = align === "center" ? g.W / 2 : PAD - 2;
    let lay = k.layoutRich(cap(title), g.W - 2 * PAD, size, k.D, 2, 44);
    const lh = lay.size * 0.95, top = base - (lay.lines.length - 1) * lh - lay.size * 0.76;
    if (draw) k.drawRich(lay, x, base - (lay.lines.length - 1) * lh, lh, k.D, "#FFFFFF", g.accent, align);
    if (tag) {
      if (!draw) return top - 18 - 26;
      ctx.font = `italic ${k.font(26, k.C, 700)}`; k.spaced(3); ctx.fillStyle = g.accent; ctx.textAlign = align;
      ctx.fillText(cap(tag), x, top - 18, g.W - 2 * PAD); ctx.textAlign = "left"; k.spaced(0);
      return top - 18 - 26;
    }
    return top;
  }
  const fmt = (v, d = 2) => (v == null ? "-" : (Math.round(v * 10 ** d) / 10 ** d).toFixed(d));

  // Leaderboard: most runs, most wickets, top scorers, assists.
  L.leaders = {
    standard: false,
    draw(k, g) {
      const s = S.current(); if (!s) return none(k, g, "Create a series first (Series box, left)");
      const ctx = k.ctx, stat = g.t.stat, n = Math.max(3, Math.min(8, parseInt(g.val("rows"), 10) || 5));
      let rows;
      if (stat === "runs") rows = S.batting(s).map((x) => ({ name: x.name, team: x.team, v: x.runs, sub: `${x.inns} inns · HS ${x.hs}${x.hsNo ? "*" : ""}${x.sr ? " · SR " + fmt(x.sr, 1) : ""}` }));
      else if (stat === "wkts") rows = S.bowling(s).map((x) => ({ name: x.name, team: x.team, v: x.wkts, sub: `Best ${x.best.w}/${x.best.r}${x.econ ? " · Econ " + fmt(x.econ) : ""}` }));
      else rows = S.scorers(s, stat === "assists" ? "assists" : "goals").map((x) => ({ name: x.name, team: x.team, v: x.n, sub: "" }));
      rows = rows.filter((r) => r.v > 0).slice(0, n);
      if (!rows.length) return none(k, g, "Add a match result to see the leaders");
      const rowH = g.H > 1500 ? 92 : 78, listTop = g.footerY - 56 - rows.length * rowH;
      const top = heading(k, g, g.val("tag") || s.name, g.val("title") || g.t.big, listTop - 30, "left", 84, false);
      k.bleedPhoto(g, top - 20) || k.photoHint(g, g.st + (top - g.st) / 2);
      heading(k, g, g.val("tag") || s.name, g.val("title") || g.t.big, listTop - 30);
      rows.forEach((r, i) => {
        const y = listTop + i * rowH, mid = y + rowH / 2, first = i === 0;
        if (first) { ctx.fillStyle = g.accent; ctx.beginPath(); ctx.moveTo(PAD + 18, y + 6); ctx.lineTo(g.W - PAD, y + 6); ctx.lineTo(g.W - PAD - 18, y + rowH - 6); ctx.lineTo(PAD, y + rowH - 6); ctx.closePath(); ctx.fill(); }
        const ink = first ? k.inkOn(g.accent) : "#FFFFFF", soft = first ? k.hexA(k.inkOn(g.accent), 0.6) : "rgba(255,255,255,0.55)";
        ctx.font = k.font(34, k.D); ctx.fillStyle = first ? ink : g.accent; ctx.fillText(String(i + 1), PAD + 24, mid + 13);
        const nm = cap(r.name), tm = r.team ? short(r.team) : "";
        ctx.font = k.font(k.fit(nm, g.W * 0.5, 40, k.C, 700), k.C, 700); k.spaced(1); ctx.fillStyle = ink; ctx.fillText(nm, PAD + 74, mid + (r.sub ? 2 : 14));
        const nw = ctx.measureText(nm).width; k.spaced(0);
        if (tm) { ctx.font = k.font(22, k.C, 700); k.spaced(3); ctx.fillStyle = soft; ctx.fillText(tm, PAD + 74 + nw + 14, mid + (r.sub ? 2 : 14)); k.spaced(0); }
        if (r.sub) { ctx.font = k.font(20, k.B, 500); ctx.fillStyle = soft; ctx.fillText(r.sub, PAD + 76, mid + 28, g.W * 0.6); }
        ctx.textAlign = "right"; ctx.font = k.font(first ? 56 : 48, k.D); ctx.fillStyle = first ? ink : "#FFFFFF"; ctx.fillText(String(r.v), g.W - PAD - 36, mid + 19); ctx.textAlign = "left";
      });
      k.footer(g);
    },
  };

  // Points table.
  L.points = {
    standard: false,
    draw(k, g) {
      const s = S.current(); if (!s) return none(k, g, "Create a series first (Series box, left)");
      const ctx = k.ctx, fb = s.sport === "football", rows = S.table(s).slice(0, Math.max(2, Math.min(10, parseInt(g.val("rows"), 10) || 8)));
      if (!rows.length) return none(k, g, "Add teams to the series");
      const q = Math.max(0, parseInt(g.val("qualify"), 10) || 0);
      const rowH = Math.min(g.H > 1500 ? 84 : 70, Math.floor((g.footerY - 60 - g.H * 0.42) / (rows.length + 0.6)));
      const headY = g.footerY - 56 - rows.length * rowH - 14, listTop = headY + 14;
      const top = heading(k, g, g.val("tag") || s.name, g.val("title") || "POINTS TABLE", headY - 40, "left", 76, false);
      k.bleedPhoto(g, top - 20) || k.photoHint(g, g.st + (top - g.st) / 2);
      heading(k, g, g.val("tag") || s.name, g.val("title") || "POINTS TABLE", headY - 40, "left", 76);
      const cols = fb ? [["P", "p"], ["W", "w"], ["D", "d"], ["L", "l"], ["GD", "gd"], ["PTS", "pts"]] : [["P", "p"], ["W", "w"], ["L", "l"], ["NRR", "nrr"], ["PTS", "pts"]];
      // Right edge of each column, working leftwards; NRR needs the most room.
      const wide = { NRR: 150, PTS: 96, GD: 88 }, xs = []; let x = g.W - PAD - 20;
      for (let i = cols.length - 1; i >= 0; i--) { xs[i] = x; x -= wide[cols[i][0]] || 72; }
      const cw = 72;
      ctx.font = k.font(20, k.C, 700); k.spaced(3); ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.textAlign = "right";
      cols.forEach((c, i) => ctx.fillText(c[0], xs[i], headY)); ctx.textAlign = "left"; ctx.fillText("TEAM", PAD + 74, headY); k.spaced(0);
      rows.forEach((r, i) => {
        const y = listTop + i * rowH, mid = y + rowH / 2, top1 = q && i < q;
        ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.07)"; ctx.fillRect(PAD, y + 3, g.W - 2 * PAD, rowH - 6);
        if (top1) { ctx.fillStyle = g.accent; ctx.fillRect(PAD, y + 3, 6, rowH - 6); }
        ctx.font = k.font(30, k.D); ctx.fillStyle = top1 ? g.accent : "rgba(255,255,255,0.6)"; ctx.fillText(String(i + 1), PAD + 26, mid + 11);
        ctx.font = k.font(k.fit(cap(r.team), xs[0] - cw - PAD - 74, 38, k.C, 700), k.C, 700); k.spaced(1); ctx.fillStyle = "#FFFFFF"; ctx.fillText(cap(r.team), PAD + 74, mid + 13); k.spaced(0);
        ctx.textAlign = "right";
        cols.forEach((c, j) => {
          let v = r[c[1]]; if (c[1] === "nrr") v = (v > 0 ? "+" : "") + fmt(v, 3); if (c[1] === "gd") v = (v > 0 ? "+" : "") + v;
          const pts = c[1] === "pts"; ctx.font = k.font(pts ? 38 : 30, pts ? k.D : k.C, pts ? "" : 700); ctx.fillStyle = pts ? g.accent : "rgba(255,255,255,0.85)";
          ctx.fillText(String(v), xs[j], mid + 12);
        });
        ctx.textAlign = "left";
      });
      k.footer(g);
    },
  };

  const resultText = (s, o) => o.winner ? (s.sport === "football" ? `${short(o.winner)} beat ${short(o.loser)} ${o.margin}` : `${short(o.winner)} won by ${o.margin}`) : o.draw ? o.text.replace(/(\S+(?: \S+)*) (\d+-\d+) (.+)/, (m, a, sc, b) => `${short(a)} ${sc} ${short(b)}`) : o.text;
  // Tournaments (more than two teams): the latest results, one per row.
  function results(k, g, s) {
    const ctx = k.ctx, games = s.matches.filter((m) => m.result && S.outcome(s, m)).slice(-6);
    if (!games.length) return none(k, g, "Add a match result to see the results");
    const rowH = g.H > 1500 ? 84 : 70, listTop = g.footerY - 56 - games.length * rowH;
    const head = g.val("headline") || "RESULTS SO FAR", tag = g.val("tag") || s.name;
    const top = heading(k, g, tag, head, listTop - 30, "left", 84, false);
    k.bleedPhoto(g, top - 20) || k.photoHint(g, g.st + (top - g.st) / 2);
    heading(k, g, tag, head, listTop - 30, "left", 84, true);
    games.forEach((m, i) => {
      const y = listTop + i * rowH, mid = y + rowH / 2, o = S.outcome(s, m), r = m.result;
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.07)"; ctx.fillRect(PAD, y + 3, g.W - 2 * PAD, rowH - 6);
      const [a, b, sa, sb] = s.sport === "football" ? [r.score.t1, r.score.t2, r.score.g1, r.score.g2] : [r.innings[0].team, r.innings[1].team, `${r.innings[0].runs}/${r.innings[0].wkts}`, `${r.innings[1].runs}/${r.innings[1].wkts}`];
      const cx = g.W / 2;
      ctx.font = k.font(36, k.C, 700); k.spaced(2);
      ctx.textAlign = "right"; ctx.fillStyle = o.winner && sameTeam(o.winner, a) ? g.accent : "#FFFFFF"; ctx.fillText(cap(full(a)), cx - 110, mid + 13, cx - 110 - PAD - 20);
      ctx.textAlign = "left"; ctx.fillStyle = o.winner && sameTeam(o.winner, b) ? g.accent : "#FFFFFF"; ctx.fillText(cap(full(b)), cx + 110, mid + 13, cx - 110 - PAD - 20); k.spaced(0);
      ctx.textAlign = "center"; ctx.font = k.font(s.sport === "football" ? 40 : 28, k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(`${sa} - ${sb}`, cx, mid + 13);
      ctx.textAlign = "left";
    });
    k.footer(g);
  }

  // Series score: PAK 2 - 1 SL, with each match's result underneath.
  L.seriesscore = {
    standard: false,
    draw(k, g) {
      const s = S.current(); if (!s) return none(k, g, "Create a series first (Series box, left)");
      const ctx = k.ctx, cx = g.W / 2, st = S.seriesLine(s);
      if (!st.a) return none(k, g, "Add both teams to the series");
      if (s.teams.length > 2) return results(k, g, s);
      const games = (st.games || []).slice(-5), listY = g.footerY - 50 - games.length * 40;
      const ns = 150, nb = listY - 40, namesY = nb + 0, gap = 170;
      const head = g.val("headline") || st.text;
      const top = heading(k, g, g.val("tag") || s.name, head, nb - ns * 0.76 - 70, "center", 72, false);
      k.bleedPhoto(g, top - 20) || k.photoHint(g, g.st + (top - g.st) / 2);
      heading(k, g, g.val("tag") || s.name, head, nb - ns * 0.76 - 70, "center", 72);
      [[st.a, st.wa, -1], [st.b, st.wb, 1]].forEach(([t, w, side]) => {
        const lead = st.wa !== st.wb && t === st.a;
        ctx.textAlign = "center"; ctx.font = k.font(ns, k.D); ctx.fillStyle = lead ? g.accent : "#FFFFFF"; ctx.fillText(String(w), cx + side * gap * 0.62, nb);
        ctx.font = k.font(34, k.C, 700); k.spaced(5); ctx.fillStyle = lead ? g.accent : "rgba(255,255,255,0.75)";
        ctx.fillText(short(t), cx + side * gap * 1.55, nb - ns * 0.3); k.spaced(0);
      });
      ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(cx - 14, nb - ns * 0.4, 28, 6);
      games.forEach((m, i) => {
        const o = S.outcome(s, m), y = listY + 20 + i * 40, txt = resultText(s, o);
        ctx.font = k.font(24, k.C, 700); k.spaced(3); ctx.fillStyle = g.accent; ctx.textAlign = "right"; ctx.fillText(`MATCH ${m.no}`, cx - 16, y);
        ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,0.85)"; k.spaced(1); ctx.font = k.font(26, k.B, 500); ctx.fillText(txt, cx + 4, y, g.W / 2 - PAD - 8); k.spaced(0);
      });
      ctx.textAlign = "left";
      k.footer(g);
    },
  };

  // Match preview: who, when (Bangladesh time), where.
  L.preview = {
    standard: false,
    draw(k, g) {
      const s = S.current(); if (!s) return none(k, g, "Create a series first (Series box, left)");
      const m = S.nextMatch(s, g.val("match")); if (!m) return none(k, g, "Add a fixture to the series");
      const ctx = k.ctx, cx = g.W / 2, t1 = m.t1 || s.teams[0] || "", t2 = m.t2 || s.teams[1] || "";
      const when = [m.date ? new Date(m.date + "T00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "", m.time ? m.time + " BD TIME" : ""].filter(Boolean).join(" · ");
      const venueY = g.footerY - 56, whenY = venueY - 46, teamsBase = whenY - 54, ts = 110;
      const st = S.seriesLine(s), tag = g.val("tag") || `${s.name} · Match ${m.no}`;
      const head = g.val("headline") || (m.result ? "RESULT" : "MATCH DAY");
      const top = heading(k, g, tag, head, teamsBase - ts - 36, "center", 60, false);
      k.bleedPhoto(g, top - 20) || k.photoHint(g, g.st + (top - g.st) / 2);
      heading(k, g, tag, head, teamsBase - ts - 36, "center", 60);
      ctx.textAlign = "center";
      const a = cap(short(t1)), b = cap(short(t2));
      ctx.font = k.font(ts, k.D); ctx.fillStyle = "#FFFFFF"; ctx.fillText(a, cx - 190, teamsBase); ctx.fillText(b, cx + 190, teamsBase);
      ctx.font = `italic ${k.font(44, k.C, 700)}`; ctx.fillStyle = g.accent; ctx.fillText("VS", cx, teamsBase - ts * 0.3);
      ctx.font = k.font(22, k.C, 700); k.spaced(4); ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(cap(full(t1)), cx - 190, teamsBase + 34, 330); ctx.fillText(cap(full(t2)), cx + 190, teamsBase + 34, 330); k.spaced(0);
      if (when) { ctx.font = k.font(34, k.C, 700); k.spaced(3); ctx.fillStyle = g.accent; ctx.fillText(cap(when), cx, whenY + 30, g.W - 2 * PAD); k.spaced(0); }
      const sub = [m.venue, st.games && st.games.length && !m.result ? (st.wa === st.wb ? `Series level ${st.wa}-${st.wb}` : `${short(st.a)} lead ${st.wa}-${st.wb}`) : ""].filter(Boolean).join(" · ");
      if (sub) { ctx.font = k.font(26, k.B, 500); ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.fillText(sub, cx, venueY + 20, g.W - 2 * PAD - 280); }
      ctx.textAlign = "left";
      k.footer(g);
    },
  };

  S.oversOf = oversOf;
})();
