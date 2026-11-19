// ─────────────────────────────────────────────────────────────────────────────
// ELITE PARADISE — sample catalogue
//
// ⚠️ SAMPLE CONTENT. These 24 pieces are placeholders so the store is fully
// browsable before the real inventory is entered. Every row carries
// is_sample = true, and the admin product list labels them as sample data.
// Replace them in Admin → Products with the real catalogue.
//
// Prices are INTEGER TAKA (BDT).
// ─────────────────────────────────────────────────────────────────────────────
import { PRODUCT_IMG } from "../../shared/catalog";

export type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  sku: string;
  category: string;
  gender: string;
  material: string;
  color: string;
  style: string;
  sizes: string[] | null;
  images: string[];
  stock: number;
  weight: string | null;
  careInstructions: string;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

const CARE_VERMEIL =
  "Store in the pouch provided, away from direct sunlight. Remove before showering, swimming or applying perfume. Wipe gently with the soft cloth after wear. Avoid contact with water, chlorine and abrasive cleaners.";
const CARE_PEARL =
  "Freshwater pearls are soft. Keep away from perfume, hairspray and cosmetics, and wipe with a damp soft cloth after wear. Store flat in the pouch, never hanging, and avoid prolonged direct sunlight.";
const CARE_STEEL =
  "Gold-plated stainless steel is durable but the plating can wear. Wipe with the soft cloth after wear, keep away from chlorine and abrasive cleaners, and store dry in the pouch provided.";
