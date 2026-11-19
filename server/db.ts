// ── Data access (MongoDB / Mongoose) ─────────────────────────────────────────
// All queries live here so routers stay thin. Money is integer taka.
// Every function returns plain objects with `id` (a UUID string), so the
// storefront and admin UI work exactly as they did on the old SQL backend.
import { randomUUID } from "node:crypto";
import { COLLECTION_RULES, effectivePrice, normalizeBdPhone, type SortValue } from "../shared/catalog";
import {
  ser,
  UserModel, ProductModel, CollectionModel, ProductCollectionModel, OrderModel,
  AddressModel, WishlistModel, ReviewModel, DiscountModel, SubscriberModel, SettingsModel,
  type Product, type Collection, type Order, type OrderItem, type Settings, type Address,
  type Review, type DiscountCode, type Subscriber, type User,
} from "./models";

export type { Product, Collection, Order, OrderItem, Settings };

/** Drop `undefined` keys so a partial update never overwrites with nothing. */
function clean<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

// ── Products ─────────────────────────────────────────────────────────────────

export type ProductFilter = {
  category?: string[];
  gender?: string[];
  material?: string[];
  color?: string[];
  style?: string[];
  collection?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  search?: string;
  sort?: SortValue;
  limit?: number;
  offset?: number;
};

type Tag = "best" | "new" | "featured";

/** Price a shopper actually pays: the sale price when set (non-zero), else price. */
const shownPrice = (p: { price: number; salePrice: number | null }) =>
  p.salePrice ? p.salePrice : p.price;

/** Mongo-side part of the filter (exact matches). */
function mongoFilter(f: ProductFilter, tag?: Tag) {
  const q: Record<string, unknown> = { isActive: true };
  if (f.category?.length) q.category = { $in: f.category };
  if (f.gender?.length) q.gender = { $in: f.gender };
  if (f.material?.length) q.material = { $in: f.material };
  if (f.color?.length) q.color = { $in: f.color };
  if (f.style?.length) q.style = { $in: f.style };
  if (f.inStockOnly) q.stock = { $gte: 1 };
  if (tag === "best") q.isBestSeller = true;
  if (tag === "new") q.isNewArrival = true;
  if (tag === "featured") q.isFeatured = true;
  return q;
}

function sortProducts(rows: Product[], sort: SortValue | undefined): Product[] {
  const t = (p: Product) => +new Date(p.createdAt);
  const out = [...rows];
  switch (sort) {
    case "newest":
      return out.sort((a, b) => t(b) - t(a) || b.sortOrder - a.sortOrder);
    case "price-asc":
      return out.sort((a, b) => shownPrice(a) - shownPrice(b));
    case "price-desc":
      return out.sort((a, b) => shownPrice(b) - shownPrice(a));
    case "best-selling":
      return out.sort(
        (a, b) =>
          Number(b.isBestSeller) - Number(a.isBestSeller) || b.sortOrder - a.sortOrder || t(b) - t(a),
      );
    default:
      return out.sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder || t(b) - t(a),
      );
  }
}

/** Mongo exact filters, then text search + price range in code (the catalogue of
 *  a jewellery shop is small, and this keeps search case-insensitive and simple). */
async function matchProducts(f: ProductFilter, tag?: Tag, extra: Record<string, unknown> = {}) {
  const docs = await ProductModel.find({ ...mongoFilter(f, tag), ...extra }).lean();
  let rows = docs.map((d) => ser<Product>(d));
  const term = f.search?.trim().toLowerCase();
  if (term) {
    rows = rows.filter((p) =>
      [p.name, p.description, p.category, p.material].some((v) => v?.toLowerCase().includes(term)),
    );
  }
  if (f.minPrice != null) rows = rows.filter((p) => shownPrice(p) >= f.minPrice!);
  if (f.maxPrice != null) rows = rows.filter((p) => shownPrice(p) <= f.maxPrice!);
  return sortProducts(rows, f.sort);
}

const page = <T>(rows: T[], f: ProductFilter) =>
  rows.slice(f.offset ?? 0, (f.offset ?? 0) + Math.min(f.limit ?? 60, 200));

export async function listProducts(f: ProductFilter = {}) {
  return page(await matchProducts(f), f);
}

export async function countProducts(f: ProductFilter = {}) {
  return (await matchProducts(f)).length;
}

export async function getProductBySlug(slug: string) {
  const d = await ProductModel.findOne({ slug }).lean();
  return d ? ser<Product>(d) : null;
}

