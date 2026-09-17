// Draws the Levo app icon (kraft ground + cream loaf) straight to PNG, no deps.
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const OUT = path.join(__dirname, "..");

const KRAFT = [139, 94, 55];
const CREAM = [250, 244, 232];

function crc32(buf) {
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0;
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      raw[p++] = rgba[i]; raw[p++] = rgba[i + 1]; raw[p++] = rgba[i + 2]; raw[p++] = rgba[i + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

// --- shape tests, all in 0..1 space ---

function inRoundRect(x, y, r) {
  const dx = Math.max(r - x, 0, x - (1 - r));
  const dy = Math.max(r - y, 0, y - (1 - r));
  if (dx === 0 || dy === 0) return x >= 0 && x <= 1 && y >= 0 && y <= 1;
  return dx * dx + dy * dy <= r * r;
}

// Dome-shaped loaf: half ellipse on a base bar with rounded bottom corners.
function inLoaf(x, y) {
  const cx = 0.5, baseY = 0.60, rx = 0.315, ry = 0.27, h = 0.05, r = 0.022;
  if (y <= baseY) {
    const nx = (x - cx) / rx, ny = (y - baseY) / ry;
    return nx * nx + ny * ny <= 1;
  }
  if (y > baseY + h) return false;
  const ax = Math.abs(x - cx);
  if (ax > rx) return false;
  if (y <= baseY + h - r || ax <= rx - r) return true;
  const dx = ax - (rx - r), dy = y - (baseY + h - r);
  return dx * dx + dy * dy <= r * r;
}

// Three scored slashes across the crown.
function inSlash(x, y) {
  const slashes = [
    { x0: 0.378, y0: 0.400, x1: 0.340, y1: 0.560 },
    { x0: 0.500, y0: 0.368, x1: 0.484, y1: 0.566 },
    { x0: 0.622, y0: 0.400, x1: 0.664, y1: 0.560 }
  ];
  const w = 0.029;
  for (const s of slashes) {
    const vx = s.x1 - s.x0, vy = s.y1 - s.y0;
    const t = Math.max(0, Math.min(1, ((x - s.x0) * vx + (y - s.y0) * vy) / (vx * vx + vy * vy)));
    const dx = x - (s.x0 + t * vx), dy = y - (s.y0 + t * vy);
    if (dx * dx + dy * dy <= w * w) return true;
  }
  return false;
}

function render(size, { maskable }) {
  const SS = 3;                       // supersampling factor
  const inset = maskable ? 0.16 : 0;  // keep art inside the safe zone
  const radius = maskable ? 0 : 0.22; // maskable ships a full bleed square
  const rgba = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0, fg = 0, sl = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x + (sx + 0.5) / SS) / size;
          const v = (y + (sy + 0.5) / SS) / size;
          if (!inRoundRect(u, v, radius)) continue;
          bg++;
          const au = (u - 0.5) / (1 - inset * 2) + 0.5;
          const av = (v - 0.5) / (1 - inset * 2) + 0.5;
          if (inLoaf(au, av)) { fg++; if (inSlash(au, av)) sl++; }
        }
      }
      const n = SS * SS;
      const a = bg / n, loaf = fg / n, slash = sl / n;
      const i = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) {
        const mixed = KRAFT[c] * (1 - loaf) + CREAM[c] * loaf;
        rgba[i + c] = Math.round(mixed * (1 - slash) + KRAFT[c] * slash);
      }
      rgba[i + 3] = Math.round(a * 255);
    }
  }
  return png(size, rgba);
}

const jobs = [
  ["icon-192.png", 192, { maskable: false }],
  ["icon-512.png", 512, { maskable: false }],
  ["icon-maskable-512.png", 512, { maskable: true }],
  ["apple-touch-icon.png", 180, { maskable: true }],
  ["favicon-32.png", 32, { maskable: false }]
];

for (const [name, size, opts] of jobs) {
  fs.writeFileSync(path.join(OUT, name), render(size, opts));
  console.log("wrote", name, size + "px");
}
