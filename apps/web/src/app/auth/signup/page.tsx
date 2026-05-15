import { redirect } from "next/navigation";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const returnTo = resolvedSearchParams.returnTo ?? "/app";
  redirect(`/auth/login?screen_hint=signup&returnTo=${encodeURIComponent(returnTo)}`);
}
