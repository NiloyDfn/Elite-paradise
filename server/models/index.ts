// Mongoose models. Every document uses a UUID string as `_id`, and the API
// exposes it as `id`, so the React app and tRPC contract are unchanged from the
// original Postgres version. Money is integer taka (BDT).
import mongoose, { Schema, type Model } from "mongoose";
import { randomUUID } from "node:crypto";

const uuid = { type: String, default: () => randomUUID() };

function model<T>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T>) ?? mongoose.model<T>(name, schema);
}

// ── Plain shapes (what the API returns) ─────────────────────────────────────

export interface User {
  id: string; email: string; passwordHash: string | null; name: string | null;
  role: string; createdAt: Date;
}
export interface StoredFile {
  id: string; key: string; ownerId: string | null; name: string; size: number;
  contentType: string | null; createdAt: Date; data?: Buffer;
}
export interface Product {
  id: string; slug: string; name: string; description: string | null;
  price: number; salePrice: number | null; sku: string; category: string; gender: string;
  material: string | null; color: string | null; style: string | null;
  sizes: string[] | null; images: string[] | null; stock: number; weight: string | null;
  careInstructions: string | null; isActive: boolean; isBestSeller: boolean;
  isNewArrival: boolean; isFeatured: boolean; isSample: boolean; sortOrder: number;
  createdAt: Date;
}
export interface Collection {
  id: string; slug: string; name: string; description: string | null;
  heroImage: string | null; kind: string; sortOrder: number; createdAt: Date;
}
export interface OrderItem {
  id: string; orderId: string; productId: string | null; name: string; slug: string | null;
  price: number; qty: number; variant: string | null; image: string | null;
}
export interface Order {
  id: string; orderNumber: string; userId: string | null; customerName: string;
  phone: string; email: string; address: string; district: string; city: string;
  postalCode: string | null; notes: string | null; subtotal: number; discount: number;
  deliveryCharge: number; total: number; discountCode: string | null;
  paymentMethod: string; paymentStatus: string; deliveryZone: string;
  internalNotes: string | null; statusHistory: { status: string; at: string }[] | null;
  status: string; createdAt: Date; updatedAt: Date;
}
export interface Address {
  id: string; userId: string; label: string | null; name: string; phone: string;
  address: string; district: string; city: string; postalCode: string | null;
  isDefault: boolean; createdAt: Date;
}
export interface Review {
  id: string; productId: string; userId: string | null; name: string; rating: number;
  body: string; createdAt: Date;
}
export interface DiscountCode {
  id: string; code: string; type: string; value: number; minSubtotal: number;
  isActive: boolean; createdAt: Date;
}
export interface Subscriber { id: string; email: string; createdAt: Date }
export interface Settings {
  id: string; announcementBar: string | null; heroHeadline: string | null;
  heroSubhead: string | null; heroImage: string | null; brandStory: string | null;
  whatsappNumber: string | null; instagram: string | null; facebook: string | null;
  contactEmail: string | null; contactPhone: string | null; address: string | null;
  deliveryCharge: number; deliveryChargeOutside: number; freeDeliveryThreshold: number;
  orderPrefix: string; paymentMethods: string[] | null; siteImages: Record<string, string> | null; updatedAt: Date;
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const UserModel = model<User>("User", new Schema({
  _id: uuid,
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: null },
  name: { type: String, default: null },
  role: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now },
}));

// Uploaded images live in MongoDB (no S3 needed). `data` is never sent through
// tRPC; it is only read by GET /app-storage/:key.
const FileModel = model<StoredFile>("File", new Schema({
  _id: uuid,
  key: { type: String, required: true, unique: true },
  ownerId: { type: String, default: null, index: true },
  name: { type: String, required: true },
  size: { type: Number, default: 0 },
  contentType: { type: String, default: null },
  data: { type: Buffer, select: false },
  createdAt: { type: Date, default: Date.now },
}));

