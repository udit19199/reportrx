export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export const AUTH0_AUDIENCE = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE ?? "";
export const REPORT_UPLOAD_MAX_MB = 20;
export const REPORT_UPLOAD_MAX_BYTES = REPORT_UPLOAD_MAX_MB * 1024 * 1024;
export const CONSENT_STORAGE_KEY = "reportrx-consent";
