import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { auth0 } from "@/lib/auth0";

export default async function Home() {
  const session = await auth0.getSession();

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="page-shell pt-20">
        <div className="organic-blob blob-1"></div>
        <div className="organic-blob blob-2"></div>
        <div className="organic-blob blob-3"></div>

        <div className="relative mx-auto w-full max-w-[1400px] px-6 py-20 md:px-12 lg:py-32">
          <section className="flex flex-col items-center text-center fade-up-soft">
            <span className="pill-badge mb-8 stagger-1">A gentler way to understand your health</span>

            <h1 className="max-w-4xl text-5xl leading-[1.05] tracking-[-0.02em] md:text-7xl lg:text-[5.5rem] font-display text-primary mb-8 stagger-2">
              Understand your medical <br className="hidden md:block" /> reports, <i className="text-secondary-foreground font-light">without the anxiety.</i>
            </h1>

            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl mb-12 stagger-3 font-sans">
              Turn dense medical documents into plain language summaries, structured insights, and report-grounded answers. A guided, comforting experience that makes your health information manageable.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row items-center justify-center w-full stagger-4">
              <Link
                href={session ? "/app" : "/auth/signup"}
                className="lux-button w-full sm:w-auto rounded-full bg-primary px-10 py-4 text-[0.95rem] font-medium text-primary-foreground"
              >
                {session ? "Open your workspace" : "Begin your summary"}
              </Link>
              <Link href="#how-it-works" className="w-full sm:w-auto">
                <span className="inline-flex w-full items-center justify-center rounded-full border border-white/60 bg-white/40 px-10 py-4 text-[0.95rem] font-medium text-foreground transition-colors hover:bg-white/60 sm:w-auto">
                  See how it works
                </span>
              </Link>
            </div>

            <div className="mt-20 subtle-line stagger-4"></div>

            <div className="mt-8 text-xs tracking-wider uppercase text-muted-foreground/60 stagger-4 font-medium">
              Informational only. Not medical advice.
            </div>
          </section>

          <section id="how-it-works" className="mt-32 grid gap-12 lg:grid-cols-[1fr_1.2fr] items-start">
            <aside className="glass-panel p-10 rounded-[2rem] sticky top-32 fade-up-soft stagger-1">
              <div className="mb-12">
                <div className="text-xs font-semibold uppercase tracking-widest text-accent-foreground mb-3">The Approach</div>
                <h2 className="text-3xl md:text-4xl font-display text-primary leading-tight">
                  Empowering you with <br /> clarity and context.
                </h2>
              </div>

              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">1</div>
                  <div>
                    <h4 className="text-lg font-display text-foreground mb-1">Reassuring Language</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">We use supportive terminology that avoids being unnecessarily clinical or vague.</p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">2</div>
                  <div>
                    <h4 className="text-lg font-display text-foreground mb-1">Factual Separation</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">Clear distinctions between stated medical facts and our informational guidance.</p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">3</div>
                  <div>
                    <h4 className="text-lg font-display text-foreground mb-1">Preparedness</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">Leaves you with a cleaner understanding of what to ask your clinician next.</p>
                  </div>
                </div>
              </div>
            </aside>

            <div className="grid gap-6">
              <div className="glass-panel p-10 rounded-[2rem] fade-up-soft stagger-2 transition-transform hover:-translate-y-1 duration-500">
                <div className="text-4xl text-secondary-foreground mb-6 font-display italic">01.</div>
                <h3 className="text-2xl font-display text-primary mb-3">Upload your document</h3>
                <p className="text-[1.05rem] leading-relaxed text-muted-foreground">
                  Send a PDF report into a private workspace where the original document remains the secure source of truth. Your privacy is paramount.
                </p>
              </div>

              <div className="glass-panel p-10 rounded-[2rem] fade-up-soft stagger-3 transition-transform hover:-translate-y-1 duration-500">
                <div className="text-4xl text-secondary-foreground mb-6 font-display italic">02.</div>
                <h3 className="text-2xl font-display text-primary mb-3">We summarize the findings</h3>
                <p className="text-[1.05rem] leading-relaxed text-muted-foreground">
                  We organize complex findings, laboratory values, and key takeaways into language that is far easier to absorb and understand at your own pace.
                </p>
              </div>

              <div className="glass-panel p-10 rounded-[2rem] fade-up-soft stagger-4 transition-transform hover:-translate-y-1 duration-500">
                <div className="text-4xl text-secondary-foreground mb-6 font-display italic">03.</div>
                <h3 className="text-2xl font-display text-primary mb-3">Review &amp; prepare</h3>
                <p className="text-[1.05rem] leading-relaxed text-muted-foreground">
                  Review the interactive summary. Click on insights to see exactly where they appear in the original report, and easily note down questions for your doctor.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
