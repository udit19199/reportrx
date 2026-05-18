"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { api, type ApiReport, type TrendDataPoint } from "@/lib/api";

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
  trends: Record<string, TrendDataPoint[]>;
  reprocessingReportId: string | null;
  setQuery: (value: string) => void;
  selectReport: (report: ApiReport) => void;
  uploadReport: (file: File, panels?: string[]) => Promise<void>;
  analyzeSelected: () => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  renameReport: (reportId: string, newFilename: string) => Promise<void>;
  reprocessReport: (reportId: string) => Promise<void>;
  refreshReports: () => Promise<void>;
};

type Options = {
  initialReports: ApiReport[];
  initialTrends?: Record<string, TrendDataPoint[]>;
};

export const useWorkspaceController = ({ initialReports, initialTrends = {} }: Options): WorkspaceController => {
  const [reports, setReports] = useState<ApiReport[]>(initialReports);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(initialReports[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Start with server-provided data; no loading skeleton needed
  // since data is pre-fetched server-side via getServerReports()
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [reprocessingReportId, setReprocessingReportId] = useState<string | null>(null);
  const [trends, setTrends] = useState<Record<string, TrendDataPoint[]>>(initialTrends);

  const selected = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId]
  );

  // Refresh trends on mount for data that may have updated since SSR
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

  // No fallback fetch needed — initialReports comes from the server.
  // If server returned no data, the empty state guides the user to upload.

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

  const uploadReport = async (file: File, panels?: string[]) => {
    setUploading(true);
    setUploadError("");

    try {
      const result = await api.uploadReport(file, panels);
      toast.success("Report uploaded — processing has started");
      // Optimistically add to list so it appears immediately (server will
      // have the freshest data after refreshReports completes)
      setReports((prev) => [result.report, ...prev.filter((r) => r.id !== result.report.id)]);
      setSelectedReportId(result.report.id);
      setAnswer(null);
      setSources([]);
      await refreshReports();
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

  const renameReport = useCallback(async (reportId: string, newFilename: string) => {
    try {
      await api.renameReport(reportId, newFilename);
      toast.success("Report renamed");
      await refreshReports();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, [refreshReports]);

  const reprocessReport = useCallback(async (reportId: string) => {
    setReprocessingReportId(reportId);
    try {
      await api.reprocessReport(reportId);
      toast.success("Reprocessing has started");
      await refreshReports();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setReprocessingReportId(null);
    }
  }, [refreshReports]);

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
    trends,
    reprocessingReportId,
    setQuery,
    selectReport,
    uploadReport,
    analyzeSelected,
    deleteReport,
    renameReport,
    reprocessReport,
    refreshReports,
  };
};
