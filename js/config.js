// Brand defaults, colour themes and platform sizes.
// This is the file to edit when you change your brand or add a team colour theme.
window.BPG = window.BPG || {};

// Shown at the top of the page, so you can tell if your phone has the latest version.
BPG.VERSION = "9 Oct 2026 · v14";

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

BPG.CATS = { rants: "Borhan Rants", cricket: "Cricket", football: "Football", general: "General" };

// Fonts used on the posters. Bangla text falls back to Hind Siliguri automatically.
BPG.FONTS = {
  display: '"Anton", "Hind Siliguri", Impact, sans-serif',
  condensed: '"Barlow Condensed", "Hind Siliguri", "Arial Narrow", sans-serif',
  body: '"Barlow", "Hind Siliguri", sans-serif',
};
