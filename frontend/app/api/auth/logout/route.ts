import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/auth-cookies";
import { getApiBaseUrl } from "@/lib/api-config";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  if (refreshToken) {
    try {
      await fetch(`${getApiBaseUrl()}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      });
    } catch {
      // The client session should still be cleared locally even if the backend is unavailable.
    }
  }

  const response = NextResponse.json({ ok: true });
  const isSecure = process.env.NODE_ENV === "production";

  response.cookies.set(ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: isSecure,
  });

  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: isSecure,
  });

  return response;
}
