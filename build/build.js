// Wraps artifact.html (the shared source) into a standalone, installable index.html.
// Run: node build/build.js
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(ROOT, "artifact.html"), "utf8");

const titleMatch = src.match(/<title>([\s\S]*?)<\/title>/);
const fontMatch = src.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/);
if (!titleMatch || !fontMatch) throw new Error("artifact.html is missing its <title> or font <link>");

const title = titleMatch[1];
const fontLink = fontMatch[0];
const body = src.replace(titleMatch[0], "").replace(fontLink, "").trimStart();

const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="دستورهای پخت با نان‌های خمیرترش لوو — صبحانه، ناهار، شام، سوپ، پیتزا و دسر.">
<meta name="theme-color" content="#faf4e8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#17110b" media="(prefers-color-scheme: dark)">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="آشپزخانه‌ی لوو">
<meta property="og:title" content="${title}">
<meta property="og:description" content="با نان‌های لوو چی می‌شه درست کرد؟ سی دستور برای هر وعده.">
<meta property="og:type" content="website">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fontLink}
<style>
  html, body { height: 100%; }
  :root {
    color-scheme: light dark;
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  body { margin: 0; }
  img { max-width: 100%; }
  [hidden] { display: none !important; }
</style>
</head>
<body>
${body}
<script>
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, "index.html"), html, "utf8");
console.log("wrote index.html (" + (html.length / 1024).toFixed(1) + " KB)");
