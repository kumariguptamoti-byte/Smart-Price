import React from "react";
import { Button } from "@/components/ui/button";

export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { error?: unknown }
> {
  state: { error?: unknown } = {};

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    // Keep this so we can diagnose blank screens in deployed environments
    // eslint-disable-next-line no-console
    console.error("App crashed:", error);
  }

  render() {
    if (this.state.error) {
      const message =
        this.state.error instanceof Error
          ? this.state.error.message
          : String(this.state.error);

      return (
        <main className="min-h-screen bg-background text-foreground">
          <section className="container mx-auto px-4 py-12">
            <h1 className="text-2xl font-semibold tracking-tight">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              The app failed to start. This usually happens when required
              environment settings are missing in your deployment.
            </p>

            <div className="mt-6 rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium">Error</p>
              <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                {message}
              </pre>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={() => window.location.reload()}
                variant="default"
              >
                Reload
              </Button>
              <Button
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(message);
                  } catch {
                    // ignore
                  }
                }}
                variant="secondary"
              >
                Copy error
              </Button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
