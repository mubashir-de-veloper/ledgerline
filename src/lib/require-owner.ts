import { getSession } from "./session";

/** Returns the signed-in owner's ID, or throws a 401 Response. */
export async function requireOwner(): Promise<string> {
  const session = await getSession();

  if (!session) {
    throw new Response(
      JSON.stringify({ error: "Please sign in to continue." }),
      {
        status: 401,
        headers: { "content-type": "application/json" },
      },
    );
  }

  return session.userId;
}