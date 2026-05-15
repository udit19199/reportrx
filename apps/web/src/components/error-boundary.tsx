"use client";

import { Component, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WorkspaceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <main className="min-h-screen bg-background px-4 py-6 md:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-2xl">
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Something went wrong</CardTitle>
                <CardDescription>The workspace encountered an unexpected error.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="rounded-lg bg-muted p-4 text-sm font-mono text-muted-foreground">
                  {this.state.error?.message ?? "Unknown error"}
                </div>
                <Button onClick={() => window.location.reload()}>Reload page</Button>
              </CardContent>
            </Card>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