export async function getProductById(id: string) {
  const d = await ProductModel.findById(id).lean();
  return d ? ser<Product>(d) : null;
}

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const docs = await ProductModel.find({ _id: { $in: ids } }).lean();
  return docs.map((d) => ser<Product>(d));
}

/** Resolve a collection slug to its products. Built-in collections use the
 *  rule table; admin-created ones use the join table. */
export async function listCollectionProducts(slug: string, f: ProductFilter = {}) {
  const rule = COLLECTION_RULES[slug];
  if (rule) {
    const merged: ProductFilter = { ...f };
    if (!rule.all) {
      if (rule.category) merged.category = rule.category;
      if (rule.gender) merged.gender = rule.gender;
      if (rule.style) merged.style = rule.style;
    }
    const all = await matchProducts(merged, rule.tag as Tag | undefined);
    return { products: page(all, f), total: all.length };
  }

  const col = await CollectionModel.findOne({ slug }).lean();
  if (!col) return { products: [], total: 0 };
  const links = await ProductCollectionModel.find({ collectionId: col._id as unknown as string }).lean();
  const ids = links.map((l) => l.productId);
  if (!ids.length) return { products: [], total: 0 };
  const rows = await matchProducts({ sort: f.sort }, undefined, { _id: { $in: ids } });
  return { products: rows, total: rows.length };
}

async function taggedList(tag: Tag, limit: number, order: "sort" | "newest") {
  const rows = await matchProducts({}, tag);
  const sorted =
    order === "newest"
      ? rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      : rows.sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.slice(0, limit);
}

export const listBestSellers = (limit = 12) => taggedList("best", limit, "sort");
export const listNewArrivals = (limit = 8) => taggedList("new", limit, "newest");
export const listFeatured = (limit = 6) => taggedList("featured", limit, "sort");

export async function listRelated(product: Product, limit = 4) {
  const docs = await ProductModel.find({
    isActive: true,
    category: product.category,
    _id: { $ne: product.id },
  }).lean();
  return docs
    .map((d) => ser<Product>(d))
    .sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller))
    .slice(0, limit);
}

/** Facet values actually present in the catalogue, so filters never offer a
 *  choice that returns nothing. */
export async function productFacets() {
  const rows = (await ProductModel.find({ isActive: true }).lean()).map((d) => ser<Product>(d));
  const uniq = (vals: (string | null)[]) =>
    [...new Set(vals.filter((v): v is string => !!v))].sort();
  const prices = rows.map(shownPrice);
  return {
    categories: uniq(rows.map((r) => r.category)),
    genders: uniq(rows.map((r) => r.gender)),
    materials: uniq(rows.map((r) => r.material)),
    colors: uniq(rows.map((r) => r.color)),
    styles: uniq(rows.map((r) => r.style)),
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
  };
}

// ── Admin product CRUD ───────────────────────────────────────────────────────

export type ProductInput = {
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  salePrice?: number | null;
  sku: string;
  category: string;
  gender: string;
  material?: string | null;
  color?: string | null;
  style?: string | null;
  sizes?: string[] | null;
  images?: string[] | null;
  stock: number;
  weight?: string | null;
  careInstructions?: string | null;
  isActive?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
};

export async function createProduct(input: ProductInput) {
  const doc = await ProductModel.create(clean(input));
  return ser<Product>(doc.toObject());
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const d = await ProductModel.findByIdAndUpdate(id, { $set: clean(input) }, { new: true, runValidators: true }).lean();
  return d ? ser<Product>(d) : null;
}

export async function deleteProduct(id: string) {
  await ProductModel.deleteOne({ _id: id });
  await ProductCollectionModel.deleteMany({ productId: id });
  return { ok: true };
}

export async function listAllProductsAdmin() {
  const docs = await ProductModel.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => ser<Product>(d));
}

// ── Collections ──────────────────────────────────────────────────────────────

export async function listCollections() {
  const docs = await CollectionModel.find({}).sort({ sortOrder: 1 }).lean();
  return docs.map((d) => ser<Collection>(d));
}

export async function getCollectionBySlug(slug: string) {
  const d = await CollectionModel.findOne({ slug }).lean();
  return d ? ser<Collection>(d) : null;
}

export async function createCollection(input: {
  slug: string; name: string; description?: string | null; heroImage?: string | null;
  kind?: string; sortOrder?: number;
}) {
  const doc = await CollectionModel.create(clean(input));
  return ser<Collection>(doc.toObject());
}

