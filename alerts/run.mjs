// Key-moment alerts. Runs every 10 minutes on GitHub Actions (.github/workflows/alerts.yml),
// checks free match data and sends a Telegram message with a link that opens the card already filled in.
// Keys come from the repo's Actions secrets and are never printed. Setup steps: alerts/README.md.
//   node alerts/run.mjs          normal check
//   node alerts/run.mjs --test   send one sample alert to check the bot works
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { footballAlerts, footballDataAlerts, cricketMatchAlerts, cricketCardAlerts, isFollowedCricket, formatMessage, makeLink } from "./lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(fs.readFileSync(path.join(here, "config.json"), "utf8"));
const env = process.env;
const SITE = env.SITE_URL || "https://poster-generator-tau.vercel.app";
const STATE_FILE = env.ALERT_STATE || path.join(here, "..", ".alerts-state", "state.json");
let now = Date.now(), today = "";
const MIN = 60 * 1000;

// Network in one place, so test.mjs can swap in sample data.
export const io = {
  async get(url, headers = {}) {
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  async post(url, body) {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
    return r.ok;
  },
};
const where = (url) => { const u = new URL(url); return u.host + u.pathname; }; // never log keys in the query
async function get(url, headers) {
  try { return await io.get(url, headers); } catch (e) { console.log(`Could not reach ${where(url)}: ${e.message}`); return null; }
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch (e) { return {}; }
}
function saveState(s) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(s));
}

// ---------------- Football ----------------
async function football(state) {
  const f = (state.football ||= { fixtures: [], calls: 0, day: "" });
  if (f.day !== today) Object.assign(f, { day: today, calls: 0, broken: false });
  const out = [];
  const can = () => f.calls < CFG.football.dailyLimit;
  const AF = "https://v3.football.api-sports.io", afHead = { "x-apisports-key": env.API_FOOTBALL_KEY };

  if (env.API_FOOTBALL_KEY && !f.broken) {
    if (f.fetchedDay !== today && can()) {
      f.calls++;
      const j = await get(`${AF}/fixtures?date=${today}`, afHead);
      const errs = j && j.errors && Object.keys(j.errors).length ? j.errors : null;
      if (errs) { console.log("API-Football said:", JSON.stringify(errs).slice(0, 200)); f.broken = true; }
      else if (j) {
        f.fetchedDay = today;
        const keep = f.fixtures.filter((x) => !x.done && now - x.kickoff < 4 * 60 * MIN);
        for (const fx of j.response || []) {
          const followed = CFG.football.leagues.includes(fx.league.id)
            || [fx.teams.home.name, fx.teams.away.name].some((n) => CFG.football.teams.includes(n));
          if (followed && !keep.some((x) => x.id === fx.fixture.id))
            keep.push({ id: fx.fixture.id, kickoff: Date.parse(fx.fixture.date), name: `${fx.teams.home.name} v ${fx.teams.away.name}` });
        }
        f.fixtures = keep;
        console.log(`Football: ${keep.length} followed matches today`);
      }
    }
    const active = f.fixtures.filter((x) => !x.done && now >= x.kickoff - 5 * MIN && now <= x.kickoff + 3.5 * 60 * MIN);
    for (let i = 0; i < active.length && can(); i += 20) {
      f.calls++;
      const ids = active.slice(i, i + 20).map((x) => x.id).join("-");
      const j = await get(`${AF}/fixtures?ids=${ids}`, afHead);
      if (j && j.errors && Object.keys(j.errors).length) { f.broken = true; break; }
      for (const fx of (j && j.response) || []) {
        out.push(...footballAlerts(fx, SITE));
        if (["FT", "AET", "PEN", "PST", "CANC", "ABD", "AWD", "WO"].includes(fx.fixture.status.short))
          (f.fixtures.find((x) => x.id === fx.fixture.id) || {}).done = true;
      }
    }
    // Drop matches that never finished in the data (postponed and the like) once their window has passed.
    f.fixtures = f.fixtures.filter((x) => !(x.done || now > x.kickoff + 4 * 60 * MIN));
  }

  // Fallback: football-data.org, score only. Used when there is no API-Football key or its free plan refuses.
  if ((!env.API_FOOTBALL_KEY || f.broken) && env.FOOTBALL_DATA_KEY) {
    const j = await get(`https://api.football-data.org/v4/matches?competitions=${CFG.football.footballDataCompetitions.join(",")}`, { "X-Auth-Token": env.FOOTBALL_DATA_KEY });
    const scores = (state.fd ||= {});
    for (const m of (j && j.matches) || []) {
      if (!["IN_PLAY", "PAUSED", "FINISHED"].includes(m.status)) continue;
      const r = footballDataAlerts(m, scores[m.id], SITE);
      out.push(...r.alerts); scores[m.id] = { ...r.now, t: now };
    }
    for (const id of Object.keys(scores)) if (now - scores[id].t > 24 * 60 * MIN) delete scores[id];
  }
  return out;
}

