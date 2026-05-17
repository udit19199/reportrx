"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { readConsentPreference, writeConsentPreference } from "@/lib/consent";

export function SettingsClient() {
  const [consent, setConsent] = useState<boolean | null>(() => readConsentPreference());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (consent === null) return;
    setSaving(true);
    writeConsentPreference(consent);
    setSaved(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSaved(false);
    setSaving(false);
  };

  return (
    <main id="main-content" className="min-h-screen bg-background px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Link
          href="/app"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-4" data-icon="inline-start" />
          Back to workspace
        </Link>

        <Card className="border-border/60 bg-card/90 shadow-sm backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-display">Settings</CardTitle>
                <CardDescription>Manage your privacy and consent preferences.</CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                <ShieldCheck className="size-3.5" />
                Privacy
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <Alert>
              <ShieldCheck className="size-4" />
              <AlertDescription>
                Your consent preference controls whether uploaded reports are processed by third-party AI providers. This setting is stored locally in your browser.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 p-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="consent-toggle" className="text-sm font-medium text-foreground">
                  AI Processing Consent
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow reports to be processed by third-party AI providers.
                </p>
              </div>
              <Switch
                id="consent-toggle"
                checked={consent ?? false}
                onCheckedChange={(checked) => setConsent(checked)}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Status:{" "}
                <span className={consent ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                  {consent === null ? "Not set" : consent ? "Enabled" : "Disabled"}
                </span>
              </p>
              <Button onClick={handleSave} disabled={consent === null || saving}>
                {saving && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>

            {saved && (
              <Alert>
                <AlertDescription className="text-emerald-600">
                  Preference saved successfully.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