export async function updateCollection(id: string, input: Partial<{
  slug: string; name: string; description: string | null; heroImage: string | null; kind: string; sortOrder: number;
}>) {
  const d = await CollectionModel.findByIdAndUpdate(id, { $set: clean(input) }, { new: true }).lean();
  return d ? ser<Collection>(d) : null;
}

export async function deleteCollection(id: string) {
  await CollectionModel.deleteOne({ _id: id });
  await ProductCollectionModel.deleteMany({ collectionId: id });
  return { ok: true };
}

// ── Site settings ────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: Omit<Settings, "updatedAt"> = {
  id: "main",
  announcementBar: "Discover Timeless Elegance — Explore Elite Paradise",
  heroHeadline: "Elegance in Every Detail.",
  heroSubhead:
    "Discover exquisite jewelry and timeless accessories designed to make every moment extraordinary.",
  heroImage: null,
  brandStory:
    "At Elite Paradise, we believe jewelry is more than an accessory. It is an expression of individuality, elegance, and the moments that matter most. Every piece is selected to bring timeless beauty into your everyday life.",
  whatsappNumber: "8801700000000",
  instagram: "https://instagram.com/eliteparadise",
  facebook: "https://facebook.com/eliteparadise",
  contactEmail: "hello@eliteparadise.com",
  contactPhone: "+880 1700 000000",
  address: "House 12, Road 7, Gulshan 1, Dhaka 1212, Bangladesh",
  deliveryCharge: 120,
  deliveryChargeOutside: 200,
  freeDeliveryThreshold: 5000,
  orderPrefix: "EP",
  paymentMethods: ["cod", "bkash", "nagad", "card"],
  siteImages: {},
};

export async function getSettings(): Promise<Settings> {
  const d = await SettingsModel.findById("main").lean();
  // A fresh database must not take the storefront down: fall back to defaults.
  return d ? ser<Settings>(d) : { ...DEFAULT_SETTINGS, updatedAt: new Date() };
}

export async function updateSettings(input: Partial<Omit<Settings, "id" | "updatedAt">>) {
  const d = await SettingsModel.findByIdAndUpdate(
    "main",
    { $set: { ...clean(input), updatedAt: new Date() }, $setOnInsert: { _id: "main" } },
    { new: true, upsert: true },
  ).lean();
  return d ? ser<Settings>(d) : null;
}

/** Replace (url) or reset (null) one storefront picture. The key is checked by
 *  the caller against SITE_IMAGE_KEYS, so it is safe inside a dotted path. */
export async function setSiteImage(key: string, url: string | null) {
  const path = `siteImages.${key}`;
  const update = url
    ? { $set: { [path]: url, updatedAt: new Date() }, $setOnInsert: { _id: "main" } }
    : { $unset: { [path]: "" }, $set: { updatedAt: new Date() }, $setOnInsert: { _id: "main" } };
  const d = await SettingsModel.findByIdAndUpdate("main", update, { new: true, upsert: true }).lean();
  return d ? ser<Settings>(d) : null;
}

// ── Discount codes ───────────────────────────────────────────────────────────

export async function findDiscount(code: string) {
  const d = await DiscountModel.findOne({ code: code.trim().toUpperCase(), isActive: true }).lean();
  return d ? ser<DiscountCode>(d) : null;
}

export async function listDiscounts() {
  const docs = await DiscountModel.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => ser<DiscountCode>(d));
}

export async function createDiscount(input: {
  code: string; type: string; value: number; minSubtotal?: number; isActive?: boolean;
}) {
  const doc = await DiscountModel.create(clean({ ...input, code: input.code.trim().toUpperCase() }));
  return ser<DiscountCode>(doc.toObject());
}

export async function deleteDiscount(id: string) {
  await DiscountModel.deleteOne({ _id: id });
  return { ok: true };
}

// ── Orders ───────────────────────────────────────────────────────────────────

export type CartLine = { productId: string; qty: number; variant?: string | null };

export type CheckoutInput = {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  city: string;
  postalCode?: string | null;
  notes?: string | null;
  paymentMethod: string;
  deliveryZone?: string;
  discountCode?: string | null;
  lines: CartLine[];
  userId?: string | null;
};

/** Delivery charge for a zone, honouring the free-delivery threshold. */
export function deliveryForZone(
  settings: Settings,
  zone: string | undefined,
  amountAfterDiscount: number,
) {
  const charge =
    zone === "outside_dhaka"
      ? (settings.deliveryChargeOutside ?? 200)
      : (settings.deliveryCharge ?? 120);
  if (settings.freeDeliveryThreshold > 0 && amountAfterDiscount >= settings.freeDeliveryThreshold) {
    return 0;
  }
  return charge;
}

