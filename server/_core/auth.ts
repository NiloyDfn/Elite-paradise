import { SignJWT, jwtVerify } from "jose";
import { compare, hash as bcryptHash } from "bcryptjs";
import { UserModel, type User } from "../models";
import { isUniqueViolation } from "./db";
import { env } from "./env";
import { sessionCookieName, type UserRole } from "../../shared/constants";
import type { SessionUser } from "../../shared/types";
import type { HttpPair } from "./context";

// Email + password accounts. A signed JWT lives in an httpOnly cookie for 30
// days. The password hash never leaves this file.

const COOKIE = sessionCookieName(env.appSlug);
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const secretKey = () => new TextEncoder().encode(env.jwtSecret);

export class AuthError extends Error {}
/** Signup hit the unique email index — that address already has an account. */
export class EmailTakenError extends AuthError {}

function toSessionUser(row: Pick<User, "id" | "email" | "name" | "role">): SessionUser {
  return { id: row.id, email: row.email, name: row.name, role: row.role as UserRole };
}

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

function cookieOpts(c: HttpPair) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    // Secure cookies only over HTTPS (Render terminates TLS; `trust proxy` makes
    // req.secure reflect that). Plain http://localhost keeps working in dev.
    secure: env.isProd ? c.req.secure : false,
  };
}

export interface AuthProvider {
  getSession(c: HttpPair): Promise<SessionUser | null>;
  login(c: HttpPair, email: string, password: string): Promise<SessionUser>;
  logout(c: HttpPair): Promise<void>;
}

class LocalAuthProvider implements AuthProvider {
  async getSession(c: HttpPair): Promise<SessionUser | null> {
    const token = readCookie(c.req.headers.cookie, COOKIE);
    if (!token) return null;
    try {
      const { payload } = await jwtVerify(token, secretKey());
      if (!payload.sub) return null;
      const row = await UserModel.findById(payload.sub).lean();
      return row ? toSessionUser({ id: row._id as unknown as string, email: row.email, name: row.name, role: row.role }) : null;
    } catch {
      return null; // expired / tampered / wrong key → treat as a visitor
    }
  }

  async login(c: HttpPair, email: string, password: string): Promise<SessionUser> {
    const row = await UserModel.findOne({ email: email.trim().toLowerCase() }).lean();
    // Still run a compare when the user is missing, to blunt timing attacks.
    const hash = row?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
    const ok = await compare(password, hash);
    if (!row || !row.passwordHash || !ok) throw new AuthError("Invalid email or password");
    const id = row._id as unknown as string;
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(id)
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secretKey());
    c.res.cookie(COOKIE, token, { ...cookieOpts(c), maxAge: MAX_AGE_MS });
    return toSessionUser({ id, email: row.email, name: row.name, role: row.role });
  }

  async logout(c: HttpPair): Promise<void> {
    c.res.clearCookie(COOKIE, cookieOpts(c));
  }
}

let _provider: AuthProvider | undefined;
export function authProvider(): AuthProvider {
  return (_provider ??= new LocalAuthProvider());
}

export async function registerLocalUser(email: string, password: string, name?: string): Promise<SessionUser> {
  const passwordHash = await bcryptHash(password, 10);
  try {
    const row = await UserModel.create({ email: email.trim().toLowerCase(), passwordHash, name: name ?? null });
    return toSessionUser({ id: row._id as unknown as string, email: row.email, name: row.name, role: row.role });
  } catch (e) {
    if (isUniqueViolation(e)) {
      throw new EmailTakenError("That email is already registered — try logging in instead.");
    }
    throw e;
  }
}

/** Create the shop owner's admin account from ADMIN_EMAIL / ADMIN_PASSWORD, or
 *  promote the existing account with that email. The password of an existing
 *  account is never changed. Returns what happened (for the startup log). */
export async function ensureAdmin(): Promise<"created" | "promoted" | "already" | "skipped"> {
  if (!env.adminEmail || !env.adminPassword) return "skipped";
  const existing = await UserModel.findOne({ email: env.adminEmail }).lean();
  if (!existing) {
    await UserModel.create({
      email: env.adminEmail,
      passwordHash: await bcryptHash(env.adminPassword, 10),
      name: "Admin",
      role: "admin",
    });
    return "created";
  }
  if (existing.role === "admin") return "already";
  await UserModel.updateOne({ _id: existing._id }, { $set: { role: "admin" } });
  return "promoted";
}
