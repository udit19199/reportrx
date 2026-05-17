import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SiteHeader } from "@/components/site-header";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/app");
  }

  return (
    <>
      <SiteHeader />

      {/* Ambient glow */}
      <div className="warm-glow glow-1" aria-hidden="true" />
      <div className="warm-glow glow-2" aria-hidden="true" />
      <div className="warm-glow glow-3" aria-hidden="true" />

      <main id="main-content" className="relative">
        {/* ═══════════════════════════════════════════
           HERO
           ═══════════════════════════════════════════ */}
        <section className="relative mx-auto max-w-[1400px] px-6 pt-28 pb-20 md:px-12 md:pt-36 lg:pt-44 lg:pb-28">
          <div className="mx-auto max-w-5xl text-center">
            {/* Pill badge */}
            <div className="reveal stagger-1 mb-8">
              <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                A gentler way to understand your health
              </span>
            </div>

            {/* Hero headline */}
            <h1 className="reveal stagger-2 text-[clamp(2.5rem,6.5vw,6rem)] leading-[0.95] font-display text-[var(--primary)]">
              Understand your
              <br />
              medical reports,
              <br />
              <span className="italic font-light text-[var(--secondary-foreground)]">
                without the anxiety.
              </span>
            </h1>

            {/* Description */}
            <p className="reveal stagger-3 mx-auto mt-8 max-w-2xl text-[1.05rem] leading-relaxed text-[var(--muted-foreground)] md:text-[1.15rem]">
              Turn dense medical documents into plain language summaries, structured
              insights, and report-grounded answers. A guided, comforting experience
              that makes your health information manageable.
            </p>

            {/* CTAs */}
            <div className="reveal stagger-4 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--primary)] px-8 text-[0.95rem] font-medium text-[var(--primary-foreground)] transition-[opacity,transform] duration-300 hover:opacity-90 hover:-translate-y-0.5"
              >
                Begin your summary
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12l4-4-4-4" />
                </svg>
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex h-12 items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-8 text-[0.95rem] font-medium text-[var(--foreground)] transition-[border-color,background-color,transform] duration-300 hover:border-[var(--primary)]/30 hover:bg-[var(--muted)] hover:-translate-y-0.5"
              >
                See how it works
              </Link>
            </div>

            {/* Divider */}
            <div className="reveal stagger-5 mt-16">
              <Separator className="max-w-xs mx-auto" />
            </div>

            {/* Disclaimer */}
            <p className="reveal stagger-6 mt-5 text-[0.65rem] font-medium uppercase tracking-[0.15em] text-[var(--muted-foreground)]/50">
              Informational only. Not medical advice.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
           HOW IT WORKS
           ═══════════════════════════════════════════ */}
        <section
          id="how-it-works"
          className="relative mx-auto max-w-[1400px] px-6 pb-28 md:px-12 md:pb-36"
        >
          <div className="mx-auto max-w-6xl">
            {/* Section header */}
            <div className="mb-16 text-center">
              <span className="reveal stagger-1 inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                The Approach
              </span>
              <h2 className="reveal stagger-2 mt-6 text-[clamp(2rem,4vw,3.5rem)] font-display text-[var(--primary)]">
                Empowering you with <br />
                <span className="italic font-light text-[var(--secondary-foreground)]">
                  clarity and context.
                </span>
              </h2>
            </div>

            {/* Features grid */}
            <div className="mb-20 grid gap-6 md:grid-cols-3">
              {[
                {
                  num: "01",
                  title: "AI-Powered Summaries",
                  description:
                    "Get a plain-language explanation of every lab value and what it means for your health.",
                },
                {
                  num: "02",
                  title: "Interactive Test Results",
                  description:
                    "See flagged values, reference ranges, and severity indicators at a glance.",
                },
                {
                  num: "03",
                  title: "Ask Questions",
                  description:
                    "Chat with your report to understand what everything means and what to ask your doctor.",
                },
              ].map((item, i) => (
                <Card
                  key={item.num}
                  className={`reveal stagger-${i + 1} p-8 group transition-[shadow,transform] duration-300 hover:shadow-md hover:-translate-y-0.5`}
                >
                  <span className="font-display text-[2.5rem] font-light italic leading-none text-[var(--secondary-foreground)]/30">
                    {item.num}
                  </span>
                  <h3 className="mt-4 text-xl font-display font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                </Card>
              ))}
            </div>

            {/* Steps — actual pipeline */}
            <div className="grid gap-8 md:grid-cols-2 md:gap-12">
              {[
                {
                  num: "01",
                  title: "Upload PDF",
                  body: "Upload your medical report PDF. We accept lab reports, diagnostic tests, and clinical summaries up to 10MB.",
                },
                {
                  num: "02",
                  title: "AI Extracts Data",
                  body: "Our AI parses the document, extracting test results, reference ranges, impressions, and critical alerts into a structured format.",
                },
                {
                  num: "03",
                  title: "View Results + Ask Questions",
                  body: "Review your plain-language summary, explore flagged results, and ask questions about anything you don't understand.",
                },
              ].map((step, i) => (
                <Card
                  key={step.num}
                  className={`reveal stagger-${i + 1} relative overflow-hidden p-8 md:p-10 group transition-[shadow,transform] duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                    i === 0 ? "md:col-span-2" : ""
                  }`}
                >
                  {/* Subtle botanical accent */}
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-[0.06]"
                    style={{
                      background:
                        "radial-gradient(circle, oklch(0.60 0.07 40), transparent 70%)",
                    }}
                    aria-hidden="true"
                  />
                  <span className="font-display text-[2.5rem] font-light italic leading-none text-[var(--secondary-foreground)]/30">
                    {step.num}
                  </span>
                  <h3 className="mt-4 text-xl font-display font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {step.body}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
           FOOTER
           ═══════════════════════════════════════════ */}
        <footer className="border-t border-[var(--border)] py-10">
          <div className="mx-auto max-w-[1400px] px-6 md:px-12">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <span className="font-display text-lg font-medium text-[var(--foreground)]">
                ReportRx.
              </span>
              <p className="text-xs text-[var(--muted-foreground)]">
                &copy; {new Date().getFullYear()} ReportRx. Informational only. Not medical advice.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
