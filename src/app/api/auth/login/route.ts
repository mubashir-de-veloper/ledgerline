import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signSession, verifyPassword } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json(
        { error: "Please enter your email and password." },
        { status: 400 },
      );
    }
    const email = body.email.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Please enter your email and password." },
        { status: 400 },
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      // Constant-ish timing: same message for bad email and bad password.
      return NextResponse.json(
        { error: "We couldn't sign you in. Check your email and password." },
        { status: 401 },
      );
    }

    const token = signSession(user.id);
    const res = NextResponse.json({ ok: true, redirectTo: "/dashboard" });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json(
      {
        error:
          "We couldn't reach the sign-in service. Check your connection and try again.",
      },
      { status: 500 },
    );
  }
}
