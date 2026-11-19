import express, { type Express } from "express";
import mongoose from "mongoose";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { authProvider } from "./_core/auth";
import { serveAppStorage, storageSave, StorageError, MAX_UPLOAD_BYTES } from "./_core/storage";
import { mountClient } from "./_core/serve";
import { env } from "./_core/env";

/** Build the Express app (no listening, no DB connect — easy to test). */
export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  // Behind Render's proxy: trust X-Forwarded-Proto so req.secure is correct.
  app.set("trust proxy", 1);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
  });

  // tRPC — every storefront/admin endpoint lives under /trpc.
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: ({ req, res }) => createContext(req, res),
    }),
  );

  // Admin image upload: the browser PUTs raw image bytes here.
  app.put(
    "/api/upload/:key",
    express.raw({ type: () => true, limit: MAX_UPLOAD_BYTES + 1024 }),
    async (req, res) => {
      try {
        const user = await authProvider().getSession({ req, res });
        if (!user) return void res.status(401).json({ error: "Please log in." });
        if (user.role !== "admin") return void res.status(403).json({ error: "Admins only." });
        const type = String(req.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
        const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
        await storageSave(String(req.params.key), body, type, user.id);
        res.status(200).json({ ok: true });
      } catch (e) {
        if (e instanceof StorageError) {
          const status = e.code === "forbidden" ? 403 : 400;
          return void res.status(status).json({ error: e.message });
        }
        console.error("[upload] failed", e);
        res.status(500).json({ error: "Upload failed." });
      }
    },
  );

  // Oversized uploads surface as a body-parser error; answer cleanly.
  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if ((err as { type?: string })?.type === "entity.too.large") {
      return void res.status(413).json({ error: "Image is too large (max 8 MB)." });
    }
    next(err);
  });

  app.get("/app-storage/:key", (req, res, next) => {
    serveAppStorage(req, res).catch(next);
  });

  if (env.isProd || process.env.SERVE_CLIENT === "true") mountClient(app);
  return app;
}
