// ── AGENT-OWNED: tRPC API surface ────────────────────────────────────────────
// Thin procedures: validate with zod, delegate to server/db.ts.
// Access levels: publicProcedure / protectedProcedure / adminProcedure.
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "./_core/trpc";
import { authProvider, registerLocalUser, AuthError, EmailTakenError } from "./_core/auth";
import {
  storageCommit,
  storageDeleteOwned,
  storageListByOwner,
  storagePutUrl,
  StorageError,
} from "./_core/storage";
import { isUniqueViolation } from "./_core/db";
import { hash as bcryptHash, compare } from "bcryptjs";
import * as q from "./db";
import { ORDER_STATUSES, PAYMENT_METHODS, SITE_IMAGE_KEYS } from "../shared/catalog";

// ── Auth ─────────────────────────────────────────────────────────────────────

const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),

  signup: publicProcedure
    .input(z.object({ email: z.email(), password: z.string().min(8), name: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await registerLocalUser(input.email, input.password, input.name);
        await authProvider().login(ctx.c, input.email, input.password);
        return user;
      } catch (e: unknown) {
        if (e instanceof EmailTakenError) throw new TRPCError({ code: "CONFLICT", message: e.message });
        throw e;
      }
    }),

  login: publicProcedure
    .input(z.object({ email: z.email(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await authProvider().login(ctx.c, input.email, input.password);
      } catch (e) {
        if (e instanceof AuthError) throw new TRPCError({ code: "UNAUTHORIZED", message: e.message });
        throw e;
      }
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    await authProvider().logout(ctx.c);
    return { ok: true };
  }),

  /** Change password for the signed-in user. This is the ONLY password-reset
   *  path: the platform has no email capability, so there is no reset link. */
  changePassword: protectedProcedure
    .input(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const row = await q.getUserById(ctx.user.id);
      if (!row?.passwordHash) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This account has no password set." });
      }
      const ok = await compare(input.currentPassword, row.passwordHash);
      if (!ok) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect." });
      await q.setPasswordHash(ctx.user.id, await bcryptHash(input.newPassword, 10));
      return { ok: true };
    }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().max(120).nullable() }))
    .mutation(({ ctx, input }) => q.updateProfile(ctx.user.id, input.name)),
});

// ── Catalogue (public reads) ─────────────────────────────────────────────────

const filterSchema = z.object({
  category: z.array(z.string()).optional(),
  gender: z.array(z.string()).optional(),
  material: z.array(z.string()).optional(),
  color: z.array(z.string()).optional(),
  style: z.array(z.string()).optional(),
  minPrice: z.number().int().nonnegative().optional(),
  maxPrice: z.number().int().nonnegative().optional(),
  inStockOnly: z.boolean().optional(),
  search: z.string().max(120).optional(),
  sort: z.enum(["featured", "newest", "price-asc", "price-desc", "best-selling"]).optional(),
  limit: z.number().int().min(1).max(200).optional(),
  offset: z.number().int().min(0).optional(),
});

const catalogRouter = router({
  products: publicProcedure.input(filterSchema.optional()).query(({ input }) => q.listProducts(input ?? {})),

  productCount: publicProcedure.input(filterSchema.optional()).query(({ input }) => q.countProducts(input ?? {})),

  product: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      const p = await q.getProductBySlug(input.slug);
      if (!p || !p.isActive) throw new TRPCError({ code: "NOT_FOUND", message: "That piece is no longer available." });
      const [related, reviews] = await Promise.all([q.listRelated(p, 4), q.listReviews(p.id)]);
      return { product: p, related, reviews };
    }),

  productsByIds: publicProcedure
    .input(z.object({ ids: z.array(z.uuid()).max(60) }))
    .query(({ input }) => q.getProductsByIds(input.ids)),

  collection: publicProcedure
    .input(z.object({ slug: z.string().min(1) }).merge(filterSchema))
    .query(async ({ input }) => {
      const { slug, ...filters } = input;
      const [result, facets] = await Promise.all([
        q.listCollectionProducts(slug, filters),
        q.productFacets(),
      ]);
      return { ...result, facets };
    }),

  facets: publicProcedure.query(() => q.productFacets()),

  bestSellers: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(24).optional() }).optional())
    .query(({ input }) => q.listBestSellers(input?.limit ?? 12)),

  newArrivals: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(24).optional() }).optional())
    .query(({ input }) => q.listNewArrivals(input?.limit ?? 8)),

  featured: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(24).optional() }).optional())
    .query(({ input }) => q.listFeatured(input?.limit ?? 6)),

  collections: publicProcedure.query(() => q.listCollections()),

  settings: publicProcedure.query(() => q.getSettings()),

  recentReviews: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).optional() }).optional())
    .query(({ input }) => q.listRecentReviews(input?.limit ?? 8)),
});

