// The form, the live preview and the download/share buttons.
window.BPG = window.BPG || {};

(() => {
  const $ = (id) => document.getElementById(id);
  const T = BPG.TEMPLATES, L = BPG.LAYOUTS, THEMES = BPG.THEMES, PLATFORMS = BPG.PLATFORMS;
  const cv = $("poster"), ctx = cv.getContext("2d");

  const firstOf = (cat) => Object.keys(T).find((k) => T[k].cat === cat);
  const state = {
    cat: Object.keys(BPG.CATS)[0], tpl: firstOf(Object.keys(BPG.CATS)[0]), platform: "instagram",
    values: {}, kicker: "", verdict: "", cta: "en", theme: "team", brand: { ...BPG.BRAND },
  };
  const photos = { 1: null, 2: null };
  let logoImg = null;

  try {
    const saved = JSON.parse(localStorage.getItem("bpg_state") || "null");
    // Brand settings (theme, colours, handle, page name) go back to the defaults on every reload; only an uploaded logo is kept.
    if (saved) Object.assign(state, saved, { theme: "team", brand: { ...BPG.BRAND, logo: (saved.brand || {}).logo || null } });
  } catch (e) {}
  if (!T[state.tpl]) { state.cat = Object.keys(BPG.CATS)[0]; state.tpl = firstOf(state.cat); }
  if (!BPG.CATS[state.cat]) state.cat = T[state.tpl].cat;
  const persist = () => { try { localStorage.setItem("bpg_state", JSON.stringify(state)); } catch (e) {} };

  BPG.state = () => state;
  BPG.logoImage = () => logoImg;
  const adjust = () => ({ zoom: parseFloat($("zoom").value), offx: parseFloat($("offx").value), offy: parseFloat($("offy").value), shade: parseFloat($("shade").value) });
  const k = BPG.createKit(ctx, { state: () => state, logo: () => logoImg, adjust });

  const val = (id) => {
    const v = state.values[state.tpl] && state.values[state.tpl][id];
    if (v !== undefined) return v;
    const f = T[state.tpl].fields.find((x) => x[0] === id);
    return f ? f[2] : "";
  };

  // ---------- Form ----------
  function button(parent, label, pressed, onClick) {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = label; b.setAttribute("aria-pressed", String(pressed)); b.onclick = onClick;
    parent.appendChild(b);
  }
  function renderCats() {
    $("cats").innerHTML = "";
    Object.entries(BPG.CATS).forEach(([key, label]) => button($("cats"), label, state.cat === key, () => {
      state.cat = key; state.tpl = firstOf(key); persist(); renderAll();
    }));
  }
  function renderTypes() {
    $("types").innerHTML = "";
    Object.entries(T).filter(([, t]) => t.cat === state.cat).forEach(([key, t]) => button($("types"), t.name, state.tpl === key, () => {
      state.tpl = key; persist(); renderAll();
    }));
  }
  function addField(parent, id, label, value, wide, type, onInput) {
    const d = document.createElement("div");
    d.className = "field" + (wide ? " wide" : "");
    const l = document.createElement("label"); l.htmlFor = id; l.textContent = label;
    const i = document.createElement(type === "area" ? "textarea" : "input");
    if (type !== "area") i.type = "text";
    i.id = id; i.value = value;
    // Name suggestions from your saved series.
    const key = id.split("_").pop();
    if (/^(player|batter|bowler|potm|name|p1|p2|assist)$/.test(key)) i.setAttribute("list", "dl_players");
    if (/^(team|opp|t1|t2)$/.test(key)) i.setAttribute("list", "dl_teams");
    i.addEventListener("input", () => onInput(i.value));
    d.append(l, i); parent.appendChild(d);
  }
  function setVal(id, v) { (state.values[state.tpl] = state.values[state.tpl] || {})[id] = v; persist(); draw(); }
  // A new note is a new poster: fields it doesn't mention are emptied, not left over from the last one.
  function fillCard(values) {
    const fresh = {}; T[state.tpl].fields.forEach(([id]) => { fresh[id] = ""; });
    state.values[state.tpl] = { ...fresh, ...values }; persist();
    renderFields(); draw(); nameChanged();
  }
  // One line in, every field filled: "Maaz Sadaqat 52*(38) 5x4 2x6 PAK vs SL".
  // With a free AI key (smartfill.js) it reads any wording, Banglish too; without one, or if the AI fails, the rules in quickfill.js do it.
  function quickBox(parent, t, example) {
    const ai = !!BPG.aiKey();
    const d = document.createElement("div"); d.className = "field wide quick";
    const l = document.createElement("label"); l.htmlFor = "f_quick";
    l.textContent = ai ? "Quick fill (AI): write it any way, Banglish works" : "Quick fill: type it in one line, short team names work";
    const row = document.createElement("div"); row.className = "quick-row";
    const i = document.createElement("input"); i.type = "text"; i.id = "f_quick"; i.autocomplete = "off";
    i.placeholder = example || "Type the update any way you like";
    const b = document.createElement("button"); b.type = "button"; b.textContent = "Fill";
    const note = document.createElement("p"); note.className = "hint"; note.setAttribute("aria-live", "polite");
    const done = (values, msg) => {
      const typed = i.value; fillCard(values);
      $("f_quick").value = typed; $("f_quick").parentNode.nextSibling.textContent = msg;
    };
    const rules = (why) => {
      const { values, labels } = example ? BPG.quickApply(t, i.value) : { values: {}, labels: [] };
      if (!labels.length) { note.textContent = (why ? why + " " : "") + (example ? "Couldn't read that. Try: " + example : ""); return; }
      done(values, (why ? why + " Used basic fill: " : "Filled ") + labels.join(", ") + ". Check the rest below.");
    };
    const go = async () => {
      if (!i.value.trim()) return;
      if (!ai) return rules();
      b.disabled = true; note.textContent = "Reading it with AI…";
      try {
        const { values, labels } = await BPG.smartFill(t, i.value);
        if (!labels.length) return rules("The AI found nothing to fill.");
        done(values, "AI filled " + labels.join(", ") + ". Check it below.");
      } catch (e) {
        rules(e.message && e.message.length < 120 ? e.message.replace(/\.?$/, ".") : "The AI didn't answer.");
      } finally { b.disabled = false; }
    };
    b.onclick = go;
    i.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
    row.append(i, b); d.append(l, row, note, aiSetup()); parent.appendChild(d);
  }
  // The free AI key: made once at aistudio.google.com/apikey, saved on this phone only.
  function aiSetup() {
    const det = document.createElement("details"); det.className = "ai-setup";
    const has = !!BPG.aiKey();
    const sum = document.createElement("summary"); sum.textContent = has ? "Smart fill is on (free AI key saved)" : "Make quick fill smarter with free AI";
    const p = document.createElement("p"); p.className = "hint";
    p.innerHTML = 'Free, no card needed. 1) Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> and sign in with Google. 2) Tap <b>Create API key</b> and copy it. 3) Paste it here. The key stays on this phone; what you type in quick fill is sent to Google to be read.';
    const row = document.createElement("div"); row.className = "quick-row";
    const k = document.createElement("input"); k.type = "password"; k.id = "f_aikey"; k.autocomplete = "off"; k.placeholder = has ? "Key saved" : "Paste your key";
    const save = document.createElement("button"); save.type = "button"; save.textContent = has ? "Remove" : "Save";
    save.onclick = () => {
      if (has) BPG.setAiKey(""); else if (k.value.trim()) BPG.setAiKey(k.value); else return;
      renderFields(); $("f_quick").parentNode.nextSibling.textContent = has ? "AI key removed. Quick fill uses the basic rules." : "AI key saved. Type anything and tap Fill.";
    };
    if (!has) row.append(k);
    row.append(save); det.append(sum, p, row);
    return det;
  }
  function renderFields() {
    const box = $("fields"), t = T[state.tpl]; box.innerHTML = "";
    const ex = BPG.quickExample(t);
    if (ex || BPG.aiKey()) quickBox(box, t, ex);
    addField(box, "f_kicker", "Match tag (optional, shows small at the bottom)", state.kicker, true, "text", (v) => { state.kicker = v; persist(); draw(); });
    addField(box, "f_verdict", "Your verdict (optional, shows at the bottom)", state.verdict || "", true, "text", (v) => { state.verdict = v; persist(); draw(); });
    if (t.big) addField(box, "f_big", "Big headline word", val("__big") || t.big, false, "text", (v) => setVal("__big", v));
    t.fields.forEach(([id, label, , wide, type]) => addField(box, `f_${state.tpl}_${id}`, label, val(id), wide, type, (v) => { setVal(id, v); if (NAME_FIELDS.includes(id)) nameChanged(); }));
    // Cards with no team field can still take a team's jersey colours.
    if (!t.fields.some(([id]) => ["winner", "team", "t1", "abbr"].includes(id)))
      addField(box, `f_${state.tpl}_colorteam`, "Team colours (optional, e.g. BAN or Real Madrid)", val("colorteam"), true, "text", (v) => setVal("colorteam", v));
    $("photo2Wrap").hidden = !t.photo2;
    $("photoBox").hidden = !!t.noPhoto; // the squad card uses the team's flag instead of a photo
    $("photo2Label").textContent = t.photo2 || "Second photo";
    $("tplHint").textContent = t.hint || "";
    $("tplHint").hidden = !t.hint;
  }
  function renderPlatforms() {
    $("platforms").innerHTML = "";
    Object.entries(PLATFORMS).forEach(([key, p]) => button($("platforms"), p.label, state.platform === key, () => {
      state.platform = key; persist(); renderPlatforms(); draw();
    }));
  }
  function renderBrand() {
    $("b_handle").value = state.brand.handle; $("b_name").value = state.brand.name;
    $("b_accent").value = state.brand.accent; $("b_bg").value = state.brand.bg;
    const sel = $("b_theme"); sel.innerHTML = "";
    Object.entries(THEMES).forEach(([key, th]) => { const o = document.createElement("option"); o.value = key; o.textContent = th.label; sel.appendChild(o); });
    sel.value = THEMES[state.theme] ? state.theme : "brand";
  }
  function renderAll() { captionEdited = false; renderCats(); renderTypes(); renderFields(); if (BPG.seriesUI) BPG.seriesUI.refresh(); draw(); nameChanged(); }
  // Lets series-ui.js open a card with its details already filled in.
  BPG.app = {
    state: () => state, draw: () => draw(), persist,
    open(tpl, values, big) {
      state.tpl = tpl; state.cat = T[tpl].cat;
      state.values[tpl] = Object.assign({}, state.values[tpl] || {}, values, big ? { __big: big } : {});
      persist(); renderAll();
    },
  };

  $("b_theme").addEventListener("change", (e) => { state.theme = e.target.value; persist(); draw(); });
  ["b_handle", "b_name", "b_accent", "b_bg"].forEach((id) => $(id).addEventListener("input", (e) => {
    state.brand[{ b_handle: "handle", b_name: "name", b_accent: "accent", b_bg: "bg" }[id]] = e.target.value; persist(); draw();
  }));
  ["zoom", "offx", "offy", "shade"].forEach((id) => $(id).addEventListener("input", draw));
  $("resetPhoto").addEventListener("click", () => { $("zoom").value = 1; $("offx").value = 0; $("offy").value = 0; $("shade").value = 0; draw(); });

  // ---------- Photos ----------
  function loadImage(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = r.result; };
      r.onerror = rej; r.readAsDataURL(file);
    });
  }
  // A PNG with see-through corners counts as a cutout (the big number then goes behind the player).
  function isCutout(img) {
    try {
      const c = document.createElement("canvas"); c.width = 24; c.height = 24;
      const x = c.getContext("2d"); x.drawImage(img, 0, 0, 24, 24);
      const d = x.getImageData(0, 0, 24, 24).data;
      return [0, 23, 24 * 23, 24 * 24 - 1, 12, 24 * 12].filter((p) => d[p * 4 + 3] < 200).length >= 2;
    } catch (e) { return false; }
  }
  // Full photo or cutout, picked under the photo. The original is always kept, so switching back is instant.
  // The choice is remembered on this phone. A cutout can be fixed by hand (see cutfix.js).
  let cutMode = "full";
  try { cutMode = localStorage.getItem("bpg_cutmode") || "full"; } catch (e) {}
  const cutStatus = (t) => { $("cutStatus").textContent = t; };
  function showCutMode() {
    $("cutMode").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === cutMode)));
    const p = photos[1];
    $("cutFix").hidden = !(cutMode === "cut" && p && p.cutImg);
  }
  async function makeCutout(n) {
    const p = photos[n]; if (!p || p.isPng || !BPG.cutout) return;
    if (p.cutImg) { Object.assign(p, { img: p.cutImg, cut: true }); showCutMode(); draw(); return; }
    if (p.busy) return; p.busy = true;
    try {
      const c = await BPG.cutout(p.orig, cutStatus);
      if (photos[n] !== p) return; // a newer photo was picked meanwhile
      p.cutImg = c; c.bpgFocus = (BPG.findSubject && BPG.findSubject(c)) || p.orig.bpgFocus;
      if (cutMode === "cut") Object.assign(p, { img: c, cut: true });
      cutStatus("Background removed. If a bat or the stumps went missing, tap Fix the cutout.");
      showCutMode(); draw();
    } catch (e) {
      console.warn(e);
      cutStatus(location.protocol === "https:" ? "Couldn't remove the background this time. Check your internet and tap Cutout again." : "Cutout works on the website, not in this preview.");
    } finally { p.busy = false; }
  }
  $("cutMode").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    cutMode = b.dataset.v;
    try { localStorage.setItem("bpg_cutmode", cutMode); } catch (err) {}
    [1, 2].forEach((n) => {
      const p = photos[n]; if (!p || p.isPng) return;
      if (cutMode === "cut") makeCutout(n); else { Object.assign(p, { img: p.orig, cut: false }); cutStatus(""); }
    });
    showCutMode(); draw();
  });
  $("cutFix").addEventListener("click", () => {
    const p = photos[1]; if (!p || !p.cutImg || !BPG.editCutout) return;
    BPG.editCutout(p, (fixed) => { fixed.bpgFocus = (BPG.findSubject && BPG.findSubject(fixed)) || p.cutImg.bpgFocus; p.cutImg = fixed; if (cutMode === "cut") Object.assign(p, { img: fixed, cut: true }); draw(); });
  });
  // Every photo goes through here, picked from the phone or from the photo library.
  // extra: { blob } keeps the file so it can be saved to the library; { libId, auto } marks a library photo.
  async function usePhoto(n, raw, extra = {}) {
    const isPng = isCutout(raw);
    // Small photos are scaled up and sharpened once here, so the card isn't blurry (see enhance.js).
    const en = isPng || !BPG.enhancePhoto ? { img: raw, w: raw.width, h: raw.height, small: false } : BPG.enhancePhoto(raw), img = en.img;
    const graded = isPng || !BPG.gradePhoto ? img : BPG.gradePhoto(img), use = proMode === "pro" ? graded : img;
    // Auto framing: find the player once, so each card places them without the sliders.
    const focus = BPG.findSubject ? BPG.findSubject(img) : null;
    if (focus) focus.small = en.small;
    img.bpgFocus = graded.bpgFocus = focus;
    photos[n] = { img: use, orig: use, plain: img, graded, cut: isPng, isPng, ...extra }; showCutMode(); draw();
    cutStatus(en.small ? `This photo is small (${en.w} x ${en.h}), so it was sharpened. A bigger photo (at least 1080 px wide) will still look better.` : "");
    if (cutMode === "cut" && !isPng) makeCutout(n);
    if (n === 1) showLibrary();
  }
  [1, 2].forEach((n) => $("photo" + n).addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    await usePhoto(n, await loadImage(f), { blob: f });
    e.target.value = ""; // so picking the same photo again still works
  }));

  // ---------- Photo library (library.js) ----------
  // When the player's name is filled, their newest saved photo goes on the card by itself.
  // A photo you picked yourself is never replaced; one the library put there is, when the name changes.
  const NAME_FIELDS = ["player", "batter", "bowler", "name", "potm", "p1"];
  const playerName = () => {
    const vals = state.values[state.tpl] || {}, t = T[state.tpl];
    const id = NAME_FIELDS.find((f) => t.fields.some((x) => x[0] === f) && String(vals[f] || "").trim());
    return id ? String(vals[id]).trim() : "";
  };
  let libTimer = null, libUrls = [];
  const libStatus = (m) => { $("libStatus").textContent = m; };
  function nameChanged() {
    if (!BPG.lib || !BPG.lib.ok()) return;
    clearTimeout(libTimer);
    libTimer = setTimeout(async () => {
      const name = playerName();
      if (name) $("libName").value = name;
      const found = await showLibrary();
      const p = photos[1];
      if (found.length && T[state.tpl] && !T[state.tpl].noPhoto && (!p || p.auto) && (!p || p.libId !== found[0].id)) {
        await useLibPhoto(found[0], true);
      }
    }, 350);
  }
  async function useLibPhoto(item, auto) {
    try { await usePhoto(1, await loadImage(item.blob), { libId: item.id, auto: !!auto, blob: item.blob }); }
    catch (e) { libStatus("Couldn't open that photo."); }
  }
  async function showLibrary() {
    const grid = $("libGrid"), name = $("libName").value.trim();
    libUrls.forEach((u) => URL.revokeObjectURL(u)); libUrls = []; grid.innerHTML = "";
    const p = photos[1];
    $("libSave").hidden = !p || !p.blob || !!p.libId;
    if (!name) { libStatus("Type a player's name to see their saved photos."); return []; }
    let found = [];
    try { found = await BPG.lib.find(name); } catch (e) { libStatus("The photo library isn't available in this browser."); return []; }
    found.slice(0, 12).forEach((item) => {
      const d = document.createElement("div"); d.className = "lib-item";
      const pick = document.createElement("button"); pick.type = "button"; pick.className = "lib-pick"; pick.title = item.name;
      pick.setAttribute("aria-pressed", String(!!(p && p.libId === item.id)));
      const im = document.createElement("img"), u = URL.createObjectURL(item.blob); libUrls.push(u); im.src = u; im.alt = item.name;
      pick.appendChild(im); pick.onclick = () => useLibPhoto(item, false);
      const del = document.createElement("button"); del.type = "button"; del.className = "lib-del"; del.textContent = "×"; del.setAttribute("aria-label", "Delete this photo from the library");
      del.onclick = async () => {
        if (!confirm(`Delete this photo of ${item.name} from your library?`)) return;
        await BPG.lib.remove(item.id); if (photos[1] && photos[1].libId === item.id) photos[1].libId = null; showLibrary();
      };
      d.append(pick, del); grid.appendChild(d);
    });
    libStatus(found.length ? `${found.length} saved photo${found.length > 1 ? "s" : ""} of ${found[0].name}. Tap one to use it.` : `No saved photos of ${name} yet. Tap Add photos to save some.`);
    return found;
  }
  $("libName").addEventListener("input", () => { clearTimeout(libTimer); libTimer = setTimeout(showLibrary, 300); });
  $("libAddBtn").addEventListener("click", () => {
    if (!$("libName").value.trim()) { libStatus("Type the player's name first, then tap Add photos."); $("libName").focus(); return; }
    $("libAdd").click();
  });
  $("libAdd").addEventListener("change", async (e) => {
    const files = [...e.target.files], name = $("libName").value.trim(); e.target.value = "";
    if (!files.length || !name) return;
    libStatus(`Saving ${files.length} photo${files.length > 1 ? "s" : ""}…`);
    try { for (const f of files) await BPG.lib.add(name, f); } catch (err) { libStatus(err.message || "Couldn't save the photos."); return; }
    const found = await showLibrary();
    if (found.length && (!photos[1] || photos[1].auto)) await useLibPhoto(found[0], true);
  });
  $("libSave").addEventListener("click", async () => {
    const p = photos[1], name = $("libName").value.trim() || playerName();
    if (!p || !p.blob) return;
    if (!name) { libStatus("Type the player's name above, then tap Save again."); $("libName").focus(); return; }
    try { p.libId = await BPG.lib.add(name, p.blob); $("libName").value = name; await showLibrary(); libStatus(`Saved to ${name}'s photos.`); }
    catch (err) { libStatus(err.message || "Couldn't save the photo."); }
  });

  // ---------- Make a poster with AI ----------
  // One note in: the AI picks the card (BPG.pickCard), fills it (BPG.smartFill), and the library adds the photo.
  const aiStatus = (m) => { $("aiStatus").textContent = m; };
  async function makePoster() {
    const text = $("aiNote").value.trim(); if (!text) return;
    if (!BPG.aiKey()) {
      aiStatus("Add your free AI key first: it's under the quick fill box in Details (Make quick fill smarter with free AI).");
      const d = document.querySelector(".ai-setup"); if (d) { d.open = true; d.scrollIntoView({ behavior: "smooth", block: "center" }); }
      return;
    }
    $("aiGo").disabled = true;
    try {
      aiStatus("Picking the card…");
      const key = await BPG.pickCard(text);
      state.tpl = key; state.cat = T[key].cat; persist(); renderAll();
      aiStatus(`${T[key].name} card. Filling it in…`);
      const { values, labels } = await BPG.smartFill(T[key], text);
      fillCard(values);
      aiStatus(`Made a ${T[key].name} card${labels.length ? " with " + labels.join(", ") : ""}. Check it, then download.`);
    } catch (e) {
      aiStatus((e.message || "The AI didn't answer.") + " Try again, or pick the card and use quick fill.");
    } finally { $("aiGo").disabled = false; }
  }
  $("aiGo").addEventListener("click", makePoster);
  $("aiNote").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); makePoster(); } });
  showCutMode();
  // Photo finish: Pro (graded, see BPG.gradePhoto, plus fine grain when drawn) or Natural. Remembered on this phone.
  let proMode = "pro";
  try { proMode = localStorage.getItem("bpg_pro") || "pro"; } catch (e) {}
  const showProMode = () => $("proMode").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === proMode)));
  showProMode();
  $("proMode").addEventListener("click", (e) => {
    const v = e.target.closest("button") && e.target.closest("button").dataset.v; if (!v || v === proMode) return;
    proMode = v; try { localStorage.setItem("bpg_pro", v); } catch (err) {}
    showProMode();
    [1, 2].forEach((n) => {
      const p = photos[n]; if (!p || p.isPng) return;
      p.orig = v === "pro" ? p.graded : p.plain; p.cutImg = null;
      if (p.cut) makeCutout(n); else p.img = p.orig;
    });
    showCutMode(); draw();
  });
  BPG.proFinish = () => proMode === "pro";
  $("b_logo").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const img = await loadImage(f);
    const c = document.createElement("canvas"), s = Math.min(1, 240 / Math.max(img.width, img.height));
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    state.brand.logo = c.toDataURL("image/png"); persist(); setLogo();
  });
  $("b_clearLogo").addEventListener("click", () => { state.brand.logo = null; logoImg = null; persist(); draw(); });
  function setLogo() {
    if (!state.brand.logo) { logoImg = null; draw(); return; }
    const i = new Image(); i.onload = () => { logoImg = i; draw(); }; i.src = state.brand.logo;
  }

  // ---------- Drawing ----------
  function draw() { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; drawCard(); if (BPG.ready) updateCaption(); }
  // Cards packed with numbers (charts, tables, ball-by-ball rows) stay clean: no brush strokes behind them.
  const NO_SWEEP = new Set(["form", "toplist", "innings", "result", "over", "leaders", "points", "seriesscore", "preview"]);
  function drawCard() {
    const p = PLATFORMS[state.platform], t = T[state.tpl], layout = L[t.layout];
    if (!layout) { console.error(`Layout "${t.layout}" not found in layouts.js`); return; }
    if (cv.width !== p.w || cv.height !== p.h) { cv.width = p.w; cv.height = p.h; }
    // "Team colours": pick the jersey colours of the team on the card (the winner on result cards).
    const teamName = (BPG.teamName && BPG.teamName(val("winner") || val("team") || val("t1") || val("abbr") || val("colorteam"))) || "";
    const tc = state.theme === "team" ? BPG.TEAM_COLORS[teamName] : null;
    const th = tc || THEMES[state.theme] || THEMES.brand, look = state.theme === "brand" || (state.theme === "team" && !tc) ? t.look || {} : {};
    const footerY = p.bottom - 4, statsTop = footerY - 124, subBase = statsTop - 22, nameBase = subBase - 44, bigBase = nameBase - 84;
    const g = {
      W: p.w, H: p.h, st: p.top, sb: p.bottom, footerY, statsTop, subBase, nameBase, bigBase, blockTop: bigBase - 120,
      accent: (tc ? null : t.accent) || look.accent || th.accent || state.brand.accent,
      bg: look.bg || th.bg || state.brand.bg,
      stroke: (tc && tc.stroke) || null, hot: (tc && tc.hot) || null, sweep: state.theme === "team" && !layout.ownSweep && !NO_SWEEP.has(t.layout), teamTheme: state.theme === "team",
      t, val, big: val("__big") || t.big || "", photo: photos[1], photos, shade: adjust().shade, ctx,
    };

    ctx.clearRect(0, 0, g.W, g.H);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; k.spaced(0);
    k.background(g);
    if (!layout.standard) { layout.draw(k, g); return; }

    const giant = layout.giant && layout.giant(g);
    if (giant && (!g.photo || g.photo.cut)) {
      ctx.font = k.font(k.fit(String(giant), g.W * 0.96, t.layout === "rating" ? 520 : 760, k.D), k.D); ctx.textAlign = "center";
      ctx.fillStyle = k.hexA(g.accent, g.photo ? 0.92 : 0.16);
      ctx.fillText(String(giant), g.W / 2, g.blockTop + 120); ctx.textAlign = "left";
    }
    if (!k.bleedPhoto(g, g.blockTop + 30)) k.photoHint(g, g.st + (g.blockTop - g.st) / 2 + 60);
    k.header(g);
    // A soft shadow keeps the text readable on top of the photo.
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 18;
    layout.draw(k, g);
    ctx.restore();
    k.footer(g);
  }
  BPG.draw = draw;

  // ---------- Caption ----------
  let captionEdited = false;
  const captionText = () => BPG.caption(T[state.tpl], val, { cta: state.cta, verdict: state.verdict });
  function updateCaption() { if (!captionEdited) $("caption").value = captionText(); }
  function renderCtas() {
    $("ctas").innerHTML = "";
    [["en", "English"], ["bn", "বাংলা"], ["banglish", "Banglish"], ["none", "No question"]].forEach(([key, label]) => button($("ctas"), label, state.cta === key, () => {
      state.cta = key; persist(); captionEdited = false; renderCtas(); updateCaption();
    }));
  }
  $("caption").addEventListener("input", () => { captionEdited = true; });
  $("resetCaption").addEventListener("click", () => { captionEdited = false; updateCaption(); });
  $("copyCaption").addEventListener("click", async () => {
    const box = $("caption");
    try { await navigator.clipboard.writeText(box.value); $("copyCaption").textContent = "Copied ✓"; }
    catch (e) { box.focus(); box.select(); $("copyCaption").textContent = "Selected, press copy"; }
    setTimeout(() => { $("copyCaption").textContent = "Copy caption"; }, 1800);
  });

  // ---------- Export ----------
  const status = (m) => { $("status").textContent = m; };
  const filename = () => `borhan-${state.tpl}-${state.platform}-${new Date().toISOString().slice(0, 10)}.png`;
  const toBlob = () => new Promise((res) => { draw(); cv.toBlob(res, "image/png"); });
  let claudeDownloads = null;
  if (window.claude && window.claude.use) window.claude.use("downloads").then((d) => { claudeDownloads = d; }).catch(() => {});

  $("download").addEventListener("click", async () => {
    const blob = await toBlob();
    if (!blob) { status("Couldn't create the image. Try a smaller photo."); return; }
    if (claudeDownloads) {
      try { await claudeDownloads.save({ filename: filename(), data: blob }); status("Saved " + filename()); return; }
      catch (e) { if (e && e.code === "declined") { status("Download cancelled."); return; } }
    }
    try {
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = filename(); document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      status("Downloaded " + filename());
    } catch (e) { showImage(); }
  });

  // On phones this opens the share sheet, so you can post straight to Instagram, TikTok or Facebook.
  $("share").addEventListener("click", async () => {
    const blob = await toBlob();
    const file = new File([blob], filename(), { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); status("Shared."); }
      catch (e) { if (e.name !== "AbortError") { showImage(); } }
    } else { showImage(); }
  });
  // The finished image opens on top of the page, so the preview itself always stays live.
  function showImage() { draw(); $("saveImg").src = cv.toDataURL("image/png"); $("saveSheet").hidden = false; }
  $("showImg").addEventListener("click", showImage);
  $("closeSave").addEventListener("click", () => { $("saveSheet").hidden = true; });
  $("saveSheet").addEventListener("click", (e) => { if (e.target.id === "saveSheet") $("saveSheet").hidden = true; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("saveSheet").hidden = true; });

  // Both sizes in one tap: 4:5 for Instagram/Facebook, 9:16 for TikTok/Reels/Stories.
  async function saveBlob(blob, name) {
    if (claudeDownloads) { try { await claudeDownloads.save({ filename: name, data: blob }); return true; } catch (e) { return false; } }
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000); return true;
  }
  $("allSizes").addEventListener("click", async () => {
    const was = state.platform, files = [];
    for (const plat of ["instagram", "tiktok"]) {
      state.platform = plat; const blob = await toBlob();
      if (blob) files.push(new File([blob], filename(), { type: "image/png" }));
    }
    state.platform = was; draw();
    if (navigator.canShare && navigator.canShare({ files }) && matchMedia("(pointer: coarse)").matches) {
      try { await navigator.share({ files }); status("Shared both sizes."); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    for (const f of files) await saveBlob(f, f.name);
    status("Saved both sizes.");
  });

  // ---------- Install as an app ----------
  let installEvent = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvent = e; $("install").hidden = false; });
  $("install").addEventListener("click", async () => { if (!installEvent) return; installEvent.prompt(); await installEvent.userChoice; installEvent = null; $("install").hidden = true; });
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (!standalone && /iphone|ipad/i.test(navigator.userAgent)) $("installHint").textContent = "On iPhone: tap Share, then Add to Home Screen, to use this like an app.";
  if ("serviceWorker" in navigator && location.protocol === "https:" && !window.claude) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  $("ver").textContent = BPG.VERSION ? "Version " + BPG.VERSION : "";

  // A link from a match alert (alerts/run.mjs) opens a card already filled in:
  // ?card=goal&d=<base64url JSON of field values>&big=FOUR-FOR. Fields the alert doesn't know are left empty.
  try {
    const q = new URLSearchParams(location.search), tpl = q.get("card");
    if (tpl && T[tpl]) {
      let d = {};
      if (q.get("d")) {
        const b = q.get("d").replace(/-/g, "+").replace(/_/g, "/");
        d = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b), (c) => c.charCodeAt(0))));
      }
      const values = {};
      T[tpl].fields.forEach(([id]) => { values[id] = d[id] != null ? String(d[id]) : ""; });
      state.tpl = tpl; state.cat = T[tpl].cat;
      state.values[tpl] = Object.assign(values, q.get("big") ? { __big: q.get("big") } : {});
      if (q.get("size") && PLATFORMS[q.get("size")]) state.platform = q.get("size");
      persist();
      history.replaceState(null, "", location.pathname);
    }
  } catch (e) {}

  // ---------- Start ----------
  BPG.ready = true;
  renderBrand(); renderPlatforms(); renderCtas(); renderAll(); setLogo();
  const fonts = document.fonts && document.fonts.load
    ? Promise.all(["100px Anton", "700 40px 'Barlow Condensed'", "italic 700 40px 'Barlow Condensed'", "600 40px 'Barlow Condensed'", "400 40px Barlow", "500 40px Barlow", "700 40px 'Hind Siliguri'", "900 40px Archivo", "800 40px Archivo", "700 40px Cinzel", "900 40px Cinzel"].map((f) => document.fonts.load(f)))
    : Promise.resolve();
  fonts.then(draw, draw);
})();
