// Pulls current prices / availability for Levo's breads from the SnappFood
// menu page and writes them into data/prices.json.
//
// MUST be run from a machine whose internet connection has an Iranian IP —
// snappfood.ir refuses connections from everywhere else, including every
// tool this assistant runs with (confirmed: curl, PowerShell, and a real
// Chrome instance all timed out on it). See README.md → "سینک با اسنپ‌فود".
//
// Usage:
//   node build/sync-snappfood.js                    fetch the live page
//   node build/sync-snappfood.js --file=sample.html  parse a saved copy instead
//   node build/sync-snappfood.js --dump              also write build/sync-debug-lines.txt
//   node build/sync-snappfood.js --commit            git add+commit+push if data/prices.json changed
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const MAP_PATH = path.join(__dirname, "snappfood-map.json");
const PRICES_PATH = path.join(ROOT, "data", "prices.json");
const DEBUG_PATH = path.join(__dirname, "sync-debug-lines.txt");

const SNAPPFOOD_URL =
  "https://superapp.snappfood.ir/confectionery/menu/%D9%84%D9%88%D9%88_%D9%86%D8%A7%D9%86__%D8%A8%DB%8C%DA%A9%D8%B1%DB%8C_%D8%B1%D9%88%D8%B2%D8%A7%D9%86%D9%87_-r-r5nkj1/";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function toEnglishDigits(s) {
  return String(s).replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
}

function parseNumber(text) {
  const cleaned = toEnglishDigits(text).replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : null;
}

async function fetchLive() {
  const res = await fetch(SNAPPFOOD_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8"
    }
  });
  if (!res.ok) throw new Error("HTTP " + res.status + " از اسنپ‌فود");
  return await res.text();
}

// Turns the raw page into one product-relevant string per line: strips
// script/style bodies (they're often full of unrelated embedded JSON), then
// breaks the markup at block-level tag boundaries so one card's price can't
// bleed into the next card's name when we later scan a window of lines.
function htmlToLines(html) {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "\n")
    .replace(/<\/?(div|li|ul|button|section|article|tr|td|p|h[1-6]|span)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&zwnj;/gi, "‌");

  return s
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

// Anchors on the exact item names in snappfood-map.json (rather than on any
// class name or DOM structure, which we haven't seen yet) and reads price /
// stock signals from the next ~18 lines after each match.
function extractItems(html, nameMap) {
  const lines = htmlToLines(html);
  const names = Object.keys(nameMap);
  const found = {};

  lines.forEach((line, i) => {
    const matchedName = names.find((name) => line.indexOf(name) !== -1);
    if (!matchedName) return;

    const id = nameMap[matchedName];
    const windowText = lines.slice(i, i + 18).join(" | ");

    const priceMatch = windowText.match(/([۰-۹0-9][۰-۹0-9,٬]{3,})\s*تومان/);
    const price = priceMatch ? parseNumber(priceMatch[1]) : undefined;

    const soldOut = /ناموجود|تمام\s*شد|موجود\s*نیست/.test(windowText);
    const lowStockMatch = windowText.match(/موجودی[\s:]*([۰-۹0-9]{1,2})\b/);

    // Later matches for the same id overwrite earlier ones — a bread can
    // legitimately reappear (e.g. in a "پیشنهاد ویژه" rail up top), and the
    // version inside its own category section is the reliable one.
    found[id] = {
      price,
      available: !soldOut,
      stock: lowStockMatch ? parseNumber(lowStockMatch[1]) : null
    };
  });

  return { found, lines };
}

function commitAndPush() {
  const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: "inherit" });
  run("git add data/prices.json");
  run('git commit -m "sync: به‌روزرسانی قیمت و موجودی از اسنپ‌فود"');
  run("git push");
}

async function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find((a) => a.startsWith("--file="));
  const shouldCommit = args.includes("--commit");
  const dump = args.includes("--dump");

  let html;
  if (fileArg) {
    const p = path.resolve(ROOT, fileArg.slice("--file=".length));
    html = fs.readFileSync(p, "utf8");
    console.log("[sync] از فایل محلی خوانده شد: " + p);
  } else {
    console.log("[sync] در حال دریافت صفحه‌ی زنده از اسنپ‌فود...");
    html = await fetchLive();
  }

  const nameMap = JSON.parse(fs.readFileSync(MAP_PATH, "utf8")).map;
  const { found, lines } = extractItems(html, nameMap);

  if (dump) {
    fs.writeFileSync(DEBUG_PATH, lines.join("\n"), "utf8");
    console.log("[sync] " + lines.length + " خط در build/sync-debug-lines.txt ذخیره شد.");
  }

  const allIds = Array.from(new Set(Object.values(nameMap)));
  const missingIds = allIds.filter((id) => !found[id]);
  if (missingIds.length) {
    console.warn(
      "[sync] هشدار: این نان‌ها در صفحه پیدا نشدند (اسم‌شان شاید عوض شده — build/snappfood-map.json را بررسی کنید): " +
        missingIds.join(", ")
    );
  }
  const noPriceIds = Object.keys(found).filter((id) => found[id].price === undefined);
  if (noPriceIds.length) {
    console.warn(
      "[sync] هشدار: قیمتِ این نان‌ها پیدا نشد، فقط وضعیت موجودی‌شان به‌روزرسانی می‌شود: " + noPriceIds.join(", ")
    );
  }
  if (Object.keys(found).length === 0) {
    console.error(
      "[sync] هیچ آیتمی شناسایی نشد. با «node build/sync-snappfood.js --file=... --dump» اجرا کنید و build/sync-debug-lines.txt را بررسی کنید."
    );
    process.exitCode = 1;
    return;
  }

  const current = JSON.parse(fs.readFileSync(PRICES_PATH, "utf8"));
  const nextItems = Object.assign({}, current.items);
  let changed = false;

  for (const id of Object.keys(found)) {
    const prev = nextItems[id] || { price: null, available: true, stock: null };
    const next = {
      price: found[id].price !== undefined ? found[id].price : prev.price,
      available: found[id].available,
      stock: found[id].stock
    };
    if (JSON.stringify(prev) !== JSON.stringify(next)) changed = true;
    nextItems[id] = next;
  }

  if (!changed) {
    console.log("[sync] چیزی نسبت به دفعه‌ی قبل تغییر نکرده — data/prices.json دست‌نخورده ماند.");
    return;
  }

  const out = { updatedAt: new Date().toISOString(), source: "snappfood", items: nextItems };
  fs.writeFileSync(PRICES_PATH, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("[sync] data/prices.json به‌روزرسانی شد.");

  if (shouldCommit) {
    console.log("[sync] در حال commit و push...");
    commitAndPush();
    console.log("[sync] push شد؛ چند ثانیه‌ی دیگر گیت‌هاب‌پیجز آپدیت می‌شود.");
  }
}

main().catch((err) => {
  console.error("[sync] خطا: " + err.message);
  process.exitCode = 1;
});