// ── Cart / checkout ──────────────────────────────────────────────────────────

const cartLineSchema = z.object({
  productId: z.uuid(),
  qty: z.number().int().min(1).max(99),
  variant: z.string().max(120).nullable().optional(),
});

const checkoutRouter = router({
  /** Re-price a cart server-side. The client shows these numbers; the client's
   *  own arithmetic is never trusted at order time. */
  quote: publicProcedure
    .input(
      z.object({
        lines: z.array(cartLineSchema).max(50),
        discountCode: z.string().max(40).nullable().optional(),
        deliveryZone: z.enum(["inside_dhaka", "outside_dhaka"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const ids = [...new Set(input.lines.map((l) => l.productId))];
      const rows = await q.getProductsByIds(ids);
      const byId = new Map(rows.map((r) => [r.id, r]));
      const settings = await q.getSettings();

      const lines = input.lines.flatMap((l) => {
        const p = byId.get(l.productId);
        if (!p || !p.isActive) return [];
        const unit = p.salePrice && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
        return [{
          productId: p.id,
          slug: p.slug,
          name: p.name,
          image: p.images?.[0] ?? null,
          unit,
          qty: l.qty,
          variant: l.variant ?? null,
          stock: p.stock,
          lineTotal: unit * l.qty,
        }];
      });

      const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
      let discount = 0;
      let appliedCode: string | null = null;
      let discountError: string | null = null;
      if (input.discountCode) {
        const d = await q.findDiscount(input.discountCode);
        if (!d) discountError = "That code is not valid.";
        else if (subtotal < d.minSubtotal) {
          discountError = `That code needs a subtotal of at least ৳${d.minSubtotal.toLocaleString("en-US")}.`;
        } else {
          discount = d.type === "percent" ? Math.round((subtotal * d.value) / 100) : d.value;
          discount = Math.min(discount, subtotal);
          appliedCode = d.code;
        }
      }

      const afterDiscount = subtotal - discount;
      // Zone-aware: "outside_dhaka" costs more, and the free threshold still wins.
      const deliveryCharge = q.deliveryForZone(settings, input.deliveryZone, afterDiscount);

      return {
        lines,
        subtotal,
        discount,
        appliedCode,
        discountError,
        deliveryCharge,
        deliveryChargeInside: settings.deliveryCharge ?? 120,
        deliveryChargeOutside: settings.deliveryChargeOutside ?? 200,
        total: afterDiscount + deliveryCharge,
        freeDeliveryThreshold: settings.freeDeliveryThreshold,
        paymentMethods: settings.paymentMethods ?? ["cod", "bkash", "nagad", "card"],
      };
    }),

  create: publicProcedure
    .input(
      z.object({
        customerName: z.string().min(2).max(120),
        phone: z
          .string()
          .min(6)
          .max(30)
          .refine((v) => /^(?:\+?880|0)1[3-9]\d{8}$/.test(v.replace(/[\s\-()]/g, "")), {
            message: "Enter a Bangladeshi mobile number, e.g. 01712345678.",
          }),
        email: z.email(),
        address: z.string().min(5).max(400),
        district: z.string().min(1).max(80),
        city: z.string().min(1).max(80),
        postalCode: z.string().max(20).nullable().optional(),
        notes: z.string().max(600).nullable().optional(),
        paymentMethod: z.enum(PAYMENT_METHODS.map((p) => p.value) as [string, ...string[]]),
        deliveryZone: z.enum(["inside_dhaka", "outside_dhaka"]).optional(),
        discountCode: z.string().max(40).nullable().optional(),
        lines: z.array(cartLineSchema).min(1).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { order } = await q.createOrder({ ...input, userId: ctx.user?.id ?? null });
        return { orderNumber: order.orderNumber, total: order.total };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "EMPTY_CART") throw new TRPCError({ code: "BAD_REQUEST", message: "Your bag is empty." });
        if (msg === "PRODUCT_UNAVAILABLE") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "One of those pieces is no longer available. Please review your bag." });
        }
        if (msg === "INSUFFICIENT_STOCK") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "One of those pieces does not have enough stock left. Please reduce the quantity." });
        }
        throw e;
      }
    }),

  order: publicProcedure
    .input(z.object({ orderNumber: z.string().min(3).max(40) }))
    .query(async ({ input }) => {
      const o = await q.getOrderByNumber(input.orderNumber);
      if (!o) throw new TRPCError({ code: "NOT_FOUND", message: "We could not find that order." });
      return o;
    }),

  track: publicProcedure
    .input(z.object({ orderNumber: z.string().min(3).max(40), phone: z.string().min(6).max(30) }))
    .query(async ({ input }) => {
      const o = await q.trackOrder(input.orderNumber, input.phone);
      if (!o) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No order matches that number and phone. Check both and try again.",
        });
      }
      return o;
    }),

  myOrders: protectedProcedure.query(({ ctx }) => q.listOrdersByUser(ctx.user.id)),
});

