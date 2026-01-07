import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { History as HistoryIcon, Search, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SearchHistoryItem, ProductPriceData } from "@/lib/types";

const History = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("search_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching history:", error);
    } else {
      setHistory((data || []) as unknown as SearchHistoryItem[]);
    }
    setIsLoading(false);
  };

  const deleteHistoryItem = async (id: string) => {
    const { error } = await supabase.from("search_history").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete history item.",
        variant: "destructive",
      });
    } else {
      setHistory(history.filter((item) => item.id !== id));
      toast({
        title: "Deleted",
        description: "History item removed.",
      });
    }
  };

  const searchAgain = (productName: string) => {
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
        <div className="flex items-center gap-3 mb-8">
          <HistoryIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Search History</h1>
            <p className="text-muted-foreground">Your recent product searches</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-16">
            <HistoryIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No search history</h2>
            <p className="text-muted-foreground mb-4">
              Your product searches will appear here
            </p>
            <Button onClick={() => navigate("/")}>Start Searching</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
              const searchData = item.search_data as ProductPriceData | null;
              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">{item.product_category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground">{item.product_name}</h3>
                        {searchData && (
                          <p className="text-sm text-muted-foreground">
                            Price: {formatPrice(searchData.currentPriceINR, searchData.currentPriceUSD)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => searchAgain(item.product_name)}
                        >
                          <Search className="h-4 w-4 mr-1" />
                          Search Again
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteHistoryItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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

export default History;
