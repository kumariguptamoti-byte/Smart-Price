import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Hardcoded fallback values for GitHub Pages deployment
// These are PUBLISHABLE keys (safe to expose in client code)
const SUPABASE_FALLBACKS = {
  VITE_SUPABASE_URLhttps://kumariguptamoti-byte.github.io/Smart-Price/
  VITE_SUPABASE_PUBLISHABLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZmxmc2xiYXdqdnFtdnRlc2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NzczMjQsImV4cCI6MjA4MzM1MzMyNH0.2lwU8pU3RWwxOvHRNgZepUiOhZQN20JIs5ZybuVlcCM",
  VITE_SUPABASE_PROJECT_ID: "xnflfslbawjvqmvtesdw",
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages compatibility (relative asset paths)
  base: "./",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Inject fallback values if env vars are not set (for GitHub Pages)
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.VITE_SUPABASE_URL || SUPABASE_FALLBACKS.VITE_SUPABASE_URL
    ),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || SUPABASE_FALLBACKS.VITE_SUPABASE_PUBLISHABLE_KEY
    ),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
      process.env.VITE_SUPABASE_PROJECT_ID || SUPABASE_FALLBACKS.VITE_SUPABASE_PROJECT_ID
    ),
  },
}));

