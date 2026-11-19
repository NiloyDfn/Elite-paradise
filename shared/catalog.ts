// ─────────────────────────────────────────────────────────────────────────────
// ELITE PARADISE — shared catalogue constants (client + server)
// Money is INTEGER TAKA (BDT) everywhere. Never a float.
// ─────────────────────────────────────────────────────────────────────────────

export const BRAND = {
  name: "ELITE PARADISE",
  wordmark: "ELITE PARADISE",
  tagline: "Elegance in Every Detail.",
  taglineUpper: "ELEGANCE IN EVERY DETAIL",
  established: "EST. 2019",
} as const;

/** Editorial imagery (hero, banners, category cards) — served from /public. */
export const EDITORIAL = {
  hero: "/images/hero.svg",
  couple: "/images/couple.svg",
  necklace: "/images/necklace.svg",
  earrings: "/images/earrings.svg",
  ring: "/images/ring.svg",
  bracelet: "/images/bracelet.svg",
  bangles: "/images/bangles.svg",
  set: "/images/set.svg",
} as const;

/** Every non-product picture on the storefront. The admin "Images" tab lets the
 *  owner replace any of these; until then `def` (a file in /public) is shown. */
export type SiteImageSlot = {
  key: string; label: string; group: string; def: string; hint: string;
};
export const SITE_IMAGE_SLOTS: SiteImageSlot[] = [
  { key: "logo", group: "Brand", label: "Website logo", def: "/images/logo.png", hint: "Transparent PNG, portrait. Shows in the menu, footer, login and admin." },
  { key: "favicon", group: "Brand", label: "Browser tab icon", def: "/favicon.png", hint: "Small square PNG (256×256)." },
  { key: "home-banner", group: "Home page", label: "Big banner (top of home page)", def: "/images/brand-banner.jpg", hint: "Wide 16:9 picture, e.g. 1500×844." },
  { key: "cat-necklaces", group: "Home page — Find your piece", label: "Necklaces card", def: EDITORIAL.necklace, hint: "Portrait 3:4, e.g. 900×1200." },
  { key: "cat-earrings", group: "Home page — Find your piece", label: "Earrings card", def: EDITORIAL.earrings, hint: "Portrait 3:4." },
  { key: "cat-rings", group: "Home page — Find your piece", label: "Rings card", def: EDITORIAL.ring, hint: "Portrait 3:4." },
  { key: "cat-bracelets", group: "Home page — Find your piece", label: "Bracelets card", def: EDITORIAL.bracelet, hint: "Portrait 3:4." },
  { key: "cat-bangles", group: "Home page — Find your piece", label: "Bangles card", def: EDITORIAL.bangles, hint: "Portrait 3:4." },
  { key: "cat-sets", group: "Home page — Find your piece", label: "Jewelry sets card", def: EDITORIAL.set, hint: "Portrait 3:4." },
  { key: "couple-banner", group: "Home page — other pictures", label: "Couple collection banner", def: EDITORIAL.couple, hint: "Wide picture, dark/soft so the white text stays readable." },
  { key: "brand-story", group: "Home page — other pictures", label: "\"More than just jewelry\" picture", def: EDITORIAL.set, hint: "Portrait 4:5." },
  { key: "gift-her", group: "Home page — other pictures", label: "Gifts for Her card", def: EDITORIAL.earrings, hint: "Landscape 4:3." },
  { key: "gift-him", group: "Home page — other pictures", label: "Gifts for Him card", def: EDITORIAL.bracelet, hint: "Landscape 4:3." },
  { key: "gift-sets", group: "Home page — other pictures", label: "Gift Sets card", def: EDITORIAL.set, hint: "Landscape 4:3." },
  { key: "mega-default", group: "Menu pictures (drop-down)", label: "Menu picture — default / Shop All", def: "/images/editorial-default.svg", hint: "Landscape 4:3." },
  { key: "mega-women", group: "Menu pictures (drop-down)", label: "Menu picture — Women", def: "/images/editorial-women.svg", hint: "Landscape 4:3." },
  { key: "mega-men", group: "Menu pictures (drop-down)", label: "Menu picture — Men", def: "/images/editorial-men.svg", hint: "Landscape 4:3." },
  { key: "mega-couple", group: "Menu pictures (drop-down)", label: "Menu picture — Couple Collection", def: "/images/editorial-couple.svg", hint: "Landscape 4:3." },
  { key: "mega-gifts", group: "Menu pictures (drop-down)", label: "Menu picture — Gifts", def: "/images/editorial-gifts.svg", hint: "Landscape 4:3." },
];
export const SITE_IMAGE_KEYS = SITE_IMAGE_SLOTS.map((s) => s.key);

