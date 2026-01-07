import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Bell, History, GitCompare, TrendingUp, Package } from "lucide-react";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    watchlistCount: 0,
    alertsCount: 0,
    historyCount: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    const [watchlist, alerts, history] = await Promise.all([
      supabase.from("watchlist").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("price_alerts").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("search_history").select("id", { count: "exact" }).eq("user_id", user.id),
    ]);

    setStats({
      watchlistCount: watchlist.count || 0,
      alertsCount: alerts.count || 0,
      historyCount: history.count || 0,
    });
  };

  if (authLoading) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your price tracking activity.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Watchlist Items
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.watchlistCount}</div>
              <p className="text-xs text-muted-foreground">Products you're tracking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Alerts
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.alertsCount}</div>
              <p className="text-xs text-muted-foreground">Price alerts set</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Search History
              </CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.historyCount}</div>
              <p className="text-xs text-muted-foreground">Products searched</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/watchlist">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Watchlist</h3>
                  <p className="text-sm text-muted-foreground">View saved products</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/alerts">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Bell className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Price Alerts</h3>
                  <p className="text-sm text-muted-foreground">Manage alerts</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/history">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <History className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">History</h3>
                  <p className="text-sm text-muted-foreground">Search history</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/compare">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <GitCompare className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Compare</h3>
                  <p className="text-sm text-muted-foreground">Compare products</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
