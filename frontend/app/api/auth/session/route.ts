import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/auth-cookies";

const accessTokenMaxAge = 60 * 60 * 24 * 7;
const refreshTokenMaxAge = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  const body = (await request.json()) as {
    accessToken?: string;
    refreshToken?: string;
  };

  if (!body.accessToken || !body.refreshToken) {
    return NextResponse.json(
      { message: "Jetons manquants." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const isSecure = process.env.NODE_ENV === "production";

  cookieStore.set(ACCESS_COOKIE_NAME, body.accessToken, {
    httpOnly: true,
    maxAge: accessTokenMaxAge,
    path: "/",
    sameSite: "lax",
    secure: isSecure,
  });

  cookieStore.set(REFRESH_COOKIE_NAME, body.refreshToken, {
    httpOnly: true,
    maxAge: refreshTokenMaxAge,
    path: "/",
    sameSite: "lax",
    secure: isSecure,
  });

  return NextResponse.json({ ok: true });
}
