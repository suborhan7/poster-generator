# Match alerts

Every 10 minutes GitHub checks live matches for free and sends a Telegram message at each key moment.
Each message has a link that opens the right card in the poster studio with everything filled in. Add a photo and post.

**Football:** goal (scorer, assist, minute, score, BRACE!/HAT-TRICK! on the card), red card, half-time, full-time.
**Cricket:** toss, fifty, hundred, 3 and 5 wicket spells, innings break with target, result with player of the match.

## Setup (once, from the phone)

1. **Telegram bot.** In Telegram open @BotFather, send `/newbot`, pick any name. Copy the token it gives you. Open your new bot and send it "hi".
2. **Free keys.**
   - Football: sign up at dashboard.api-football.com (free, 100 checks a day). Copy the API key.
   - Cricket: sign up at cricketdata.org (free, 100 checks a day). Copy the API key.
   - Backup for football (optional): football-data.org free key. Used if API-Football's free plan refuses; gives the score but not the scorer.
3. **Put the keys in GitHub, never in chat.** github.com/suborhan7/poster-generator, then Settings, Secrets and variables, Actions, New repository secret. Add:
   - `TELEGRAM_BOT_TOKEN`
   - `API_FOOTBALL_KEY`
   - `CRICKETDATA_KEY`
   - `FOOTBALL_DATA_KEY` (optional)
4. **Site link** (optional): on the same page, Variables tab, add `SITE_URL` = your Vercel Domains link. Without it, `https://poster-generator-tau.vercel.app` is used.
5. **Test.** Actions tab, Match alerts, Run workflow, tick "Send a sample alert", Run. A test message with a goal card link should arrive.

## Which matches

`alerts/config.json`: football league ids (39 Premier League, 140 La Liga, 2 Champions League, 1 World Cup, 4 Euro, 9 Copa América, 32/34 World Cup qualifiers) plus teams followed in any competition; cricket teams (men's internationals) plus series names like Bangladesh Premier League.

## Good to know

- GitHub may start a check a few minutes late, so an alert can come 5 to 15 minutes after the moment.
- The free cricket plan has 100 hits a day and a full scorecard costs 10, so scores, toss, innings break and result are checked every 10 minutes, while fifties, hundreds and wicket hauls are checked about hourly and at each innings break. One full ODI uses about 92 hits. Bangladesh matches get first call on the hits. If the hits still run out, alerts that arrive later are marked "Catching up".
- GitHub pauses the 10-minute schedule if the repo has no commits for 60 days. Turn it back on in the Actions tab.
- `node alerts/test.mjs` plays sample matches through the checker without any keys.
