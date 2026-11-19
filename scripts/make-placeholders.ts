// Generates the temporary pictures in client/public/images (one-off helper).
// Replace them with real photos: upload in Admin → Products, or drop your own
// files in client/public/images (same names) — or change the names in shared/catalog.ts.
import { writeFileSync } from "node:fs";
import { SEED_PRODUCTS } from "../server/seed/seed-data";
import { EDITORIAL } from "../shared/catalog";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const G = "url(#gold)";

// Each glyph is drawn around (0,0) in a box about 1 unit wide (scaled later).
const stroke = (w: number, extra = "") => `fill="none" stroke="${G}" stroke-width="${w}" stroke-linecap="round" ${extra}`;
const gem = (x: number, y: number, r: number) => `
<g transform="translate(${x} ${y})"><polygon points="${-r},0 ${-r * 0.55},${-r * 0.7} ${r * 0.55},${-r * 0.7} ${r},0 0,${r * 1.15}" fill="url(#gem)" stroke="${G}" stroke-width="0.004"/>
<path d="M${-r},0 H${r} M${-r * 0.55},${-r * 0.7} L${-r * 0.2},0 L0,${r * 1.15} M${r * 0.55},${-r * 0.7} L${r * 0.2},0 L0,${r * 1.15}" stroke="#fff" stroke-opacity="0.7" stroke-width="0.003" fill="none"/></g>`;
const pearl = (x: number, y: number, r: number) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#pearl)"/>`;

const earring = (x: number, y: number, k: number) => `<g transform="translate(${x} ${y}) scale(${k})"><circle cx="0" cy="-0.2" r="0.022" fill="${G}"/><path d="M0,-0.18 V-0.1" ${stroke(0.008)}/><path d="M0,-0.1 q0.07,0.08 0,0.2 q-0.07,-0.12 0,-0.2" fill="${G}"/>${pearl(0, 0.17, 0.045)}</g>`;