// ── Account ──────────────────────────────────────────────────────────────────

const accountRouter = router({
  addresses: protectedProcedure.query(({ ctx }) => q.listAddresses(ctx.user.id)),

  addAddress: protectedProcedure
    .input(
      z.object({
        label: z.string().max(40).nullable().optional(),
        name: z.string().min(2).max(120),
        phone: z
          .string()
          .min(6)
          .max(30)
          .refine((v) => /^(?:\+?880|0)1[3-9]\d{8}$/.test(v.replace(/[\s\-()]/g, "")), {
            message: "Enter a Bangladeshi mobile number, e.g. 01712345678.",
          }),
        address: z.string().min(5).max(400),
        district: z.string().min(1).max(80),
        city: z.string().min(1).max(80),
        postalCode: z.string().max(20).nullable().optional(),
        isDefault: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) => q.createAddress(ctx.user.id, input)),

  removeAddress: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(({ ctx, input }) => q.deleteAddress(ctx.user.id, input.id)),

  wishlist: protectedProcedure.query(({ ctx }) => q.listWishlist(ctx.user.id)),

  wishlistIds: protectedProcedure.query(({ ctx }) => q.wishlistIds(ctx.user.id)),

  toggleWishlist: protectedProcedure
    .input(z.object({ productId: z.uuid() }))
    .mutation(({ ctx, input }) => q.toggleWishlist(ctx.user.id, input.productId)),

  addReview: protectedProcedure
    .input(z.object({ productId: z.uuid(), rating: z.number().int().min(1).max(5), body: z.string().min(4).max(1200) }))
    .mutation(({ ctx, input }) =>
      q.createReview({
        productId: input.productId,
        userId: ctx.user.id,
        name: ctx.user.name || ctx.user.email.split("@")[0],
        rating: input.rating,
        body: input.body,
      }),
    ),
});

// ── Newsletter ───────────────────────────────────────────────────────────────

const newsletterRouter = router({
  subscribe: publicProcedure
    .input(z.object({ email: z.email() }))
    .mutation(({ input }) => q.subscribeNewsletter(input.email)),
});

// ── Admin ────────────────────────────────────────────────────────────────────

const productInputSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only."),
  name: z.string().min(1).max(200),
  description: z.string().max(4000).nullable().optional(),
  price: z.number().int().min(0),
  salePrice: z.number().int().min(0).nullable().optional(),
  sku: z.string().min(1).max(60),
  category: z.string().min(1).max(40),
  gender: z.string().min(1).max(20),
  material: z.string().max(80).nullable().optional(),
  color: z.string().max(40).nullable().optional(),
  style: z.string().max(40).nullable().optional(),
  sizes: z.array(z.string().max(30)).max(20).nullable().optional(),
  images: z.array(z.string().max(600)).max(10).nullable().optional(),
  stock: z.number().int().min(0),
  weight: z.string().max(40).nullable().optional(),
  careInstructions: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const adminRouter = router({
  overview: adminProcedure.query(() => q.adminOverview()),

  products: adminProcedure.query(() => q.listAllProductsAdmin()),

  product: adminProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const p = await q.getProductById(input.id);
      if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
      return p;
    }),

  createProduct: adminProcedure.input(productInputSchema).mutation(async ({ input }) => {
    try {
      return await q.createProduct(input);
    } catch (e) {
      if (isUniqueViolation(e)) {
        throw new TRPCError({ code: "CONFLICT", message: "That slug or SKU is already used by another product." });
      }
      throw e;
    }
  }),

  updateProduct: adminProcedure
    .input(z.object({ id: z.uuid() }).merge(productInputSchema.partial()))
    .mutation(async ({ input }) => {
      const { id, ...rest } = input;
      try {
        const row = await q.updateProduct(id, rest);
        if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
        return row;
      } catch (e) {
        if (e instanceof TRPCError) throw e;
        if (isUniqueViolation(e)) {
          throw new TRPCError({ code: "CONFLICT", message: "That slug or SKU is already used by another product." });
        }
        throw e;
      }
    }),

  deleteProduct: adminProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(({ input }) => q.deleteProduct(input.id)),

  collections: adminProcedure.query(() => q.listCollections()),

  createCollection: adminProcedure
    .input(
      z.object({
        slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only."),
        name: z.string().min(1).max(160),
        description: z.string().max(1000).nullable().optional(),
        heroImage: z.string().max(600).nullable().optional(),
        kind: z.string().max(30).optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await q.createCollection(input);
      } catch (e) {
        if (isUniqueViolation(e)) {
          throw new TRPCError({ code: "CONFLICT", message: "A collection with that slug already exists." });
        }
        throw e;
      }
    }),

  updateCollection: adminProcedure
    .input(
      z.object({
        id: z.uuid(),
        slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/).optional(),
        name: z.string().min(1).max(160).optional(),
        description: z.string().max(1000).nullable().optional(),
        heroImage: z.string().max(600).nullable().optional(),
        kind: z.string().max(30).optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...rest } = input;
      try {
        const row = await q.updateCollection(id, rest);
        if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found." });
        return row;
      } catch (e) {
        if (e instanceof TRPCError) throw e;
        if (isUniqueViolation(e)) {
          throw new TRPCError({ code: "CONFLICT", message: "A collection with that slug already exists." });
        }
        throw e;
      }
    }),

  deleteCollection: adminProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(({ input }) => q.deleteCollection(input.id)),

  orders: adminProcedure
    .input(z.object({ status: z.string().optional(), search: z.string().max(120).optional() }).optional())
    .query(({ input }) => q.listAllOrders(input ?? {})),

  order: adminProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const o = await q.getOrderById(input.id);
      if (!o) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      return o;
    }),

  updateOrderStatus: adminProcedure
    .input(
      z.object({
        id: z.uuid(),
        status: z.enum(ORDER_STATUSES as unknown as [string, ...string[]]),
        paymentStatus: z.enum(["unpaid", "paid", "refunded", "failed"]).optional(),
        internalNotes: z.string().max(2000).nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const row = await q.updateOrderStatus(input.id, input.status, {
        paymentStatus: input.paymentStatus,
        internalNotes: input.internalNotes,
      });
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      return row;
    }),

  customers: adminProcedure.query(() => q.listCustomers()),

  settings: adminProcedure.query(() => q.getSettings()),

  // Replace (url) or reset to default (url = null) one storefront picture.
  setSiteImage: adminProcedure
    .input(
      z.object({
        key: z.string().max(60),
        url: z
          .string()
          .max(600)
          .regex(/^(\/|https:\/\/)/, "Use an uploaded picture or a https link.")
          .nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!SITE_IMAGE_KEYS.includes(input.key)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown picture slot." });
      }
      return q.setSiteImage(input.key, input.url);
    }),

  updateSettings: adminProcedure
    .input(
      z.object({
        announcementBar: z.string().max(300).nullable().optional(),
        heroHeadline: z.string().max(200).nullable().optional(),
        heroSubhead: z.string().max(600).nullable().optional(),
        heroImage: z.string().max(600).nullable().optional(),
        brandStory: z.string().max(2000).nullable().optional(),
        whatsappNumber: z.string().max(30).nullable().optional(),
        instagram: z.string().max(300).nullable().optional(),
        facebook: z.string().max(300).nullable().optional(),
        contactEmail: z.string().max(200).nullable().optional(),
        contactPhone: z.string().max(60).nullable().optional(),
        address: z.string().max(400).nullable().optional(),
        deliveryCharge: z.number().int().min(0).max(100000).optional(),
        deliveryChargeOutside: z.number().int().min(0).max(100000).optional(),
        freeDeliveryThreshold: z.number().int().min(0).max(1000000).optional(),
        orderPrefix: z.string().min(1).max(6).optional(),
        paymentMethods: z.array(z.string().max(20)).max(10).optional(),
      }),
    )
    .mutation(({ input }) => q.updateSettings(input)),

  discounts: adminProcedure.query(() => q.listDiscounts()),

  createDiscount: adminProcedure
    .input(
      z.object({
        code: z.string().min(2).max(40),
        type: z.enum(["percent", "fixed"]),
        value: z.number().int().min(1),
        minSubtotal: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await q.createDiscount(input);
      } catch (e) {
        if (isUniqueViolation(e)) {
          throw new TRPCError({ code: "CONFLICT", message: "That discount code already exists." });
        }
        throw e;
      }
    }),

  deleteDiscount: adminProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(({ input }) => q.deleteDiscount(input.id)),

  subscribers: adminProcedure.query(() => q.listSubscribers()),
});

