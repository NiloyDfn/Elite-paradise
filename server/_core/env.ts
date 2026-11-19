// Central env access. Everything the server needs from the environment is here.
const isProd = process.env.NODE_ENV === "production";

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing required env var: ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return v;
}

export const env = {
  isProd,
  /** MongoDB connection string (Atlas or local). */
  get mongodbUri(): string {
    return required("MONGODB_URI");
  },
  /** Secret used to sign login cookies. Any long random string. */
  get jwtSecret(): string {
    const v = process.env.JWT_SECRET;
    if (v) return v;
    if (isProd) throw new Error("Missing required env var: JWT_SECRET");
    return "dev-only-secret-change-me-dev-only-secret";
  },
  appSlug: process.env.APP_SLUG ?? "eliteparadise",
  port: Number(process.env.PORT ?? 3000),
  apiPort: Number(process.env.API_PORT ?? 3001),
  /** Optional: create/promote this admin account every time the server starts. */
  adminEmail: process.env.ADMIN_EMAIL?.trim().toLowerCase() || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  /** Load the 24 sample products on first start when the shop is empty. */
  seedOnStart: (process.env.SEED_ON_START ?? "true") !== "false",
};
