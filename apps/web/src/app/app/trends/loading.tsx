import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function TrendsLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-16 w-full" />
            <Skeleton className="mt-2 h-3 w-16" />
          </Card>
        ))}
      </div>
    </main>
  );
}
