"use client";

import { API_URL } from "./config";

export type ApiReport = {
  id: string;
  filename: string;
  status: "pending" | "processing" | "ready" | "failed";
  currentStage?: string | null;
  uploadedAt: string;
  parsedData?: Record<string, unknown> | null;
  errorMessage?: string | null;
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

function isAuthEndpoint(path: string): boolean {
  return path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register");
}

function extractErrorMessage(data: unknown, status: number): string {
  if (!data) return `Request failed (status ${status})`;

  // FastAPI simple error: { "detail": "message" }
  if (typeof data === "object" && "detail" in data) {
    const detail = data.detail;
    if (typeof detail === "string") return detail;
    // FastAPI validation error: { "detail": [{ "loc": ["body", "field"], "msg": "...", "type": "..." }] }
    if (Array.isArray(detail)) {
      return detail
        .map((d: Record<string, unknown>) => {
          const msg = typeof d.msg === "string" ? d.msg : String(d.msg);
          // Remove "Value error, " prefix from Pydantic messages
          return msg.replace(/^Value error, /, "");
        })
        .join("; ");
    }
  }

  // Fallback for { "error": "message" } format
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

  // Only redirect on 401 for non-auth endpoints
  if (response.status === 401 && !isAuthEndpoint(path) && typeof window !== "undefined") {
    window.location.assign("/auth/login");
    return new Promise(() => {});
  }

  const data = await response.json().catch(() => null);
  throw new Error(extractErrorMessage(data, response.status));
}

export const api = {
  login: (email: string, password: string) =>
    requestJson<{ user: { id: string; email: string } }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    requestJson<{ user: { id: string; email: string } }>("/api/auth/register", {
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
  listReports: () => requestJson<{ reports: ApiReport[] }>("/api/reports"),
  getReport: (id: string) => requestJson<{ report: ApiReport }>(`/api/reports/${id}`),
  uploadReport: (file: File) => {
    const form = new FormData();
    form.append("file", file);

    return requestJson<{ report: ApiReport }>("/api/reports", {
      method: "POST",
      body: form,
    });
  },
  deleteReport: (id: string) => requestJson<{ ok: boolean }>(`/api/reports/${id}`, { method: "DELETE" }),
  analyze: (reportId: string, query: string) =>
    requestJson<{ answer: string; sources: string[] }>("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, query, topK: 5 }),
    }),
  getTrends: () => requestJson<TrendsResponse>("/api/trends"),
};

export type FieldErrors = Record<string, string>;

export function parseFieldErrors(errorMessage: string): { banner: string; fields: FieldErrors } {
  const fields: FieldErrors = {};
  let banner = "";

  // Email already registered → field error
  if (errorMessage.includes("already registered")) {
    fields.email = "This email is already registered";
    return { banner: "", fields };
  }

  // Invalid credentials → banner (can't determine which field)
  if (errorMessage.includes("Invalid credentials")) {
    banner = "Invalid email or password";
    return { banner, fields };
  }

  // FastAPI validation errors with field info
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

  // Password too short
  if (errorMessage.toLowerCase().includes("password") && errorMessage.includes("8")) {
    fields.password = "Password must be at least 8 characters";
    return { banner: "", fields };
  }

  // Fallback → banner
  banner = errorMessage;
  return { banner, fields };
}
