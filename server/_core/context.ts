import type { Request, Response } from "express";
import { authProvider } from "./auth";

/** What a tRPC procedure gets for every request: the HTTP pair (needed to set
 *  the login cookie) and the signed-in user, or null for a visitor. */
export type HttpPair = { req: Request; res: Response };

export async function createContext(req: Request, res: Response) {
  const c: HttpPair = { req, res };
  const user = await authProvider().getSession(c);
  return { c, user };
}

export type AppContext = Awaited<ReturnType<typeof createContext>>;