/** Product photography, one image per sample product. */
export const PRODUCT_IMG = {
  pearlPendant: "/images/p1.svg",
  dropEarrings: "/images/p2.svg",
  solitaireRing: "/images/p3.svg",
  discBracelet: "/images/p4.svg",
  duoBangle: "/images/p5.svg",
  triniteSet: "/images/p6.svg",
  signetRing: "/images/p7.svg",
  haloHoops: "/images/p8.svg",
  onyxBand: "/images/p9.svg",
  atlasBracelet: "/images/p10.svg",
  curbChain: "/images/p11.svg",
  barPendant: "/images/p12.svg",
  watch: "/images/p13.svg",
  coupleBracelets: "/images/p14.svg",
  coupleRings: "/images/p15.svg",
  coupleNecklaces: "/images/p16.svg",
  anklet: "/images/p17.svg",
  huggies: "/images/p18.svg",
  cuff: "/images/p19.svg",
  moonNecklace: "/images/p20.svg",
  threaders: "/images/p21.svg",
  tennisBracelet: "/images/p22.svg",
  knotStuds: "/images/p23.svg",
  giftSet: "/images/p24.svg",
} as const;

// ── Navigation ───────────────────────────────────────────────────────────────

export type NavLink = { label: string; href: string };
export type NavItem = { label: string; href: string; menu?: { title: string; links: NavLink[] }[] };

export const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "New Arrivals", href: "/collections/new-arrivals" },
  {
    label: "Shop All",
    href: "/collections/shop-all",
    menu: [
      {
        title: "Shop by Style",
        links: [
          { label: "Minimalist", href: "/collections/minimalist" },
          { label: "Classic", href: "/collections/classic" },
          { label: "Modern", href: "/collections/modern" },
          { label: "Statement Jewelry", href: "/collections/statement-jewelry" },
          { label: "Everyday Elegance", href: "/collections/everyday-elegance" },
        ],
      },
      {
        title: "Browse",
        links: [
          { label: "All Pieces", href: "/collections/shop-all" },
          { label: "Best Sellers", href: "/collections/best-sellers" },
          { label: "New Arrivals", href: "/collections/new-arrivals" },
          { label: "Jewelry Sets", href: "/collections/jewelry-sets" },
          { label: "Watches", href: "/collections/watches" },
        ],
      },
    ],
  },
  {
    label: "Women",
    href: "/collections/women",
    menu: [
      {
        title: "Jewelry",
        links: [
          { label: "Necklaces", href: "/collections/necklaces" },
          { label: "Earrings", href: "/collections/earrings" },
          { label: "Rings", href: "/collections/rings" },
          { label: "Bracelets", href: "/collections/bracelets" },
        ],
      },
      {
        title: "More",
        links: [
          { label: "Bangles", href: "/collections/bangles" },
          { label: "Jewelry Sets", href: "/collections/jewelry-sets" },
          { label: "Watches", href: "/collections/watches" },
          { label: "Anklets", href: "/collections/anklets" },
        ],
      },
    ],
  },
  {
    label: "Men",
    href: "/collections/men",
    menu: [
      {
        title: "Jewelry",
        links: [
          { label: "Men's Rings", href: "/collections/mens-rings" },
          { label: "Men's Bracelets", href: "/collections/mens-bracelets" },
          { label: "Men's Chains", href: "/collections/mens-chains" },
        ],
      },
      {
        title: "More",
        links: [
          { label: "Men's Necklaces", href: "/collections/mens-necklaces" },
          { label: "Watches", href: "/collections/watches" },
          { label: "Men's Accessories", href: "/collections/mens-accessories" },
        ],
      },
    ],
  },
  {
    label: "Couple Collection",
    href: "/collections/couple",
    menu: [
      {
        title: "For Two",
        links: [
          { label: "Matching Bracelets", href: "/collections/matching-bracelets" },
          { label: "Couple Rings", href: "/collections/couple-rings" },
          { label: "Matching Necklaces", href: "/collections/matching-necklaces" },
        ],
      },
      {
        title: "More",
        links: [
          { label: "Couple Watches", href: "/collections/couple-watches" },
          { label: "Couple Gift Sets", href: "/collections/couple-gift-sets" },
        ],
      },
    ],
  },
  {
    label: "Gifts",
    href: "/collections/gifts",
    menu: [
      {
        title: "By Recipient",
        links: [
          { label: "Gifts for Her", href: "/collections/gifts-for-her" },
          { label: "Gifts for Him", href: "/collections/gifts-for-him" },
          { label: "Gift Sets", href: "/collections/gift-sets" },
        ],
      },
      {
        title: "By Occasion",
        links: [
          { label: "Anniversary Gifts", href: "/collections/anniversary-gifts" },
          { label: "Birthday Gifts", href: "/collections/birthday-gifts" },
          { label: "Valentine's Gifts", href: "/collections/valentines-gifts" },
        ],
      },
    ],
  },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

