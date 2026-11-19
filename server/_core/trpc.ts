import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { AppContext } from "./context";

/** All a client ever learns about an unhandled server failure. */
export const OPAQUE_SERVER_ERROR = "Something went wrong. Please try again.";

// tRPC's default formatter copies `error.message` straight onto the wire. For a
// TRPCError you threw on purpose that is exactly right — the message was
// written for the user. For anything that merely ESCAPED a procedure it is a
// leak (database errors can quote queries and values), so the client only ever
// sees a generic message while the detail stays in the server log.
//
// Translate expected failures in your router (see `authRouter`/`filesRouter` in
// routers.ts) — a CONFLICT/BAD_REQUEST you raise keeps its message. This is only
// the floor under the ones nobody translated.
const t = initTRPC.context<AppContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    if (error.code !== "INTERNAL_SERVER_ERROR") return shape;
    // eslint-disable-next-line no-console
    console.error("[trpc] unhandled error", error.cause ?? error); // detail stays server-side
    // `stack` (dev only) starts with the same message — drop it with the rest.
    const { stack: _stack, ...data } = shape.data;
    return { ...shape, message: OPAQUE_SERVER_ERROR, data };
  },
});

export const router = t.router;
export const middleware = t.middleware;

/** Open to anyone. */
export const publicProcedure = t.procedure;

/** Requires an authenticated user; narrows ctx.user to non-null for downstream
 *  middleware/procedures. Inlined into .use() (not via a standalone middleware())
 *  so the ctx narrowing actually chains — a standalone middleware re-infers its
 *  input ctx from the root, where user is nullable. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/** Requires role === 'admin'. Builds on protectedProcedure, so ctx.user is non-null. */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});
