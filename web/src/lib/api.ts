const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type ApiReport = {
  id: string;
  filename: string;
  status: "pending" | "processing" | "ready" | "failed";
  uploadedAt: string;
  summary?: string | null;
};

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Request failed");
  }
  return response.json() as Promise<T>;
};

export const api = {
  register: (email: string, password: string) =>
    request<{ id: string; email: string }>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ id: string; email: string }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  listReports: () => request<{ reports: ApiReport[] }>("/api/reports"),
  getReport: (id: string) => request<{ report: ApiReport }>(`/api/reports/${id}`),
  uploadReport: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ report: ApiReport }>("/api/reports", {
      method: "POST",
      body: form,
    });
  },
  deleteReport: (id: string) => request<{ ok: boolean }>(`/api/reports/${id}`, { method: "DELETE" }),
  analyze: (reportId: string, query: string) =>
    request<{ answer: string; sources: string[] }>("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, query, topK: 5 }),
    }),
};
