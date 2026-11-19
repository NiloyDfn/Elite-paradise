import mongoose from "mongoose";
import "./index";

/** Create every collection + index now (unique email, slug, sku, order number…). */
export async function initModels(): Promise<void> {
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}
