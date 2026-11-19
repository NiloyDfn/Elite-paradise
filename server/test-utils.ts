// Test helpers: a real Express app + a real MongoDB.
//   • Set TEST_MONGODB_URI to use a MongoDB you already run, or
//   • leave it unset and mongodb-memory-server starts a throwaway one
//     (it downloads the MongoDB binary the first time — needs internet once).
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import mongoose from "mongoose";
import { createApp } from "./app";
import { connectDb, disconnectDb } from "./_core/db";
import { initModels } from "./models/init";
import { runSeed } from "./seed";
import { appRouter, type AppRouter } from "./routers";

let memory: { stop(): Promise<unknown> } | null = null;
let server: Server | null = null;

export async function startTestServer(opts: { seed?: boolean } = {}) {
  let uri = process.env.TEST_MONGODB_URI;
  if (!uri) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const m = await MongoMemoryServer.create();
    memory = m;
    uri = m.getUri("eptest");
  } else {
    uri = uri.replace(/\/[^/?]*(\?|$)/, `/eptest_${process.pid}$1`);
  }
  await connectDb(uri);
  await mongoose.connection.dropDatabase();
  await initModels();
  if (opts.seed !== false) await runSeed();

  server = await new Promise<Server>((resolve) => {
    const s = createApp().listen(0, "127.0.0.1", () => resolve(s));
  });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { base };
}

export async function stopTestServer() {
  await new Promise((r) => (server ? server.close(() => r(null)) : r(null)));
  if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
  await disconnectDb();
  await memory?.stop();
}

/** A client with its own cookie jar — i.e. one browser. */
export function makeClient(base: string) {
  let cookie = "";
  const fetchWithJar: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (cookie) headers.set("cookie", cookie);
    const res = await fetch(input, { ...init, headers });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const [name, value] = pair.split("=");
      const cleared = !value || /expires=thu, 01 jan 1970/i.test(c);
      const rest = cookie.split("; ").filter((p) => p && !p.startsWith(`${name}=`));
      cookie = (cleared ? rest : [...rest, pair]).join("; ");
    }
    return res;
  };
  const client = createTRPCClient<AppRouter>({
    links: [httpBatchLink({ url: `${base}/trpc`, transformer: superjson, fetch: fetchWithJar })],
  });
  // Call procedures like functions — `api.catalog.products({...})` — whether
  // they are queries or mutations (looked up from the router definition).
  const procedures = (appRouter as unknown as { _def: { procedures: Record<string, { _def: { type: string } }> } })._def.procedures;
  const make = (path: string[]): unknown =>
    new Proxy(() => undefined, {
      get: (_t, prop) => make([...path, String(prop)]),
      apply: (_t, _this, args) => {
        const key = path.join(".");
        const node = path.reduce((o: any, k) => o[k], client as any);
        return procedures[key]._def.type === "query" ? node.query(args[0]) : node.mutate(args[0]);
      },
    });
  const api = make([]) as ReturnType<typeof appRouter.createCaller>;
  return { client: api, fetch: fetchWithJar, get cookie() { return cookie; } };
}