// ── Files (admin image upload) ───────────────────────────────────────────────

export function sanitizeBasename(name: string): string {
  const last = name.split(/[/\\]/).pop() ?? "";
  const dot = last.lastIndexOf(".");
  const rawStem = dot > 0 ? last.slice(0, dot) : last;
  const rawExt = dot > 0 ? last.slice(dot + 1) : "";
  const stem = rawStem.replace(/[^A-Za-z0-9._-]/g, "").replace(/^\.+/, "") || "upload";
  const ext = rawExt.replace(/[^A-Za-z0-9]/g, "").slice(0, 10);
  return ext ? `${stem}.${ext}` : stem;
}

const filesRouter = router({
  uploadUrl: adminProcedure
    .input(z.object({ name: z.string().min(1), contentType: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const key = `${crypto.randomUUID()}-${sanitizeBasename(input.name)}`;
      try {
        const { uploadUrl, publicPath } = await storagePutUrl(key, input.contentType, {
          ownerId: ctx.user.id,
        });
        return { key, uploadUrl, publicPath };
      } catch (e) {
        if (e instanceof StorageError && e.code === "failed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "That image type is not accepted. Use PNG, JPEG, WebP or AVIF.",
          });
        }
        throw e;
      }
    }),

  commit: adminProcedure
    .input(z.object({ key: z.string().min(1), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await storageCommit(input.key, { ownerId: ctx.user.id, name: input.name });
      } catch (e) {
        if (e instanceof StorageError && e.code === "not_found") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Upload not found — did the upload finish?" });
        }
        if (e instanceof StorageError && e.code === "forbidden") {
          throw new TRPCError({ code: "FORBIDDEN", message: "That file belongs to another user." });
        }
        throw e;
      }
    }),

  list: adminProcedure.query(({ ctx }) => storageListByOwner(ctx.user.id)),

  remove: adminProcedure
    .input(z.object({ key: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await storageDeleteOwned(ctx.user.id, input.key);
      } catch (e) {
        if (e instanceof StorageError && e.code === "forbidden") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Malformed file key." });
        }
        throw e;
      }
    }),
});

export const appRouter = router({
  auth: authRouter,
  catalog: catalogRouter,
  checkout: checkoutRouter,
  account: accountRouter,
  newsletter: newsletterRouter,
  admin: adminRouter,
  files: filesRouter,
});

export type AppRouter = typeof appRouter;
