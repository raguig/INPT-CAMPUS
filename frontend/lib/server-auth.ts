import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCESS_COOKIE_NAME } from "@/lib/auth-cookies";
import { getApiBaseUrl } from "@/lib/api-config";
import type { AuthUser } from "@/lib/auth-types";

export async function getServerAuthOrRedirect() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      redirect("/login");
    }

    const user = (await response.json()) as AuthUser;
    return {
      token,
      user,
    };
  } catch {
    redirect("/login");
  }
}