/** Next readable order number: EP-YYYYMMDD-NNNN. The unique index on
 *  orderNumber is the real guarantee; `bump` moves past a number a concurrent
 *  checkout just took. */
async function makeOrderNumber(prefix: string, bump = 0) {
  const now = new Date();
  const day = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const start = `${prefix}-${day}-`;
  const n = await OrderModel.countDocuments({
    orderNumber: { $regex: `^${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}` },
  });
  return `${start}${String(n + 1 + bump).padStart(4, "0")}`;
}

/**
 * Create an order. Prices, discounts and delivery are ALL recomputed here from
 * the database — the client's numbers are never trusted. Stock is reduced with
 * a guarded update (`stock >= qty`), so it can never go negative, even when two
 * customers buy the last piece at the same time. If any line fails, the lines
 * already reserved are put back.
 */
export async function createOrder(input: CheckoutInput) {
  if (!input.lines.length) throw new Error("EMPTY_CART");

  const ids = [...new Set(input.lines.map((l) => l.productId))];
  const rows = await getProductsByIds(ids);
  const byId = new Map(rows.map((r) => [r.id, r]));

  const priced = input.lines.map((line) => {
    const p = byId.get(line.productId);
    if (!p || !p.isActive) throw new Error("PRODUCT_UNAVAILABLE");
    const qty = Math.max(1, Math.min(Math.floor(line.qty), 99));
    if (p.stock < qty) throw new Error("INSUFFICIENT_STOCK");
    return { product: p, qty, unit: effectivePrice(p), variant: line.variant ?? null };
  });

  const subtotal = priced.reduce((sum, l) => sum + l.unit * l.qty, 0);

  let discount = 0;
  let appliedCode: string | null = null;
  if (input.discountCode) {
    const d = await findDiscount(input.discountCode);
    if (d && subtotal >= d.minSubtotal) {
      discount = d.type === "percent" ? Math.round((subtotal * d.value) / 100) : d.value;
      discount = Math.min(discount, subtotal);
      appliedCode = d.code;
    }
  }

  const settings = await getSettings();
  const afterDiscount = subtotal - discount;
  const deliveryCharge = deliveryForZone(settings, input.deliveryZone, afterDiscount);
  const total = afterDiscount + deliveryCharge;

  // Reserve stock first (guarded), roll back on any failure.
  const reserved: { id: string; qty: number }[] = [];
  const release = () =>
    Promise.all(reserved.map((r) => ProductModel.updateOne({ _id: r.id }, { $inc: { stock: r.qty } })));
  // Merge duplicate lines of the same product so the guard sees the true total.
  const perProduct = new Map<string, number>();
  for (const l of priced) perProduct.set(l.product.id, (perProduct.get(l.product.id) ?? 0) + l.qty);
  for (const [id, qty] of perProduct) {
    const res = await ProductModel.updateOne({ _id: id, stock: { $gte: qty } }, { $inc: { stock: -qty } });
    if (res.modifiedCount !== 1) {
      await release();
      throw new Error("INSUFFICIENT_STOCK");
    }
    reserved.push({ id, qty });
  }

  const orderId = randomUUID();
  const nowIso = new Date().toISOString();
  const prefix = settings.orderPrefix || "EP";
  try {
    for (let attempt = 0; ; attempt++) {
      const orderNumber = await makeOrderNumber(prefix, attempt);
      try {
        const doc = await OrderModel.create({
          _id: orderId,
          orderNumber,
          userId: input.userId ?? null,
          customerName: input.customerName,
          phone: input.phone,
          email: input.email.toLowerCase(),
          address: input.address,
          district: input.district,
          city: input.city,
          postalCode: input.postalCode ?? null,
          notes: input.notes ?? null,
          subtotal,
          discount,
          deliveryCharge,
          total,
          discountCode: appliedCode,
          paymentMethod: input.paymentMethod,
          // No payment gateway is connected: every order starts unpaid. Cash on
          // delivery is collected at the door; bKash/Nagad are settled by hand.
          paymentStatus: "unpaid",
          deliveryZone: input.deliveryZone ?? "inside_dhaka",
          statusHistory: [{ status: "pending", at: nowIso }],
          status: "pending",
          items: priced.map((l) => ({
            id: randomUUID(),
            orderId,
            productId: l.product.id,
            name: l.product.name,
            slug: l.product.slug,
            price: l.unit,
            qty: l.qty,
            variant: l.variant,
            image: l.product.images?.[0] ?? null,
          })),
        });
        const order = ser<Order & { items: OrderItem[] }>(doc.toObject());
        return { order, orderNumber };
      } catch (e) {
        const dup = (e as { code?: number }).code === 11000;
        if (!dup || attempt >= 5) throw e;
      }
    }
  } catch (e) {
    await release();
    throw e;
  }
}

