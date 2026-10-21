// Smart fill: the quick fill box asks a free AI (Google Gemini, with your own free key) which field each piece of a
// typed note belongs in, so you can write it any way you like, in English, Banglish or Bangla.
// No key, no internet, or the AI fails? It falls back to the normal quick fill (quickfill.js).
// The key stays on this phone (localStorage); the note you type is sent to Google to be read.
window.BPG = window.BPG || {};

(() => {
  const KEY = "bpg_ai_key";
  // Free-tier models, best first. The "latest" names follow Google's newest Flash models, so this keeps working.
  const MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-2.5-flash"];
  const API = "https://generativelanguage.googleapis.com/v1beta/models/";

  BPG.aiKey = () => { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } };
  BPG.setAiKey = (k) => { try { k ? localStorage.setItem(KEY, k.trim()) : localStorage.removeItem(KEY); } catch (e) {} };

  // Fields a card can be filled from: its own fields plus the big headline word when it has one.
  const fieldsOf = (tpl) => {
    const list = tpl.fields.map(([id, label, example, , type]) => ({ id, label, example: example || "", long: type === "area" }));
    if (tpl.big) list.push({ id: "__big", label: "Big headline word", example: tpl.big, long: false });
    return list;
  };

  const prompt = (tpl, text) => {
    const fields = fieldsOf(tpl).map((f) => `- ${f.id}: ${f.label}${f.example ? ` (example: ${f.example})` : ""}${f.long ? " [a few sentences]" : ""}`).join("\n");
    return `You fill in the form for one sports poster on the page "Borhan Rants About Sports" (cricket and football, Bangladesh).
The card is "${tpl.name}". Its fields:
${fields}

The user typed this quick note. It may be English, Banglish (Bangla in English letters, e.g. "52 run 38 bole, 5 ta char 2 ta chokka") or Bangla:
"""${text}"""

Rules:
- Put each fact from the note in the field it belongs to. Leave a field as "" when the note doesn't give it. Never invent numbers, names or scores.
- Never guess a team or opponent from who the player is or who they usually play: fill team fields only with teams written in the note.
- Copy numbers exactly. Follow each field's example for the format (e.g. "52*" for not out, "5/23" style figures, "67'" for a minute, team short names like BAN when the label asks for a short name).
- Spell player and team names properly in English (e.g. "mushi" is Mushfiqur Rahim, "bd" is Bangladesh) when you are sure who is meant.
- Headlines, body text, tags and other free text: short and punchy, in English, cleaned up from the note. Write them in Bangla script only if the note is in Bangla script.
- Text in *stars* is coloured on the card; keep stars the user typed.`;
  };

  const schema = (tpl) => {
    const props = {};
    fieldsOf(tpl).forEach((f) => { props[f.id] = { type: "STRING" }; });
    return { type: "OBJECT", properties: props, propertyOrdering: Object.keys(props) };
  };

  // The AI sometimes "helps" by guessing (e.g. an opponent you never typed). Drop a team that isn't named in the note,
  // and a short number field whose numbers aren't in the note.
  const TEAM_FIELDS = /^(team|opp|t1|t2|winner|loser|abbr)$/;
  const grounded = (f, v, text) => {
    if (TEAM_FIELDS.test(f.id)) return BPG.teamMentioned(text, v) || String(text).toLowerCase().includes(v.toLowerCase());
    if (!f.long && v.length <= 12 && /^[\d\s.*\/'()+:-]+$/.test(v)) {
      const typed = String(text).match(/\d+(?:\.\d+)?/g) || [];
      return (v.match(/\d+(?:\.\d+)?/g) || []).every((n) => typed.includes(n));
    }
    return true;
  };

  async function ask(model, key, body, ms) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), ms);
    try {
      const res = await fetch(`${API}${model}:generateContent`, {
        method: "POST", signal: ctl.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { const err = new Error((data.error && data.error.message) || `HTTP ${res.status}`); err.status = res.status; throw err; }
      const out = (((data.candidates || [])[0] || {}).content || {}).parts || [];
      return JSON.parse(out.map((p) => p.text || "").join("").replace(/^```(?:json)?|```$/g, "").trim());
    } finally { clearTimeout(timer); }
  }

  // Sends one request, trying each free model in turn. Throws a short message the studio can show.
  async function run(body, key) {
    if (!key) throw new Error("no key");
    let last;
    for (const m of MODELS) {
      try { return await ask(m, key, body, 15000); } catch (e) {
        last = e;
        // A bad key won't work on any model; a missing model or a busy one might on the next.
        if (e.status === 400 && /api key/i.test(e.message)) throw new Error("That AI key doesn't work. Check it in Smart fill.");
        if (e.status === 403) throw new Error("That AI key isn't allowed. Make a new one at aistudio.google.com/apikey.");
        if (e.name === "AbortError") throw new Error("The AI took too long.");
      }
    }
    if (last && (last.status === 429 || last.status >= 500)) throw new Error("The free AI is busy right now.");
    throw new Error("The AI didn't answer.");
  }
  const json = (text, schema) => ({
    contents: [{ role: "user", parts: [{ text }] }],
    generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: schema },
  });

  // Resolves with { values, labels, via: "ai" } or throws; the caller falls back to BPG.quickApply.
  BPG.smartFill = async (tpl, text, key = BPG.aiKey()) => {
    const got = await run(json(prompt(tpl, text), schema(tpl)), key);
    const fields = fieldsOf(tpl), values = {};
    fields.forEach((f) => { const v = got && got[f.id]; if (v !== undefined && v !== null && String(v).trim() !== "" && grounded(f, String(v).trim(), text)) values[f.id] = String(v).trim(); });
    const labels = fields.filter((f) => f.id in values).map((f) => f.label.replace(/\s*\(.*\)$/, ""));
    return { values, labels, via: "ai" };
  };

  // "Make a poster": picks which card fits a typed note. Resolves with a key of BPG.TEMPLATES.
  BPG.pickCard = async (text, key = BPG.aiKey()) => {
    const T = BPG.TEMPLATES, cats = BPG.CATS || {};
    const list = Object.entries(T).map(([k, t]) => `- ${k}: ${t.name} (${cats[t.cat] || t.cat})${t.big ? `, big word ${t.big}` : ""}. Fields: ${t.fields.map((f) => f[1].replace(/\s*\(.*\)$/, "")).join(", ")}`).join("\n");
    const got = await run(json(`You choose the poster card for a sports page (cricket and football, Bangladesh). The cards:
${list}

The user's note (English, Banglish or Bangla):
"""${text}"""

Pick the one card that fits the note best. A batter's fifty is "fifty", a hundred is "century", a five-wicket haul is "fifer"; Test matches use the Test cricket cards when the note says Test. When the note is an opinion or a match story, pick a Borhan Rants card. Answer with the card's key.`,
      { type: "OBJECT", properties: { card: { type: "STRING", enum: Object.keys(T) } }, required: ["card"] }), key);
    if (!got || !T[got.card]) throw new Error("The AI couldn't pick a card.");
    return got.card;
  };
})();
