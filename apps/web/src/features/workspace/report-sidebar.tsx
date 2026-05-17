"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Settings2,
  Trash2,
  Upload,
  FileText,
  MoreVertical,
  TrendingUp,
} from "lucide-react";

import type { ApiReport } from "@/lib/api";
import { REPORT_UPLOAD_MAX_BYTES, REPORT_UPLOAD_MAX_MB } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

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

function UploadPanel({
  uploading,
  onUpload,
  uploadError,
}: Pick<ReportSidebarProps, "uploading" | "onUpload"> & { uploadError?: string }) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== "application/pdf") {
        return;
      }
      if (file.size > REPORT_UPLOAD_MAX_BYTES) {
        return;
      }
      onUpload(file);
    },
    [onUpload]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      dragCounterRef.current = 0;
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const borderClasses = dragging
    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
    : "border-border bg-muted/30 hover:bg-muted/60";

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`flex flex-col gap-3 rounded-2xl border border-dashed p-4 transition-all ${borderClasses}`}
    >
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
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-foreground">Upload a report</p>
          <p className="text-sm text-muted-foreground">PDF up to {REPORT_UPLOAD_MAX_MB}MB.</p>
        </div>
        <label
          htmlFor="upload-report"
          className="inline-flex h-7 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" data-icon="inline-start" />
          )}
          {uploading ? "Uploading" : "Choose PDF"}
        </label>
      </div>
      {uploadError ? (
        <p className="text-sm text-destructive">{uploadError}</p>
      ) : null}
      {dragging && (
        <p className="text-sm text-primary font-medium text-center">Drop your PDF here</p>
      )}
    </div>
  );
}

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

  const classes = active
    ? "border-primary/30 bg-primary/5 shadow-sm"
    : "border-border bg-background hover:border-primary/20 hover:bg-muted/40";

  const isProcessing = report.status === "processing" || report.status === "pending";

  return (
    <>
      <div className={`rounded-2xl border p-4 transition-colors ${classes}`}>
        <div className="flex items-start gap-3">
          <FileText className="size-4 mt-1 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1" onClick={() => onSelect(report)}>
            <p className="truncate font-medium text-foreground cursor-pointer">{report.filename}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(report.uploadedAt).toLocaleString()}
            </p>
            {isProcessing && (
              <div className="mt-2 flex items-center gap-2">
                <Loader2 className="size-3 animate-spin text-primary" />
                <Progress value={30} className="h-1 flex-1" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant={report.status === "failed" ? "destructive" : "secondary"}>
              {report.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none hover:bg-muted hover:text-foreground size-6 rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-3"
              >
                <MoreVertical className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="size-3.5" data-icon="inline-start" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{report.filename}&rdquo; and all its analysis data. This action cannot be undone.
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

function ReportListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="size-4 mt-1 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

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
    <aside className="flex min-h-screen flex-col border-b border-border/60 bg-card/90 backdrop-blur xl:sticky xl:top-0 xl:border-b-0 xl:border-r">
      <div className="flex h-full flex-col">
        <div className="px-6 py-5 border-b border-border/60">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-display font-medium">Workspace</h2>
              <p className="text-sm text-muted-foreground mt-1">Upload and manage your reports</p>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 px-6 py-5">
          <UploadPanel uploading={uploading} onUpload={onUpload} uploadError={uploadError} />

          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Reports</p>
                <p className="text-xs text-muted-foreground">
                  {reports.length} {reports.length === 1 ? "report" : "reports"}
                </p>
              </div>
            </div>
            <Separator />

            <div className="min-h-0 flex-1 overflow-auto pr-1">
              <div className="flex flex-col gap-2">
                {loading ? (
                  <ReportListSkeleton />
                ) : reports.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
                    <FileText className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No reports yet.</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Upload a PDF to get started.</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <ReportListItem
                      key={report.id}
                      report={report}
                      active={selected?.id === report.id}
                      onSelect={onSelect}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-2 flex flex-col gap-2">
            <Link
              href="/app/trends"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <TrendingUp className="size-4" data-icon="inline-start" />
              Trends
            </Link>
            <Link
              href="/settings"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Settings2 className="size-4" data-icon="inline-start" />
              Settings
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
