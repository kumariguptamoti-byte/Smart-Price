import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

const root = createRoot(rootEl);

// Prevent blank screens caused by module-level crashes during initial import.
// If App (or one of its imports) throws, we render a deterministic error UI.
import("./App")
  .then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </React.StrictMode>
    );
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to bootstrap app:", err);

    root.render(
      <main className="min-h-screen bg-background text-foreground">
        <section className="container mx-auto px-4 py-12">
          <h1 className="text-2xl font-semibold tracking-tight">
            App failed to start
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            A runtime error occurred during startup. Open DevTools → Console for the
            full stack trace.
          </p>
          <pre className="mt-6 rounded-lg border border-border bg-card p-4 text-xs whitespace-pre-wrap break-words text-muted-foreground">
            {String(err instanceof Error ? err.stack ?? err.message : err)}
          </pre>
        </section>
      </main>
    );
  });

