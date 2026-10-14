// Plays a football match and a cricket match through the alert checker with sample data.
// No keys or network needed:  node alerts/test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "alerts-"));
Object.assign(process.env, {
  ALERT_STATE: path.join(dir, "state.json"), SITE_URL: "https://example.app",
  API_FOOTBALL_KEY: "k", CRICKETDATA_KEY: "k", TELEGRAM_BOT_TOKEN: "t", TELEGRAM_CHAT_ID: "1",
});
delete process.env.FOOTBALL_DATA_KEY;
const { main, io } = await import("./run.mjs");

const KO = Date.parse("2026-10-14T19:00:00Z"), MIN = 60000;
let world = {}, sent = [];
io.get = async (url) => {
  const u = new URL(url), p = u.pathname;
  if (p.endsWith("/fixtures") && u.searchParams.get("date")) return { errors: [], response: [world.fx] };
  if (p.endsWith("/fixtures")) return { errors: [], response: [world.fx] };
  if (p.endsWith("/currentMatches")) return { status: "success", data: [world.cm, other], info: { hitsToday: 10, hitsLimit: 100 } };
  if (p.endsWith("/match_scorecard")) return { status: "success", data: world.card, info: { hitsToday: 11, hitsLimit: 100 } };
  throw new Error("unexpected " + p);
};
io.post = async (url, body) => { sent.push(body.text); return true; };
const run = async (t) => { sent = []; await main([], t); return sent; };
const decode = (msg, i = 0) => {
  const href = [...msg.matchAll(/href="([^"]+)"/g)][i][1].replace(/&amp;/g, "&");
  const u = new URL(href);
  return { card: u.searchParams.get("card"), big: u.searchParams.get("big"), d: JSON.parse(Buffer.from(u.searchParams.get("d"), "base64url").toString()) };
};

// ---- Football ----
const ev = (elapsed, type, detail, team, player, assist) => ({ time: { elapsed, extra: null }, type, detail, team: { name: team }, player: { name: player }, assist: { name: assist || null } });
const fixture = (short, h, a, events, extra = {}) => ({
  fixture: { id: 99, date: new Date(KO).toISOString(), status: { short } },
  league: { id: 39, name: "Premier League", round: "Regular Season - 8" },
  teams: { home: { name: "Arsenal" }, away: { name: "Chelsea" } }, goals: { home: h, away: a }, events, ...extra,
});
const cmBase = { id: "m1", name: "Bangladesh vs Afghanistan, 1st ODI, Afghanistan tour of Bangladesh 2026", matchType: "odi",
  teams: ["Bangladesh", "Afghanistan"], dateTimeGMT: "2026-10-14T08:00:00", matchStarted: false, matchEnded: false, score: [] };
const other = { ...cmBase, id: "x", name: "Nepal vs Oman, 3rd T20I, Oman tour", teams: ["Nepal", "Oman"], tossWinner: "Nepal", tossChoice: "bat" };
world = { fx: fixture("NS", 0, 0, []), cm: cmBase, card: { scorecard: [] } };

let out = await run(KO - 60 * MIN);
assert.equal(out.length, 1); assert.match(out[0], /alerts are on/i);

