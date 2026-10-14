// Turns match data into key-moment alerts. No network here, so it can be tested with sample data (test.mjs).
// Each alert: { key, text, links: [{ label, url }] }. The key stops the same moment being sent twice.

export function makeLink(site, card, data, big) {
  const d = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${site.replace(/\/+$/, "")}/?card=${card}&d=${d}${big ? "&big=" + encodeURIComponent(big) : ""}`;
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const min = (t) => (t ? `${t.elapsed}${t.extra ? "+" + t.extra : ""}'` : "");

// ---------------- Football (API-Football) ----------------

const FINISHED = new Set(["FT", "AET", "PEN"]);

// API-Football is unclear about which team an own goal is listed under, so both readings are tried
// and the one that adds up to the real score wins.
function goalList(fx) {
  const goals = (fx.events || []).filter((e) => e.type === "Goal" && e.detail !== "Missed Penalty");
  const home = fx.teams.home.name, away = fx.teams.away.name, other = (n) => (n === home ? away : home);
  const tally = (ogSwap) => {
    let h = 0, a = 0;
    const list = goals.map((e) => {
      const og = e.detail === "Own Goal", forTeam = og && ogSwap ? other(e.team.name) : e.team.name;
      if (forTeam === home) h++; else a++;
      return { e, og, forTeam, h, a };
    });
    return { list, h, a };
  };
  const plain = tally(false), swapped = tally(true);
  const gh = fx.goals.home ?? 0, ga = fx.goals.away ?? 0;
  return (swapped.h === gh && swapped.a === ga && !(plain.h === gh && plain.a === ga) ? swapped : plain).list;
}

function scorersLine(fx) {
  const g = goalList(fx), side = (team) => g.filter((x) => x.forTeam === team)
    .map((x) => `${x.e.player.name}${x.og ? " (og)" : x.e.detail === "Penalty" ? " (pen)" : ""} ${min(x.e.time)}`).join(", ");
  return [side(fx.teams.home.name), side(fx.teams.away.name)].filter(Boolean).join(" · ");
}

export function footballAlerts(fx, site) {
  const out = [], id = fx.fixture.id, home = fx.teams.home.name, away = fx.teams.away.name;
  const scoreText = (h, a) => `${home} ${h}-${a} ${away}`;
  const goals = goalList(fx), perPlayer = {};

  for (const g of goals) {
    const name = g.e.player.name, opp = g.forTeam === home ? away : home;
    const n = g.og ? 0 : (perPlayer[name] = (perPlayer[name] || 0) + 1);
    const big = n === 3 ? "HAT-TRICK!" : n === 2 ? "BRACE!" : n > 3 ? `${n} GOALS!` : g.og ? "OWN GOAL!" : undefined;
    const assist = g.e.assist && g.e.assist.name ? g.e.assist.name : "";
    const data = { player: name, team: g.forTeam, opp, minute: min(g.e.time), score: scoreText(g.h, g.a), assist };
    out.push({
      key: `f${id}:goal:${g.e.time.elapsed}:${g.e.time.extra || 0}:${name}`,
      text: `⚽ <b>${big ? esc(big.replace("!", "")) : "GOAL"}</b> ${esc(name)}${g.og ? " (own goal)" : g.e.detail === "Penalty" ? " (pen)" : ""} ${min(g.e.time)}\n${esc(scoreText(g.h, g.a))}${assist ? `\nAssist: ${esc(assist)}` : ""}`,
      links: [{ label: "Goal card", url: makeLink(site, "goal", data, big) }],
    });
  }

  for (const e of fx.events || []) {
    if (e.type !== "Card" || !/red|second yellow/i.test(e.detail)) continue;
    const opp = e.team.name === home ? away : home, reason = /second/i.test(e.detail) ? "Second yellow" : "Straight red";
    out.push({
      key: `f${id}:red:${e.time.elapsed}:${e.player.name}`,
      text: `🟥 <b>RED CARD</b> ${esc(e.player.name)} (${esc(e.team.name)}) ${min(e.time)}\n${reason}`,
      links: [{ label: "Red card", url: makeLink(site, "redcard", { player: e.player.name, team: e.team.name, opp, minute: min(e.time), reason }) }],
    });
  }

  const st = fx.fixture.status.short, h = fx.goals.home ?? 0, a = fx.goals.away ?? 0, scorers = scorersLine(fx);
  const comp = [fx.league.name, fx.league.round].filter(Boolean).join(" | ");
  // Half-time is only sent while it is actually half-time, never late.
  if (st === "HT") out.push({
    key: `f${id}:ht`,
    text: `⏸ <b>HALF-TIME</b> ${esc(scoreText(h, a))}${scorers ? "\n" + esc(scorers) : ""}`,
    links: [{ label: "Score card", url: makeLink(site, "fresult", { headline: "HALF-TIME", t1: home, s1: h, t2: away, s2: a, potm: scorers }) }],
  });
  if (FINISHED.has(st)) {
    const links = [{ label: "Full-time card", url: makeLink(site, "fresult", { headline: "", t1: home, s1: h, t2: away, s2: a, potm: scorers }) }];
    let pens = "";
    if (st === "PEN" && fx.score && fx.score.penalty) pens = ` (${fx.score.penalty.home}-${fx.score.penalty.away} pens)`;
    let winner = h > a ? home : a > h ? away : null;
    if (!winner && st === "PEN" && fx.score && fx.score.penalty) winner = fx.score.penalty.home > fx.score.penalty.away ? home : away;
    if (winner) {
      const loser = winner === home ? away : home;
      const margin = `${Math.max(h, a)}-${Math.min(h, a)}${pens ? " on pens" : ""}`;
      links.push({ label: "Bold result", url: makeLink(site, "fbigresult", { winner, loser, verb: "beat", margin, info: comp }) });
    }
    out.push({ key: `f${id}:ft`, text: `🏁 <b>FULL-TIME</b> ${esc(scoreText(h, a))}${pens}${scorers ? "\n" + esc(scorers) : ""}`, links });
  }
  return out;
}

// ---------------- Football fallback (football-data.org: score only, no scorer names) ----------------

export function footballDataAlerts(m, prev, site) {
  const out = [], home = m.homeTeam.shortName || m.homeTeam.name, away = m.awayTeam.shortName || m.awayTeam.name;
  const ft = m.score.fullTime || {}, h = ft.home ?? 0, a = ft.away ?? 0;
  const before = prev || { h: 0, a: 0 };
  const scoreText = `${home} ${h}-${a} ${away}`, minute = m.minute ? `${m.minute}'` : "";
  for (let i = before.h; i < h; i++) out.push(fdGoal(m.id, home, away, i + 1, "h", scoreText, minute, site));
  for (let i = before.a; i < a; i++) out.push(fdGoal(m.id, away, home, i + 1, "a", scoreText, minute, site));
  if (m.status === "PAUSED") out.push({
    key: `d${m.id}:ht`, text: `⏸ <b>HALF-TIME</b> ${esc(scoreText)}`,
    links: [{ label: "Score card", url: makeLink(site, "fresult", { headline: "HALF-TIME", t1: home, s1: h, t2: away, s2: a, potm: "" }) }],
  });
  if (m.status === "FINISHED") {
    const links = [{ label: "Full-time card", url: makeLink(site, "fresult", { headline: "", t1: home, s1: h, t2: away, s2: a, potm: "" }) }];
    if (h !== a) links.push({ label: "Bold result", url: makeLink(site, "fbigresult", { winner: h > a ? home : away, loser: h > a ? away : home, verb: "beat", margin: `${Math.max(h, a)}-${Math.min(h, a)}`, info: m.competition ? m.competition.name : "" }) });
    out.push({ key: `d${m.id}:ft`, text: `🏁 <b>FULL-TIME</b> ${esc(scoreText)}`, links });
  }
  return { alerts: out, now: { h, a } };
}
function fdGoal(id, team, opp, n, side, scoreText, minute, site) {
  return {
    key: `d${id}:goal:${side}${n}`,
    text: `⚽ <b>GOAL</b> ${esc(team)} ${minute}\n${esc(scoreText)}\n(Scorer not in the free data, add it on the card)`,
    links: [{ label: "Goal card", url: makeLink(site, "goal", { player: "", team, opp, minute, score: scoreText, assist: "" }) }],
  };
}

// ---------------- Cricket (CricketData.org) ----------------

const ordinalTeam = (inning) => String(inning || "").replace(/\s+inning\s*\d*$/i, "").trim();
const fig = (s) => (s ? `${s.r}/${s.w}${s.o != null ? ` (${s.o})` : ""}` : "");

export function matchParts(m) {
  const parts = String(m.name || "").split(",").map((s) => s.trim());
  return { label: parts[1] || "", series: parts.slice(2).join(", ") || "" };
}

export function isFollowedCricket(m, cfg) {
  const teams = m.teams || [];
  if (teams.some((t) => cfg.teams.includes(t))) return true;
  return cfg.seriesKeywords.some((k) => String(m.name || "").toLowerCase().includes(k.toLowerCase()));
}

// What a currentMatches entry alone tells us: toss, innings break, result.
export function cricketMatchAlerts(m, prev, site, card) {
  const out = [], id = m.id, { label, series } = matchParts(m), teams = m.teams || [];
  const vsLine = teams.join(" vs ");
  if (m.tossWinner && m.tossChoice) {
    const choice = /bowl|field/i.test(m.tossChoice) ? "BOWL" : "BAT";
    out.push({
      key: `c${id}:toss`,
      text: `🪙 <b>TOSS</b> ${esc(m.tossWinner)} chose to ${choice.toLowerCase()} first\n${esc(vsLine)}${label ? ", " + esc(label) : ""}`,
      links: [{ label: "Toss card", url: makeLink(site, "toss", { player: label.toUpperCase(), stamp: `*${String(m.tossWinner).toUpperCase()}* OPT TO ${choice} FIRST`, detail: series || vsLine }) }],
    });
  }
  const score = m.score || [], limited = !/test/i.test(m.matchType || "");
  if (limited && score.length >= 2 && (!prev || (prev.innings || 0) < 2) && !m.matchEnded) {
    const s = score[0], team = ordinalTeam(s.inning), top = card ? topPerformers(card, 0) : {};
    out.push({
      key: `c${id}:break`,
      text: `☕ <b>INNINGS BREAK</b> ${esc(team)} ${esc(fig(s))}\nTarget ${s.r + 1}`,
      links: [{ label: "Innings break card", url: makeLink(site, "innings", { team, score: `${s.r}/${s.w}`, overs: s.o, topbat: top.bat || "", topbowl: top.bowl || "" }) }],
    });
  }
  if (m.matchEnded && m.status) {
    const won = /^(.+?) won by (.+)$/i.exec(m.status), links = [];
    const winner = m.matchWinner || (won ? won[1] : ""), loser = teams.find((t) => t !== winner) || "";
    const margin = won ? "by " + won[2].replace(/\bwkts?\b/i, "wickets").replace(/\bruns?\b/i, "runs") : "";
    const potm = playerOfMatch(m) || playerOfMatch(card || {});
    const sOf = (t) => fig(score.filter((s) => ordinalTeam(s.inning) === t).pop());
    if (winner) {
      links.push({ label: "Bold result", url: makeLink(site, "bigresult", { winner, loser, verb: "beat", margin, info: [label, series].filter(Boolean).join(" | ") }) });
    }
    links.push({ label: "Result card", url: makeLink(site, "cresult", {
      headline: winner ? `*${winner.toUpperCase()}* WIN ${margin.toUpperCase()}` : String(m.status).toUpperCase(),
      t1: teams[0] || "", s1: sOf(teams[0]), t2: teams[1] || "", s2: sOf(teams[1]), potm,
    }) });
    out.push({ key: `c${id}:result`, text: `🏆 <b>RESULT</b> ${esc(m.status)}${potm ? "\nPlayer of the match: " + esc(potm) : ""}`, links });
  }
  return out;
}

function playerOfMatch(m) {
  const p = m.playerOfTheMatch || m.player_of_match || m.potm;
  if (!p) return "";
  if (Array.isArray(p)) return p.map((x) => x.name || x).join(", ");
  return p.name || String(p);
}

function topPerformers(card, i) {
  const inn = (card.scorecard || [])[i];
  if (!inn) return {};
  const bat = [...(inn.batting || [])].sort((x, y) => y.r - x.r)[0];
  const bowl = [...(inn.bowling || [])].sort((x, y) => y.w - x.w || x.r - y.r)[0];
  const short = (n) => String(n || "").split(" ").slice(-1)[0];
  return {
    bat: bat ? `${short(bat.batsman && bat.batsman.name)} ${bat.r} (${bat.b})` : "",
    bowl: bowl && bowl.w > 0 ? `${short(bowl.bowler && bowl.bowler.name)} ${bowl.w}/${bowl.r}` : "",
  };
}

// What the scorecard adds: fifties, hundreds, 3+ wicket spells.
export function cricketCardAlerts(m, card, site) {
  const out = [], id = m.id, teams = m.teams || [];
  (card.scorecard || []).forEach((inn, i) => {
    const batTeam = ordinalTeam(inn.inning), bowlTeam = teams.find((t) => t !== batTeam) || "";
    for (const b of inn.batting || []) {
      const name = b.batsman && b.batsman.name, r = Number(b.r) || 0;
      if (!name || r < 50) continue;
      const ton = r >= 100, mile = ton ? Math.floor(r / 100) * 100 : 50;
      const notOut = /not out/i.test(b["dismissal-text"] || b.dismissal || "");
      out.push({
        key: `c${id}:${i}:bat:${name}:${mile}`,
        text: `${ton ? "💯" : "🔥"} <b>${ton ? (mile > 100 ? mile : "HUNDRED") : "FIFTY"}</b> ${esc(name)} ${r}${notOut ? "*" : ""} (${b.b})\n${esc(batTeam)} vs ${esc(bowlTeam)}`,
        links: [{ label: ton ? "Hundred card" : "Fifty card", url: makeLink(site, ton ? "century" : "fifty", {
          player: name, team: batTeam, opp: bowlTeam, runs: `${r}${notOut ? "*" : ""}`, balls: b.b, fours: b["4s"], sixes: b["6s"],
        }) }],
      });
    }
    for (const w of inn.bowling || []) {
      const name = w.bowler && w.bowler.name, n = Number(w.w) || 0;
      if (!name || n < 3) continue;
      const step = n >= 5 ? 5 : 3, big = ["", "", "", "THREE-FOR", "FOUR-FOR", "FIVE-FOR", "SIX-FOR", "SEVEN-FOR", "EIGHT-FOR", "NINE-FOR", "TEN-FOR"][n] || "FIVE-FOR";
      out.push({
        key: `c${id}:${i}:bowl:${name}:${step}`,
        text: `🎯 <b>${big}</b> ${esc(name)} ${n}/${w.r} (${w.o} ov)\n${esc(bowlTeam)} vs ${esc(batTeam)}`,
        links: [{ label: "Bowling card", url: makeLink(site, "fifer", { player: name, team: bowlTeam, opp: batTeam, wkts: n, runs: w.r, overs: w.o }, big) }],
      });
    }
  });
  // Both 50 and 100 seen in one check: only the hundred is worth sending.
  const keys = new Set(out.map((a) => a.key));
  return out.filter((a) => !(/:50$/.test(a.key) && keys.has(a.key.replace(/:50$/, ":100"))));
}

export function formatMessage(a) {
  return `${a.text}\n${a.links.map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join("  ·  ")}`;
}
