import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Trash2, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PriceAlert } from "@/lib/types";

const Alerts = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching alerts:", error);
    } else {
      setAlerts(data || []);
    }
    setIsLoading(false);
  };

  const deleteAlert = async (id: string) => {
    const { error } = await supabase.from("price_alerts").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete alert.",
        variant: "destructive",
      });
    } else {
      setAlerts(alerts.filter((alert) => alert.id !== id));
      toast({
        title: "Deleted",
        description: "Price alert removed.",
      });
    }
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
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Price Alerts</h1>
            <p className="text-muted-foreground">Get notified when prices drop to your target</p>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No price alerts set</h2>
            <p className="text-muted-foreground mb-4">
              Search for products and set price alerts to get notified when prices drop
            </p>
            <Button onClick={() => navigate("/")}>Start Searching</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={alert.is_triggered ? "default" : "secondary"}>
                          {alert.product_category}
                        </Badge>
                        {alert.is_triggered && (
                          <Badge variant="default" className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Triggered
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{alert.product_name}</h3>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Target Price: </span>
                          <span className="font-medium text-green-600">
                            {formatPrice(alert.target_price_inr, alert.target_price_usd || alert.target_price_inr / 83)}
                          </span>
                        </div>
                        {alert.current_price_inr && (
                          <div>
                            <span className="text-muted-foreground">Current Price: </span>
                            <span className="font-medium">
                              {formatPrice(alert.current_price_inr, alert.current_price_inr / 83)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
