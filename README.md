# Borhan Poster Studio

A poster generator for **Borhan Rants About Sports**. Pick a card, type the details, add a photo, and download a ready-to-post image for Instagram, Facebook (1080 × 1350) or TikTok (1080 × 1920).

It's plain HTML, CSS and JavaScript, with no build step, no server and no account. Everything runs in your browser, and your photos never leave your device.

## Use it

- **On your computer:** open `index.html` in Chrome, Edge or Safari.
- **Online (recommended):** turn on GitHub Pages (below) and open `https://suborhan7.github.io/poster-generator/` on your phone or laptop. On a phone, tap **Share to app** to send the poster straight to Instagram, TikTok or Facebook. Use "Add to Home Screen" so it opens like an app.
- **As one file:** run `python3 tools/bundle.py` to get `dist/poster-studio.html`. That single file works offline and can be sent to any device.

### Turn on GitHub Pages (one time)

1. Open the repository on GitHub and go to **Settings**, then **Pages**.
2. Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **main**, and Folder to **/ (root)**. Then click **Save**.
3. After a minute the site is live at `https://suborhan7.github.io/poster-generator/`. Every push to `main` updates it automatically.

## Cards included (25)

| Group | Cards |
| --- | --- |
| Borhan Rants | Match reaction, Day report (your own style, with the Rant Meter) |
| Cricket | Fifty, Century, Knock (X off Y, adds a DUCK stamp on 0), Wicket, Five-wicket haul, Brilliant over, Bad over, Score update, Innings break, Match result, Recent form, Toss |
| Football | Goal, Full-time score, Red card, Player rating |
| General | Status (In the XI, Ruled out…), Hot take, Quote, Top list, Who's better?, Breaking news, Photo frame |

Features on every card:

- Put `*stars*` around words to colour them, as in `*TIGERS WIN* BY 5 WICKETS`.
- Your verdict line goes at the bottom of any card.
- Colour themes include Tigers green, Bangladesh red, Argentina, Brazil, Night and Alert.
- Strike rate, economy, over totals and chase targets are worked out for you.
- With a cutout PNG (transparent background), the big milestone number sits behind the player.
- Your inputs and brand settings are remembered in your browser.

## Files

| File | What it is | How often you'll edit it |
| --- | --- | --- |
| `js/config.js` | Brand name, handle, colours, themes, sizes | Sometimes |
| `js/templates.js` | The list of cards and their input fields | **Often**: new cards go here |
| `js/layouts.js` | The designs (how each card is drawn) | When you want a new look |
| `js/engine.js` | Drawing helpers shared by all designs | Rarely |
| `js/app.js` | The form, preview, download and share | Rarely |
| `css/styles.css` | Look of the tool itself (not the posters) | Rarely |
| `tools/bundle.py` | Builds the single-file version | Never |

## Add a new card

### A. New card, existing design (2 minutes)

Most new ideas reuse a design with different words. Open `js/templates.js`, copy an entry, and change the key, name and fields. For example, a "Ruled out" card:

```js
ruledout: { cat: "general", name: "Ruled out", layout: "status", accent: "#FF3B3B",
  fields: [["player","Player","Kagiso Rabada",true],["stamp","Status","*RULED OUT*",true],["detail","Detail line","1st Test vs Australia",true]] },
```

Each field is `[id, label, example value, wide?, "area" for multi-line]`. The layout reads fields by `id`, so keep the ids that layout uses. Check the matching entry in `layouts.js` (look for `g.val("...")`).

### B. Brand-new design

1. In `js/layouts.js`, add an entry to `BPG.LAYOUTS`:

   ```js
   myDesign: {
     standard: true,           // the app draws photo, fade, top row and bottom row for you
     draw(k, g) {
       k.bigText(g, g.val("headline"), g.bigBase);
       k.nameText(g, g.val("player"), g.nameBase);
       k.stats(g, [["Runs", g.val("runs")], ["Balls", g.val("balls")]], g.statsTop);
     },
   },
   ```

   Set `standard: false` if you want to draw the whole poster yourself (see `reaction` for an example).
2. In `js/templates.js`, add a card with `layout: "myDesign"` and the fields it uses.
3. Reload the page. The new card shows in its group.

Useful helpers in `engine.js`: `k.bigText`, `k.nameText`, `k.subText`, `k.label`, `k.stats`, `k.stamp`, `k.layoutRich` + `k.drawRich` (wrapped text with `*highlights*`), `k.photoArea`, `k.fadeBottom`, `k.slash`, `k.circlePhoto`, `k.header`, `k.footer`. For anything else, `k.ctx` is the normal canvas 2D context.

### Add a colour theme

In `js/config.js`, add a line to `BPG.THEMES`:

```js
pakistan: { label: "Pakistan green", bg: "#04301B", accent: "#FFFFFF" },
```

## Tips

- Prepare both result cards (win and loss) before the last over, so you can post first.
- Use cutout PNGs of players (remove.bg or Canva's background remover) for the best look.
- Agency and broadcast photos are copyrighted. Credit the photographer in the card's photo credit field where the card has one, and prefer official club or board media.
