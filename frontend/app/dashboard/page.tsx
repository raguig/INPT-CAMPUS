import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ACCESS_COOKIE_NAME } from "@/lib/auth-cookies";
import { getApiBaseUrl } from "@/lib/api-config";
import type { AuthUser } from "@/lib/auth-types";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  let user: AuthUser;

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

    user = (await response.json()) as AuthUser;
  } catch {
    redirect("/login");
  }

  return <DashboardShell initialUser={user} token={token} />;
}
