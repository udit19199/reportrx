"use client";

import { useRef, useState } from "react";
import {
  Loader2,
  Trash2,
  Upload,
  FileText,
  MoreVertical,
  BookOpen,
  Plus,
} from "lucide-react";

import { InteractiveRow } from "@/components/interactive-row";
import type { ApiReport } from "@/lib/api";
import { REPORT_UPLOAD_MAX_BYTES, REPORT_UPLOAD_MAX_MB } from "@/lib/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

type ReportSidebarProps = {
  reports: ApiReport[];
  selected: ApiReport | null;
  uploading: boolean;
  loading: boolean;
  uploadError: string;
  onSelect: (report: ApiReport) => void;
  onUpload: (file: File) => void;
  onDelete: (reportId: string) => void;
};

/* ── Upload Zone ──────────────────────────────────── */

function UploadZone({
  uploading,
  onUpload,
  uploadError,
  hasReports,
}: Pick<ReportSidebarProps, "uploading" | "onUpload"> & { uploadError?: string; hasReports: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compact button when reports exist
  if (hasReports) {
    return (
      <div className="flex flex-col gap-2">
        <input
          type="file"
          className="hidden"
          accept="application/pdf"
          id="upload-report"
          ref={fileInputRef}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > REPORT_UPLOAD_MAX_BYTES) {
              alert(`File is too large. Maximum size is ${REPORT_UPLOAD_MAX_MB}MB.`);
              event.target.value = "";
              return;
            }
            onUpload(file);
            event.target.value = "";
          }}
        />
        <label htmlFor="upload-report" className="w-full">
          <span className="inline-flex h-7 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 text-xs font-medium transition-colors hover:bg-[var(--muted)]">
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {uploading ? "Uploading..." : "Upload report"}
          </span>
        </label>
        {uploadError && (
          <p className="text-xs text-destructive">{uploadError}</p>
        )}
      </div>
    );
  }

  // Full drop zone for empty state
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-[var(--border)]/50 bg-[var(--muted)]/20 p-5 text-center">
      <input
        type="file"
        className="hidden"
        accept="application/pdf"
        id="upload-report"
        ref={fileInputRef}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (file.size > REPORT_UPLOAD_MAX_BYTES) {
            alert(`File is too large. Maximum size is ${REPORT_UPLOAD_MAX_MB}MB.`);
            event.target.value = "";
            return;
          }
          onUpload(file);
          event.target.value = "";
        }}
      />
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--primary)]/10">
          <Upload className="size-4 text-[var(--primary)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">Upload a report</p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            PDF up to {REPORT_UPLOAD_MAX_MB}MB
          </p>
        </div>
        <label
          htmlFor="upload-report"
          className="mt-2 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)]/60 bg-[var(--card)] px-3 text-xs font-medium text-[var(--foreground)] transition-all duration-200 hover:bg-[var(--muted)] active:scale-95"
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <span>Choose file</span>
          )}
        </label>
      </div>
      {uploadError && (
        <p className="mt-2 text-xs text-destructive">{uploadError}</p>
      )}
    </div>
  );
}

/* ── Report List Item ─────────────────────────────── */

function ReportListItem({
  report,
  active,
  onSelect,
  onDelete,
}: {
  report: ApiReport;
  active: boolean;
  onSelect: (report: ApiReport) => void;
  onDelete: (reportId: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isProcessing = report.status === "processing" || report.status === "pending";

  const statusColor =
    report.status === "ready"
      ? "bg-emerald-500"
      : report.status === "failed"
        ? "bg-red-400"
        : "bg-[var(--primary)]/40";

  return (
    <>
      <InteractiveRow
        onClick={() => onSelect(report)}
        active={active}
        className="flex w-full items-start gap-3 rounded-lg p-3"
      >
        {/* Status dot */}
        <span
          className={`mt-1.5 size-2 shrink-0 rounded-full ${statusColor} ${
            isProcessing ? "animate-pulse" : ""
          }`}
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--foreground)]">
            {report.filename}
          </p>
          <p className="mt-px text-xs text-[var(--muted-foreground)]">
            {new Date(report.uploadedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <div className="mt-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-medium tracking-wide ${
                report.status === "ready"
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : report.status === "failed"
                    ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                    : "bg-[var(--primary)]/8 text-[var(--primary)]"
              }`}
            >
              {isProcessing && (
                <span className="inline-block size-1.5 rounded-full bg-current animate-pulse" />
              )}
              {report.status === "ready"
                ? "Ready"
                : report.status === "failed"
                  ? "Failed"
                  : report.status === "processing" || report.status === "pending"
                    ? "Processing"
                    : report.status}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="relative z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <MoreVertical className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen(true);
              }}
            >
              <Trash2 className="size-3.5" data-icon="inline-start" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </InteractiveRow>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{report.filename}&rdquo; and all
              its analysis data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(report.id);
                setConfirmOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ── Skeletons ────────────────────────────────────── */

function ReportListSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg p-3">
          <Skeleton className="mt-1.5 size-2 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Sidebar ──────────────────────────────────────── */

export function ReportSidebar({
  reports,
  selected,
  uploading,
  loading,
  uploadError,
  onSelect,
  onUpload,
  onDelete,
}: ReportSidebarProps) {
  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-[var(--border)]/30 bg-[var(--card)]/50">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-[var(--border)]/30 px-4 py-3">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--primary)]/8">
          <BookOpen className="size-3.5 text-[var(--primary)]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-medium tracking-tight text-[var(--foreground)]">
            Your Reports
          </h2>
          <p className="truncate text-[0.65rem] text-[var(--muted-foreground)]">
            {reports.length} uploaded
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
        {/* Upload zone */}
        <UploadZone
          uploading={uploading}
          onUpload={onUpload}
          uploadError={uploadError}
          hasReports={reports.length > 0}
        />

        {/* Report list */}
        <div className="flex flex-col gap-1">
          {loading ? (
            <ReportListSkeleton />
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--border)]/40 px-4 py-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--muted)]/50">
                <FileText className="size-5 text-[var(--muted-foreground)]/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  No reports yet
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]/70 leading-relaxed">
                  Upload a PDF report to get started
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-px">
              {reports.map((report) => (
                <ReportListItem
                  key={report.id}
                  report={report}
                  active={selected?.id === report.id}
                  onSelect={onSelect}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
