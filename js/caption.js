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
    const teams = [val("team"), val("opp"), val("t1"), val("t2")].map(plain).filter(Boolean);
    const sport = t.cat === "football" ? "#Football" : t.cat === "cricket" ? "#Cricket" : "";
    const vsTag = teams.length >= 2 ? "#" + short(teams[0]) + "v" + short(teams[1]) : "";
    const tags = [...new Set(["#BorhanRants", vsTag, ...teams.map(tag), tag(val("player")), sport, opts.extraTags || ""].filter(Boolean))].join(" ");
    return [line, opts.verdict ? `Borhan's verdict: ${plain(opts.verdict)}` : "", BPG.CTAS[opts.cta || "en"], tags].filter(Boolean).join("\n\n");
  };
})();