export async function getOrderByNumber(orderNumber: string) {
  const d = await OrderModel.findOne({ orderNumber: orderNumber.trim().toUpperCase() }).lean();
  return d ? ser<Order & { items: OrderItem[] }>(d) : null;
}

/** Guest tracking: order number + the phone it was placed with. Either the
 *  local 01XXXXXXXXX form or +8801XXXXXXXXX is accepted; both sides are
 *  normalised, and a mismatch never reveals whether the order exists. */
export async function trackOrder(orderNumber: string, phone: string) {
  const row = await getOrderByNumber(orderNumber);
  if (!row || normalizeBdPhone(row.phone) !== normalizeBdPhone(phone)) return null;
  return row;
}

export async function listOrdersByUser(userId: string) {
  const docs = await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean();
  return docs.map((d) => ser<Order & { items: OrderItem[] }>(d));
}

export async function listAllOrders(f: { status?: string; search?: string } = {}) {
  const q: Record<string, unknown> = {};
  if (f.status && f.status !== "all") q.status = f.status;
  const docs = await OrderModel.find(q).sort({ createdAt: -1 }).lean();
  let rows = docs.map((d) => ser<Order & { items: OrderItem[] }>(d));
  const term = f.search?.trim().toLowerCase();
  if (term) {
    rows = rows.filter((o) =>
      [o.orderNumber, o.customerName, o.email, o.phone].some((v) => v.toLowerCase().includes(term)),
    );
  }
  return rows.slice(0, 300);
}

export async function getOrderById(id: string) {
  const d = await OrderModel.findById(id).lean();
  return d ? ser<Order & { items: OrderItem[] }>(d) : null;
}

export async function updateOrderStatus(
  id: string,
  status: string,
  extra?: { paymentStatus?: string; internalNotes?: string | null },
) {
  const current = await OrderModel.findById(id).lean();
  if (!current) return null;

  // Append to the status trail so the admin board can show when each step
  // happened. A repeated same-status save is not recorded twice.
  const history = current.statusHistory ?? [];
  const nextHistory =
    current.status === status ? history : [...history, { status, at: new Date().toISOString() }];

  const d = await OrderModel.findByIdAndUpdate(
    id,
    {
      $set: {
        status,
        statusHistory: nextHistory,
        updatedAt: new Date(),
        ...(extra?.paymentStatus ? { paymentStatus: extra.paymentStatus } : {}),
        ...(extra?.internalNotes !== undefined ? { internalNotes: extra.internalNotes } : {}),
      },
    },
    { new: true },
  ).lean();
  return d ? ser<Order & { items: OrderItem[] }>(d) : null;
}

// ── Admin overview ───────────────────────────────────────────────────────────

export async function adminOverview() {
  const allOrders = (await OrderModel.find({}).sort({ createdAt: -1 }).lean()).map((d) =>
    ser<Order & { items: OrderItem[] }>(d),
  );
  const revenue = allOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const pending = allOrders.filter((o) => ["pending", "confirmed", "processing"].includes(o.status)).length;
  const completed = allOrders.filter((o) => o.status === "delivered").length;

  const byProduct = new Map<string, { name: string; slug: string | null; qty: number; revenue: number }>();
  for (const o of allOrders) {
    for (const it of o.items) {
      const key = `${it.name}|${it.slug ?? ""}`;
      const cur = byProduct.get(key) ?? { name: it.name, slug: it.slug, qty: 0, revenue: 0 };
      cur.qty += it.qty;
      cur.revenue += it.qty * it.price;
      byProduct.set(key, cur);
    }
  }
  const bestSelling = [...byProduct.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  const [customers, productCount, lowStockDocs] = await Promise.all([
    UserModel.countDocuments({ role: "user" }),
    ProductModel.countDocuments({}),
    ProductModel.find({ isActive: true, stock: { $lte: 5 } }).sort({ stock: 1 }).limit(8).lean(),
  ]);

  return {
    revenue,
    orders: allOrders.length,
    pending,
    completed,
    customers,
    products: productCount,
    bestSelling,
    lowStock: lowStockDocs.map((d) => ser<Product>(d)),
    recentOrders: allOrders.slice(0, 6),
  };
}

// ── Customers ────────────────────────────────────────────────────────────────

export async function listCustomers() {
  const users = (await UserModel.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).limit(300).lean())
    .map((d) => ser<User>(d));
  const orderRows = await OrderModel.find({}, { userId: 1, email: 1, total: 1, status: 1, createdAt: 1 }).lean();

  return users.map((u) => {
    const mine = orderRows.filter(
      (o) => o.userId === u.id || o.email.toLowerCase() === u.email.toLowerCase(),
    );
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
      orderCount: mine.length,
      spend: mine.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0),
      lastOrder: mine.map((o) => o.createdAt).sort((a, b) => +new Date(b) - +new Date(a))[0] ?? null,
    };
  });
}

