import express, { type Express } from "express";
import { existsSync } from "node:fs";
import path from "node:path";

// In production one process serves the built React app (dist/public) next to
// the API. In dev, Vite serves the client and proxies API calls here.
const PUBLIC_DIR = path.resolve("dist/public");

export function mountClient(app: Express): void {
  if (!existsSync(path.join(PUBLIC_DIR, "index.html"))) {
    console.warn(`[server] ${PUBLIC_DIR}/index.html not found — run "npm run build" first.`);
    return;
  }
  app.use(
    express.static(PUBLIC_DIR, {
      index: false,
      setHeaders(res, file) {
        if (file.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
        // Vite's hashed bundles never change under the same name.
        else if (file.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else res.setHeader("Cache-Control", "public, max-age=3600");
      },
    }),
  );
  // Single-page app: any other GET (that isn't an API/file route) gets index.html.
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (/^\/(trpc|api|app-storage)(\/|$)/.test(req.path)) return next();
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
  });
}
