import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE_NAME } from "@/lib/auth-cookies";

const authPages = new Set(["/login", "/register", "/forgot-password"]);

export function middleware(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const { pathname, search } = request.nextUrl;
  const isAuthPage = authPages.has(pathname);

  if (!token && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
