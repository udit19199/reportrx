"use client";

import Link from "next/link";
import { Loader2, Settings2, Trash2, Upload } from "lucide-react";

import type { ApiReport } from "@/lib/api";
import { REPORT_UPLOAD_MAX_BYTES, REPORT_UPLOAD_MAX_MB } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ReportSidebarProps = {
  reports: ApiReport[];
  selected: ApiReport | null;
  uploading: boolean;
  onSelect: (report: ApiReport) => void;
  onUpload: (file: File) => void;
  onDelete: (reportId: string) => void;
};

function UploadPanel({ uploading, onUpload }: Pick<ReportSidebarProps, "uploading" | "onUpload">) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4 transition-colors hover:bg-muted/60">
      <input
        type="file"
        className="hidden"
        accept="application/pdf"
        id="upload-report"
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
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" data-icon="inline-start" />}
          {uploading ? "Uploading" : "Choose PDF"}
        </label>
      </div>
    </div>
  );
}

function ReportListItem({
  report,
  active,
  onSelect,
}: {
  report: ApiReport;
  active: boolean;
  onSelect: (report: ApiReport) => void;
}) {
  const classes = active
    ? "border-primary/30 bg-primary/5 shadow-sm"
    : "border-border bg-background hover:border-primary/20 hover:bg-muted/40";

  return (
    <button className={`rounded-2xl border p-4 text-left transition-colors ${classes}`} onClick={() => onSelect(report)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{report.filename}</p>
          <p className="mt-1 text-xs text-muted-foreground">{new Date(report.uploadedAt).toLocaleString()}</p>
        </div>
        <Badge variant={report.status === "failed" ? "destructive" : "secondary"}>{report.status}</Badge>
      </div>
    </button>
  );
}

export function ReportSidebar({ reports, selected, uploading, onSelect, onUpload, onDelete }: ReportSidebarProps) {
  return (
    <aside className="flex min-h-screen flex-col border-b border-border/60 bg-card/90 backdrop-blur xl:sticky xl:top-0 xl:border-b-0 xl:border-r">
      <Card className="flex h-full flex-col rounded-none border-0 bg-transparent shadow-none">
        <CardHeader className="border-b border-border/60 px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">Workspace</CardTitle>
              <CardDescription>Reports up top, settings below.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-5 px-6 py-5">
          <UploadPanel uploading={uploading} onUpload={onUpload} />

          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Reports</p>
                <p className="text-xs text-muted-foreground">Resume Q&A from any uploaded document.</p>
              </div>
            </div>
            <Separator />

            <div className="min-h-0 flex-1 overflow-auto pr-1">
              <div className="flex flex-col gap-2">
                {reports.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                    No reports yet.
                  </div>
                ) : (
                  reports.map((report) => (
                    <ReportListItem
                      key={report.id}
                      report={report}
                      active={selected?.id === report.id}
                      onSelect={onSelect}
                    />
                  ))
                )}
              </div>
            </div>

            {selected ? (
              <Button variant="outline" size="sm" className="w-fit" onClick={() => onDelete(selected.id)}>
                <Trash2 className="size-4" data-icon="inline-start" />
                Delete selected
              </Button>
            ) : null}
          </div>

          <div className="mt-auto pt-2">
            <Link
              href="/settings"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Settings2 className="size-4" data-icon="inline-start" />
              Settings
            </Link>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
