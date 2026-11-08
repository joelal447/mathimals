// Builds dist/mathimal-quest.html — one self-contained file with React, Three.js and PeerJS inlined —
// plus an identical index.html at the top level so GitHub Pages serves the game straight away.
// Usage: npm install && npm run build
import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";

const result = await build({
  entryPoints: ["src/entry.jsx"],
  bundle: true,
  minify: true,
  format: "iife",
  loader: { ".jsx": "jsx" },
  define: { "process.env.NODE_ENV": '"production"' },
  write: false,
  logLevel: "error",
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mathimal Quest</title>
<style>html, body { margin: 0; padding: 0; background: #0f172a; }</style>
</head>
<body>
<div id="root"></div>
<script>
${js}
</script>
</body>
</html>
`;
mkdirSync("dist", { recursive: true });
writeFileSync("dist/mathimal-quest.html", html);
writeFileSync("index.html", html);
console.log(`Built dist/mathimal-quest.html and index.html (${Math.round(html.length / 1024)} KB)`);
