import "dotenv/config"; // load .env first (no-op when it's absent, e.g. on Render)
import { createApp } from "./app";
import { connectDb } from "./_core/db";
import { initModels } from "./models/init";
import { ensureAdmin } from "./_core/auth";
import { seedIfEmpty } from "./seed";
import { env } from "./_core/env";

async function main() {
  await connectDb();
  await initModels(); // builds the unique indexes before the first request
  console.log("[db] connected to MongoDB");

  const admin = await ensureAdmin();
  if (admin !== "skipped") console.log(`[admin] ${env.adminEmail}: ${admin}`);

  if (env.seedOnStart) {
    const seeded = await seedIfEmpty();
    if (seeded) console.log(`[seed] loaded ${seeded} sample products (replace them in Admin → Products)`);
  }

  const port = env.isProd ? env.port : env.apiPort;
  createApp().listen(port, () => {
    console.log(`[server] listening on :${port} (${env.isProd ? "production" : "dev-api"})`);
  });
}

main().catch((e) => {
  console.error("[server] failed to start:", e instanceof Error ? e.message : e);
  process.exit(1);
});
