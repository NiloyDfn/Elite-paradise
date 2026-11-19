import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TRPCClientError } from "@trpc/client";
import { startTestServer, stopTestServer, makeClient } from "./test-utils";
import { UserModel } from "./models";
import { ensureAdmin } from "./_core/auth";

let base = "";
const guest = () => makeClient(base);

async function codeOf(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    if (e instanceof TRPCClientError) return e.data?.code ?? "UNKNOWN";
    throw e;
  }
  return "OK";
}

const ADDRESS = {
  customerName: "Rahim Uddin",
  phone: "01712345678",
  email: "rahim@example.com",
  address: "House 5, Road 3, Banani",
  district: "Dhaka",
  city: "Dhaka",
  paymentMethod: "cod",
} as const;

beforeAll(async () => {
  ({ base } = await startTestServer());
}, 120_000);
afterAll(async () => {
  await stopTestServer();
});

describe("health + catalogue", () => {
  it("reports a connected database", async () => {
    const res = await fetch(`${base}/api/health`);
    expect(await res.json()).toEqual({ ok: true, db: "connected" });
  });

  it("lists the 24 sample products with string ids", async () => {
    const { client } = guest();
    const rows = await client.catalog.products({ limit: 100 });
    expect(rows).toHaveLength(24);
    expect(typeof rows[0].id).toBe("string");
    expect(rows[0].createdAt).toBeInstanceOf(Date);
    expect(await client.catalog.productCount()).toBe(24);
  });

  it("filters by category, price range and stock; sorts by price", async () => {
    const { client } = guest();
    const neck = await client.catalog.products({ category: ["necklaces"] });
    expect(neck.length).toBeGreaterThan(0);
    expect(neck.every((p) => p.category === "necklaces")).toBe(true);

    const cheap = await client.catalog.products({ maxPrice: 5000, sort: "price-asc" });
    const shown = cheap.map((p) => p.salePrice || p.price);
    expect(shown.every((n) => n <= 5000)).toBe(true);
    expect([...shown].sort((a, b) => a - b)).toEqual(shown);

    const desc = await client.catalog.products({ sort: "price-desc" });
    const d = desc.map((p) => p.salePrice || p.price);
    expect([...d].sort((a, b) => b - a)).toEqual(d);
  });

  it("searches name/description case-insensitively", async () => {
    const { client } = guest();
    const rows = await client.catalog.products({ search: "PEARL" });
    expect(rows.length).toBeGreaterThan(0);
  });

  it("serves built-in collections and facets", async () => {
    const { client } = guest();
    const c = await client.catalog.collection({ slug: "rings" });
    expect(c.products.length).toBeGreaterThan(0);
    expect(c.products.every((p) => p.category === "rings")).toBe(true);
    expect(c.total).toBe(c.products.length);
    expect(c.facets.categories).toContain("rings");
    const unknown = await client.catalog.collection({ slug: "no-such-collection" });
    expect(unknown.products).toEqual([]);
  });

  it("returns a product page with related items, and 404 for unknown slugs", async () => {
    const { client } = guest();
    const page = await client.catalog.product({ slug: "aurelia-pearl-pendant-necklace" });
    expect(page.product.name).toMatch(/Aurelia/);
    expect(page.related.every((p) => p.category === page.product.category)).toBe(true);
    expect(await codeOf(client.catalog.product({ slug: "nope" }))).toBe("NOT_FOUND");
  });

  it("serves public settings and the home-page lists", async () => {
    const { client } = guest();
    const s = await client.catalog.settings();
    expect(s.orderPrefix).toBe("EP");
    expect((await client.catalog.bestSellers()).length).toBeGreaterThan(0);
    expect((await client.catalog.newArrivals()).length).toBeGreaterThan(0);
    expect((await client.catalog.featured()).length).toBeGreaterThan(0);
  });
});

