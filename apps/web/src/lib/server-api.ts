import { cookies } from "next/headers";
import { API_URL } from "./config";

/**
 * Server-side API fetcher for the external FastAPI backend.
 * Uses the httpOnly token cookie for authentication.
 */
async function serverFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/** Fetch the authenticated user's session. */
export type SessionUser = {
  id: string;
  email: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  pregnant?: boolean | null;
};

export type TrendDataPoint = {
  reportId: string;
  filename: string;
  uploadedAt: string;
  value: string | null;
  unit: string | null;
  referenceRange: string | null;
  flagged: boolean;
  status: string;
};

export type TrendsResponse = {
  tests: Record<string, TrendDataPoint[]>;
};

export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const data = await serverFetch<{ user: SessionUser }>("/api/auth/me");
    return data.user;
  } catch {
    return null;
  }
}

/** Fetch the user's reports from the server. */
export type ApiReport = {
  id: string;
  filename: string;
  status: "pending" | "processing" | "ready" | "failed";
  currentStage?: string | null;
  uploadedAt: string;
  parsedData?: Record<string, unknown> | null;
  errorMessage?: string | null;
  selectedPanels?: string[];
  patientAge?: number | null;
  patientGender?: string | null;
};

export async function getServerReports(): Promise<ApiReport[]> {
  try {
    const data = await serverFetch<{ reports: ApiReport[] }>("/api/reports");
    return data.reports;
  } catch {
    return [];
  }
}

export async function getServerTrends(): Promise<TrendsResponse> {
  try {
    return await serverFetch<TrendsResponse>("/api/trends");
  } catch {
    return { tests: {} };
  }
}
