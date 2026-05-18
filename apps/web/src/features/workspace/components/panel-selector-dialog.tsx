"use client";

import { useState } from "react";
import {
  FileText,
  FlaskConical,
  Syringe,
  Heart,
  Activity,
  Droplets,
  Loader2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/* ── Panel definitions ──────────────────────────── */

export type PanelSlug = "cbc" | "kft" | "lft" | "lipid" | "thyroid" | "diabetes";

export type PanelInfo = {
  slug: PanelSlug;
  name: string;
  description: string;
  icon: React.ReactNode;
  tests: string[]; // count shown in UI
};

export const AVAILABLE_PANELS: PanelInfo[] = [
  {
    slug: "cbc",
    name: "Complete Blood Count",
    description: "Anemia, infection, blood cell health",
    icon: <Droplets className="size-4" aria-hidden="true" />,
    tests: ["Hemoglobin", "RBC", "WBC", "Platelets", "MCV", "MCH", "Differential"],
  },
  {
    slug: "kft",
    name: "Kidney Function Test",
    description: "Kidney health, creatinine, urea, electrolytes",
    icon: <Activity className="size-4" aria-hidden="true" />,
    tests: ["Creatinine", "Urea", "Uric Acid", "Sodium", "Potassium", "Calcium"],
  },
  {
    slug: "lft",
    name: "Liver Function Test",
    description: "Liver enzymes, bilirubin, proteins",
    icon: <FlaskConical className="size-4" aria-hidden="true" />,
    tests: ["ALT", "AST", "ALP", "Bilirubin", "Albumin", "Total Protein"],
  },
  {
    slug: "lipid",
    name: "Lipid Profile",
    description: "Cholesterol, triglycerides, cardiovascular risk",
    icon: <Heart className="size-4" aria-hidden="true" />,
    tests: ["Total Cholesterol", "HDL", "LDL", "Triglycerides", "VLDL"],
  },
  {
    slug: "thyroid",
    name: "Thyroid Profile",
    description: "Thyroid function, TSH, T3, T4",
    icon: <Syringe className="size-4" aria-hidden="true" />,
    tests: ["TSH", "Free T3", "Free T4"],
  },
  {
    slug: "diabetes",
    name: "Diabetes Profile",
    description: "Blood sugar, HbA1c, insulin",
    icon: <Activity className="size-4" aria-hidden="true" />,
    tests: ["Glucose Fasting", "HbA1c", "Glucose PP", "Insulin"],
  },
];

/* ── Props ───────────────────────────────────────── */

type PanelSelectorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (panels: PanelSlug[]) => void;
  uploading: boolean;
};

/* ── Component ───────────────────────────────────── */

export function PanelSelectorDialog({
  open,
  onOpenChange,
  onConfirm,
  uploading,
}: PanelSelectorDialogProps) {
  const [selected, setSelected] = useState<Set<PanelSlug>>(new Set());
  const [mode, setMode] = useState<"auto" | "manual">("auto");

  const togglePanel = (slug: PanelSlug) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (mode === "auto") {
      onConfirm([]);
    } else {
      onConfirm(Array.from(selected));
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={open ? "open" : "closed"} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5 text-[var(--primary)]" aria-hidden="true" />
            Report panels
          </DialogTitle>
          <DialogDescription>
            Select what kind of tests this report contains. This helps us show you
            more accurate reference ranges and catch any missing tests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Auto-detect mode */}
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors ${
              mode === "auto"
                ? "border-[var(--primary)]/30 bg-[var(--primary)]/5"
                : "border-[var(--border)]/40 hover:border-[var(--border)]"
            }`}
          >
            <input
              type="radio"
              name="panel-mode"
              value="auto"
              checked={mode === "auto"}
              onChange={() => setMode("auto")}
              className="mt-0.5 size-4 accent-[var(--primary)]"
            />
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                Auto-detect from document
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                We&apos;ll analyze the report and figure out which tests it contains.
                Recommended for most reports.
              </p>
            </div>
          </label>

          {/* Manual mode */}
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors ${
              mode === "manual"
                ? "border-[var(--primary)]/30 bg-[var(--primary)]/5"
                : "border-[var(--border)]/40 hover:border-[var(--border)]"
            }`}
          >
            <input
              type="radio"
              name="panel-mode"
              value="manual"
              checked={mode === "manual"}
              onChange={() => setMode("manual")}
              className="mt-0.5 size-4 accent-[var(--primary)]"
            />
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                Select panels manually
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Tell us what your report covers. Useful for specialized or partial reports.
              </p>
            </div>
          </label>

          {/* Panel grid (only visible in manual mode) */}
          {mode === "manual" && (
            <div className="grid grid-cols-2 gap-2 pl-7">
              {AVAILABLE_PANELS.map((panel) => {
                const isSelected = selected.has(panel.slug);
                return (
                  <button
                    key={panel.slug}
                    type="button"
                    onClick={() => togglePanel(panel.slug)}
                    className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                      isSelected
                        ? "border-[var(--primary)]/30 bg-[var(--primary)]/8"
                        : "border-[var(--border)]/40 bg-[var(--card)] hover:border-[var(--border)]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 shrink-0 ${
                        isSelected
                          ? "text-[var(--primary)]"
                          : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      {panel.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--foreground)]">
                        {panel.name}
                      </p>
                      <p className="mt-0.5 truncate text-[0.6rem] text-[var(--muted-foreground)]">
                        {panel.tests.slice(0, 3).join(", ")}
                        {panel.tests.length > 3 && "…"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                Uploading…
              </>
            ) : mode === "auto" ? (
              "Upload & auto-detect"
            ) : selected.size === 0 ? (
              "Upload without panels"
            ) : (
              `Upload (${selected.size} panel${selected.size > 1 ? "s" : ""})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
