// Caption and hashtags written from the card's details, ready to copy into Instagram, Facebook or TikTok.
// BPG.caption(template, val, extra) returns the text. Edit the lines below to change the wording.
window.BPG = window.BPG || {};

(() => {
  const plain = (s) => String(s || "").replace(/\*([^*]+)\*/g, "$1").replace(/\s+/g, " ").trim();
  const n = (v) => parseInt(String(v).split("/")[0].replace(/[^\d]/g, ""), 10) || 0;
  const tag = (s) => { const t = plain(s).replace(/[^\p{L}\p{N}]+/gu, ""); return t ? "#" + t : ""; };
  const short = (s) => (BPG.teamShort && BPG.teamName && BPG.teamName(s) ? BPG.teamShort(BPG.teamName(s)) : plain(s).slice(0, 3).toUpperCase());

  // One line per card type. v(id) reads a field.
  const LINES = {
    batting: (v, t) => `${t.milestone === "100" ? "💯" : "🔥"} ${v("player")} brings up a ${t.milestone === "100" ? "hundred" : "fifty"} against ${v("opp")}! ${v("runs")} off ${v("balls")} balls (${v("fours")}x4, ${v("sixes")}x6).`,
    knock: (v) => `${v("player")}: ${v("runs")} off ${v("balls")} against ${v("opp")}. ${v("fours")} fours, ${v("sixes")} sixes.`,
    wicket: (v) => `GONE! ${v("batter")} out for ${v("runs")} (${v("balls")}), ${v("how")}. ${v("score")}.`,
    bowling: (v) => `🔥 ${v("player")} takes ${v("wkts")}/${v("runs")} in ${v("overs")} overs against ${v("opp")}.`,
    over: (v) => `Over ${v("over")} from ${v("player")}: ${v("balls")}`,
    scoreupd: (v) => `${v("status")}: ${v("team")} ${v("score")} (${v("overs")} ov). ${v("detail")}`,
    innings: (v) => `Innings break. ${v("team")} ${v("score")} (${v("overs")} ov), target ${n(v("score")) + 1}. Top scorer ${v("topbat")}, best bowler ${v("topbowl")}.`,
    result: (v) => `${v("headline")}! ${v("t1")} ${v("s1")} beat ${v("t2")} ${v("s2")}. Player of the match: ${v("potm")}.`,
    form: (v) => `${v("player")}, ${v("title")}: ${v("scores")}`,
    toss: (v) => `${v("player")} ${v("stamp")}. ${v("detail")}`,
    goal: (v) => `⚽ GOAL! ${v("player")} scores for ${v("team")} (${v("minute")}). ${v("score")}. Assist: ${v("assist")}.`,
    matchcard: (v) => (String(v("s1")).trim() || String(v("s2")).trim() ? `${v("status") || "FT"}: ${v("t1")} ${v("s1")}-${v("s2")} ${v("t2")}` : `${v("stage") || "Match day"}: ${v("t1")} vs ${v("t2")}, ${v("status")}`) + ` | ${v("tournament")}\n${[v("g1"), v("g2")].filter((x) => String(x).trim()).join(" · ")}\n${v("headline")}`,
    chase: (v) => `🏏 ${v("t1")} need ${v("need")} off ${v("balls")} balls against ${v("t2")}${v("wkts") ? ", " + v("wkts") + " wickets left" : ""}. Can they do it?`,
    partnership: (v) => `🤝 ${v("runs")} runs${v("balls") ? " off " + v("balls") + " balls" : ""} for the ${v("wkt")} wicket. ${v("b1")} ${v("r1")}, ${v("b2")} ${v("r2")}.`,
    poll: (v) => `${v("question")} ${v("match")}\nComment 1 for ${v("t1")}, 2 for ${v("t2")} 👇`,
    h2h: (v) => `📊 ${v("t1")} vs ${v("t2")} head to head: ${v("w1")}-${v("w2")} in ${v("played")} matches${v("draws") ? ", " + v("draws") + " " + (v("dlabel") || "draws").toLowerCase() : ""}.`,
    countdown: (v) => `⏳ ${v("number")} ${v("unit").toLowerCase()}: ${v("event")}. ${v("line")}`,
    onthisday: (v) => `📅 On this day, ${v("date")} ${v("year")}: ${v("headline")}. ${v("line")}`,
    profile: (v) => `${v("player")} | ${v("role")}\n${String(v("stats")).replace(/,\s*/g, " · ")}`,
    debut: (v) => `🧢 ${v("format")} cap #${v("cap")}: ${v("player")}. ${v("line")}`,
    story: (v) => `${v("headline")} (swipe ➡️)\n\n${v("result")}\n\n${v("question")}`,
    tframe: (v) => `${v("headline")}\n${v("tag")} | ${v("tournament")}`,
    xipitch: (v, t, raw) => `📋 ${v("title") || "Starting XI"}: ${v("teamname") || v("team")}${v("opp") ? " vs " + v("opp") : ""} | ${v("formation")}\n\n${String(raw("players")).split("\n").map((l) => l.split("|")[0].trim()).filter(Boolean).join(", ")}\n\n${v("tournament")}`,
    lineup: (v, t, raw) => `📋 ${v("team")} starting XI vs ${v("opp")} | ${v("tournament")}\n\n${String(raw("players")).split("\n").map((l) => l.trim()).filter(Boolean).join("\n")}\n\nSubs: ${String(raw("subs")).replace(/\n/g, ", ")}`,
    fscore: (v) => `FT: ${v("t1")} ${v("s1")}-${v("s2")} ${v("t2")}. ${v("headline")}. ${v("potm")}`,
    redcard: (v) => `🟥 RED CARD! ${v("player")} (${v("team")}) sent off in the ${v("minute")} minute. ${v("reason")}.`,
    rating: (v) => `${v("player")} vs ${v("opp")}: ${v("rating")}/10. ${v("stats")}`,
    reaction: (v) => `${v("headline")}\n\n${v("body")}`,
    status: (v) => `${v("player")}: ${v("stamp")}. ${v("detail")}`,
    hottake: (v) => `Hot take: ${v("quote")}`,
    quote: (v) => `"${v("quote")}" ${v("name")}, ${v("context")}.`,
    toplist: (v, t, raw) => `${v("title")}\n${String(raw("items")).split("\n").filter((l) => l.trim()).map((l, i) => `${i + 1}. ${l.split("|").reverse().map((x) => x.trim()).join(": ")}`).join("\n")}`,
    versus: (v) => `${v("question")} ${v("p1")} or ${v("p2")}? Comment below 👇`,
    breaking: (v) => `🚨 BREAKING: ${v("headline")}. ${v("detail")}`,
    frame: (v) => `${v("headline")}`,
    testmile: (v, t) => `${t.milestone === "100" ? "💯" : "🏏"} ${v("player")} reaches ${t.milestone === "100" ? "a Test hundred" : "a Test fifty"} against ${v("opp")}! ${v("runs")}${v("balls") ? " off " + v("balls") + " balls" : ""}. ${v("info").replace(/\s*\|\s*/g, " · ")}`,
    testbowl: (v) => `🔴 ${v("player")} takes ${v("wkts")}/${v("runs")} against ${v("opp")}${v("overs") ? " in " + v("overs") + " overs" : ""}. ${v("info").replace(/\s*\|\s*/g, " · ")}`,
    stumps: (v) => `${v("status")}: ${v("t1")} ${v("s1")}, ${v("t2")} ${v("s2")}. ${v("line")}`,
    testresult: (v) => `${v("winner")} beat ${v("loser")} ${v("margin")}! ${v("series")} ${v("potm") ? "Player of the match: " + v("potm") + "." : ""}`,
    squad: (v, t, raw) => { const n = String(raw("players")).split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")); return `🚨 ${v("team")} ${v("title").toLowerCase() || "squad"} is out! ${n.length} players:\n${n.join(", ")}`; },
    grunge: (v, t) => ({
      runs: () => `🔥 ${v("player")}: ${v("runs")} ${v("unit").toLowerCase() || "runs!"} ${v("info").replace(/\s*\|\s*/g, " · ")}`,
      wickets: () => `🎯 ${v("player")}: ${v("wkts")} wickets${v("runs") ? " for " + v("runs") : ""}${v("overs") ? " in " + v("overs") + " overs" : ""}! ${v("info").replace(/\s*\|\s*/g, " · ")}`,
      goal: () => `⚽ ${v("player")} ${v("minute")}! ${v("score")}. ${v("info")}`,
      result: () => `🏆 ${v("winner")} ${(v("word") || "win").toLowerCase().replace(/!+$/, "")} ${v("margin")}! ${v("info").replace(/\s*\|\s*/g, " · ")}`,
      number: () => `${v("name")}: ${v("number")} ${v("unit").toLowerCase()} ${v("info").replace(/\s*\|\s*/g, " · ")}`,
    })[t.kind](),
    bigknock: (v) => `🔥 ${v("player")}: ${v("runs")}${v("balls") ? " off " + v("balls") : " runs"}! ${v("info").replace(/\s*\|\s*/g, " · ")}`,
    bigresult: (v) => `${v("winner")} ${v("verb") || "beat"} ${v("loser")}${v("margin") ? " " + v("margin") : ""}! ${v("info").replace(/\s*\|\s*/g, " · ")}`,
    seriesscore: () => { const s = BPG.series && BPG.series.current(); if (!s) return ""; if (s.teams.length > 2) return `${s.name}: results so far.`; const st = BPG.series.seriesLine(s); return `${s.name}: ${st.text.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}.`; },
    preview: (v) => { const s = BPG.series && BPG.series.current(); const m = s && BPG.series.nextMatch(s, v("match")); return m ? `Match ${m.no}: ${m.t1} vs ${m.t2}${m.date ? ", " + m.date : ""}${m.time ? " at " + m.time + " (BD time)" : ""}${m.venue ? ", " + m.venue : ""}. Who's winning this one?` : ""; },
    leaders: (v, t) => { const s = BPG.series && BPG.series.current(); if (!s) return ""; const S = BPG.series;
      const list = t.stat === "runs" ? S.batting(s).map((x) => [x.name, x.runs]) : t.stat === "wkts" ? S.bowling(s).map((x) => [x.name, x.wkts]) : S.scorers(s, t.stat === "assists" ? "assists" : "goals").map((x) => [x.name, x.n]);
      return `${v("title") || t.big} in ${s.name}:\n` + list.slice(0, parseInt(v("rows"), 10) || 5).map((x, i) => `${i + 1}. ${x[0]}: ${x[1]}`).join("\n"); },
    points: () => { const s = BPG.series && BPG.series.current(); if (!s) return ""; return `${s.name} points table:\n` + BPG.series.table(s).map((r, i) => `${i + 1}. ${r.team}: ${r.pts} pts`).join("\n"); },
  };

  BPG.CTAS = {
    en: "What's your take? Comment below 👇",
    bn: "আপনার মতামত কমেন্টে জানান 👇",
    banglish: "Apnar ki mone hoy? Comment e janan 👇",
    none: "",
  };

  BPG.caption = (t, val, opts = {}) => {
    const v = (id) => plain(val(id));
    const line = (LINES[t.layout] || (() => ""))(v, t, val)
      .replace(/\(\s*\)/g, "").replace(/ {2,}/g, " ").replace(/\s+([.,!])/g, "$1").replace(/([.!]){2,}/g, "$1").trim();
    const sr = BPG.series && BPG.series.current();
    const teams = (t.cat === "series" && sr ? sr.teams : [val("team"), val("opp"), val("t1"), val("t2"), val("winner"), val("loser")]).map(plain).filter(Boolean);
    const sport = t.cat === "football" || (t.cat === "series" && sr && sr.sport === "football") ? "#Football" : t.cat === "test" ? "#Cricket #TestCricket" : t.cat === "cricket" || t.cat === "series" ? "#Cricket" : "";
    const vsTag = teams.length >= 2 ? "#" + short(teams[0]) + "v" + short(teams[1]) : "";
    const tags = [...new Set(["#BorhanRants", vsTag, ...teams.map(tag), tag(val("player")), sport, opts.extraTags || ""].filter(Boolean))].join(" ");
    return [line, opts.verdict ? `Borhan's verdict: ${plain(opts.verdict)}` : "", BPG.CTAS[opts.cta || "en"], tags].filter(Boolean).join("\n\n");
  };
})();
