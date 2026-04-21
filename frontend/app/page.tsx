import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCESS_COOKIE_NAME } from "@/lib/auth-cookies";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  redirect(token ? "/dashboard" : "/login");
}
