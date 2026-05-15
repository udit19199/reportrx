import { redirect } from "next/navigation";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const returnTo = resolvedSearchParams.returnTo ?? "/app";
  redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
}
