// Generates client/public/sitemap.xml from the collection rules in
// shared/catalog.ts, so the sitemap can never drift from the routes the app
// actually serves. Run with: node scripts/gen-sitemap.mjs
import fs from "node:fs";

const cat = fs.readFileSync("shared/catalog.ts", "utf8");
const start = cat.indexOf("COLLECTION_RULES");
const end = cat.indexOf("};", start);
const block = cat.slice(start, end);

const keys = [...block.matchAll(/^\s{2}"?([a-z0-9-]+)"?:/gm)].map((m) => m[1]);

// The same file also holds status/payment enums further down; those are not
// collections, so they are filtered out by name.
const NOT_COLLECTIONS = new Set([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "unpaid",
  "paid",
  "refunded",
  "failed",
]);

const collections = [...new Set(keys)].filter((k) => !NOT_COLLECTIONS.has(k));

const pages = [
  "",
  "about",
  "contact",
  "faq",
  "care-guide",
  "shipping",
  "returns",
  "privacy",
  "terms",
  "track-order",
  "wishlist",
];

const BASE = "https://eliteparadise.com.bd";

const urls = [
  ...pages.map(
    (p) =>
      `  <url><loc>${BASE}/${p}</loc><changefreq>${p === "" ? "daily" : "monthly"}</changefreq><priority>${p === "" ? "1.0" : "0.6"}</priority></url>`,
  ),
  ...collections.map(
    (c) =>
      `  <url><loc>${BASE}/collections/${c}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
  ),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

fs.writeFileSync("client/public/sitemap.xml", xml);
console.log(`sitemap: ${collections.length} collections, ${urls.length} urls`);
