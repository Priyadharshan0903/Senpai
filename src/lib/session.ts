import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

// Lightweight profile identity for the crew app: picking a profile mints an
// HMAC-signed httpOnly cookie, and every mutation route checks that the `user`
// in the request body matches the cookie. This isn't full auth (profiles have
// no passwords), but it stops direct API calls from acting as someone else and
// gives a single place to hang PINs later.

export const SESSION_COOKIE = "senpai_session";

// SESSION_SECRET is preferred; TURSO_AUTH_TOKEN doubles as a secret that is
// already set in every real deployment. The dev fallback keeps local file-db
// setups working without any config.
const SECRET =
  process.env.SESSION_SECRET || process.env.TURSO_AUTH_TOKEN || "senpai-dev-secret";

function hmac(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export function signSession(userId: string): string {
  return `${userId}.${hmac(userId)}`;
}

/** Returns the verified userId inside the session cookie, or null. */
export function readSession(req: NextRequest): string | null {
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = hmac(userId);
  if (sig.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }
  return userId;
}

/**
 * Guard for mutation routes: the session cookie must exist and match the
 * profile the request claims to act as. Returns null when OK, otherwise a
 * ready-to-return 401 response.
 */
export function requireUser(req: NextRequest, claimedUser: string): NextResponse | null {
  const sessionUser = readSession(req);
  if (!sessionUser || sessionUser !== claimedUser) {
    return NextResponse.json(
      { error: "session expired — pick your profile again" },
      { status: 401 }
    );
  }
  return null;
}

export function attachSessionCookie(res: NextResponse, userId: string): void {
  res.cookies.set(SESSION_COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
