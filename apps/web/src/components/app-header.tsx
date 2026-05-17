import { getSession } from "@/lib/session";
import { AppHeaderClient } from "./app-header-client";

export async function AppHeader() {
  const session = await getSession();

  return (
    <AppHeaderClient
      userEmail={session?.user.email ?? ""}
    />
  );
}
