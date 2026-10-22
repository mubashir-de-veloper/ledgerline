import { getSession } from "./session";

class UnauthorizedError extends Error {
  constructor(message = "Please sign in to continue.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Returns the signed-in owner's ID. Throws UnauthorizedError if not signed in. */
export async function requireOwner(): Promise<string> {
  const session = await getSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session.userId;
}

/** Returns appropriate Response for UnauthorizedError, or null. */
export function handleUnauthorized(err: unknown): Response | null {
  if (err instanceof UnauthorizedError) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return null;
}
