import mongoose from "mongoose";
import { env } from "./env";

let connecting: Promise<typeof mongoose> | null = null;

/** Connect once; later calls reuse the same connection. */
export function connectDb(uri: string = env.mongodbUri): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose);
  if (!connecting) {
    mongoose.set("strictQuery", true);
    connecting = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 15000 })
      .catch((e) => {
        connecting = null;
        throw e;
      });
  }
  return connecting;
}

export async function disconnectDb(): Promise<void> {
  connecting = null;
  await mongoose.disconnect();
}

/** MongoDB duplicate-key error (unique index hit), code 11000. */
export function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    ((e as { code?: unknown }).code === 11000 ||
      (e as { cause?: { code?: unknown } }).cause?.code === 11000)
  );
}

export { mongoose };
