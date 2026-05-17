import { getServerSession } from "./server-api";

export type SessionUser = {
  id: string;
  email: string;
};

/**
 * Get the current user session from the server.
 * Uses the httpOnly token cookie.
 */
export async function getSession(): Promise<{ user: SessionUser } | null> {
  const user = await getServerSession();
  if (!user) return null;
  return { user };
}
