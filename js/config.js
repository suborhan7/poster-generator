// Brand defaults, colour themes and platform sizes.
// This is the file to edit when you change your brand or add a team colour theme.
window.BPG = window.BPG || {};

// Shown at the top of the page, so you can tell if your phone has the latest version.
BPG.VERSION = "10 Oct 2026 · v18";

BPG.BRAND = {
  handle: "@borhanrants",
  name: "BORHAN RANTS ABOUT SPORTS",
  verdictLabel: "BORHAN'S VERDICT",
  accent: "#FFD23F",
  bg: "#0B1426",
  logo: null,
};

// Add a theme: copy a line, give it a new key, label and two colours.
BPG.THEMES = {
  team: { label: "Team colours (auto from the team you type)" },
  brand: { label: "Your brand" },
  tigers: { label: "Tigers green", bg: "#062A1E", accent: "#F2C14E" },
  redgreen: { label: "Bangladesh red", bg: "#0A2E1F", accent: "#F2414B" },
  argentina: { label: "Argentina sky", bg: "#0C2340", accent: "#75AADB" },
  brazil: { label: "Brazil gold", bg: "#063B22", accent: "#FFDF00" },
  night: { label: "Night white", bg: "#101114", accent: "#FFFFFF" },
  alert: { label: "Alert red", bg: "#1A0B0F", accent: "#FF3B3B" },
};

// top / bottom = the safe zone where text is allowed (TikTok covers the edges with its buttons).
BPG.PLATFORMS = {
  instagram: { label: "Instagram 4:5", w: 1080, h: 1350, top: 60, bottom: 1300 },
  facebook: { label: "Facebook 4:5", w: 1080, h: 1350, top: 60, bottom: 1300 },
  tiktok: { label: "TikTok 9:16", w: 1080, h: 1920, top: 230, bottom: 1536 },
};

BPG.CATS = { rants: "Borhan Rants", series: "Series", cricket: "Cricket", football: "Football", general: "General" };

// Fonts used on the posters. Bangla text falls back to Hind Siliguri automatically.
// Jersey colours, used by the "Team colours" theme. bg = dark base, accent = highlight, stroke = paint strokes.
// Add a team: copy a line. The name must match the full name the quick fill uses (e.g. "Sri Lanka").
BPG.TEAM_COLORS = {
  "Bangladesh": { bg: "#04301F", accent: "#FFC72C", stroke: "#0B7A43", hot: "#E4002B" },
  "India": { bg: "#0A1C46", accent: "#FF9933", stroke: "#1F5FD1", hot: "#FF9933" },
  "Pakistan": { bg: "#03261A", accent: "#A6E36B", stroke: "#0F7A40", hot: "#FFFFFF" },
  "Sri Lanka": { bg: "#0A1D4A", accent: "#FFC400", stroke: "#1D58C2", hot: "#FFC400" },
  "Australia": { bg: "#0E2A1C", accent: "#FFCD00", stroke: "#00843D", hot: "#FFCD00" },
  "England": { bg: "#0A1D44", accent: "#EF3B4F", stroke: "#2F66D6", hot: "#EF3B4F" },
  "South Africa": { bg: "#052A1C", accent: "#FFB81C", stroke: "#007749", hot: "#FFB81C" },
  "New Zealand": { bg: "#0B0C10", accent: "#8ADBEA", stroke: "#3A3D4A", hot: "#FFFFFF" },
  "West Indies": { bg: "#3A0914", accent: "#FFC72C", stroke: "#8E1B30", hot: "#FF8A1F" },
  "Afghanistan": { bg: "#081A3C", accent: "#F2333E", stroke: "#1E5BC6", hot: "#2DB35A" },
  "Zimbabwe": { bg: "#2A0909", accent: "#FCE300", stroke: "#C80F0F", hot: "#2DB35A" },
  "Ireland": { bg: "#042C1C", accent: "#A9E36E", stroke: "#169B62", hot: "#FF883E" },
  "Netherlands": { bg: "#2A1200", accent: "#FF7A00", stroke: "#E85A00", hot: "#FFFFFF" },
  "Nepal": { bg: "#2A0610", accent: "#3D7CFF", stroke: "#DC143C", hot: "#FFFFFF" },
  "Argentina": { bg: "#0C2340", accent: "#75AADB", stroke: "#3E7CC0", hot: "#F6B40E" },
  "Brazil": { bg: "#063B22", accent: "#FFDF00", stroke: "#009C3B", hot: "#2A63C8" },
  "France": { bg: "#0A1640", accent: "#E8323C", stroke: "#2445B0", hot: "#FFFFFF" },
  "Portugal": { bg: "#3A0610", accent: "#E9B83C", stroke: "#B0122B", hot: "#2DB35A" },
  "Spain": { bg: "#3A0508", accent: "#F6C400", stroke: "#C60B1E", hot: "#F6C400" },
  "Germany": { bg: "#121212", accent: "#FFCE00", stroke: "#3A3A3A", hot: "#DD0000" },
  "Real Madrid": { bg: "#0D0D2B", accent: "#FEBE10", stroke: "#3A3A8C", hot: "#FFFFFF" },
  "Barcelona": { bg: "#1A0D3A", accent: "#EDBB00", stroke: "#A50044", hot: "#2A5BD7" },
  "Manchester City": { bg: "#0B2545", accent: "#6CABDD", stroke: "#2F6FB3", hot: "#FFFFFF" },
  "Manchester United": { bg: "#2A0507", accent: "#FBE122", stroke: "#DA291C", hot: "#FBE122" },
  "Liverpool": { bg: "#2A0306", accent: "#F6EB61", stroke: "#C8102E", hot: "#00B2A9" },
  "Arsenal": { bg: "#2A0306", accent: "#FFFFFF", stroke: "#EF0107", hot: "#9C824A" },
  "Chelsea": { bg: "#061A40", accent: "#DBA111", stroke: "#034694", hot: "#FFFFFF" },
  "Inter Miami": { bg: "#151515", accent: "#F7B5CD", stroke: "#444444", hot: "#F7B5CD" },
};

BPG.FONTS = {
  display: '"Anton", "Hind Siliguri", Impact, sans-serif',
  condensed: '"Barlow Condensed", "Hind Siliguri", "Arial Narrow", sans-serif',
  body: '"Barlow", "Hind Siliguri", sans-serif',
  heavy: '"Archivo", "Hind Siliguri", "Arial Black", sans-serif',
};