const GLYPH: Record<string, string> = {
  rings: `<ellipse cx="0" cy="0.05" rx="0.2" ry="0.22" ${stroke(0.034)}/><ellipse cx="0" cy="0.05" rx="0.2" ry="0.22" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="0.006" transform="translate(-0.006 -0.006)"/>${gem(0, -0.2, 0.075)}`,
  necklaces: `<path d="M-0.28,-0.3 C-0.26,0.1 0.26,0.1 0.28,-0.3" ${stroke(0.01, 'stroke-dasharray="0.012 0.012"')}/><path d="M0,0.002 V0.05" ${stroke(0.006)}/><path d="M0,0.05 q0.04,0.05 0,0.1 q-0.04,-0.05 0,-0.1" fill="${G}"/>${pearl(0, 0.19, 0.05)}`,
  chains: `<path d="M-0.3,-0.12 C-0.2,0.18 -0.1,-0.18 0,0.06 C0.1,0.3 0.2,-0.14 0.3,0.1" ${stroke(0.012, 'stroke-dasharray="0.016 0.012"')}/><path d="M-0.3,-0.12 C-0.2,0.18 -0.1,-0.18 0,0.06 C0.1,0.3 0.2,-0.14 0.3,0.1" ${stroke(0.004)}/>`,
  earrings: [-0.14, 0.14].map((x) => earring(x, 0, 1)).join(""),
  bracelets: `<ellipse cx="0" cy="0" rx="0.26" ry="0.1" ${stroke(0.03)}/><ellipse cx="0" cy="0" rx="0.26" ry="0.1" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="0.005" transform="translate(0 -0.01)"/>${[-0.18, -0.06, 0.06, 0.18].map((x) => `<circle cx="${x}" cy="${0.098 * Math.sqrt(1 - (x / 0.26) ** 2)}" r="0.015" fill="url(#pearl)"/>`).join("")}`,
  bangles: [-0.07, 0, 0.07].map((y, i) => `<ellipse cx="0" cy="${y}" rx="${0.24 - i * 0.012}" ry="0.085" ${stroke(0.022)}/>`).join(""),
  watches: `<rect x="-0.055" y="-0.34" width="0.11" height="0.17" rx="0.02" ${stroke(0.014)}/><rect x="-0.055" y="0.17" width="0.11" height="0.17" rx="0.02" ${stroke(0.014)}/><circle r="0.14" ${stroke(0.022)}/><circle r="0.115" ${stroke(0.004)}/>${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="-0.1" x2="0" y2="${i % 3 === 0 ? -0.083 : -0.092}" stroke="${G}" stroke-width="0.004" transform="rotate(${i * 30})"/>`).join("")}<path d="M0,0 V-0.075 M0,0 L0.05,0.03" ${stroke(0.007)}/>`,
  anklets: `<path d="M-0.3,-0.04 C-0.2,0.14 0.2,0.14 0.3,-0.04" ${stroke(0.01, 'stroke-dasharray="0.014 0.011"')}/><path d="M0,0.085 l0.03,0.035 l-0.03,0.04 l-0.03,-0.04 z" fill="${G}"/>`,
  accessories: `<circle r="0.12" ${stroke(0.02)}/><path d="M-0.05,0.04 V-0.05 L0,0 L0.05,-0.05 V0.04" ${stroke(0.012)}/>`,
};
GLYPH.sets = `<g transform="translate(0 -0.12) scale(0.8)">${GLYPH.necklaces}</g>${earring(-0.2, 0.2, 0.55)}${earring(0.2, 0.2, 0.55)}`;
GLYPH.couple = `<g transform="translate(-0.1 0)">${GLYPH.rings.replace(gem(0, -0.2, 0.075), "")}</g><g transform="translate(0.1 0)">${GLYPH.rings}</g>`;
GLYPH.hero = GLYPH.rings;

const TONES: Record<string, [string, string]> = {
  rings: ["#f7f0e4", "#e6d5b4"], necklaces: ["#f6efe6", "#e2d2c0"], chains: ["#f2eee8", "#d9d0c2"],
  earrings: ["#f8f1ea", "#e7d3c4"], bracelets: ["#f5f0e6", "#e0d3b6"], bangles: ["#f7f1e3", "#e4d4ae"],
  watches: ["#f1eeea", "#d6cdbf"], anklets: ["#f6f0e8", "#e3d5c1"], sets: ["#f8f0e4", "#e8d7b8"],
  accessories: ["#f2eee8", "#dad0c0"], couple: ["#f8efe6", "#e9d3bd"], hero: ["#f9f2e6", "#e7d5b2"],
};

function art(w: number, h: number, kind: string, title: string, sub: string, variant = 0, scale = 1) {
  const [c1, c2] = TONES[kind] ?? TONES.rings;
  const s = Math.min(w, h);
  const cy = h * (title ? 0.42 : 0.5);
  const flip = variant % 2 ? "x1=\"1\" y1=\"0\" x2=\"0\" y2=\"1\"" : "x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs>
<linearGradient id="bg" ${flip}><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<radialGradient id="spot" cx="0.5" cy="0.38" r="0.6"><stop offset="0" stop-color="#fff" stop-opacity="0.85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ecd596"/><stop offset="0.45" stop-color="#b8923f"/><stop offset="1" stop-color="#f0dda3"/></linearGradient>
<radialGradient id="pearl" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff"/><stop offset="0.6" stop-color="#f1e9dc"/><stop offset="1" stop-color="#cdbfa6"/></radialGradient>
<linearGradient id="gem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#dfeaf2"/><stop offset="1" stop-color="#b9c9d6"/></linearGradient>
<radialGradient id="floor" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#3b2d12" stop-opacity="0.22"/><stop offset="1" stop-color="#3b2d12" stop-opacity="0"/></radialGradient>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="${s * 0.008}" stdDeviation="${s * 0.007}" flood-color="#5a4417" flood-opacity="0.35"/></filter>
</defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
<rect width="${w}" height="${h}" fill="url(#spot)"/>
<ellipse cx="${w / 2}" cy="${cy + s * 0.27 * scale}" rx="${s * 0.24 * scale}" ry="${s * 0.03 * scale}" fill="url(#floor)"/>
<g transform="translate(${w / 2} ${cy}) scale(${s * (kind === "watches" ? 0.95 : 1.05) * scale})" filter="url(#soft)">${GLYPH[kind] ?? GLYPH.rings}</g>
<rect x="${s * 0.035}" y="${s * 0.035}" width="${w - s * 0.07}" height="${h - s * 0.07}" fill="none" stroke="${G}" stroke-opacity="0.55" stroke-width="${Math.max(1, s * 0.002)}"/>
${title ? `<text x="${w / 2}" y="${h * 0.84}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${s * 0.044}" fill="#3a3226">${esc(title)}</text>
<text x="${w / 2}" y="${h * 0.84 + s * 0.055}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${s * 0.02}" fill="#8a7a58" letter-spacing="${s * 0.008}">${esc(sub.toUpperCase())}</text>` : ""}
</svg>`;
}

for (const p of SEED_PRODUCTS) {
  const file = p.images[0].replace(/^\/images\//, "");
  writeFileSync(`client/public/images/${file}`, art(800, 1000, p.category, p.name, p.category, p.sortOrder));
}
// Home / category pictures (no text: the page supplies the words).
const KIND: Record<string, string> = {
  hero: "hero", couple: "couple", necklace: "necklaces", earrings: "earrings",
  ring: "rings", bracelet: "bracelets", bangles: "bangles", set: "sets",
};
Object.values(EDITORIAL).forEach((src, i) => {
  const file = (src as string).replace(/^\/images\//, "");
  const key = file.replace(/\.svg$/, "");
  writeFileSync(`client/public/images/${file}`, art(1600, 1000, KIND[key] ?? "rings", "", "", i, 0.7));
});
for (const [file, kind] of [
  ["editorial-default.svg", "necklaces"], ["editorial-women.svg", "earrings"], ["editorial-men.svg", "watches"],
  ["editorial-couple.svg", "couple"], ["editorial-gifts.svg", "sets"],
] as const) {
  writeFileSync(`client/public/images/${file}`, art(900, 1100, kind, "", "", 1, 0.85));
}
console.log("placeholders written");