// ── Addresses ────────────────────────────────────────────────────────────────

export async function listAddresses(userId: string) {
  const docs = await AddressModel.find({ userId }).lean();
  return docs
    .map((d) => ser<Address>(d))
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function createAddress(userId: string, input: {
  label?: string | null; name: string; phone: string; address: string;
  district: string; city: string; postalCode?: string | null; isDefault?: boolean;
}) {
  if (input.isDefault) await AddressModel.updateMany({ userId }, { $set: { isDefault: false } });
  const doc = await AddressModel.create({ ...clean(input), userId });
  return ser<Address>(doc.toObject());
}

export async function deleteAddress(userId: string, id: string) {
  await AddressModel.deleteOne({ _id: id, userId });
  return { ok: true };
}

// ── Wishlist ─────────────────────────────────────────────────────────────────

export async function listWishlist(userId: string) {
  const rows = await WishlistModel.find({ userId }).sort({ createdAt: -1 }).lean();
  if (!rows.length) return [];
  const prods = await getProductsByIds(rows.map((r) => r.productId));
  const byId = new Map(prods.map((p) => [p.id, p]));
  return rows.map((r) => byId.get(r.productId)).filter((p): p is Product => !!p);
}

export async function toggleWishlist(userId: string, productId: string) {
  const existing = await WishlistModel.findOne({ userId, productId }).lean();
  if (existing) {
    await WishlistModel.deleteOne({ _id: existing._id });
    return { added: false };
  }
  try {
    await WishlistModel.create({ userId, productId });
  } catch (e) {
    if ((e as { code?: number }).code !== 11000) throw e; // already added by a parallel click
  }
  return { added: true };
}

export async function wishlistIds(userId: string) {
  const rows = await WishlistModel.find({ userId }).lean();
  return rows.map((r) => r.productId);
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export async function listReviews(productId: string) {
  const docs = await ReviewModel.find({ productId }).sort({ createdAt: -1 }).limit(50).lean();
  return docs.map((d) => ser<Review>(d));
}

export async function createReview(input: {
  productId: string; userId: string; name: string; rating: number; body: string;
}) {
  const doc = await ReviewModel.create(input);
  return ser<Review>(doc.toObject());
}

/** Real reviews only — the homepage shows these or an honest empty state. */
export async function listRecentReviews(limit = 8) {
  const docs = await ReviewModel.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  return docs.map((d) => ser<Review>(d));
}

// ── Newsletter ───────────────────────────────────────────────────────────────

export async function subscribeNewsletter(email: string) {
  const e = email.trim().toLowerCase();
  await SubscriberModel.updateOne(
    { email: e },
    { $setOnInsert: { _id: randomUUID(), email: e, createdAt: new Date() } },
    { upsert: true },
  );
  return { ok: true };
}

export async function listSubscribers() {
  const docs = await SubscriberModel.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => ser<Subscriber>(d));
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function updateProfile(userId: string, name: string | null) {
  const d = await UserModel.findByIdAndUpdate(userId, { $set: { name } }, { new: true }).lean();
  return d ? { id: d._id as unknown as string, email: d.email, name: d.name, role: d.role } : null;
}

export async function getUserById(id: string) {
  const d = await UserModel.findById(id).lean();
  return d ? ser<User>(d) : null;
}

export async function setPasswordHash(userId: string, hash: string) {
  await UserModel.updateOne({ _id: userId }, { $set: { passwordHash: hash } });
  return { ok: true };
}
