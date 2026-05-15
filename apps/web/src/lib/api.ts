"use client";

import { getAccessToken } from "@auth0/nextjs-auth0/client";

import { API_URL, AUTH0_AUDIENCE } from "./config";

export type ApiReport = {
  id: string;
  filename: string;
  status: "pending" | "processing" | "ready" | "failed";
  uploadedAt: string;
  summary?: string | null;
  insights?: string | null;
  nextActions?: string | null;
  errorMessage?: string | null;
};

async function getAuthorizationHeader() {
  if (!AUTH0_AUDIENCE) return {};

  try {
    const token = await getAccessToken({ audience: AUTH0_AUDIENCE });
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const authorizationHeader = await getAuthorizationHeader();
  const headers = new Headers(options?.headers);

  for (const [key, value] of Object.entries(authorizationHeader)) {
    headers.set(key, value);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.ok) {
    return response.json() as Promise<T>;
  }

  if (response.status === 401 && typeof window !== "undefined") {
    window.location.href = "/auth/signin";
    return new Promise(() => {});
  }

  const data = await response.json().catch(() => null);
  throw new Error(data?.error ?? "Request failed");
}

export const api = {
  register: (email: string, password: string) =>
    requestJson<{ id: string; email: string }>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    requestJson<{ id: string; email: string }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  logout: () => requestJson<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
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
};
