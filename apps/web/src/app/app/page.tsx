import { redirect } from "next/navigation";

import { WorkspaceErrorBoundary } from "@/components/error-boundary";
import { Workspace } from "@/features/workspace/workspace";
import { auth0 } from "@/lib/auth0";
import type { ApiReport } from "@/lib/api";
import { API_URL, AUTH0_AUDIENCE } from "@/lib/config";

async function getInitialReports() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/signin");

  const accessToken = AUTH0_AUDIENCE
    ? await auth0.getAccessToken({ audience: AUTH0_AUDIENCE })
    : await auth0.getAccessToken();
  const { token } = accessToken;

  const response = await fetch(`${API_URL}/api/reports`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 401) redirect("/auth/signin");
  if (!response.ok) {
    console.error("Failed to fetch reports:", response.status, await response.text().catch(() => ""));
    return [];
  }

  const data = (await response.json()) as { reports: ApiReport[] };
  return data.reports;
}

export default async function AppPage() {
  const reports = await getInitialReports();
  return (
    <WorkspaceErrorBoundary>
      <Workspace initialReports={reports} />
    </WorkspaceErrorBoundary>
  );
}
