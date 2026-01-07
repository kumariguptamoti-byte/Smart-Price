import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, TrendingDown, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Track Prices with
            <span className="text-primary"> AI Power</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Get real-time price tracking, historical data, and AI-powered predictions 
            for any product. Save money by buying at the right time.
          </p>

          {/* Main Search */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-12">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search any product... (iPhone, Nike shoes, Samsung TV)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8">
              <Search className="mr-2 h-5 w-5" />
              Search
            </Button>
          </form>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <LineChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Price History</h3>
              <p className="text-sm text-muted-foreground">
                View detailed price charts spanning months of historical data
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">AI Predictions</h3>
              <p className="text-sm text-muted-foreground">
                Get AI-powered price forecasts to buy at the perfect time
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Price Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Set target prices and get notified when prices drop
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
