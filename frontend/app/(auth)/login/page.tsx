import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = getParamValue(params.next);
  const registered = getParamValue(params.registered) === "1";

  return <LoginForm defaultNextPath={nextPath} registered={registered} />;
}