// ── Collections ──────────────────────────────────────────────────────────────

/** How a built-in collection selects its products. Admin-created collections
 *  use the productCollections join table instead. */
export type CollectionRule = {
  category?: string[];
  gender?: string[];
  style?: string[];
  tag?: "best" | "new" | "featured";
  all?: boolean;
};

export const COLLECTION_RULES: Record<string, CollectionRule> = {
  "shop-all": { all: true },
  "new-arrivals": { tag: "new" },
  "best-sellers": { tag: "best" },
  women: { gender: ["women"] },
  men: { gender: ["men"] },
  couple: { gender: ["unisex"] },
  necklaces: { category: ["necklaces"] },
  earrings: { category: ["earrings"] },
  rings: { category: ["rings"] },
  bracelets: { category: ["bracelets"] },
  bangles: { category: ["bangles"] },
  "jewelry-sets": { category: ["sets"] },
  watches: { category: ["watches"] },
  anklets: { category: ["anklets"] },
  "mens-rings": { category: ["rings"], gender: ["men"] },
  "mens-bracelets": { category: ["bracelets"], gender: ["men"] },
  "mens-chains": { category: ["chains"], gender: ["men"] },
  "mens-necklaces": { category: ["necklaces"], gender: ["men"] },
  "mens-accessories": { category: ["accessories"], gender: ["men"] },
  "matching-bracelets": { category: ["bracelets"], gender: ["unisex"] },
  "couple-rings": { category: ["rings"], gender: ["unisex"] },
  "matching-necklaces": { category: ["necklaces"], gender: ["unisex"] },
  "couple-watches": { category: ["watches"], gender: ["unisex"] },
  "couple-gift-sets": { category: ["sets"], gender: ["unisex"] },
  "gifts-for-her": { gender: ["women"] },
  "gifts-for-him": { gender: ["men"] },
  "anniversary-gifts": { category: ["sets"] },
  "birthday-gifts": { category: ["sets"] },
  "valentines-gifts": { gender: ["unisex"] },
  "gift-sets": { category: ["sets"] },
  minimalist: { style: ["minimalist"] },
  classic: { style: ["classic"] },
  modern: { style: ["modern"] },
  "statement-jewelry": { style: ["statement"] },
  "everyday-elegance": { style: ["everyday"] },
};

export type CollectionMeta = { name: string; description: string; heroImage: string; kind: string };

