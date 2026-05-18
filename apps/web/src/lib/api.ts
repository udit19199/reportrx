"use client";

import { API_URL } from "./config";

export type ApiReport = {
  id: string;
  filename: string;
  status: "pending" | "processing" | "ready" | "failed";
  currentStage?: string | null;
  uploadedAt: string;
  reportDate?: string | null;
  parsedData?: Record<string, unknown> | null;
  errorMessage?: string | null;
  selectedPanels?: string[];
  patientAge?: number | null;
  patientGender?: string | null;
};

export type TrendDataPoint = {
  reportId: string;
  filename: string;
  uploadedAt: string;
  reportDate?: string | null;
  value: string | null;
  unit: string | null;
  referenceRange: string | null;
  flagged: boolean;
  status: string;
};

export type TrendsResponse = {
  tests: Record<string, TrendDataPoint[]>;
};

export type UserProfile = {
  id: string;
  email: string;
  dateOfBirth: string | null;
  gender: string | null;
  weightKg: number | null;
  heightCm: number | null;
  pregnant: boolean | null;
};

function isAuthEndpoint(path: string): boolean {
  return (
    path.startsWith("/api/auth/login") ||
    path.startsWith("/api/auth/register")
  );
}

function extractErrorMessage(data: unknown, status: number): string {
  if (!data) return `Request failed (status ${status})`;

  if (typeof data === "object" && "detail" in data) {
    const detail = data.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d: Record<string, unknown>) => {
          const msg = typeof d.msg === "string" ? d.msg : String(d.msg);
          return msg.replace(/^Value error, /, "");
        })
        .join("; ");
    }
  }

  if (typeof data === "object" && "error" in data && typeof data.error === "string") {
    return data.error;
  }

  return `Request failed (status ${status})`;
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`Cannot connect to API (${API_URL}). Is the server running? ${message}`);
  }

  if (response.ok) {
    return response.json() as Promise<T>;
  }

  if (response.status === 401 && !isAuthEndpoint(path) && typeof window !== "undefined") {
    window.location.assign("/auth/login");
    return new Promise(() => {});
  }

  const data = await response.json().catch(() => null);
  throw new Error(extractErrorMessage(data, response.status));
}

export const api = {
  login: (email: string, password: string) =>
    requestJson<{ user: UserProfile }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    requestJson<{ user: UserProfile }>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  logout: () =>
    requestJson<{ ok: boolean }>("/api/auth/logout", {
      method: "POST",
    }).then(() => {
      window.location.assign("/");
    }),

  // Profiles
  getProfile: () =>
    requestJson<{ user: UserProfile }>("/api/auth/me"),
  updateProfile: (body: {
    dateOfBirth?: string;
    gender?: string;
    weightKg?: number;
    heightCm?: number;
    pregnant?: boolean;
  }) =>
    requestJson<{ user: UserProfile }>("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  // Reports
  listReports: () => requestJson<{ reports: ApiReport[] }>("/api/reports"),
  getReport: (id: string) => requestJson<{ report: ApiReport }>(`/api/reports/${id}`),
  uploadReport: (file: File, panels?: string[]) => {
    const form = new FormData();
    form.append("file", file);
    if (panels && panels.length > 0) {
      form.append("panels", JSON.stringify(panels));
    }

    return requestJson<{ report: ApiReport }>("/api/reports", {
      method: "POST",
      body: form,
    });
  },
  deleteReport: (id: string) =>
    requestJson<{ ok: boolean }>(`/api/reports/${id}`, { method: "DELETE" }),
  renameReport: (id: string, filename: string) =>
    requestJson<{ report: ApiReport }>(`/api/reports/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    }),
  reprocessReport: (id: string) =>
    requestJson<{ report: ApiReport }>(`/api/reports/${id}/reprocess`, { method: "PUT" }),

  // Analysis
  analyze: (reportId: string, query: string) =>
    requestJson<{ answer: string; sources: string[] }>("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, query, topK: 5 }),
    }),
  getTrends: () => requestJson<TrendsResponse>("/api/trends"),

  // Account
  deleteAccount: () =>
    requestJson<{ ok: boolean }>("/api/auth/me", { method: "DELETE" }),
  updateAccount: (body: {
    email?: string;
    currentPassword: string;
    newPassword?: string;
  }) =>
    requestJson<{ user: UserProfile }>("/api/auth/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};

export type FieldErrors = Record<string, string>;

export function parseFieldErrors(errorMessage: string): { banner: string; fields: FieldErrors } {
  const fields: FieldErrors = {};
  let banner = "";

  if (errorMessage.includes("already registered")) {
    fields.email = "This email is already registered";
    return { banner: "", fields };
  }

  if (errorMessage.includes("Invalid credentials")) {
    banner = "Invalid email or password";
    return { banner, fields };
  }

  if (errorMessage.includes("body.email") || errorMessage.includes("body.password")) {
    const parts = errorMessage.split("; ");
    for (const part of parts) {
      if (part.includes("body.email")) {
        fields.email = part.replace(/.*body\.email\s*/, "").trim();
      } else if (part.includes("body.password")) {
        fields.password = part.replace(/.*body\.password\s*/, "").trim();
      } else {
        banner = part;
      }
    }
    return { banner: banner || "", fields };
  }

  if (errorMessage.toLowerCase().includes("password") && errorMessage.includes("8")) {
    fields.password = "Password must be at least 8 characters";
    return { banner: "", fields };
  }

  banner = errorMessage;
  return { banner, fields };
}
