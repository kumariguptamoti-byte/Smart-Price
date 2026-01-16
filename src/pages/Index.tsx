import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { HeroSection } from "@/components/HeroSection";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Info, Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryNav />
      <HeroSection />
      <CategoryGrid />
      
      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-6">
            <Link 
              to="/about" 
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <Info className="w-4 h-4" />
              About the Developer
            </Link>
            <Link 
              to="/privacy-policy" 
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <Shield className="w-4 h-4" />
              Privacy Policy
            </Link>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2025 CostSeer AI. AI-powered price tracking for smarter shopping.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
