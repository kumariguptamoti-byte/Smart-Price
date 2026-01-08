import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Trash2, Search, TrendingUp, TrendingDown, Bell, RefreshCw } from "lucide-react";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WatchlistItem } from "@/lib/types";

interface PriceChange {
  itemId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  change: number;
  percentChange: number;
}

const Watchlist = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [priceChanges, setPriceChanges] = useState<Map<string, PriceChange>>(new Map());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user]);

  const fetchWatchlist = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching watchlist:", error);
    } else {
      setItems(data || []);
    }
    setIsLoading(false);
  };

  const checkPriceUpdates = useCallback(async () => {
    if (!user || items.length === 0) return;
    
    setIsRefreshing(true);
    const changes: Map<string, PriceChange> = new Map();
    
    for (const item of items) {
      try {
        const { data, error } = await supabase.functions.invoke("ai-price-search", {
          body: { productName: item.product_name, category: item.product_category }
        });

        if (!error && data && data.currentPriceINR) {
          const oldPrice = item.current_price_inr || 0;
          const newPrice = data.currentPriceINR;
          
          if (oldPrice > 0 && Math.abs(newPrice - oldPrice) > 1) {
            const change = newPrice - oldPrice;
            const percentChange = ((change / oldPrice) * 100);
            
            changes.set(item.id, {
              itemId: item.id,
              productName: item.product_name,
              oldPrice,
              newPrice,
              change,
              percentChange
            });

            // Show notification for significant changes
            if (Math.abs(percentChange) >= 5) {
              const isIncrease = change > 0;
              toast({
                title: isIncrease ? "📈 Price Increased!" : "📉 Price Dropped!",
                description: `${item.product_name}: ${isIncrease ? "+" : ""}${percentChange.toFixed(1)}% (₹${oldPrice.toLocaleString()} → ₹${newPrice.toLocaleString()})`,
                variant: isIncrease ? "destructive" : "default",
              });
            }

            // Update the price in database
            await supabase
              .from("watchlist")
              .update({ 
                current_price_inr: newPrice,
                current_price_usd: data.currentPriceUSD,
                product_image: data.specifications?.imageUrl || item.product_image
              })
              .eq("id", item.id);
          }
        }
      } catch (err) {
        console.error("Error checking price for:", item.product_name, err);
      }
    }
    
    setPriceChanges(changes);
    setIsRefreshing(false);
    
    if (changes.size > 0) {
      fetchWatchlist(); // Refresh the list with new prices
    } else {
      toast({
        title: "Prices Checked",
        description: "All prices are up to date!",
      });
    }
  }, [items, user, toast]);

  const removeFromWatchlist = async (id: string) => {
    const { error } = await supabase.from("watchlist").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove item.",
        variant: "destructive",
      });
    } else {
      setItems(items.filter((item) => item.id !== id));
      toast({
        title: "Removed",
        description: "Item removed from watchlist.",
      });
    }
  };

  const searchProduct = (productName: string) => {
    navigate(`/search?q=${encodeURIComponent(productName)}`);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryNav />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Watchlist</h1>
              <p className="text-muted-foreground">Products you're tracking for price changes</p>
            </div>
          </div>
          {items.length > 0 && (
            <Button 
              onClick={checkPriceUpdates} 
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Checking...' : 'Check Price Updates'}
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Your watchlist is empty</h2>
            <p className="text-muted-foreground mb-4">
              Search for products and add them to your watchlist to track price changes
            </p>
            <Button onClick={() => navigate("/")}>Start Searching</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const priceChange = priceChanges.get(item.id);
              return (
                <Card key={item.id} className="overflow-hidden relative">
                  {priceChange && (
                    <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      priceChange.change > 0 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {priceChange.change > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {priceChange.change > 0 ? '+' : ''}{priceChange.percentChange.toFixed(1)}%
                    </div>
                  )}
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <img
                      src={item.product_image || "/placeholder.svg"}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <CardContent className="p-4">
                    <Badge variant="secondary" className="mb-2">
                      {item.product_category}
                    </Badge>
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
                      {item.product_name}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg font-bold text-primary">
                        {item.current_price_inr && item.current_price_usd
                          ? formatPrice(item.current_price_inr, item.current_price_usd)
                          : "Price not available"}
                      </span>
                      {priceChange && (
                        <span className={`text-sm ${priceChange.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          (was ₹{priceChange.oldPrice.toLocaleString()})
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => searchProduct(item.product_name)}
                      >
                        <Search className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromWatchlist(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