const ProductModel = model<Product>("Product", new Schema({
  _id: uuid,
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  price: { type: Number, required: true },
  salePrice: { type: Number, default: null },
  sku: { type: String, required: true, unique: true },
  category: { type: String, required: true, index: true },
  gender: { type: String, default: "women" },
  material: { type: String, default: null },
  color: { type: String, default: null },
  style: { type: String, default: null },
  sizes: { type: [String], default: null },
  images: { type: [String], default: null },
  stock: { type: Number, default: 0 },
  weight: { type: String, default: null },
  careInstructions: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  isBestSeller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isSample: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, { minimize: false }));

const CollectionModel = model<Collection>("Collection", new Schema({
  _id: uuid,
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  heroImage: { type: String, default: null },
  kind: { type: String, default: "category" },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}));

const ProductCollectionModel = model<{ id: string; productId: string; collectionId: string }>(
  "ProductCollection",
  new Schema({
    _id: uuid,
    productId: { type: String, required: true },
    collectionId: { type: String, required: true, index: true },
  }),
);

const OrderModel = model<Order & { items: OrderItem[] }>("Order", new Schema({
  _id: uuid,
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: String, default: null, index: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  district: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, default: null },
  notes: { type: String, default: null },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  total: { type: Number, required: true },
  discountCode: { type: String, default: null },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, default: "unpaid" },
  deliveryZone: { type: String, default: "inside_dhaka" },
  internalNotes: { type: String, default: null },
  statusHistory: { type: [{ _id: false, status: String, at: String }], default: null },
  status: { type: String, default: "pending", index: true },
  items: {
    type: [{
      _id: false,
      id: { type: String, default: () => randomUUID() },
      orderId: String,
      productId: { type: String, default: null },
      name: String,
      slug: { type: String, default: null },
      price: Number,
      qty: Number,
      variant: { type: String, default: null },
      image: { type: String, default: null },
    }],
    default: [],
  },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
}));

const AddressModel = model<Address>("Address", new Schema({
  _id: uuid,
  userId: { type: String, required: true, index: true },
  label: { type: String, default: null },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  district: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, default: null },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}));

const WishlistModel = model<{ id: string; userId: string; productId: string; createdAt: Date }>(
  "Wishlist",
  (() => {
    const s = new Schema({
      _id: uuid,
      userId: { type: String, required: true },
      productId: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    });
    s.index({ userId: 1, productId: 1 }, { unique: true });
    return s;
  })(),
);

const ReviewModel = model<Review>("Review", new Schema({
  _id: uuid,
  productId: { type: String, required: true, index: true },
  userId: { type: String, default: null },
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}));

const DiscountModel = model<DiscountCode>("DiscountCode", new Schema({
  _id: uuid,
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, default: "percent" },
  value: { type: Number, required: true },
  minSubtotal: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}));

const SubscriberModel = model<Subscriber>("NewsletterSubscriber", new Schema({
  _id: uuid,
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now },
}));

const SettingsModel = model<Settings>("SiteSettings", new Schema({
  _id: { type: String, default: "main" },
  announcementBar: { type: String, default: null },
  heroHeadline: { type: String, default: null },
  heroSubhead: { type: String, default: null },
  heroImage: { type: String, default: null },
  brandStory: { type: String, default: null },
  whatsappNumber: { type: String, default: null },
  instagram: { type: String, default: null },
  facebook: { type: String, default: null },
  contactEmail: { type: String, default: null },
  contactPhone: { type: String, default: null },
  address: { type: String, default: null },
  deliveryCharge: { type: Number, default: 120 },
  deliveryChargeOutside: { type: Number, default: 200 },
  freeDeliveryThreshold: { type: Number, default: 5000 },
  orderPrefix: { type: String, default: "EP" },
  paymentMethods: { type: [String], default: ["cod", "bkash", "nagad"] },
  siteImages: { type: Schema.Types.Mixed, default: {} },
  updatedAt: { type: Date, default: Date.now },
}));

export {
  UserModel, FileModel, ProductModel, CollectionModel, ProductCollectionModel,
  OrderModel, AddressModel, WishlistModel, ReviewModel, DiscountModel,
  SubscriberModel, SettingsModel,
};

/** Turn a lean Mongo document into the API shape: `_id` → `id`, drop `__v`. */
export function ser<T = Record<string, unknown>>(doc: unknown): T {
  if (!doc || typeof doc !== "object") return doc as T;
  const { _id, __v, ...rest } = doc as Record<string, unknown>;
  void __v;
  return { id: _id, ...rest } as T;
}
