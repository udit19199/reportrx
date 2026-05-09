"use client";

import { useEffect, useState } from "react";
import { api, type ApiReport } from "@/lib/api";

type AuthMode = "login" | "register";

export default function AppPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authed, setAuthed] = useState(false);
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [selected, setSelected] = useState<ApiReport | null>(null);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);

  const refreshReports = async (silent = false) => {
    try {
      const data = await api.listReports();
      setReports(data.reports);
      if (selected) {
        const updated = data.reports.find((r) => r.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch (err) {
      if (!silent) {
        setError((err as Error).message);
      }
      throw err;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await refreshReports(true);
        setAuthed(true);
      } catch (err) {
        // Not authed, ignore
      }
    };
    void checkAuth();
  }, []);

  useEffect(() => {
    if (authed) {
      void refreshReports();
    }
  }, [authed]);

  useEffect(() => {
    if (!selected || selected.status !== "processing") return;
    setProcessing(true);
    const timer = setInterval(() => {
      void refreshReports();
    }, 4000);
    return () => clearInterval(timer);
  }, [selected]);

  useEffect(() => {
    if (selected?.status === "ready") {
      setProcessing(false);
    }
  }, [selected]);

  const handleAuth = async () => {
    setAuthError("");
    try {
      if (mode === "register") {
        await api.register(email, password);
      } else {
        await api.login(email, password);
      }
      setAuthed(true);
    } catch (err) {
      setAuthError((err as Error).message);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      await api.uploadReport(file);
      await refreshReports();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selected) return;
    setLoading(true);
    setAnswer(null);
    setSources([]);
    try {
      const data = await api.analyze(selected.id, query);
      setAnswer(data.answer);
      setSources(data.sources ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    setError("");
    try {
      await api.deleteReport(reportId);
      if (selected?.id === reportId) {
        setSelected(null);
      }
      await refreshReports();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <main id="main-content" className="page-shell">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
        <section className="screen-grid section-frame">
          <aside className="card p-6 detail-card sticky-pane fade-up">
            <div className="panel-title">
              <div>
                <div className="panel-kicker">Your reports</div>
                <h1 className="mt-2 text-xl section-title">Workspace</h1>
              </div>
              <div className="chip rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em]">
                Secure
              </div>
            </div>

            {!authed ? (
              <>
                <p className="text-sm leading-6 text-slate-600">
                  Sign in or create an account to keep your reports private.
                </p>
                <div className="grid gap-3">
                  <input
                    className="input rounded-xl px-4 py-3"
                    name="email"
                    autoComplete="email"
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <input
                    className="input rounded-xl px-4 py-3"
                    name="password"
                    autoComplete="current-password"
                    placeholder="Password (min 8 chars)"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                {authError ? <p className="text-sm text-rose-600">{authError}</p> : null}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button className="primary-button rounded-xl px-5 py-3 font-semibold" onClick={handleAuth}>
                    {mode === "login" ? "Sign in" : "Create account"}
                  </button>
                  <button
                    className="ghost-button rounded-xl px-5 py-3"
                    onClick={() => setMode(mode === "login" ? "register" : "login")}
                  >
                    {mode === "login" ? "Need an account?" : "I have an account"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <label className="card ghost-panel p-4 text-sm text-slate-600">
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleUpload(file);
                    }}
                  />
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">Upload a report</p>
                      <p className="text-xs text-slate-500">PDF up to 20MB.</p>
                    </div>
                    <span className="primary-button rounded-full px-4 py-2 text-xs font-semibold">
                      {uploading ? "Uploading…" : "Choose PDF"}
                    </span>
                  </div>
                </label>

                <div className="card-muted rounded-2xl p-4">
                  <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={consent}
                      onChange={(event) => setConsent(event.target.checked)}
                    />
                    I understand this tool is informational only and my report will be processed by third-party AI
                    providers.
                  </label>
                </div>

                {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                <div className="stacked-list max-h-[45vh] overflow-auto pr-1">
                  {reports.length === 0 ? (
                    <p className="text-sm text-slate-500">No reports yet.</p>
                  ) : (
                    reports.map((report) => (
                      <button
                        key={report.id}
                        className={`report-item w-full rounded-xl px-4 py-3 text-left ${
                          selected?.id === report.id ? "active" : ""
                        }`}
                        onClick={() => setSelected(report)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{report.filename}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {new Date(report.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                          <span className="status-pill rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em]">
                            {report.status}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {selected ? (
                  <button className="ghost-button rounded-full px-4 py-2 text-xs" onClick={() => void handleDelete(selected.id)}>
                    Delete selected
                  </button>
                ) : null}
              </>
            )}
          </aside>

            <section className="card p-6 detail-card content-panel fade-up delay-2">
              {!authed ? (
                <div className="flex min-h-[540px] flex-col items-center justify-center px-4 text-center text-slate-500">
                  <div className="tagline">Private workspace</div>
                  <h2 className="mt-5 max-w-lg text-3xl leading-[1.05] tracking-[-0.02em] section-title text-slate-900">
                    Sign in to review reports and ask questions.
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
                  Your application remains separate from the public homepage, keeping the product and marketing
                  experiences cleanly divided.
                </p>
              </div>
                ) : !selected ? (
                <div className="flex min-h-[540px] flex-col items-center justify-center px-4 text-center text-slate-500">
                  <div className="tagline">Ready when you are</div>
                  <h2 className="mt-5 max-w-lg text-3xl leading-[1.05] tracking-[-0.02em] section-title text-slate-900">
                    Select a report to see the summary and ask questions.
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
                  Your report details will expand here with enough space for reading, questioning, and follow-up.
                </p>
              </div>
            ) : (
                <div className="content-scroll">
                  <div className="panel-title">
                    <div>
                      <div className="panel-kicker">Current report</div>
                      <h2 className="mt-2 text-3xl leading-[1.05] tracking-[-0.02em] section-title text-slate-900">{selected.filename}</h2>
                      <p className="mt-2 text-xs text-slate-500">Status: {selected.status}</p>
                    </div>
                    <button className="ghost-button rounded-full px-4 py-2 text-xs" onClick={() => void handleDelete(selected.id)}>
                      Delete
                  </button>
                </div>

                {processing && (
                  <div className="card-muted rounded-2xl p-4 flex items-center gap-3">
                    <span className="spinner" />
                    <p className="text-sm text-slate-600">Processing your report…</p>
                  </div>
                )}

                {selected.status === "failed" && (
                  <div className="card-muted rounded-2xl p-4 text-sm text-rose-600">
                    Ingestion failed. Please re-upload the report.
                  </div>
                )}

                {selected.status === "ready" ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="card-muted rounded-2xl p-5 note-card detail-card">
                      <div className="panel-title">
                        <h3 className="text-lg font-semibold">Summary</h3>
                        <span className="panel-kicker">At a glance</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                        {selected.summary || "Summary is generating..."}
                      </p>
                    </div>

                    <div className="card-muted rounded-2xl p-5 detail-card">
                      <div className="panel-title">
                        <h3 className="text-lg font-semibold">Ask a question</h3>
                        <span className="panel-kicker">Grounded in report</span>
                      </div>
                      <label htmlFor="report-question" className="sr-only">
                        Question
                      </label>
                      <textarea
                        id="report-question"
                        className="input min-h-[180px] w-full rounded-xl px-4 py-3"
                        placeholder="What does the impression mean?"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">Answers are grounded in your report only.</p>
                        <button
                          className="primary-button rounded-xl px-5 py-3 text-sm font-semibold"
                          onClick={handleAnalyze}
                          disabled={!query || !consent || loading}
                        >
                          {loading ? "Analyzing…" : "Get answer"}
                        </button>
                      </div>
                      {!consent && (
                        <p className="text-xs text-amber-700">Please acknowledge consent before analyzing.</p>
                      )}
                    </div>

                    {answer && (
                      <div className="card-muted rounded-2xl p-5 xl:col-span-2 detail-card note-card">
                        <div className="panel-title">
                          <h3 className="text-lg font-semibold">Answer</h3>
                          <span className="panel-kicker">Evidence-based response</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{answer}</p>
                        {sources.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {sources.map((source, index) => (
                              <span key={`${source}-${index}`} className="chip rounded-full px-3 py-1 text-xs">
                                {source}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="card-muted rounded-2xl p-5 text-sm text-slate-600">
                    Report is not ready yet. We will show the summary once processing finishes.
                  </div>
                )}
              </div>
            )}
            </section>
        </section>
      </div>
    </main>
  );
}