describe("accounts", () => {
  it("signs up, stays logged in, logs out and back in", async () => {
    const b = guest();
    const u = await b.client.auth.signup({ email: "Asha@Example.com", password: "password123", name: "Asha" });
    expect(u.email).toBe("asha@example.com");
    expect(u.role).toBe("user");
    expect((await b.client.auth.me())?.email).toBe("asha@example.com");

    await b.client.auth.logout();
    expect(await b.client.auth.me()).toBeNull();

    const back = await b.client.auth.login({ email: "asha@example.com", password: "password123" });
    expect(back.name).toBe("Asha");
  });

  it("rejects a duplicate email with CONFLICT and a safe message", async () => {
    const b = guest();
    await b.client.auth.signup({ email: "dup@example.com", password: "password123" });
    const err = await guest().client.auth.signup({ email: "dup@example.com", password: "password123" }).catch((e) => e);
    expect(err.data.code).toBe("CONFLICT");
    expect(err.message).toMatch(/already registered/i);
    expect(err.message).not.toMatch(/E11000|\$2[aby]\$/);
  });

  it("rejects wrong passwords and short passwords", async () => {
    const b = guest();
    await b.client.auth.signup({ email: "pw@example.com", password: "password123" });
    expect(await codeOf(guest().client.auth.login({ email: "pw@example.com", password: "wrongwrong" }))).toBe("UNAUTHORIZED");
    expect(await codeOf(guest().client.auth.login({ email: "nobody@example.com", password: "whatever12" }))).toBe("UNAUTHORIZED");
    expect(await codeOf(guest().client.auth.signup({ email: "s@example.com", password: "short" }))).toBe("BAD_REQUEST");
  });

  it("changes the password", async () => {
    const b = guest();
    await b.client.auth.signup({ email: "chg@example.com", password: "oldpassword1" });
    expect(await codeOf(b.client.auth.changePassword({ currentPassword: "bad", newPassword: "newpassword1" }))).toBe("UNAUTHORIZED");
    await b.client.auth.changePassword({ currentPassword: "oldpassword1", newPassword: "newpassword1" });
    await guest().client.auth.login({ email: "chg@example.com", password: "newpassword1" });
  });

  it("protects account endpoints from visitors", async () => {
    expect(await codeOf(guest().client.account.addresses())).toBe("UNAUTHORIZED");
    expect(await codeOf(guest().client.checkout.myOrders())).toBe("UNAUTHORIZED");
  });

  it("saves addresses (one default), wishlist and reviews", async () => {
    const b = guest();
    await b.client.auth.signup({ email: "acct@example.com", password: "password123", name: "Nila" });
    const product = (await b.client.catalog.products({ limit: 1 }))[0];

    const a1 = await b.client.account.addAddress({ name: "Nila", phone: "01812345678", address: "Road 1, Uttara", district: "Dhaka", city: "Dhaka", isDefault: true });
    await b.client.account.addAddress({ name: "Nila", phone: "01812345678", address: "Road 2, Mirpur", district: "Dhaka", city: "Dhaka", isDefault: true });
    const list = await b.client.account.addresses();
    expect(list.filter((a) => a.isDefault)).toHaveLength(1);
    await b.client.account.removeAddress({ id: a1.id });
    expect(await b.client.account.addresses()).toHaveLength(1);

    expect((await b.client.account.toggleWishlist({ productId: product.id })).added).toBe(true);
    expect(await b.client.account.wishlistIds()).toEqual([product.id]);
    expect((await b.client.account.wishlist())[0].id).toBe(product.id);
    expect((await b.client.account.toggleWishlist({ productId: product.id })).added).toBe(false);

    await b.client.account.addReview({ productId: product.id, rating: 5, body: "Beautiful piece." });
    const page = await b.client.catalog.product({ slug: product.slug });
    expect(page.reviews[0].name).toBe("Nila");
    expect((await b.client.catalog.recentReviews()).length).toBe(1);
  });

  it("accepts a newsletter signup twice without error", async () => {
    const { client } = guest();
    await client.newsletter.subscribe({ email: "News@Example.com" });
    await client.newsletter.subscribe({ email: "news@example.com" });
  });
});

