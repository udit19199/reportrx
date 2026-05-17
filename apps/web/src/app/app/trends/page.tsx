import type { Metadata } from "next";
import { getServerTrends } from "@/lib/server-api";
import { TrendsClient } from "./trends-client";

export const metadata: Metadata = {
  title: "Trends | ReportRx",
  description: "Track your test results across multiple reports.",
};

export default async function TrendsPage() {
  const data = await getServerTrends();
  return <TrendsClient initialData={data.tests} />;
}
