// Quick fill: type one line like "Maaz Sadaqat 52*(38) 5x4 2x6 PAK vs SL" and the form fills itself.
// BPG.quickParse(text) returns what it understood; BPG.quickApply(template, text) maps that onto a card's fields.
window.BPG = window.BPG || {};

(() => {
  // Short forms and common spellings -> the full name shown on the card.
  // Add a line here to teach it a new team.
  const TEAMS = {
    "Bangladesh": ["ban", "bd", "bang", "bangla", "tigers"],
    "Pakistan": ["pak", "pk"],
    "Sri Lanka": ["sl", "srilanka", "sri lanka", "lanka"],
    "India": ["ind", "in"],
    "Australia": ["aus", "oz"],
    "England": ["eng"],
    "South Africa": ["sa", "rsa", "proteas", "southafrica"],
    "New Zealand": ["nz", "newzealand", "kiwis"],
    "Afghanistan": ["afg", "afghan"],
    "West Indies": ["wi", "windies", "westindies"],
    "Zimbabwe": ["zim"],
    "Ireland": ["ire"],
    "Netherlands": ["ned", "nl", "holland"],
    "Scotland": ["sco"],
    "Nepal": ["nep"],
    "UAE": ["uae"],
    "Oman": ["oma", "omn"],
    "USA": ["usa", "us"],
    "Namibia": ["nam"],
    "Canada": ["can"],
    "Hong Kong": ["hk", "hongkong"],
    "Argentina": ["arg"],
    "Brazil": ["bra"],
    "France": ["fra"],
    "Germany": ["ger"],
    "Spain": ["esp", "spa"],
    "Portugal": ["por"],
    "Italy": ["ita"],
    "Belgium": ["bel"],
    "Croatia": ["cro"],
    "Uruguay": ["uru"],
    "Morocco": ["mar"],
    "Japan": ["jpn"],
    "Mexico": ["mex"],
    "Real Madrid": ["rma", "real"],
    "Barcelona": ["fcb", "barca"],
    "Manchester City": ["mci", "man city", "city"],
    "Manchester United": ["mun", "man utd", "man united", "united"],
    "Liverpool": ["liv"],
    "Arsenal": ["ars"],
    "Chelsea": ["che"],
    "Bayern Munich": ["fcb munich", "bayern"],
    "Inter Miami": ["miami"],
    "Al Nassr": ["nassr"],
  };
  // The short form printed on cards that want one (score bars, reaction pill).
  const SHORT = {
    "Bangladesh": "BAN", "Pakistan": "PAK", "Sri Lanka": "SL", "India": "IND", "Australia": "AUS", "England": "ENG",
    "South Africa": "SA", "New Zealand": "NZ", "Afghanistan": "AFG", "West Indies": "WI", "Zimbabwe": "ZIM", "Ireland": "IRE",
    "Netherlands": "NED", "Scotland": "SCO", "Nepal": "NEP", "UAE": "UAE", "Oman": "OMA", "USA": "USA", "Namibia": "NAM",
    "Canada": "CAN", "Hong Kong": "HK", "Argentina": "ARG", "Brazil": "BRA", "France": "FRA", "Germany": "GER", "Spain": "ESP",
    "Portugal": "POR", "Italy": "ITA", "Belgium": "BEL", "Croatia": "CRO", "Uruguay": "URU", "Morocco": "MAR", "Japan": "JPN", "Mexico": "MEX",
  };

  const lookup = new Map();
  Object.entries(TEAMS).forEach(([full, alts]) => {
    lookup.set(full.toLowerCase(), full);
    lookup.set(full.toLowerCase().replace(/\s+/g, ""), full);
    alts.forEach((a) => lookup.set(a, full));
  });
  // Two-letter short forms like "in" and "us" are also ordinary words, so they only count in UPPER CASE or next to "vs".
  const risky = new Set(["in", "us", "can", "city", "real", "united", "oz", "nam", "bel", "ire"]);

  BPG.teamName = (s) => lookup.get(String(s || "").trim().toLowerCase()) || "";
  BPG.teamShort = (full) => SHORT[full] || String(full || "").slice(0, 3).toUpperCase();

  const title = (s) => s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());

  BPG.quickParse = (text) => {
    let t = " " + String(text || "").replace(/[–—]/g, "-").replace(/\s+/g, " ") + " ";
    t = t.replace(/(\d{1,3})\s*\*?\s*(?:not out|n\.o\.?|no)(?=[\s,.;]|$)/gi, "$1*");
    const out = {};
    const take = (re, fn) => { const m = t.match(re); if (m) { fn(m); t = t.replace(m[0], " "); } return !!m; };

    // Teams: "PAK vs SL", "Pakistan v Sri Lanka", "pak-sl" style first, then any team names left over.
    const names = [...lookup.keys()].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const teamRe = names.join("|");
    take(new RegExp(`(?:^|\\s)(${teamRe})\\s*(?:vs?\\.?|versus|x)\\s*(${teamRe})(?=\\s|[,.;]|$)`, "i"), (m) => {
      out.team = lookup.get(m[1].toLowerCase()); out.opp = lookup.get(m[2].toLowerCase());
    });

    // Football score "2-1" next to the teams: "ARG 2-1 BRA".
    take(new RegExp(`(?:^|\\s)(${teamRe})\\s+(\\d{1,2})\\s*-\\s*(\\d{1,2})\\s+(${teamRe})(?=\\s|[,.;]|$)`, "i"), (m) => {
      out.team = lookup.get(m[1].toLowerCase()); out.opp = lookup.get(m[4].toLowerCase()); out.goals1 = m[2]; out.goals2 = m[3];
    });

    // Slash figures, with optional overs: 5/23 (8.3) is a bowler, 286/7 (50) is a team score.
    take(/\b(\d{1,3})\s*[\/-]\s*(\d{1,3})\b(?:\s*(?:\(\s*(\d{1,2}(?:\.\d)?)\s*(?:ov|overs?)?\s*\)|(?:in|off)\s+(\d{1,2}(?:\.\d)?)\s*(?:ov|overs?)?\b))?/i, (m) => {
      const a = +m[1], b = +m[2], overs = m[3] || m[4] || "";
      if (a > 10 && a > b) { out.score = `${a}/${b}`; out.scoreOvers = overs; } else { out.wkts = m[1]; out.given = m[2]; out.overs = overs; }
    });
    // Batting: 52*(38), 52* off 38, 52 from 38 balls
    take(/(\d{1,3}\*?)\s*(?:\(\s*(\d{1,3})\s*(?:b|balls?)?\s*\)|(?:off|from)\s+(\d{1,3})\s*(?:b|balls?)?\b)/i, (m) => { out.runs = m[1]; out.balls = m[2] || m[3]; });
    // Boundaries: 5x4 2x6, 5 fours, 4s: 5, 5 4s
    take(/\b(\d{1,2})\s*x\s*4s?\b|\b(\d{1,2})\s*(?:fours?|4s)\b|\b(?:4s|fours?)\s*[:=-]?\s*(\d{1,2})\b/i, (m) => { out.fours = m[1] || m[2] || m[3]; });
    take(/\b(\d{1,2})\s*x\s*6s?\b|\b(\d{1,2})\s*(?:sixes|six|6s)\b|\b(?:6s|sixes)\s*[:=-]?\s*(\d{1,2})\b/i, (m) => { out.sixes = m[1] || m[2] || m[3]; });
    // Separate runs and balls if typed apart: "52* 38b", "52 runs 38 balls"
    if (!out.balls) take(/\b(\d{1,3})\s*(?:b|balls?)\b/i, (m) => { out.balls = m[1]; });
    if (!out.runs) take(/\b(\d{1,3}\*?)\s*(?:runs?|r)\b|(?:^|\s)(\d{1,3}\*)(?=\s)/i, (m) => { out.runs = m[1] || m[2]; });
    if (!out.overs) take(/\b([\d]{1,2}(?:\.\d)?)\s*(?:ov|overs?)\b/i, (m) => { out.overs = m[1]; });
    take(/\b(\d{1,3})\s*'(?=\s)|\b(\d{1,3})(?:st|nd|rd|th)?\s*(?:min|minute)\b/i, (m) => { out.minute = (m[1] || m[2]) + "'"; });

    // Any team names still left (no "vs"), in the order typed.
    const left = [];
    t = t.replace(new RegExp(`(^|[\\s,(])(${teamRe})(?=[\\s,.;)]|$)`, "gi"), (all, pre, w) => {
      if (risky.has(w.toLowerCase()) && w !== w.toUpperCase()) return all;
      left.push(lookup.get(w.toLowerCase())); return pre + " ";
    });
    left.forEach((n) => { if (!out.team) out.team = n; else if (!out.opp && n !== out.team) out.opp = n; });

    // Whatever words are left are the player's name.
    const words = t.replace(/\b(vs?|versus|against|for|and|scored|scores|hits|smashes|takes|took|not out|no|runs?|balls?|wkts?|wickets?)\b/gi, " ")
      .replace(/[^\p{L}\s'.-]/gu, " ").replace(/\s+/g, " ").trim();
    if (words) out.player = title(words);
    return out;
  };

  // Put the parsed values into the fields this card has. Returns the labels that were filled.
  BPG.quickApply = (tpl, text) => {
    const p = BPG.quickParse(text), ids = new Set(tpl.fields.map((f) => f[0])), set = {};
    const put = (id, v) => { if (ids.has(id) && v !== undefined && v !== "") set[id] = String(v); };
    put("player", p.player); put("batter", p.player);
    put("team", ids.has("abbr") || tpl.layout !== "reaction" ? p.team : BPG.teamShort(p.team));
    put("abbr", p.team && BPG.teamShort(p.team));
    put("opp", p.opp);
    put("runs", tpl.layout === "bowling" ? p.given : p.runs);
    put("balls", tpl.layout === "over" ? undefined : p.balls);
    put("fours", p.fours); put("sixes", p.sixes);
    put("wkts", p.wkts);
    put("score", p.score); put("overs", p.scoreOvers || p.overs);
    put("minute", p.minute);
    if (p.goals1 !== undefined) { put("t1", p.team); put("s1", p.goals1); put("t2", p.opp); put("s2", p.goals2); put("score", `${p.team} ${p.goals1}-${p.goals2} ${p.opp}`); }
    else if (tpl.layout === "result" || tpl.layout === "fscore") { put("t1", p.team); put("t2", p.opp); }
    const labels = Object.keys(set).map((id) => tpl.fields.find((f) => f[0] === id)[1].replace(/\s*\(.*\)$/, ""));
    return { values: set, labels };
  };

  // Example line shown in the box for each kind of card.
  BPG.quickExample = (tpl) => ({
    batting: "Maaz Sadaqat 52*(38) 5x4 2x6 PAK vs SL",
    knock: "Litton Das 82 off 41 8 fours 4 sixes BAN v SA",
    bowling: "Mustafizur 5/23 (8.3) BAN vs SA",
    over: "Taskin Ahmed BAN vs SA",
    wicket: "Temba Bavuma 41(55)",
    scoreupd: "BAN 317/8 (84)",
    innings: "Bangladesh 286/7 (50)",
    result: "BAN vs SA",
    goal: "Messi 67' ARG vs BRA",
    fscore: "ARG 2-1 BRA",
    redcard: "Casemiro 58' BRA vs ARG",
    rating: "Messi ARG vs BRA",
  })[tpl.layout] || "";
})();
