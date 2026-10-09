// The form, the live preview and the download/share buttons.
window.BPG = window.BPG || {};

(() => {
  const $ = (id) => document.getElementById(id);
  const T = BPG.TEMPLATES, L = BPG.LAYOUTS, THEMES = BPG.THEMES, PLATFORMS = BPG.PLATFORMS;
  const cv = $("poster"), ctx = cv.getContext("2d");

  const firstOf = (cat) => Object.keys(T).find((k) => T[k].cat === cat);
  const state = {
    cat: Object.keys(BPG.CATS)[0], tpl: firstOf(Object.keys(BPG.CATS)[0]), platform: "instagram",
    values: {}, kicker: "BAN vs SA · 1st ODI", verdict: "", theme: "brand", brand: { ...BPG.BRAND },
  };
  const photos = { 1: null, 2: null };
  let logoImg = null;

  try {
    const saved = JSON.parse(localStorage.getItem("bpg_state") || "null");
    if (saved) Object.assign(state, saved, { brand: { ...BPG.BRAND, ...(saved.brand || {}) } });
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
    i.addEventListener("input", () => onInput(i.value));
    d.append(l, i); parent.appendChild(d);
  }
  function setVal(id, v) { (state.values[state.tpl] = state.values[state.tpl] || {})[id] = v; persist(); draw(); }
  function renderFields() {
    const box = $("fields"), t = T[state.tpl]; box.innerHTML = "";
    addField(box, "f_kicker", "Match / tag line (top left pill)", state.kicker, true, "text", (v) => { state.kicker = v; persist(); draw(); });
    addField(box, "f_verdict", "Your verdict (optional, shows at the bottom)", state.verdict || "", true, "text", (v) => { state.verdict = v; persist(); draw(); });
    if (t.big) addField(box, "f_big", "Big headline word", val("__big") || t.big, false, "text", (v) => setVal("__big", v));
    t.fields.forEach(([id, label, , wide, type]) => addField(box, `f_${state.tpl}_${id}`, label, val(id), wide, type, (v) => setVal(id, v)));
    $("photo2Wrap").hidden = !t.photo2;
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
  function renderAll() { renderCats(); renderTypes(); renderFields(); draw(); }

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
  [1, 2].forEach((n) => $("photo" + n).addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const img = await loadImage(f); photos[n] = { img, cut: isCutout(img) }; draw();
  }));
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
  function draw() {
    const p = PLATFORMS[state.platform], t = T[state.tpl], layout = L[t.layout];
    if (!layout) { console.error(`Layout "${t.layout}" not found in layouts.js`); return; }
    if (cv.width !== p.w || cv.height !== p.h) { cv.width = p.w; cv.height = p.h; }
    const th = THEMES[state.theme] || THEMES.brand, look = state.theme === "brand" ? t.look || {} : {};
    const footerY = p.bottom - 4, statsTop = footerY - 166, subBase = statsTop - 30, nameBase = subBase - 56, bigBase = nameBase - 112;
    const g = {
      W: p.w, H: p.h, st: p.top, sb: p.bottom, footerY, statsTop, subBase, nameBase, bigBase, blockTop: bigBase - 170,
      accent: t.accent || look.accent || th.accent || state.brand.accent,
      bg: look.bg || th.bg || state.brand.bg,
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
    if (!k.fitPhoto(g, 0, g.blockTop - 8)) k.photoHint(g, g.st + (g.blockTop - g.st) / 2 + 60);
    k.header(g);
    // A soft shadow keeps the text readable on top of the photo.
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 18;
    layout.draw(k, g);
    ctx.restore();
    k.footer(g);
  }
  BPG.draw = draw;

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
    } catch (e) { showImage(); status("Long-press or right-click the image below to save it."); }
  });

  // On phones this opens the share sheet, so you can post straight to Instagram, TikTok or Facebook.
  $("share").addEventListener("click", async () => {
    const blob = await toBlob();
    const file = new File([blob], filename(), { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); status("Shared."); }
      catch (e) { if (e.name !== "AbortError") { showImage(); status("Sharing isn't available here. Long-press the image below to save it."); } }
    } else { showImage(); status("Sharing isn't available in this browser. Long-press or right-click the image below to save it."); }
  });
  function showImage() { draw(); $("saveImg").src = cv.toDataURL("image/png"); $("saveImg").hidden = false; }
  $("showImg").addEventListener("click", () => { showImage(); status("Long-press (phone) or right-click (computer) the image to save it."); });

  // ---------- Start ----------
  renderBrand(); renderPlatforms(); renderAll(); setLogo();
  const fonts = document.fonts && document.fonts.load
    ? Promise.all(["100px Anton", "700 40px 'Barlow Condensed'", "italic 700 40px 'Barlow Condensed'", "600 40px 'Barlow Condensed'", "400 40px Barlow", "500 40px Barlow", "700 40px 'Hind Siliguri'"].map((f) => document.fonts.load(f)))
    : Promise.resolve();
  fonts.then(draw, draw);
})();