const g1 = ev(12, "Goal", "Normal Goal", "Arsenal", "Bukayo Saka", "Martin Odegaard");
world.fx = fixture("1H", 1, 0, [g1]);
out = await run(KO + 13 * MIN);
assert.equal(out.length, 1); assert.match(out[0], /GOAL<\/b> Bukayo Saka 12'/);
let l = decode(out[0]);
assert.deepEqual([l.card, l.d.player, l.d.team, l.d.opp, l.d.score, l.d.assist], ["goal", "Bukayo Saka", "Arsenal", "Chelsea", "Arsenal 1-0 Chelsea", "Martin Odegaard"]);

out = await run(KO + 23 * MIN);
assert.equal(out.length, 0, "same goal is not sent twice");

const og = ev(30, "Goal", "Own Goal", "Arsenal", "William Saliba");
const red = ev(40, "Card", "Second Yellow card", "Chelsea", "Moises Caicedo");
world.fx = fixture("HT", 1, 1, [g1, og, red]);
out = await run(KO + 50 * MIN);
assert.equal(out.length, 3);
assert.match(out[0], /OWN GOAL<\/b> William Saliba/); assert.equal(decode(out[0]).d.score, "Arsenal 1-1 Chelsea"); assert.equal(decode(out[0]).d.team, "Chelsea");
assert.match(out[1], /RED CARD<\/b> Moises Caicedo/); assert.equal(decode(out[1]).d.reason, "Second yellow");
assert.match(out[2], /HALF-TIME<\/b> Arsenal 1-1 Chelsea/); assert.equal(decode(out[2]).d.headline, "HALF-TIME");

const g3 = ev(70, "Goal", "Penalty", "Arsenal", "Bukayo Saka"), g4 = ev(88, "Goal", "Normal Goal", "Arsenal", "Bukayo Saka", "Declan Rice");
world.fx = fixture("FT", 3, 1, [g1, og, red, g3, g4]);
out = await run(KO + 115 * MIN);
assert.equal(out.length, 3);
assert.equal(decode(out[0]).big, "BRACE!"); assert.equal(decode(out[0]).d.score, "Arsenal 2-1 Chelsea");
assert.match(out[1], /HAT-TRICK<\/b>/); assert.equal(decode(out[1]).big, "HAT-TRICK!");
assert.match(out[2], /FULL-TIME<\/b> Arsenal 3-1 Chelsea/);
const ft = decode(out[2]), bold = decode(out[2], 1);
assert.deepEqual([ft.card, ft.d.s1, ft.d.s2], ["fresult", 3, 1]);
assert.match(ft.d.potm, /^Bukayo Saka 12', Bukayo Saka \(pen\) 70', Bukayo Saka 88' · William Saliba \(og\) 30'$/);
assert.deepEqual([bold.card, bold.d.winner, bold.d.loser, bold.d.margin], ["fbigresult", "Arsenal", "Chelsea", "3-1"]);

out = await run(KO + 125 * MIN);
assert.equal(out.length, 0, "finished match is not checked again");

// ---- Cricket ----
const T0 = Date.parse("2026-10-14T08:00:00Z");
world.cm = { ...cmBase, tossWinner: "Bangladesh", tossChoice: "bat", matchStarted: true };
out = await run(T0 - 20 * MIN);
assert.equal(out.length, 1, "toss for a followed team only (Nepal v Oman is ignored)");
l = decode(out[0]);
assert.deepEqual([l.card, l.d.player, l.d.stamp, l.d.detail], ["toss", "1ST ODI", "*BANGLADESH* OPT TO BAT FIRST", "Afghanistan tour of Bangladesh 2026"]);

const bat = (name, r, b, f, s, dis = "not out") => ({ batsman: { name }, r, b, "4s": f, "6s": s, "dismissal-text": dis });
const bowl = (name, o, r, w) => ({ bowler: { name }, o, r, w });
world.cm = { ...world.cm, score: [{ r: 140, w: 3, o: 28, inning: "Bangladesh Inning 1" }] };
world.card = { scorecard: [{ inning: "Bangladesh Inning 1", batting: [bat("Towhid Hridoy", 54, 41, 5, 2), bat("Litton Das", 20, 22, 2, 0, "c X b Y")], bowling: [bowl("Rashid Khan", 6, 21, 3)] }] };
out = await run(T0 + 110 * MIN);
assert.equal(out.length, 2);
assert.match(out[0], /FIFTY<\/b> Towhid Hridoy 54\* \(41\)/);
l = decode(out[0]); assert.deepEqual([l.card, l.d.runs, l.d.team, l.d.opp, l.d.fours], ["fifty", "54*", "Bangladesh", "Afghanistan", 5]);
l = decode(out[1]); assert.deepEqual([l.card, l.big, l.d.wkts, l.d.team], ["fifer", "THREE-FOR", 3, "Afghanistan"]);

out = await run(T0 + 115 * MIN);
assert.equal(out.length, 0, "scorecard waits 20 minutes and nothing repeats");

world.cm = { ...world.cm, score: [{ r: 286, w: 7, o: 50, inning: "Bangladesh Inning 1" }, { r: 0, w: 0, o: 0, inning: "Afghanistan Inning 1" }] };
world.card = { scorecard: [{ inning: "Bangladesh Inning 1", batting: [bat("Towhid Hridoy", 104, 90, 9, 3)], bowling: [bowl("Rashid Khan", 10, 45, 4)] }] };
out = await run(T0 + 200 * MIN);
assert.equal(out.length, 2, "hundred and innings break; a 4-for after the 3-for alert stays quiet");
assert.match(out[0], /HUNDRED<\/b> Towhid Hridoy 104\*/);
assert.match(out[1], /INNINGS BREAK<\/b> Bangladesh 286\/7 \(50\)\nTarget 287/);
l = decode(out[1]); assert.deepEqual([l.card, l.d.score, l.d.topbat, l.d.topbowl], ["innings", "286/7", "Hridoy 104 (90)", "Khan 4/45"]);

world.cm = { ...world.cm, matchEnded: true, status: "Bangladesh won by 42 runs", matchWinner: "Bangladesh",
  score: [{ r: 286, w: 7, o: 50, inning: "Bangladesh Inning 1" }, { r: 244, w: 10, o: 46.3, inning: "Afghanistan Inning 1" }] };
world.card = { ...world.card, player_of_match: [{ name: "Towhid Hridoy" }] };
out = await run(T0 + 420 * MIN);
assert.equal(out.length, 1);
assert.match(out[0], /RESULT<\/b> Bangladesh won by 42 runs\nPlayer of the match: Towhid Hridoy/);
const br = decode(out[0]), cr = decode(out[0], 1);
assert.deepEqual([br.card, br.d.winner, br.d.loser, br.d.margin, br.d.info], ["bigresult", "Bangladesh", "Afghanistan", "by 42 runs", "1st ODI | Afghanistan tour of Bangladesh 2026"]);
assert.deepEqual([cr.card, cr.d.headline, cr.d.s1, cr.d.s2, cr.d.potm], ["cresult", "*BANGLADESH* WIN BY 42 RUNS", "286/7 (50)", "244/10 (46.3)", "Towhid Hridoy"]);

fs.rmSync(dir, { recursive: true, force: true });
console.log("All alert checks passed");
