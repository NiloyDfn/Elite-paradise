import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { FileModel, ser, type StoredFile } from "../models";

// Image storage inside MongoDB — no S3 / extra service needed.
//
// Flow (same shape the admin uploader already used):
//   1. files.uploadUrl  → server returns key + upload URL + public path
//   2. browser PUTs the image bytes to /api/upload/<key>   (admin only)
//   3. files.commit     → confirms the file and stores its display name
//   4. product pages load it from /app-storage/<key>
//
// MongoDB documents are limited to 16 MB and an Atlas free cluster holds 512 MB
// in total, so uploads are capped at 8 MB each. For a very large catalogue,
// swap this file for Cloudinary/S3 — nothing else needs to change.

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"];

export type StorageErrorCode = "not_found" | "forbidden" | "not_configured" | "failed";

export class StorageError extends Error {
  constructor(message: string, readonly code: StorageErrorCode) {
    super(message);
    this.name = "StorageError";
  }
}

export type FileRecord = StoredFile;

/** Keys are `<uuid>-<safe-name>`: letters, digits, dot, dash, underscore only. */
function canonicalKey(relKey: string): string {
  const key = relKey.replace(/^\/+/, "");
  if (!key || key === "." || key === ".." || !/^[A-Za-z0-9._-]+$/.test(key) || key.startsWith(".")) {
    throw new StorageError(`unsafe storage key: ${relKey}`, "forbidden");
  }
  return key;
}

/** Step 1: validate the type and hand the browser where to PUT the bytes. */
export async function storagePutUrl(
  relKey: string,
  contentType: string,
  _opts: { ownerId?: string | null } = {},
): Promise<{ uploadUrl: string; publicPath: string }> {
  const key = canonicalKey(relKey);
  if (!ALLOWED_TYPES.includes(contentType.toLowerCase())) {
    throw new StorageError(`content type not accepted: ${contentType}`, "failed");
  }
  return { uploadUrl: `/api/upload/${key}`, publicPath: `/app-storage/${key}` };
}

/** Step 2 (called by the PUT route): save the bytes. */
export async function storageSave(
  relKey: string,
  data: Buffer,
  contentType: string,
  ownerId: string,
): Promise<FileRecord> {
  const key = canonicalKey(relKey);
  if (!ALLOWED_TYPES.includes(contentType)) throw new StorageError("content type not accepted", "failed");
  if (data.length === 0) throw new StorageError("empty upload", "failed");
  if (data.length > MAX_UPLOAD_BYTES) throw new StorageError("file too large", "failed");

  const existing = await FileModel.findOne({ key }).lean();
  if (existing?.ownerId && existing.ownerId !== ownerId) {
    throw new StorageError(`key already owned by another user: ${key}`, "forbidden");
  }
  await FileModel.updateOne(
    { key },
    {
      $set: { data, size: data.length, contentType, ownerId },
      $setOnInsert: { _id: randomUUID(), name: key, createdAt: new Date() },
    },
    { upsert: true },
  );
  const doc = await FileModel.findOne({ key }, { data: 0 }).lean();
  return ser<FileRecord>(doc);
}

/** Step 3: confirm an upload that landed, and set its display name. */
export async function storageCommit(
  relKey: string,
  opts: { ownerId?: string | null; name?: string } = {},
): Promise<FileRecord> {
  const key = canonicalKey(relKey);
  const row = await FileModel.findOne({ key }).lean();
  if (!row) throw new StorageError(`no such object: ${key}`, "not_found");
  if (row.ownerId && opts.ownerId && row.ownerId !== opts.ownerId) {
    throw new StorageError("key owned by another user", "forbidden");
  }
  await FileModel.updateOne({ key }, { $set: { name: opts.name ?? row.name } });
  const doc = await FileModel.findOne({ key }, { data: 0 }).lean();
  return ser<FileRecord>(doc);
}

export async function storageListByOwner(ownerId: string, opts: { limit?: number } = {}): Promise<FileRecord[]> {
  const limit = Math.max(1, Math.min(opts.limit ?? 50, 200));
  const docs = await FileModel.find({ ownerId }, { data: 0 }).sort({ createdAt: -1 }).limit(limit).lean();
  return docs.map((d) => ser<FileRecord>(d));
}

/** Delete one file OWNED BY `ownerId`. false = nothing matched (never existed,
 *  or someone else's — the two are deliberately not distinguished). */
export async function storageDeleteOwned(ownerId: string, relKey: string): Promise<boolean> {
  const key = canonicalKey(relKey);
  const res = await FileModel.deleteOne({ key, ownerId });
  return res.deletedCount === 1;
}

/** GET /app-storage/:key — stream the stored image. */
export async function serveAppStorage(req: Request, res: Response): Promise<void> {
  let key: string;
  try {
    key = canonicalKey(String(req.params.key ?? ""));
  } catch {
    res.status(404).end();
    return;
  }
  const row = await FileModel.findOne({ key }).select("+data").lean();
  if (!row?.data) {
    res.status(404).end();
    return;
  }
  res.setHeader("Content-Type", row.contentType ?? "application/octet-stream");
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Keys contain a random UUID, so a file never changes under the same URL.
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.end(Buffer.from((row.data as unknown as { buffer: Uint8Array }).buffer ?? row.data));
}
