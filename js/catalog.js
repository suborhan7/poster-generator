// The card picker's catalogue: the plain name, emoji, group (shelf) and search words of every card.
// Only what you SEE changes here. Card keys, fields and designs stay in templates.js and the layout files.
// To add a card to the picker: add one line to CARDS below with its key.
window.BPG = window.BPG || {};

(() => {
  const T = BPG.TEMPLATES;

  // Groups shown as pills, in this order. ("tour" must stay "tour": the app shows the tournament picker there.)
  BPG.SHELVES = {
    cricket: "🏏 Cricket",
    test: "🔴 Test",
    football: "⚽ Football",
    news: "📰 News & talk",
    compare: "🆚 Compare",
    teams: "👥 Line-ups",
    tables: "📊 Tables & series",
    tour: "🏆 Tournaments",
    rants: "🔥 Borhan Rants",
    stylish: "✨ Big text",
  };

  // key: [emoji, name, group, "use it when…", "extra search words (Banglish / Bangla)"]
  const CARDS = {
    // Cricket, in match order: during the innings, milestones, bowling, end of match.
    scoreupd:    ["📺", "Live score", "cricket", "Score during an innings, like the TV score bar", "score update live run rate rr scorebar স্কোর"],
    innings:     ["☕", "Innings break", "cricket", "First innings is over: total and target", "target innings break half time lokkho লক্ষ্য"],
    chase:       ["🎯", "Runs needed", "cricket", "Chase is on: need 42 off 30 balls", "chase tracker need required rate rrr lagbe dorkar"],
    partnership: ["🤝", "Partnership", "cricket", "Two batters' stand together", "partnership stand juti জুটি"],
    fifty:       ["5️⃣", "Fifty (50)", "cricket", "A batter reaches 50", "50 half century fifty pachas ফিফটি অর্ধশতক"],
    century:     ["💯", "Century (100)", "cricket", "A batter reaches 100", "100 hundred ton century shotok sentury সেঞ্চুরি শতক"],
    knock:       ["🏏", "Knock (52 off 38)", "cricket", "Any batting score, X runs off Y balls. 0 gets a DUCK stamp", "knock innings runs balls batting duck"],
    bigknock:    ["💥", "Knock, bold style", "cricket", "Big batting score with big bold text", "big knock bold innings runs"],
    wicket:      ["☝️", "Wicket", "cricket", "A batter is out", "wicket out uikat bowled caught উইকেট আউট"],
    fifer:       ["🖐️", "Five wickets", "cricket", "A bowler takes 5 wickets", "five wicket haul fifer 5wi 5 wickets পাঁচ উইকেট"],
    goodover:    ["🔥", "Great over", "cricket", "Over with few runs or wickets: six balls shown", "brilliant over maiden good over"],
    badover:     ["💸", "Expensive over", "cricket", "Over that went for lots of runs", "bad over expensive costly sixes"],
    cresult:     ["🏆", "Match result", "cricket", "Who won, both scores and player of the match", "result won win potm jitlo joy ফলাফল"],
    bigresult:   ["🏅", "Result, bold style", "cricket", "Who won, in big bold text", "big result bold win"],
    toss:        ["🪙", "Toss", "cricket", "Who won the toss and chose what", "toss coin bat bowl first"],
    form:        ["📈", "Recent form", "cricket", "A player's last few scores as a bar chart", "form last innings average chart"],

    // Test cricket
    testfifty:   ["5️⃣", "Test fifty", "test", "50 in a Test match", "test 50 fifty red ball"],
    testton:     ["💯", "Test hundred", "test", "100 in a Test match", "test 100 century ton red ball"],
    testfifer:   ["🖐️", "Test five wickets", "test", "5 wickets in a Test innings", "test fifer five wicket red ball"],
    stumps:      ["⏸️", "Day end / Lunch / Tea", "test", "Score at stumps, lunch or tea", "stumps lunch tea day end session"],
    testresult:  ["🏆", "Test result", "test", "Who won the Test (or a draw)", "test result draw won"],

    // Football
    goal:        ["⚽", "Goal", "football", "Someone scores", "goal gol scored গোল"],
    fresult:     ["🏁", "Full-time score", "football", "Final score of a match", "full time ft result score"],
    fbigresult:  ["🏅", "Result, bold style", "football", "Who won, in big bold text", "big result bold win"],
    matchcard:   ["🆚", "Match card (live / full time)", "football", "Two crests and the score, for kick-off, live or full time", "match card kick off live ft vs"],
    redcard:     ["🟥", "Red card", "football", "A player is sent off", "red card sent off lal card"],
    rating:      ["⭐", "Player rating", "football", "Rate a player out of 10", "rating rate 10 player"],
    transfer:    ["🔁", "Transfer", "football", "A player moves club: old club, new club, fee", "transfer sign signing deal here we go"],
    tphoto:      ["📸", "Tournament photo card", "football", "Full photo, one big headline, tournament colours", "photo simple clean headline tournament saff best player"],
    tframe:      ["🖼️", "Tournament photo frame", "football", "Any photo with the tournament ribbons around it", "frame tournament ribbons photo"],

    // News & talk
    breaking:    ["🚨", "Breaking news", "news", "Big news, one strong headline", "breaking news alert"],
    news:        ["📰", "News with details", "news", "Headline plus up to 4 lines of text", "instant news update details khobor খবর"],
    statuscard:  ["✅", "Player in / out", "news", "In the XI, ruled out, injured, rested", "status ruled out injury injured xi in out dropped"],
    quote:       ["💬", "Quote", "news", "What a player or coach said", "quote said bolse উক্তি"],
    hottake:     ["🌶️", "Hot take (my opinion)", "news", "Your bold opinion on a player or match", "hot take opinion rant take mot"],
    trivia:      ["💡", "Did you know?", "news", "A fun fact or stat", "trivia fact did you know jano ki"],
    poll:        ["🗳️", "Who will win? (poll)", "news", "Fans comment 1 or 2", "poll ke jitbe who will win vote predict"],
    countdown:   ["⏳", "Countdown", "news", "Days left to a big match", "countdown days left baki"],
    onthisday:   ["📅", "On this day", "news", "Something that happened on this date years ago", "on this day history ajker dine"],
    record:      ["🏅", "Record broken", "news", "A record or big achievement, with a big number", "record achievement milestone"],
    mvp:         ["👑", "Player of the month", "news", "MVP or player of the month / series", "mvp potm player of month series award"],
    profile:     ["🪪", "Player profile", "news", "A player's career stats", "profile career stats bio"],
    debut:       ["🧢", "Debut", "news", "A player's first match", "debut cap first match ovishek অভিষেক"],
    top:         ["🔢", "Top 5 list", "news", "Any ranked list", "top list ranking top 5 top 10"],
    frame:       ["🖼️", "Photo with logo", "news", "Just the photo, a short line and your logo", "photo frame picture simple"],
    story:       ["📚", "5-slide story (carousel)", "news", "One match told in 5 swipeable slides", "story carousel slides swipe"],

    // Compare
    versus:      ["⚖️", "Who's better?", "compare", "Two players, fans pick one", "versus who better vs ke bhalo"],
    compare:     ["📊", "Player vs player stats", "compare", "Two players' stats side by side with bars", "compare player vs player stats bars"],
    h2h:         ["🆚", "Head to head (teams)", "compare", "Two teams' record against each other", "head to head h2h teams record"],

    // Line-ups and squads
    playingxi:   ["📋", "Playing XI (cricket)", "teams", "Cricket team's eleven for the match", "playing xi 11 eleven lineup cricket team"],
    squad:       ["🏏", "Squad (cricket)", "teams", "Cricket squad announced, with the flag", "squad announcement dol দল cricket"],
    lineup:      ["📋", "Starting XI (football)", "teams", "Football eleven as a list", "starting xi lineup 11 football"],
    pitch:       ["🏟️", "XI on the pitch", "teams", "Football eleven drawn on a pitch with a formation", "pitch formation 4-3-3 lineup xi"],
    fsquad:      ["⚽", "Squad (football)", "teams", "Football squad announced, with the flag", "squad announcement football dol"],
    totwc:       ["🌟", "Team of the week (cricket)", "teams", "Best cricket XI of the week", "team of the week totw best xi cricket"],
    totw:        ["🌟", "Team of the week (football)", "teams", "Best football XI of the week, on a pitch", "team of the week totw best xi football"],

    // Tables and series (series cards fill from the Series box)
    seriesscore: ["🧮", "Series score", "tables", "Series result so far (fill the Series box)", "series score results 2-1"],
    preview:     ["🔜", "Match preview", "tables", "Next match in a series", "preview next match upcoming"],
    mostruns:    ["🏏", "Most runs", "tables", "Top run scorers of a series", "most runs top scorers batting leaders"],
    mostwkts:    ["🎯", "Most wickets", "tables", "Top wicket takers of a series", "most wickets bowling leaders"],
    points:      ["📊", "Points table", "tables", "Series or league points table", "points table standings"],
    topscorers:  ["⚽", "Top goal scorers", "tables", "Most goals in a tournament", "top scorers goals golden boot"],
    assists:     ["🅰️", "Most assists", "tables", "Most assists in a tournament", "assists playmaker"],
    fixtures:    ["🗓️", "Fixtures", "tables", "Upcoming matches with day and time", "fixtures schedule upcoming matches khela kobe"],
    tgroup:      ["🧾", "Group table", "tables", "Group standings, top teams highlighted", "group table standings points"],
    tstats:      ["📉", "Match stats", "tables", "Possession, shots and more with split bars", "match stats possession shots"],

    // Borhan Rants (your own style)
    reaction:     ["🔥", "Match reaction", "rants", "Your rant on a match, with the Rant Meter", "reaction rant take meter"],
    reactionTest: ["📝", "Day report", "rants", "Your take on a Test day, with the Rant Meter", "day report test rant"],

    // Big text (the Stylish cards with the font library)
    gruns:   ["🔠", "Runs, big text", "stylish", "Huge \"219* RUNS!\" headline, pick any font", "stylish runs big text font headline"],
    gwkts:   ["🔠", "Wickets, big text", "stylish", "Huge \"5 WICKETS\" headline", "stylish wickets big text font"],
    ggoal:   ["🔠", "Goal, big text", "stylish", "Huge \"GOAL!\" headline", "stylish goal big text font"],
    gresult: ["🔠", "Result, big text", "stylish", "Huge \"WON BY 7 WICKETS\" headline", "stylish result big text font"],
    gnumber: ["🔠", "Big number / record", "stylish", "One huge number for a record", "stylish number record big text font"],
  };

  // Tournament copies (saff_matchcard…) take the base card's emoji and a short name.
  const TOUR_NAMES = { matchcard: "Match card", lineup: "Starting XI", pitch: "XI on the pitch", fixtures: "Fixtures", tgroup: "Group table", tstats: "Match stats", h2h: "Head to head", poll: "Who will win? (poll)", tframe: "Photo frame", tphoto: "Photo card (simple)" };

  Object.entries(T).forEach(([key, t]) => {
    let c = CARDS[key];
    if (t.tour) {
      const base = key.slice(t.tour.length + 1), b = CARDS[base];
      c = [b ? b[0] : "🏆", TOUR_NAMES[base] || t.name, "tour", b ? b[3] : "", (b ? b[4] : "") + " " + t.tour];
    }
    if (!c) c = ["🃏", t.name, BPG.SHELVES[t.cat] ? t.cat : "news", "", ""];  // a new card nobody listed yet still shows up
    t.oldName = t.name;
    [t.emoji, t.name, t.shelf, t.use, t.kw] = c;
    const i = t.tour ? Object.keys(TOUR_NAMES).indexOf(key.slice(t.tour.length + 1)) : Object.keys(CARDS).indexOf(key);
    t.order = i < 0 ? 999 : i;
  });

  BPG.shelfOf = (key) => (T[key] && T[key].shelf) || "cricket";
  BPG.firstOfShelf = (shelf) => Object.keys(T).filter((k) => T[k].shelf === shelf).sort((a, b) => T[a].order - T[b].order)[0];

  // Search: every word typed must appear in the name, group, use line, search words or old name.
  const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  BPG.searchCards = (q) => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return Object.keys(T).map((k) => {
      const t = T[k], name = norm(t.name);
      const hay = [name, norm(BPG.SHELVES[t.shelf]), norm(t.use), norm(t.kw), norm(t.oldName), k.toLowerCase()].join(" ");
      if (!words.every((w) => hay.includes(w))) return null;
      // Name matches first, then name starts, then everything else.
      const score = words.reduce((s, w) => s + (name.startsWith(w) ? 3 : name.includes(w) ? 2 : 0), 0) - (t.tour ? 1 : 0) + (name.replace(/\s*\(.*\)$/, "") === words.join(" ") ? 5 : 0);
      return [k, score, name.length];
    }).filter(Boolean).sort((a, b) => b[1] - a[1] || a[2] - b[2]).map((x) => x[0]);
  };
})();
