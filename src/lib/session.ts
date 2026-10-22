import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, type SessionPayload } from "./auth";

export const SESSION_COOKIE = "ledgerline_session";

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
