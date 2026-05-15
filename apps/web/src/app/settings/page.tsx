"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { readConsentPreference, writeConsentPreference } from "@/lib/consent";

export default function SettingsPage() {
  const [consent, setConsent] = useState<boolean | null>(() => readConsentPreference());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (consent === null) return;
    writeConsentPreference(consent);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  return (
    <main id="main-content" className="min-h-screen bg-background px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Link
          href="/app"
          className="inline-flex w-fit items-center justify-center gap-2 rounded-lg px-0 text-sm font-medium text-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" data-icon="inline-start" />
          Back to workspace
        </Link>

        <Card className="border-border/60 bg-card/90 shadow-sm backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-3xl">Settings</CardTitle>
                <CardDescription>Update your consent preference whenever you want.</CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                <ShieldCheck className="size-3.5" />
                Privacy
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm leading-6 text-foreground">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border-border"
                checked={consent ?? false}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span>
                Allow my reports to be processed by third-party AI providers.
                <span className="mt-1 block text-xs text-muted-foreground">
                  This preference is saved locally in this workspace.
                </span>
              </span>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Current status: {consent === null ? "not set" : consent ? "enabled" : "disabled"}
              </p>
              <Button onClick={handleSave} disabled={consent === null}>
                Save changes
              </Button>
            </div>

            {saved ? <p className="text-sm text-emerald-700">Saved.</p> : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
