# Vendor files

`bg-removal.js` is [@imgly/background-removal](https://github.com/imgly/background-removal-js) version 1.4.5, bundled into one file with esbuild. It removes photo backgrounds in the browser for free; nothing is uploaded. It is licensed under the AGPL-3.0 (see `LICENSE-bg-removal.md`), which this repository meets by being open source.

The AI model and engine files (about 100 MB, downloaded once and then cached by the browser) come from the publisher's CDN at staticimgly.com.

To rebuild: `npm install @imgly/background-removal@1.4.5 esbuild`, then
`echo 'export { removeBackground } from "@imgly/background-removal";' > entry.js && npx esbuild entry.js --bundle --format=esm --minify --outfile=vendor/bg-removal.js`.
