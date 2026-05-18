"use client";

import { useRef, useState, useMemo } from "react";
import {
  Loader2,
  Trash2,
  Upload,
  FileText,
  MoreVertical,
  Plus,
  Search,
  X,
  BookOpen,
  Pencil,
  RefreshCw,
  GitCompare,
  CheckSquare,
  Square,
} from "lucide-react";

import type { ApiReport } from "@/lib/api";
import { PanelSelectorDialog, type PanelSlug } from "./panel-selector-dialog";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type ReportsDrawerProps = {
  open: boolean;
  onClose: () => void;
  reports: ApiReport[];
  selected: ApiReport | null;
  uploading: boolean;
  loading: boolean;
  uploadError: string;
  onSelect: (report: ApiReport) => void;
  onUpload: (file: File, panels?: string[]) => void;
  onDelete: (reportId: string) => void;
  onRename: (reportId: string, newFilename: string) => Promise<void>;
  onReprocess: (reportId: string) => Promise<void>;
  onRefresh: () => void;
  compareMode: boolean;
  compareSelection: string[];
  onToggleCompareMode: () => void;
  onCompareSelect: (reportId: string) => void;
  onStartCompare: () => void;
};

/* ── Upload Zone ────────────────────────────────── */

function UploadZone({
  uploading,
  uploadError,
  onPendingFile,
}: Pick<ReportsDrawerProps, "uploading" | "uploadError"> & {
  onPendingFile: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sizeError, setSizeError] = useState("");

  return (
    <div>
      <input
        type="file"
        className="hidden"
        accept="application/pdf"
        id="drawer-upload"
        ref={fileInputRef}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setSizeError("");
          if (file.size > REPORT_UPLOAD_MAX_BYTES) {
            setSizeError(`File is too large. Maximum size is ${REPORT_UPLOAD_MAX_MB}MB.`);
            event.target.value = "";
            return;
          }
          onPendingFile(file);
          event.target.value = "";
        }}
      />
      <label
        htmlFor="drawer-upload"
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)]/60 px-4 py-2.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:border-[var(--border)] hover:bg-[var(--muted)]/30"
      >
        {uploading ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Plus className="size-3.5" aria-hidden="true" />
        )}
        {uploading ? "Uploading…" : "Upload PDF"}
      </label>
      {(sizeError || uploadError) && (
        <p className="mt-1.5 text-xs text-destructive">{sizeError || uploadError}</p>
      )}
    </div>
  );
}

