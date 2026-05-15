import { CONSENT_STORAGE_KEY } from "./config";

export function readConsentPreference() {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (value === null) return null;

  return value === "true";
}

export function writeConsentPreference(value: boolean) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(CONSENT_STORAGE_KEY, String(value));
}
