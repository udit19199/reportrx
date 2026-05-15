"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { api, type ApiReport } from "@/lib/api";
import { readConsentPreference } from "@/lib/consent";

export type WorkspaceController = {
  reports: ApiReport[];
  selected: ApiReport | null;
  query: string;
  answer: string | null;
  sources: string[];
  analyzing: boolean;
  uploading: boolean;
  error: string;
  consentGranted: boolean;
  setQuery: (value: string) => void;
  selectReport: (report: ApiReport) => void;
  uploadReport: (file: File) => Promise<void>;
  analyzeSelected: () => Promise<void>;
  deleteSelected: () => Promise<void>;
  refreshReports: () => Promise<void>;
};

type Options = {
  initialReports: ApiReport[];
};

export const useWorkspaceController = ({ initialReports }: Options): WorkspaceController => {
  const [reports, setReports] = useState<ApiReport[]>(initialReports);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(initialReports[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [consentPreference, setConsentPreference] = useState<boolean | null>(() => readConsentPreference());

  const selected = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId]
  );
  const consentGranted = consentPreference === true;

  useEffect(() => {
    const syncConsent = () => {
      setConsentPreference(readConsentPreference());
    };

    window.addEventListener("storage", syncConsent);
    return () => window.removeEventListener("storage", syncConsent);
  }, []);

  const clearAnalysisState = useCallback(() => {
    setAnswer(null);
    setSources([]);
  }, []);

  const refreshReports = useCallback(async () => {
    const data = await api.listReports();
    setReports(data.reports);
    setSelectedReportId((currentId) => {
      if (currentId && data.reports.some((report) => report.id === currentId)) {
        return currentId;
      }

      return data.reports[0]?.id ?? null;
    });
  }, []);

  useEffect(() => {
    const hasProcessingReports = reports.some(
      (report) => report.status === "processing" || report.status === "pending"
    );

    if (!hasProcessingReports) return;

    const timer = window.setInterval(() => {
      void refreshReports().catch((err) => setError((err as Error).message));
    }, 4000);

    return () => window.clearInterval(timer);
  }, [refreshReports, reports]);

  const selectReport = useCallback(
    (report: ApiReport) => {
      setSelectedReportId(report.id);
      setError("");
      clearAnalysisState();
    },
    [clearAnalysisState]
  );

  const uploadReport = async (file: File) => {
    setUploading(true);
    setError("");

    try {
      await api.uploadReport(file);
      await refreshReports();
      clearAnalysisState();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const analyzeSelected = async () => {
    if (!selected) return;

    setAnalyzing(true);
    setError("");
    clearAnalysisState();

    try {
      const data = await api.analyze(selected.id, query);
      setAnswer(data.answer);
      setSources(data.sources ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  const deleteSelected = async () => {
    if (!selected) return;

    setError("");

    try {
      await api.deleteReport(selected.id);
      clearAnalysisState();
      setSelectedReportId(null);
      await refreshReports();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return {
    reports,
    selected,
    query,
    answer,
    sources,
    analyzing,
    uploading,
    error,
    consentGranted,
    setQuery,
    selectReport,
    uploadReport,
    analyzeSelected,
    deleteSelected,
    refreshReports,
  };
};