const CARE_WATCH =
  "Keep the case dry and wipe with the soft cloth. Avoid magnets, extreme heat and knocks. This watch is not waterproof — do not swim or shower with it. Have the battery replaced by a jeweller.";

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    slug: "aurelia-pearl-pendant-necklace",
    name: "Aurelia Pearl Pendant Necklace",
    description:
      "A single freshwater pearl suspended from a fine cable chain, finished in 18k gold vermeil. The pendant sits just below the collarbone, which is where it catches the most light. Deliberately quiet — it is the piece you reach for without thinking.",
    price: 4850, salePrice: 3890, sku: "EP-NK-001",
    category: "necklaces", gender: "women", material: "18k Gold Vermeil", color: "Pearl White", style: "minimalist",
    sizes: ["40 cm", "45 cm", "50 cm"], images: [PRODUCT_IMG.pearlPendant], stock: 18,
    weight: "3.2 g", careInstructions: CARE_PEARL,
    isBestSeller: true, isNewArrival: false, isFeatured: true, sortOrder: 1,
  },
  {
    slug: "lumiere-drop-earrings",
    name: "Lumière Drop Earrings",
    description:
      "A slender gold bar that falls into a cluster of small pearls. Light enough to wear all evening, structured enough to hold its shape. French hooks, finished by hand.",
    price: 5200, salePrice: null, sku: "EP-ER-002",
    category: "earrings", gender: "women", material: "18k Gold Vermeil", color: "Pearl White", style: "classic",
    sizes: null, images: [PRODUCT_IMG.dropEarrings], stock: 12,
    weight: "4.1 g", careInstructions: CARE_PEARL,
    isBestSeller: true, isNewArrival: false, isFeatured: true, sortOrder: 2,
  },
  {
    slug: "solene-solitaire-ring",
    name: "Solène Solitaire Ring",
    description:
      "A single brilliant-cut stone in a fine four-claw setting on a slim band. The setting is kept low so the ring sits flush against the finger — no snagging on knitwear, no catching on hair.",
    price: 7400, salePrice: 6290, sku: "EP-RG-003",
    category: "rings", gender: "women", material: "18k Gold Vermeil", color: "Clear", style: "classic",
    sizes: ["US 5", "US 6", "US 7", "US 8"], images: [PRODUCT_IMG.solitaireRing], stock: 9,
    weight: "2.4 g", careInstructions: CARE_VERMEIL,
    isBestSeller: true, isNewArrival: false, isFeatured: true, sortOrder: 3,
  },
  {
    slug: "orb-disc-bracelet",
    name: "Orb Disc Bracelet",
    description:
      "A fine chain carrying one small flat disc, polished to a soft mirror. Wears well alone and layers without tangling. Adjustable closure with three positions.",
    price: 3600, salePrice: null, sku: "EP-BR-004",
    category: "bracelets", gender: "women", material: "18k Gold Vermeil", color: "Gold", style: "everyday",
    sizes: ["16 cm", "18 cm"], images: [PRODUCT_IMG.discBracelet], stock: 24,
    weight: "2.8 g", careInstructions: CARE_VERMEIL,
    isBestSeller: true, isNewArrival: false, isFeatured: false, sortOrder: 4,
  },
  {
    slug: "duo-polished-bangles",
    name: "Duo Polished Bangles",
    description:
      "Two bangles of slightly different widths, designed to be worn as a pair. The narrower one sits inside the wider, so they move together rather than clashing.",
    price: 6800, salePrice: 5440, sku: "EP-BG-005",
    category: "bangles", gender: "women", material: "Brass, Gold Plated", color: "Gold", style: "modern",
    sizes: ["Small", "Medium", "Large"], images: [PRODUCT_IMG.duoBangle], stock: 7,
    weight: "18.5 g", careInstructions: CARE_VERMEIL,
    isBestSeller: true, isNewArrival: false, isFeatured: false, sortOrder: 5,
  },
  {
    slug: "trinite-three-piece-set",
    name: "Trinité Three-Piece Set",
    description:
      "Necklace, stud earrings and bracelet in one coordinated design — a fine chain with a small ring pendant, repeated at three scales. Presented in our ivory box.",
    price: 12500, salePrice: 9990, sku: "EP-ST-006",
    category: "sets", gender: "women", material: "18k Gold Vermeil", color: "Gold", style: "classic",
    sizes: null, images: [PRODUCT_IMG.triniteSet], stock: 6,
    weight: "9.6 g", careInstructions: CARE_VERMEIL,
    isBestSeller: true, isNewArrival: false, isFeatured: true, sortOrder: 6,
  },
  {
    slug: "signet-oval-ring",
    name: "Signet Oval Ring",
    description:
      "A polished oval face on a solid band. Left blank, as a signet should be — or engraved to order. Substantial without being heavy.",
    price: 5900, salePrice: null, sku: "EP-RG-007",
    category: "rings", gender: "women", material: "18k Gold Vermeil", color: "Gold", style: "modern",
    sizes: ["US 5", "US 6", "US 7", "US 8", "US 9"], images: [PRODUCT_IMG.signetRing], stock: 14,
    weight: "4.8 g", careInstructions: CARE_VERMEIL,
    isBestSeller: false, isNewArrival: true, isFeatured: false, sortOrder: 7,
  },
  {
    slug: "halo-hoop-earrings",
    name: "Halo Hoop Earrings",
    description:
      "A rounded hoop with a slim profile — the everyday hoop, refined. Hinged closure so they sit securely without a backing.",
    price: 3200, salePrice: 2560, sku: "EP-ER-008",
    category: "earrings", gender: "women", material: "18k Gold Vermeil", color: "Gold", style: "everyday",
    sizes: ["20 mm", "30 mm"], images: [PRODUCT_IMG.haloHoops], stock: 31,
    weight: "2.2 g", careInstructions: CARE_VERMEIL,
    isBestSeller: true, isNewArrival: false, isFeatured: false, sortOrder: 8,
  },
  {
    slug: "onyx-brushed-band",
    name: "Onyx Brushed Band",
    description:
      "A men's band in brushed gold with a single fine groove running its circumference. The matte finish keeps it from looking polished or formal — it wears like a tool, not a jewel.",
    price: 6400, salePrice: null, sku: "EP-MR-009",
    category: "rings", gender: "men", material: "Stainless Steel, Gold Plated", color: "Gold", style: "modern",
    sizes: ["US 8", "US 9", "US 10", "US 11", "US 12"], images: [PRODUCT_IMG.onyxBand], stock: 16,
    weight: "6.2 g", careInstructions: CARE_STEEL,
    isBestSeller: true, isNewArrival: false, isFeatured: false, sortOrder: 9,
  },
  {
    slug: "atlas-link-bracelet",
    name: "Atlas Link Bracelet",
    description:
      "Flat interlocking links with a brushed face and polished edges. Weighted to sit properly on the wrist rather than sliding. Fold-over clasp.",
    price: 8900, salePrice: 7120, sku: "EP-MB-010",
    category: "bracelets", gender: "men", material: "Stainless Steel, Gold Plated", color: "Gold", style: "modern",
    sizes: ["19 cm", "21 cm"], images: [PRODUCT_IMG.atlasBracelet], stock: 11,
    weight: "24.0 g", careInstructions: CARE_STEEL,
    isBestSeller: true, isNewArrival: false, isFeatured: true, sortOrder: 10,
  },
  {
    slug: "curb-chain-necklace",
    name: "Curb Chain Necklace",
    description:
      "A slim flat curb link, kept narrow enough to wear under a collar. The links are soldered, so the chain holds its line instead of twisting.",
    price: 9600, salePrice: null, sku: "EP-MC-011",
    category: "chains", gender: "men", material: "Stainless Steel, Gold Plated", color: "Gold", style: "classic",
    sizes: ["50 cm", "55 cm", "60 cm"], images: [PRODUCT_IMG.curbChain], stock: 13,
    weight: "18.0 g", careInstructions: CARE_STEEL,
    isBestSeller: false, isNewArrival: true, isFeatured: false, sortOrder: 11,
  },
  {
    slug: "bar-pendant-necklace",
    name: "Bar Pendant Necklace",
    description:
      "A small brushed rectangular bar on a fine chain. The restraint is the point — it reads as a detail, not a statement.",
    price: 4200, salePrice: 3360, sku: "EP-MN-012",
    category: "necklaces", gender: "men", material: "Stainless Steel, Gold Plated", color: "Gold", style: "minimalist",
    sizes: ["50 cm", "55 cm"], images: [PRODUCT_IMG.barPendant], stock: 20,
    weight: "7.4 g", careInstructions: CARE_STEEL,
    isBestSeller: false, isNewArrival: true, isFeatured: false, sortOrder: 12,
  },
  {
    slug: "meridian-slim-watch",
    name: "Meridian Slim Watch",
    description:
      "A 36 mm champagne-gold case with an ivory dial carrying no numerals at all — only two slim hands. Warm beige leather strap, quick-release pins.",
    price: 14500, salePrice: 11600, sku: "EP-WT-013",
    category: "watches", gender: "unisex", material: "Stainless Steel, Gold Plated", color: "Ivory", style: "minimalist",
    sizes: ["36 mm"], images: [PRODUCT_IMG.watch], stock: 5,
    weight: "38.0 g", careInstructions: CARE_WATCH,
    isBestSeller: true, isNewArrival: false, isFeatured: true, sortOrder: 13,
  },
  {
    slug: "two-threads-couple-bracelets",
    name: "Two Threads Couple Bracelets",
    description:
      "A pair of fine chains — one carrying a small round charm, one a flat tag. Sold as a pair, presented in one box. Adjustable to fit most wrists.",
    price: 7900, salePrice: 6320, sku: "EP-CP-014",
    category: "bracelets", gender: "unisex", material: "18k Gold Vermeil", color: "Gold", style: "minimalist",
    sizes: ["16-19 cm adjustable"], images: [PRODUCT_IMG.coupleBracelets], stock: 10,
    weight: "5.6 g (pair)", careInstructions: CARE_VERMEIL,
    isBestSeller: true, isNewArrival: false, isFeatured: true, sortOrder: 14,
  },
  {
    slug: "same-vow-couple-rings",
    name: "Same Vow Couple Rings",
    description:
      "Two slim bands, one slightly wider, in the same finish. Designed to be worn as a pair without matching exactly — the difference is the point.",
    price: 8600, salePrice: null, sku: "EP-CP-015",
    category: "rings", gender: "unisex", material: "18k Gold Vermeil", color: "Gold", style: "classic",
    sizes: ["US 6 / US 9", "US 7 / US 10", "US 8 / US 11"], images: [PRODUCT_IMG.coupleRings], stock: 8,
    weight: "5.0 g (pair)", careInstructions: CARE_VERMEIL,
    isBestSeller: false, isNewArrival: true, isFeatured: false, sortOrder: 15,
  },
  {
    slug: "half-heart-couple-necklaces",
    name: "Half-Heart Couple Necklaces",
    description:
      "Two fine chains, each with a half-heart pendant that sits close to its pair. Worn together they read as one shape. Sold as a pair.",
    price: 9200, salePrice: 7360, sku: "EP-CP-016",
    category: "necklaces", gender: "unisex", material: "18k Gold Vermeil", color: "Gold", style: "classic",
    sizes: ["45 cm", "50 cm"], images: [PRODUCT_IMG.coupleNecklaces], stock: 7,
    weight: "6.8 g (pair)", careInstructions: CARE_VERMEIL,
    isBestSeller: true, isNewArrival: false, isFeatured: false, sortOrder: 16,
  },
  {
    slug: "petite-charm-anklet",
    name: "Petite Charm Anklet",
    description:
      "A fine chain with three tiny round charms, spaced so they fall at different points around the ankle. Adjustable closure.",
    price: 2800, salePrice: 2240, sku: "EP-AN-017",
    category: "anklets", gender: "women", material: "18k Gold Vermeil", color: "Gold", style: "everyday",
    sizes: ["23 cm", "26 cm"], images: [PRODUCT_IMG.anklet], stock: 22,
    weight: "1.9 g", careInstructions: CARE_VERMEIL,
    isBestSeller: false, isNewArrival: true, isFeatured: false, sortOrder: 17,
  },
  {
    slug: "pearl-huggie-earrings",
    name: "Pearl Huggie Earrings",
    description:
      "Small hinged huggies, each set with a single tiny pearl. They sit close to the lobe, which makes them the right choice for a second or third piercing.",
    price: 3400, salePrice: null, sku: "EP-ER-018",
    category: "earrings", gender: "women", material: "18k Gold Vermeil", color: "Pearl White", style: "minimalist",
    sizes: ["10 mm"], images: [PRODUCT_IMG.huggies], stock: 19,
    weight: "1.4 g", careInstructions: CARE_PEARL,
    isBestSeller: false, isNewArrival: true, isFeatured: false, sortOrder: 18,
  },
  {
    slug: "hammered-statement-cuff",
    name: "Hammered Statement Cuff",
    description:
      "A wide open cuff with a softly hammered surface, so it catches light in many small planes rather than one. Open back, gently adjustable.",
    price: 11200, salePrice: 8960, sku: "EP-BG-019",
    category: "bangles", gender: "women", material: "Brass, Gold Plated", color: "Gold", style: "statement",
    sizes: ["One size, adjustable"], images: [PRODUCT_IMG.cuff], stock: 4,
    weight: "32.0 g", careInstructions: CARE_VERMEIL,
    isBestSeller: false, isNewArrival: false, isFeatured: true, sortOrder: 19,
  },
  {
    slug: "crescent-moon-necklace",
    name: "Crescent Moon Necklace",
    description:
      "A small crescent pendant set with tiny stones along its curve. The stones are set flush, so nothing catches on fabric.",
    price: 5600, salePrice: null, sku: "EP-NK-020",
    category: "necklaces", gender: "women", material: "18k Gold Vermeil", color: "Clear", style: "modern",
    sizes: ["40 cm", "45 cm"], images: [PRODUCT_IMG.moonNecklace], stock: 15,
    weight: "3.0 g", careInstructions: CARE_VERMEIL,
    isBestSeller: false, isNewArrival: true, isFeatured: false, sortOrder: 20,
  },
  {
    slug: "thread-pearl-earrings",
    name: "Thread Pearl Earrings",
    description:
      "Long slender threaders with a pearl at each end — one sits at the lobe, one hangs. Pull-through fitting, no backing required.",
    price: 4100, salePrice: 3280, sku: "EP-ER-021",
    category: "earrings", gender: "women", material: "18k Gold Vermeil", color: "Pearl White", style: "statement",
    sizes: null, images: [PRODUCT_IMG.threaders], stock: 9,
    weight: "2.6 g", careInstructions: CARE_PEARL,
    isBestSeller: false, isNewArrival: false, isFeatured: false, sortOrder: 21,
  },
  {
    slug: "ligne-tennis-bracelet",
    name: "Ligne Tennis Bracelet",
    description:
      "A single continuous row of small clear stones in a fine gold setting. The clasp is integrated into the line so the bracelet reads as unbroken.",
    price: 13800, salePrice: 11040, sku: "EP-BR-022",
    category: "bracelets", gender: "women", material: "18k Gold Vermeil", color: "Clear", style: "classic",
    sizes: ["17 cm", "19 cm"], images: [PRODUCT_IMG.tennisBracelet], stock: 6,
    weight: "8.2 g", careInstructions: CARE_VERMEIL,
    isBestSeller: true, isNewArrival: false, isFeatured: false, sortOrder: 22,
  },
  {
    slug: "knot-stud-earrings",
    name: "Knot Stud Earrings",
    description:
      "A small smooth knot, cast in one piece. Sits flat against the lobe and works as a first or second piercing.",
    price: 2600, salePrice: null, sku: "EP-ER-023",
    category: "earrings", gender: "women", material: "18k Gold Vermeil", color: "Gold", style: "minimalist",
    sizes: null, images: [PRODUCT_IMG.knotStuds], stock: 28,
    weight: "1.1 g", careInstructions: CARE_VERMEIL,
    isBestSeller: false, isNewArrival: true, isFeatured: false, sortOrder: 23,
  },
  {
    slug: "ivory-gift-box-set",
    name: "Ivory Gift Box Set",
    description:
      "A fine necklace and matching stud earrings, presented in our ivory box with a champagne-gold ribbon. The card is left blank for your own message.",
    price: 9800, salePrice: 7840, sku: "EP-ST-024",
    category: "sets", gender: "women", material: "18k Gold Vermeil", color: "Gold", style: "classic",
    sizes: null, images: [PRODUCT_IMG.giftSet], stock: 12,
    weight: "7.2 g", careInstructions: CARE_VERMEIL,
    isBestSeller: true, isNewArrival: false, isFeatured: true, sortOrder: 24,
  },
];

/** Discount codes seeded for the store to be usable out of the box. */
export const SEED_DISCOUNTS = [
  { code: "ELITE10", type: "percent", value: 10, minSubtotal: 0 },
  { code: "WELCOME500", type: "fixed", value: 500, minSubtotal: 5000 },
];
