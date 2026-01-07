import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { HeroSection } from "@/components/HeroSection";
import { CategoryGrid } from "@/components/CategoryGrid";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryNav />
      <HeroSection />
      <CategoryGrid />
      
      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 PriceTracker. AI-powered price tracking for smarter shopping.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