export const COLLECTION_META: Record<string, CollectionMeta> = {
  "shop-all": { name: "Shop All", description: "The complete Elite Paradise collection — every piece, in one place.", heroImage: EDITORIAL.hero, kind: "edit" },
  "new-arrivals": { name: "New Arrivals", description: "The latest additions to the house, released in small numbers.", heroImage: EDITORIAL.necklace, kind: "edit" },
  "best-sellers": { name: "Best Sellers", description: "The pieces our clients return to, season after season.", heroImage: EDITORIAL.set, kind: "edit" },
  women: { name: "Women", description: "Necklaces, earrings, rings and bracelets composed for everyday elegance.", heroImage: EDITORIAL.necklace, kind: "gender" },
  men: { name: "Men", description: "Considered pieces in brushed gold and steel, made to be worn daily.", heroImage: EDITORIAL.bracelet, kind: "gender" },
  couple: { name: "Couple Collection", description: "Two hearts, one story — matching pieces for the people who belong together.", heroImage: EDITORIAL.couple, kind: "couple" },
  necklaces: { name: "Necklaces", description: "Fine chains and pendants, from barely-there to quietly statement.", heroImage: EDITORIAL.necklace, kind: "category" },
  earrings: { name: "Earrings", description: "Studs, hoops and drops — each pair finished by hand.", heroImage: EDITORIAL.earrings, kind: "category" },
  rings: { name: "Rings", description: "Solitaires, signets and bands in gold vermeil and sterling silver.", heroImage: EDITORIAL.ring, kind: "category" },
  bracelets: { name: "Bracelets", description: "Chain, tennis and cuff bracelets for a considered wrist.", heroImage: EDITORIAL.bracelet, kind: "category" },
  bangles: { name: "Bangles", description: "Sculptural bangles in polished and hammered gold.", heroImage: EDITORIAL.bangles, kind: "category" },
  "jewelry-sets": { name: "Jewelry Sets", description: "Coordinated pieces, designed to be worn together.", heroImage: EDITORIAL.set, kind: "category" },
  watches: { name: "Watches", description: "Minimal dials and warm leather straps, quietly precise.", heroImage: EDITORIAL.ring, kind: "category" },
  anklets: { name: "Anklets", description: "Delicate chains for the ankle, finished with tiny charms.", heroImage: EDITORIAL.bracelet, kind: "category" },
  "mens-rings": { name: "Men's Rings", description: "Bands and signets with a matte, architectural finish.", heroImage: EDITORIAL.ring, kind: "category" },
  "mens-bracelets": { name: "Men's Bracelets", description: "Substantial links in brushed gold and steel.", heroImage: EDITORIAL.bracelet, kind: "category" },
  "mens-chains": { name: "Men's Chains", description: "Curb and flat links, weighted to sit properly.", heroImage: EDITORIAL.bracelet, kind: "category" },
  "mens-necklaces": { name: "Men's Necklaces", description: "Pendants and chains kept deliberately restrained.", heroImage: EDITORIAL.necklace, kind: "category" },
  "mens-accessories": { name: "Men's Accessories", description: "The finishing details — kept few, kept good.", heroImage: EDITORIAL.bracelet, kind: "category" },
  "matching-bracelets": { name: "Matching Bracelets", description: "A pair of chains, one for each wrist.", heroImage: EDITORIAL.couple, kind: "couple" },
  "couple-rings": { name: "Couple Rings", description: "Two bands, cut from the same intention.", heroImage: EDITORIAL.couple, kind: "couple" },
  "matching-necklaces": { name: "Matching Necklaces", description: "Two halves that sit close together.", heroImage: EDITORIAL.couple, kind: "couple" },
  "couple-watches": { name: "Couple Watches", description: "Matched dials, his and hers.", heroImage: EDITORIAL.couple, kind: "couple" },
  "couple-gift-sets": { name: "Couple Gift Sets", description: "Presented together, in one ivory box.", heroImage: EDITORIAL.couple, kind: "couple" },
  "gifts-for-her": { name: "Gifts for Her", description: "Pieces chosen to be worn the same evening.", heroImage: EDITORIAL.earrings, kind: "gift" },
  "gifts-for-him": { name: "Gifts for Him", description: "Considered, understated, and made to last.", heroImage: EDITORIAL.bracelet, kind: "gift" },
  "anniversary-gifts": { name: "Anniversary Gifts", description: "For the years that deserve something kept.", heroImage: EDITORIAL.set, kind: "gift" },
  "birthday-gifts": { name: "Birthday Gifts", description: "A small box, a long memory.", heroImage: EDITORIAL.set, kind: "gift" },
  "valentines-gifts": { name: "Valentine's Gifts", description: "Matching pieces for the fourteenth of February.", heroImage: EDITORIAL.couple, kind: "gift" },
  "gift-sets": { name: "Gift Sets", description: "Coordinated pieces in our signature ivory presentation box.", heroImage: EDITORIAL.set, kind: "gift" },
  minimalist: { name: "Minimalist", description: "Nothing extra. A single line, a single stone.", heroImage: EDITORIAL.ring, kind: "style" },
  classic: { name: "Classic", description: "Proportions that have never needed revising.", heroImage: EDITORIAL.necklace, kind: "style" },
  modern: { name: "Modern", description: "Clean geometry, softened at the edges.", heroImage: EDITORIAL.bangles, kind: "style" },
  "statement-jewelry": { name: "Statement Jewelry", description: "For the evenings that ask for more.", heroImage: EDITORIAL.bangles, kind: "style" },
  "everyday-elegance": { name: "Everyday Elegance", description: "Pieces light enough to forget you are wearing.", heroImage: EDITORIAL.bracelet, kind: "style" },
};

