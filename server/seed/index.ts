import { randomUUID } from "node:crypto";
import { ProductModel, DiscountModel, SettingsModel } from "../models";
import { DEFAULT_SETTINGS } from "../db";
import { SEED_PRODUCTS, SEED_DISCOUNTS } from "./seed-data";

/** Load the sample catalogue, discount codes and site settings. Safe to run
 *  more than once: existing slugs / codes / settings are left alone. */
export async function runSeed(): Promise<number> {
  let added = 0;
  for (const p of SEED_PRODUCTS) {
    const res = await ProductModel.updateOne(
      { slug: p.slug },
      { $setOnInsert: { _id: randomUUID(), ...p, isSample: true, isActive: true, createdAt: new Date() } },
      { upsert: true },
    );
    if (res.upsertedCount) added++;
  }
  for (const d of SEED_DISCOUNTS) {
    await DiscountModel.updateOne({ code: d.code }, { $setOnInsert: { _id: randomUUID(), ...d, isActive: true, createdAt: new Date() } }, { upsert: true });
  }
  const { id: _id, ...settings } = DEFAULT_SETTINGS;
  await SettingsModel.updateOne(
    { _id: "main" },
    { $setOnInsert: { _id: "main", ...settings, updatedAt: new Date() } },
    { upsert: true },
  );
  return added;
}

/** On first start (no products yet) fill the shop with the sample pieces. */
export async function seedIfEmpty(): Promise<number> {
  if ((await ProductModel.estimatedDocumentCount()) > 0) return 0;
  return runSeed();
}