// ---------------- Cricket ----------------
async function cricket(state) {
  if (!env.CRICKETDATA_KEY) return [];
  const c = (state.cricket ||= { matches: {}, lastList: 0 });
  if (c.day !== today) Object.assign(c, { day: today, hitsLeft: null });
  const C = CFG.cricket, base = "https://api.cricapi.com/v1", key = `apikey=${env.CRICKETDATA_KEY}`;
  const canHit = () => c.hitsLeft == null || c.hitsLeft > C.reserveHits;
  const track = (j) => { if (j && j.info && j.info.hitsLimit != null) c.hitsLeft = j.info.hitsLimit - j.info.hitsToday; };

  const tracked = Object.values(c.matches);
  const busy = tracked.some((m) => (m.started && !m.ended) || (!m.started && now >= m.start - 45 * MIN));
  if (!(busy || now - c.lastList >= C.idleCheckMinutes * MIN) || !canHit()) return [];

  const j = await get(`${base}/currentMatches?${key}&offset=0`);
  track(j);
  if (!j || j.status !== "success") { if (j) console.log("CricketData said:", String(j.reason || j.status).slice(0, 200)); return []; }
  c.lastList = now;

  const out = [];
  for (const m of j.data || []) {
    if (!isFollowedCricket(m, C)) continue;
    const prev = c.matches[m.id], innings = (m.score || []).length;
    const rec = (c.matches[m.id] = { ...(prev || {}), start: Date.parse(m.dateTimeGMT + "Z") || now, started: !!m.matchStarted, ended: !!m.matchEnded, seen: now });
    let card = null;
    const changed = !prev || prev.innings !== innings || (m.matchEnded && !prev.ended);
    const due = m.matchStarted && (!rec.cardAt || now - rec.cardAt >= C.scorecardEveryMinutes * MIN);
    if (m.matchStarted && (changed || due) && canHit()) {
      const s = await get(`${base}/match_scorecard?${key}&id=${m.id}`);
      track(s);
      if (s && s.status === "success" && s.data) { card = s.data; rec.cardAt = now; out.push(...cricketCardAlerts(m, card, SITE)); }
    }
    out.push(...cricketMatchAlerts(m, prev, SITE, card));
    rec.innings = innings;
  }
  for (const [id, m] of Object.entries(c.matches)) if (now - m.seen > 2 * 24 * 60 * MIN) delete c.matches[id];
  console.log(`Cricket: ${Object.keys(c.matches).length} followed matches, ${c.hitsLeft ?? "?"} free hits left today`);
  return out;
}

// ---------------- Telegram ----------------
async function telegram(state, text) {
  const tok = env.TELEGRAM_BOT_TOKEN;
  if (!tok) { console.log("No TELEGRAM_BOT_TOKEN secret yet, so nothing was sent."); return false; }
  const api = `https://api.telegram.org/bot${tok}`;
  let chat = env.TELEGRAM_CHAT_ID || state.chatId;
  if (!chat) {
    const u = await get(`${api}/getUpdates`);
    const msg = ((u && u.result) || []).map((x) => x.message || x.channel_post).filter(Boolean).pop();
    if (!msg) { console.log("No chat yet: open your bot in Telegram and send it any message, then run again."); return false; }
    chat = state.chatId = msg.chat.id;
  }
  try {
    const ok = await io.post(`${api}/sendMessage`, { chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true });
    if (!ok) console.log("Telegram refused the message");
    return ok;
  } catch (e) { console.log("Could not reach Telegram:", e.message); return false; }
}

export async function main(argv = process.argv.slice(2), at = Date.now()) {
  now = at; today = new Date(now).toISOString().slice(0, 10);
  const state = loadState();
  if (argv.includes("--test")) {
    const ok = await telegram(state, formatMessage({
      text: "✅ <b>Test alert</b> from Borhan Rants About Sports. Tap the link: the goal card should open filled in.",
      links: [{ label: "Sample goal card", url: makeLink(SITE, "goal", { player: "Lionel Messi", team: "Argentina", opp: "Brazil", minute: "67'", score: "Argentina 1-0 Brazil", assist: "Julián Álvarez" }) }],
    }));
    saveState(state);
    return ok;
  }

  const alerts = [];
  for (const job of [football, cricket]) {
    try { alerts.push(...(await job(state))); } catch (e) { console.log(`${job.name} check failed: ${e.message}`); }
  }
  const sent = (state.sent ||= {});
  const fresh = alerts.filter((a, i) => !sent[a.key] && alerts.findIndex((b) => b.key === a.key) === i);

  if (!state.seeded) {
    // First run (or the saved state was lost): don't flood with old moments, just say alerts are on.
    fresh.forEach((a) => { sent[a.key] = now; });
    if (await telegram(state, "✅ <b>Match alerts are on.</b> You'll get a message with a ready card at each key moment.")) state.seeded = true;
  } else {
    for (const a of fresh) if (await telegram(state, formatMessage(a))) sent[a.key] = now;
  }
  for (const k of Object.keys(sent)) if (now - sent[k] > 3 * 24 * 60 * MIN) delete sent[k];
  console.log(`${fresh.length} new moment(s)`);
  saveState(state);
  return true;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
