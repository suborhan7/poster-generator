"""Builds dist/poster-studio.html: the whole site in one file you can open offline or send to your phone.

Run from the repository root:  python3 tools/bundle.py
"""
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")

css = (root / "css" / "styles.css").read_text(encoding="utf-8")
html = html.replace('<link rel="stylesheet" href="css/styles.css">', "<style>\n" + css + "</style>")


def inline_script(match):
    src = match.group(1)
    code = (root / src).read_text(encoding="utf-8")
    return "<script>\n" + code.replace("</script", "<\\/script") + "\n</script>"


html = re.sub(r'<script src="(js/[^"]+)"></script>', inline_script, html)
# The single file has no manifest or icons next to it, so drop those links.
html = re.sub(r'<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\n?', "", html)

out = root / "dist" / "poster-studio.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
print(f"Wrote {out.relative_to(root)} ({out.stat().st_size // 1024} KB)")
