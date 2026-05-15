import { Badge } from "@/components/ui/badge";

type WorkspaceEmptyStateProps = {
  title: string;
  description: string;
};

export function WorkspaceEmptyState({ title, description }: WorkspaceEmptyStateProps) {
  return (
    <section className="min-h-screen bg-background px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <div className="flex min-h-[calc(100vh-2rem)] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center md:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-4rem)]">
        <div className="max-w-md space-y-4">
          <Badge variant="secondary">Ready when you are</Badge>
          <h2 className="text-2xl font-display leading-tight tracking-[-0.02em]">{title}</h2>
          <p className="text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
      </div>
    </section>
  );
}
