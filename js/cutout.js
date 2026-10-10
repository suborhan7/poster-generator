// Automatic cutout: removes the photo's background in the browser, for free (nothing is uploaded).
// BPG.cutout(image, onStatus) resolves with a canvas: the player with a transparent background.
// The first run downloads the AI model (about 100 MB) once; the browser keeps it for next time.
window.BPG = window.BPG || {};

(() => {
  const VERSION = "1.4.5";
  const PATHS = [
    `https://staticimgly.com/@imgly/background-removal-data/${VERSION}/dist/`,
    `https://cdn.jsdelivr.net/npm/@imgly/background-removal-data@${VERSION}/dist/`,
  ];
  let lib = null;
  // Where the cutout library sits: vendor/ next to js/ on the website.
  const here = document.currentScript && document.currentScript.src;
  const LIB = here ? new URL("../vendor/bg-removal.js", here).href : new URL("vendor/bg-removal.js", location.href).href;

  const toBlob = (img, max) => new Promise((ok) => {
    const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    c.toBlob(ok, "image/png");
  });

  // The model leaves soft, half-see-through edges on blurry arms and hair; firm them up a little.
  function firm(img, w, h) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h), p = d.data;
    for (let i = 3; i < p.length; i += 4) p[i] = Math.max(0, Math.min(255, (p[i] - 30) * 2));
    x.putImageData(d, 0, 0);
    return c;
  }

  BPG.cutout = async (img, onStatus = () => {}) => {
    if (!lib) {
      onStatus("Loading the cutout tool…");
      lib = await import(LIB);
    }
    const blob = await toBlob(img, 2000);
    let out = null, err = null;
    for (const publicPath of PATHS) {
      try {
        out = await lib.removeBackground(blob, {
          publicPath, model: "medium", output: { format: "image/png" },
          progress: (key, cur, total) => { if (key.startsWith("fetch") && total) onStatus(`Downloading the cutout model, first time only… ${Math.round((cur / total) * 100)}%`); else onStatus("Removing the background…"); },
        });
        break;
      } catch (e) { err = e; }
    }
    if (!out) throw err || new Error("Cutout failed");
    const bmp = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(out); });
    return firm(bmp, bmp.width, bmp.height);
  };
})();