describe("checkout", () => {
  it("quotes with server prices, discount and zone-aware delivery", async () => {
    const { client } = guest();
    const [p] = await client.catalog.products({ sort: "price-asc", limit: 1 });
    const unit = p.salePrice || p.price;
    const q = await client.checkout.quote({
      lines: [{ productId: p.id, qty: 2 }],
      discountCode: "elite10",
      deliveryZone: "outside_dhaka",
    });
    expect(q.subtotal).toBe(unit * 2);
    expect(q.discount).toBe(Math.round((unit * 2 * 10) / 100));
    expect(q.appliedCode).toBe("ELITE10");
    expect(q.deliveryCharge).toBe(200);
    expect(q.total).toBe(q.subtotal - q.discount + 200);

    const bad = await client.checkout.quote({ lines: [{ productId: p.id, qty: 1 }], discountCode: "NOPE" });
    expect(bad.discountError).toMatch(/not valid/);
  });

  it("places an order, numbers it, reduces stock, and can be tracked by phone", async () => {
    const b = guest();
    const [p] = await b.client.catalog.products({ maxPrice: 4000, limit: 1 });
    const before = (await b.client.catalog.product({ slug: p.slug })).product.stock;

    const placed = await b.client.checkout.create({ ...ADDRESS, lines: [{ productId: p.id, qty: 2 }] });
    expect(placed.orderNumber).toMatch(/^EP-\d{8}-\d{4}$/);
    const sub = (p.salePrice || p.price) * 2;
    expect(placed.total).toBe(sub + (sub >= 5000 ? 0 : 120));

    const after = (await b.client.catalog.product({ slug: p.slug })).product.stock;
    expect(after).toBe(before - 2);

    const order = await b.client.checkout.order({ orderNumber: placed.orderNumber.toLowerCase() });
    expect(order.items).toHaveLength(1);
    expect(order.items[0].qty).toBe(2);
    expect(order.paymentStatus).toBe("unpaid");
    expect(order.statusHistory?.[0].status).toBe("pending");

    const tracked = await b.client.checkout.track({ orderNumber: placed.orderNumber, phone: "+8801712345678" });
    expect(tracked.id).toBe(order.id);
    expect(await codeOf(b.client.checkout.track({ orderNumber: placed.orderNumber, phone: "01999999999" }))).toBe("NOT_FOUND");

    const second = await b.client.checkout.create({ ...ADDRESS, lines: [{ productId: p.id, qty: 1 }] });
    expect(second.orderNumber).not.toBe(placed.orderNumber);
  });

  it("applies free delivery over the threshold and rejects bad input", async () => {
    const { client } = guest();
    const [p] = await client.catalog.products({ sort: "price-desc", limit: 1 });
    const q = await client.checkout.quote({ lines: [{ productId: p.id, qty: 1 }] });
    expect(q.deliveryCharge).toBe(0);
    expect(await codeOf(client.checkout.create({ ...ADDRESS, phone: "12345", lines: [{ productId: p.id, qty: 1 }] }))).toBe("BAD_REQUEST");
    expect(await codeOf(client.checkout.create({ ...ADDRESS, lines: [] }))).toBe("BAD_REQUEST");
  });

  it("refuses to oversell, and never lets two buyers take the last piece", async () => {
    const admin = await adminClient();
    const created = await admin.client.admin.createProduct({
      slug: "last-piece", name: "Last Piece", price: 1000, sku: "T-LAST", category: "rings", gender: "women", stock: 1,
    });
    const a = guest(), c = guest();
    const results = await Promise.allSettled([
      a.client.checkout.create({ ...ADDRESS, lines: [{ productId: created.id, qty: 1 }] }),
      c.client.checkout.create({ ...ADDRESS, lines: [{ productId: created.id, qty: 1 }] }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const lost = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(lost.reason.data.code).toBe("BAD_REQUEST");
    expect(lost.reason.message).toMatch(/stock/i);
    expect((await admin.client.admin.product({ id: created.id })).stock).toBe(0);
  });

  it("links orders to a logged-in customer", async () => {
    const b = guest();
    await b.client.auth.signup({ email: "buyer@example.com", password: "password123" });
    const [p] = await b.client.catalog.products({ limit: 1 });
    await b.client.checkout.create({ ...ADDRESS, lines: [{ productId: p.id, qty: 1 }] });
    const mine = await b.client.checkout.myOrders();
    expect(mine).toHaveLength(1);
    expect(mine[0].items).toHaveLength(1);
  });
});

async function adminClient() {
  process.env.ADMIN_EMAIL = "boss@example.com";
  const email = "boss@example.com";
  const b = guest();
  try {
    await b.client.auth.signup({ email, password: "bosspassword1", name: "Boss" });
  } catch {
    /* already exists from an earlier call */
  }
  await UserModel.updateOne({ email }, { $set: { role: "admin" } });
  await b.client.auth.login({ email, password: "bosspassword1" });
  return b;
}

describe("admin", () => {
  it("blocks visitors and ordinary customers", async () => {
    expect(await codeOf(guest().client.admin.overview())).toBe("UNAUTHORIZED");
    const c = guest();
    await c.client.auth.signup({ email: "plain@example.com", password: "password123" });
    expect(await codeOf(c.client.admin.overview())).toBe("FORBIDDEN");
    expect(await codeOf(c.client.admin.deleteProduct({ id: crypto.randomUUID() }))).toBe("FORBIDDEN");
  });

  it("lets only admins change or reset storefront pictures", async () => {
    expect(await codeOf(guest().client.admin.setSiteImage({ key: "logo", url: "/app-storage/x.png" }))).toBe("UNAUTHORIZED");
    const a = await adminClient();
    expect(await codeOf(a.client.admin.setSiteImage({ key: "no-such-slot", url: "/app-storage/x.png" }))).toBe("BAD_REQUEST");
    expect(await codeOf(a.client.admin.setSiteImage({ key: "logo", url: "javascript:alert(1)" }))).toBe("BAD_REQUEST");
    await a.client.admin.setSiteImage({ key: "logo", url: "/app-storage/new-logo.png" });
    await a.client.admin.setSiteImage({ key: "home-banner", url: "/app-storage/new-banner.jpg" });
    let pub = await guest().client.catalog.settings();
    expect(pub.siteImages).toMatchObject({ logo: "/app-storage/new-logo.png", "home-banner": "/app-storage/new-banner.jpg" });
    await a.client.admin.setSiteImage({ key: "logo", url: null });
    pub = await guest().client.catalog.settings();
    expect(pub.siteImages?.logo).toBeUndefined();
    expect(pub.siteImages?.["home-banner"]).toBe("/app-storage/new-banner.jpg");
  });

  it("shows the dashboard overview", async () => {
    const a = await adminClient();
    const o = await a.client.admin.overview();
    expect(o.products).toBeGreaterThanOrEqual(24);
    expect(o.orders).toBeGreaterThan(0);
    expect(o.revenue).toBeGreaterThan(0);
    expect(o.bestSelling.length).toBeGreaterThan(0);
    expect(o.recentOrders.length).toBeGreaterThan(0);
    expect(typeof o.lowStock[0]?.id).toBe("string");
  });

  it("creates, edits, hides and deletes a product; duplicate slug/SKU → CONFLICT", async () => {
    const a = await adminClient();
    const input = { slug: "test-ring", name: "Test Ring", price: 2500, sku: "T-RING-1", category: "rings", gender: "women", stock: 5 };
    const p = await a.client.admin.createProduct(input);
    expect(await codeOf(a.client.admin.createProduct({ ...input, sku: "OTHER" }))).toBe("CONFLICT");
    expect(await codeOf(a.client.admin.createProduct({ ...input, slug: "other-slug" }))).toBe("CONFLICT");

    const edited = await a.client.admin.updateProduct({ id: p.id, price: 2800, salePrice: 2400 });
    expect(edited.price).toBe(2800);
    expect(edited.name).toBe("Test Ring"); // untouched fields survive

    await a.client.admin.updateProduct({ id: p.id, isActive: false });
    expect(await codeOf(guest().client.catalog.product({ slug: "test-ring" }))).toBe("NOT_FOUND");

    await a.client.admin.deleteProduct({ id: p.id });
    expect(await codeOf(a.client.admin.product({ id: p.id }))).toBe("NOT_FOUND");
  });

  it("manages orders: status trail, payment status, notes, search", async () => {
    const a = await adminClient();
    const orders = await a.client.admin.orders();
    const o = orders[0];
    const updated = await a.client.admin.updateOrderStatus({ id: o.id, status: "confirmed", paymentStatus: "paid", internalNotes: "Called customer" });
    expect(updated.status).toBe("confirmed");
    expect(updated.paymentStatus).toBe("paid");
    expect(updated.statusHistory?.map((h) => h.status)).toEqual(["pending", "confirmed"]);
    await a.client.admin.updateOrderStatus({ id: o.id, status: "confirmed" });
    expect((await a.client.admin.order({ id: o.id })).statusHistory).toHaveLength(2);

    const found = await a.client.admin.orders({ search: o.customerName.slice(0, 4) });
    expect(found.some((x) => x.id === o.id)).toBe(true);
    const onlyConfirmed = await a.client.admin.orders({ status: "confirmed" });
    expect(onlyConfirmed.every((x) => x.status === "confirmed")).toBe(true);
  });

  it("manages collections, discounts, settings; lists customers and subscribers", async () => {
    const a = await adminClient();
    const col = await a.client.admin.createCollection({ slug: "eid-edit", name: "Eid Edit" });
    expect(await codeOf(a.client.admin.createCollection({ slug: "eid-edit", name: "Again" }))).toBe("CONFLICT");
    await a.client.admin.updateCollection({ id: col.id, name: "Eid Special" });
    expect((await a.client.admin.collections()).find((c) => c.id === col.id)?.name).toBe("Eid Special");
    await a.client.admin.deleteCollection({ id: col.id });

    const d = await a.client.admin.createDiscount({ code: " eid20 ", type: "percent", value: 20, minSubtotal: 1000 });
    expect(d.code).toBe("EID20");
    expect(await codeOf(a.client.admin.createDiscount({ code: "EID20", type: "fixed", value: 5 }))).toBe("CONFLICT");
    await a.client.admin.deleteDiscount({ id: d.id });
    expect((await a.client.admin.discounts()).some((x) => x.code === "EID20")).toBe(false);

    const s = await a.client.admin.updateSettings({ announcementBar: "Eid sale", deliveryCharge: 99 });
    expect(s?.announcementBar).toBe("Eid sale");
    expect((await guest().client.catalog.settings()).deliveryCharge).toBe(99);
    await a.client.admin.updateSettings({ deliveryCharge: 120 });

    const customers = await a.client.admin.customers();
    expect(customers.some((c) => c.email === "buyer@example.com" && c.orderCount === 1)).toBe(true);
    expect(customers.every((c) => !("passwordHash" in c))).toBe(true);
    expect((await a.client.admin.subscribers()).some((x) => x.email === "news@example.com")).toBe(true);
  });
});

describe("image upload (stored in MongoDB)", () => {
  // 1×1 transparent PNG
  const PNG = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64",
  );

  it("uploads, commits, serves and deletes an image", async () => {
    const a = await adminClient();
    const signed = await a.client.files.uploadUrl({ name: "My Ring (1).png", contentType: "image/png" });
    expect(signed.key).toMatch(/^[0-9a-f-]{36}-MyRing1\.png$/);
    expect(signed.uploadUrl).toBe(`/api/upload/${signed.key}`);

    const put = await a.fetch(`${base}${signed.uploadUrl}`, { method: "PUT", headers: { "content-type": "image/png" }, body: PNG });
    expect(put.status).toBe(200);
    const file = await a.client.files.commit({ key: signed.key, name: "My Ring (1).png" });
    expect(file.size).toBe(PNG.length);
    expect(file.name).toBe("My Ring (1).png");

    const get = await fetch(`${base}${signed.publicPath}`);
    expect(get.status).toBe(200);
    expect(get.headers.get("content-type")).toBe("image/png");
    expect(get.headers.get("cache-control")).toMatch(/immutable/);
    expect(Buffer.from(await get.arrayBuffer()).equals(PNG)).toBe(true);

    expect((await a.client.files.list()).some((f) => f.key === signed.key)).toBe(true);
    await a.client.files.remove({ key: signed.key });
    expect((await fetch(`${base}${signed.publicPath}`)).status).toBe(404);
  });

  it("only lets admins upload, and only images", async () => {
    const a = await adminClient();
    const signed = await a.client.files.uploadUrl({ name: "x.png", contentType: "image/png" });
    const anon = await fetch(`${base}${signed.uploadUrl}`, { method: "PUT", headers: { "content-type": "image/png" }, body: PNG });
    expect(anon.status).toBe(401);

    const user = guest();
    await user.client.auth.signup({ email: "u2@example.com", password: "password123" });
    const asUser = await user.fetch(`${base}${signed.uploadUrl}`, { method: "PUT", headers: { "content-type": "image/png" }, body: PNG });
    expect(asUser.status).toBe(403);

    const html = await a.fetch(`${base}${signed.uploadUrl}`, { method: "PUT", headers: { "content-type": "text/html" }, body: "<script>1</script>" });
    expect(html.status).toBe(400);
    expect(await codeOf(a.client.files.uploadUrl({ name: "x.svg", contentType: "image/svg+xml" }))).toBe("BAD_REQUEST");
    expect(await codeOf(a.client.files.commit({ key: "00000000-0000-4000-8000-000000000000-none.png", name: "n" }))).toBe("NOT_FOUND");
    expect((await fetch(`${base}/app-storage/..%2Fetc%2Fpasswd`)).status).toBe(404);
    expect(await codeOf(guest().client.files.list())).toBe("UNAUTHORIZED");
  });
});

describe("admin bootstrap", () => {
  it("creates the owner account from ADMIN_EMAIL/ADMIN_PASSWORD, then promotes on later runs", async () => {
    // env is read at call time, so set it here
    const env = (await import("./_core/env")).env as { adminEmail: string; adminPassword: string };
    env.adminEmail = "owner@shop.test";
    env.adminPassword = "OwnerPass123";
    expect(await ensureAdmin()).toBe("created");
    expect(await ensureAdmin()).toBe("already");
    const b = guest();
    expect((await b.client.auth.login({ email: "owner@shop.test", password: "OwnerPass123" })).role).toBe("admin");
    await UserModel.updateOne({ email: "owner@shop.test" }, { $set: { role: "user" } });
    expect(await ensureAdmin()).toBe("promoted");
    env.adminEmail = "";
    expect(await ensureAdmin()).toBe("skipped");
  });
});