// ── Taxonomy ─────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { slug: "necklaces", label: "Necklaces" },
  { slug: "earrings", label: "Earrings" },
  { slug: "rings", label: "Rings" },
  { slug: "bracelets", label: "Bracelets" },
  { slug: "bangles", label: "Bangles" },
  { slug: "sets", label: "Jewelry Sets" },
  { slug: "watches", label: "Watches" },
  { slug: "anklets", label: "Anklets" },
  { slug: "chains", label: "Chains" },
  { slug: "accessories", label: "Accessories" },
] as const;

export const GENDERS = [
  { slug: "women", label: "Women" },
  { slug: "men", label: "Men" },
  { slug: "unisex", label: "Unisex" },
] as const;

export const STYLES = [
  { slug: "minimalist", label: "Minimalist" },
  { slug: "classic", label: "Classic" },
  { slug: "modern", label: "Modern" },
  { slug: "statement", label: "Statement" },
  { slug: "everyday", label: "Everyday" },
] as const;

export const MATERIALS = [
  "18k Gold Vermeil",
  "Sterling Silver",
  "Brass, Gold Plated",
  "Stainless Steel, Gold Plated",
  "Titanium, Gold Plated",
  "Freshwater Pearl",
] as const;

export const COLORS = ["Gold", "Pearl White", "Clear", "Black", "Ivory"] as const;

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "best-selling", label: "Best Selling" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ── Bangladesh delivery + payment ────────────────────────────────────────────

export const DISTRICTS = [
  "Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi", "Barishal", "Rangpur", "Mymensingh",
  "Cumilla", "Narayanganj", "Gazipur", "Bogura", "Jashore", "Cox's Bazar", "Dinajpur", "Pabna",
  "Noakhali", "Feni", "Tangail", "Kushtia", "Faridpur", "Jamalpur", "Sirajganj", "Brahmanbaria",
] as const;

export const PAYMENT_METHODS = [
  { value: "cod", label: "Cash on Delivery", note: "Pay the courier when your order arrives." },
  { value: "bkash", label: "bKash", note: "We will contact you with the merchant number to complete the transfer." },
  { value: "nagad", label: "Nagad", note: "We will contact you with the merchant number to complete the transfer." },
  { value: "card", label: "Card", note: "We will send a secure payment link once your order is confirmed." },
] as const;

export type PaymentValue = (typeof PAYMENT_METHODS)[number]["value"];

/** Delivery zones. Charges are configured in Admin → Website, never hardcoded. */
export const DELIVERY_ZONES = [
  { value: "inside_dhaka", label: "Inside Dhaka", hint: "1–2 business days" },
  { value: "outside_dhaka", label: "Outside Dhaka", hint: "2–4 business days" },
] as const;

export type DeliveryZone = (typeof DELIVERY_ZONES)[number]["value"];

/** Dhaka city + the districts that sit inside the metro delivery ring. */
export const DHAKA_ZONE_DISTRICTS = ["Dhaka", "Narayanganj", "Gazipur", "Savar"] as const;

/** A Bangladeshi mobile number: 01XXXXXXXXX, +8801XXXXXXXXX or 8801XXXXXXXXX. */
export function isValidBdPhone(raw: string): boolean {
  const digits = raw.replace(/[\s\-()]/g, "");
  return /^(?:\+?880|0)1[3-9]\d{8}$/.test(digits);
}

/** Normalises any accepted form to 01XXXXXXXXX so orders match on lookup. */
export function normalizeBdPhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("880")) return `0${digits.slice(3)}`;
  if (digits.startsWith("1") && digits.length === 10) return `0${digits}`;
  return digits;
}

/** Suggests the zone for a district, so the customer rarely has to think. */
export function zoneForDistrict(district: string): DeliveryZone {
  return (DHAKA_ZONE_DISTRICTS as readonly string[]).includes(district)
    ? "inside_dhaka"
    : "outside_dhaka";
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

/** The customer-visible progress ladder. Cancelled/returned are terminal and
 *  shown separately rather than as a step. */
export const TRACKING_STEPS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;

/** Payment state. No gateway is connected, so nothing here ever claims money
 *  was taken — an order is unpaid until a human marks it otherwise. */
export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded", "failed"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  refunded: "Refunded",
  failed: "Failed",
};

// ── Formatting helpers (shared so client and server agree) ───────────────────

export function formatTaka(amount: number): string {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

export function effectivePrice(p: { price: number; salePrice: number | null }): number {
  return p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
}

export function discountPercent(p: { price: number; salePrice: number | null }): number {
  if (p.salePrice == null || p.salePrice <= 0 || p.salePrice >= p.price) return 0;
  return Math.round(((p.price - p.salePrice) / p.price) * 100);
}

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
