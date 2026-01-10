import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CurrencyProvider } from "@/hooks/useCurrency";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import Dashboard from "./pages/Dashboard";
import Watchlist from "./pages/Watchlist";
import Alerts from "./pages/Alerts";
import History from "./pages/History";
import Compare from "./pages/Compare";
import Category from "./pages/Category";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const routerBasename = (() => {
  const envBase = import.meta.env.BASE_URL;

  // In dev this is usually "/".
  if (envBase && envBase !== "./") {
    // React Router basename works best without a trailing slash.
    return envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;
  }

  // If hosted on a custom domain, routes live at "/".
  // Only infer repo-name basenames on *.github.io hosts.
  const isGitHubPagesHost = window.location.hostname.endsWith("github.io");
  if (!isGitHubPagesHost) return "/";

  // GitHub Pages + Vite often uses base "./". In that case, infer the repo name
  // from the current path so routes work under "/<repo>/...".
  const firstSegment = window.location.pathname.split("/").filter(Boolean)[0];
  return firstSegment ? `/${firstSegment}` : "/";
})();


const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={routerBasename}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/search" element={<Search />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/history" element={<History />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/category/:categoryId" element={<Category />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