/* ── Report Item ─────────────────────────────────── */

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function ReportItem({
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
      <button
        onClick={() => onSelect(report)}
        className={`group relative flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
          active
            ? "bg-[var(--primary)]/8"
            : "hover:bg-[var(--muted)]/40"
        }`}
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
            {dateFormatter.format(new Date(report.uploadedAt))}
          </p>
        </div>

        <span
          className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-medium tracking-wide ${
            report.status === "ready"
              ? "bg-emerald-50 text-emerald-600"
              : report.status === "failed"
                ? "bg-red-50 text-red-600"
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
              : "Processing"}
        </span>
      </button>

      {/* Delete confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{report.filename}&rdquo; and all
              its analysis data.
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

/* ── Skeletons ───────────────────────────────────── */

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2.5">
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

/* ── Drawer ──────────────────────────────────────── */

export function ReportsDrawer({
  open,
  onClose,
  reports,
  selected,
  uploading,
  loading,
  uploadError,
  onSelect,
  onUpload,
  onDelete,
  onRename,
  onReprocess,
  onRefresh,
  compareMode,
  compareSelection,
  onToggleCompareMode,
  onCompareSelect,
  onStartCompare,
}: ReportsDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [renameTarget, setRenameTarget] = useState<ApiReport | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [panelDialogOpen, setPanelDialogOpen] = useState(false);

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase();
    return reports.filter(
      (r) =>
        r.filename.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
    );
  }, [reports, searchQuery]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-black/15 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed left-16 top-0 bottom-0 z-40 flex w-96 flex-col border-r border-[var(--border)]/50 bg-[var(--card)] shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)]/30 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--primary)]/8">
              <BookOpen className="size-3.5 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[var(--foreground)]">
                Reports
              </h2>
              <p className="text-[0.65rem] text-[var(--muted-foreground)]">
                {reports.length} uploaded
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleCompareMode}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.65rem] font-medium transition-colors ${
                compareMode
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              }`}
              aria-label={compareMode ? "Exit compare mode" : "Compare reports"}
            >
              <GitCompare className="size-3.5" aria-hidden="true" />
              {compareMode ? "Done" : "Compare"}
            </button>
            <button
              onClick={onClose}
              className="flex size-6 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              aria-label="Close reports panel"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-3 overflow-y-auto px-3 py-3">
            {/* Upload */}
            <UploadZone
              uploading={uploading}
              uploadError={uploadError}
              onPendingFile={(file) => {
                setPendingFile(file);
                setPanelDialogOpen(true);
              }}
            />

            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted-foreground)]/50" />
              <input
                type="text"
                placeholder="Search reports…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search reports"
                className="w-full rounded-lg border border-[var(--border)]/50 bg-[var(--background)] py-2 pl-8 pr-3 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/40 focus:border-[var(--primary)]/30 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/20"
              />
            </div>

            {/* List */}
            <div className="flex flex-col gap-px">
            {loading ? (
              <DrawerSkeleton />
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--muted)]/50">
                  <FileText className="size-5 text-[var(--muted-foreground)]/40" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {searchQuery ? "No matches" : "No reports yet"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]/70">
                    {searchQuery
                      ? "Try a different search term"
                      : "Upload a PDF report to get started"}
                  </p>
                </div>
              </div>
            ) : compareMode ? (
              filteredReports.map((report) => {
                const isSelected = compareSelection.includes(report.id);
                const isDisabled = !isSelected && compareSelection.length >= 2;
                return (
                  <button
                    key={report.id}
                    onClick={() => onCompareSelect(report.id)}
                    disabled={isDisabled}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-[var(--primary)]/8"
                        : isDisabled
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-[var(--muted)]/40"
                    }`}
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center">
                      {isSelected ? (
                        <CheckSquare className="size-5 text-[var(--primary)]" aria-hidden="true" />
                      ) : (
                        <Square className="size-5 text-[var(--muted-foreground)]/40" aria-hidden="true" />
                      )}
                    </span>
                    <span
                      className={`mt-0.5 size-2 shrink-0 rounded-full ${
                        report.status === "ready"
                          ? "bg-emerald-500"
                          : report.status === "failed"
                            ? "bg-red-400"
                            : "bg-[var(--primary)]/40"
                      } ${report.status === "processing" || report.status === "pending" ? "animate-pulse" : ""}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {report.filename}
                      </p>
                      <p className="mt-px text-xs text-[var(--muted-foreground)]">
                        {dateFormatter.format(new Date(report.uploadedAt))}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[0.625rem] font-medium tracking-wide ${
                        report.status === "ready"
                          ? "bg-emerald-50 text-emerald-600"
                          : report.status === "failed"
                            ? "bg-red-50 text-red-600"
                            : "bg-[var(--primary)]/8 text-[var(--primary)]"
                      }`}
                    >
                      {report.status === "ready"
                        ? "Ready"
                        : report.status === "failed"
                          ? "Failed"
                          : "Processing"}
                    </span>
                  </button>
                );
              })
            ) : (
              filteredReports.map((report) => (
                <div key={report.id} className="group relative">
                  <ReportItem
                    report={report}
                    active={selected?.id === report.id}
                    onSelect={onSelect}
                    onDelete={onDelete}
                  />
                  {/* Context menu trigger */}
                  <div className="absolute right-2 top-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        onClick={(e) => e.stopPropagation()}
                        className="flex size-6 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                        aria-label="More actions"
                      >
                        <MoreVertical className="size-3.5" aria-hidden="true" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="right">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameTarget(report);
                            setRenameValue(report.filename.replace(/\.pdf$/i, ""));
                          }}
                        >
                          <Pencil className="size-3.5" data-icon="inline-start" aria-hidden="true" />
                          Rename
                        </DropdownMenuItem>
                        {report.status === "failed" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onReprocess(report.id);
                            }}
                          >
                            <RefreshCw className="size-3.5" data-icon="inline-start" aria-hidden="true" />
                            Reprocess
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(report.id);
                          }}
                        >
                          <Trash2 className="size-3.5" data-icon="inline-start" aria-hidden="true" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Compare action bar — outside scroll area */}
        {compareMode && compareSelection.length === 2 && (
          <div className="border-t border-[var(--border)]/40 bg-[var(--card)] px-3 py-3">
            <Button
              className="w-full gap-2"
              size="sm"
              onClick={() => {
                onStartCompare();
                onClose();
              }}
            >
              <GitCompare className="size-3.5" aria-hidden="true" />
              Compare 2 reports
            </Button>
          </div>
        )}
      </div>
      </div>

      {/* Panel selector dialog */}
      <PanelSelectorDialog
        open={panelDialogOpen}
        onOpenChange={setPanelDialogOpen}
        uploading={uploading}
        onConfirm={(panels) => {
          if (pendingFile) {
            onUpload(pendingFile, panels.length > 0 ? panels : undefined);
            setPendingFile(null);
          }
        }}
      />

      {/* Rename dialog */}
      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
            setRenameValue("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename report</DialogTitle>
            <DialogDescription>
              Enter a new filename for &ldquo;{renameTarget?.filename}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!renameTarget || !renameValue.trim() || renaming) return;
              const finalName = renameValue.trim().endsWith(".pdf")
                ? renameValue.trim()
                : `${renameValue.trim()}.pdf`;
              setRenaming(true);
              await onRename(renameTarget.id, finalName);
              setRenaming(false);
              setRenameTarget(null);
              setRenameValue("");
            }}
          >
            <div className="py-4">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="New filename"
                autoFocus
                className="w-full"
              />
              <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                {renameValue.trim() && !renameValue.trim().endsWith(".pdf")
                  ? 'Will append ".pdf" extension'
                  : " "}
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRenameTarget(null);
                  setRenameValue("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!renameValue.trim() || renaming}>
                {renaming ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                    Renaming…
                  </>
                ) : (
                  "Rename"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
