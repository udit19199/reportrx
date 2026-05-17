"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { api, type ApiReport, type TrendDataPoint } from "@/lib/api";
import { readConsentPreference } from "@/lib/consent";

export type WorkspaceController = {
  reports: ApiReport[];
  selected: ApiReport | null;
  query: string;
  answer: string | null;
  sources: string[];
  analyzing: boolean;
  uploading: boolean;
  loading: boolean;
  uploadError: string;
  consentGranted: boolean;
  trends: Record<string, TrendDataPoint[]>;
  setQuery: (value: string) => void;
  selectReport: (report: ApiReport) => void;
  uploadReport: (file: File) => Promise<void>;
  analyzeSelected: () => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
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
  const [loading, setLoading] = useState(initialReports.length === 0);
  const [uploadError, setUploadError] = useState("");
  const [consentPreference, setConsentPreference] = useState<boolean | null>(() => readConsentPreference());
  const [trends, setTrends] = useState<Record<string, TrendDataPoint[]>>({});

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

  useEffect(() => {
    void api.getTrends().then((data) => setTrends(data.tests)).catch(() => {
      toast.error("Failed to load trends data");
    });
  }, []);

  const clearAnalysisState = useCallback(() => {
    setAnswer(null);
    setSources([]);
  }, []);

  const refreshReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listReports();
      setReports(data.reports);
      setSelectedReportId((currentId) => {
        if (currentId && data.reports.some((report) => report.id === currentId)) {
          return currentId;
        }
        return data.reports[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialReports.length === 0) {
      void refreshReports();
    }
  }, [initialReports.length, refreshReports]);

  // Refresh when reports change to stop polling if nothing is processing
  useEffect(() => {
    const hasProcessingReports = reports.some(
      (report) => report.status === "processing" || report.status === "pending"
    );

    if (!hasProcessingReports) return;

    const timer = window.setInterval(() => {
      void refreshReports().catch((err) => {
        toast.error((err as Error).message);
      });
    }, 4000);

    return () => window.clearInterval(timer);
  }, [refreshReports, reports]);

  const selectReport = useCallback(
    (report: ApiReport) => {
      setSelectedReportId(report.id);
      setUploadError("");
      clearAnalysisState();
    },
    [clearAnalysisState]
  );

  const uploadReport = async (file: File) => {
    setUploading(true);
    setUploadError("");

    try {
      await api.uploadReport(file);
      toast.success("Report uploaded — processing has started");
      await refreshReports();
      clearAnalysisState();
    } catch (err) {
      const message = (err as Error).message;
      setUploadError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const analyzeSelected = async () => {
    if (!selected) return;

    setAnalyzing(true);
    setUploadError("");
    clearAnalysisState();

    try {
      const data = await api.analyze(selected.id, query);
      setAnswer(data.answer);
      setSources(data.sources ?? []);
    } catch (err) {
      const message = (err as Error).message;
      toast.error(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const deleteReport = useCallback(async (reportId: string) => {
    setUploadError("");

    try {
      await api.deleteReport(reportId);
      toast.success("Report deleted");
      // Always clear selection & analysis if the deleted report was selected
      // Use the reportId param directly instead of relying on `selected` closure
      setSelectedReportId((currentId) => {
        if (currentId === reportId) return null;
        return currentId;
      });
      clearAnalysisState();
      await refreshReports();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, [clearAnalysisState, refreshReports]);

  return {
    reports,
    selected,
    query,
    answer,
    sources,
    analyzing,
    uploading,
    loading,
    uploadError,
    consentGranted,
    trends,
    setQuery,
    selectReport,
    uploadReport,
    analyzeSelected,
    deleteReport,
    refreshReports,
  };
};
