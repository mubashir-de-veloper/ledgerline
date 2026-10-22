import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || "";
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is required and must be at least 16 characters");
  }
  return secret;
}

/** Hash a password with scrypt + per-user salt. Format: salt:hash. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export interface SessionPayload {
  userId: string;
  iat: number;
  exp: number;
}

/** Sign a payload as an opaque session token: base64(payload).hmac */
export function signSession(userId: string, ttlSeconds = 60 * 60 * 24 * 7): string {
  const payload: SessionPayload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const sig = createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession(token: string): SessionPayload | null {
  if (!token || typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (!payload.userId || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Constant-time short-circuit-safe random token for things like references. */
export function randomReference(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}
