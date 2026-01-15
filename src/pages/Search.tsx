import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, Loader2, TrendingUp, TrendingDown, Heart, Bell, Camera, X } from "lucide-react";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { PriceChart } from "@/components/PriceChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/lib/categories";
import { ProductPriceData, PricePoint } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState("electronics");
  const [isLoading, setIsLoading] = useState(false);
  const [productData, setProductData] = useState<ProductPriceData | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const { user } = useAuth();

  const startCamera = async () => {
    try {
      setShowCamera(true);
      // Small delay to ensure dialog is open before accessing camera
      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } 
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
        } catch (err) {
          toast({
            title: "Camera Error",
            description: "Unable to access camera. Please check permissions.",
            variant: "destructive",
          });
          setShowCamera(false);
        }
      }, 300);
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);
        // Stop camera after capture
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        analyzeImage(imageData);
      }
    } else {
      toast({
        title: "Camera not ready",
        description: "Please wait for camera to initialize",
        variant: "destructive",
      });
    }
  };

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-image-search", {
        body: { image: imageData },
      });

      if (error) throw error;

      if (data?.productName) {
        setSearchQuery(data.productName);
        stopCamera();
        handleSearch(data.productName);
        toast({
          title: "Product Identified",
          description: `Found: ${data.productName}`,
        });
      } else {
        toast({
          title: "Could not identify product",
          description: "Please try again with a clearer image.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze image. Try text search instead.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  useEffect(() => {
    if (query) {
      setSearchQuery(query);
      handleSearch(query);
    }
  }, [query]);

  const handleSearch = async (productName?: string) => {
    const searchTerm = productName || searchQuery;
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setProductData(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-price-search", {
        body: { productName: searchTerm, category: selectedCategory },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Search Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      const toPricePoints = (values: unknown, fallbackMonths: string[]): PricePoint[] => {
        if (!Array.isArray(values)) return [];

        // If AI returns [number, number, ...]
        if (values.length > 0 && typeof values[0] === "number") {
          return (values as number[]).map((priceINR, idx) => {
            const month = fallbackMonths[idx] ?? `M${idx + 1}`;
            const safeINR = Number.isFinite(priceINR) ? priceINR : 0;
            return {
              month,
              priceINR: safeINR,
              priceUSD: Math.round((safeINR / 83.5) * 100) / 100,
            };
          });
        }

        // If AI returns [{month, priceINR, priceUSD}, ...]
        return (values as any[])
          .filter(Boolean)
          .map((p, idx) => {
            const safeINR = Number.isFinite(p?.priceINR) ? p.priceINR : 0;
            const safeUSD = Number.isFinite(p?.priceUSD)
              ? p.priceUSD
              : Math.round((safeINR / 83.5) * 100) / 100;
            return {
              month: String(p?.month ?? fallbackMonths[idx] ?? `M${idx + 1}`),
              priceINR: safeINR,
              priceUSD: safeUSD,
            } as PricePoint;
          });
      };

      const last12Months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const next6Months = ["+1m", "+2m", "+3m", "+4m", "+5m", "+6m"];

      // Validate and fix the data structure
      const validatedData: ProductPriceData = {
        productName: data.productName || searchTerm,
        category: data.category || selectedCategory,
        currentPriceINR: Number.isFinite(data.currentPriceINR) ? data.currentPriceINR : 0,
        currentPriceUSD: Number.isFinite(data.currentPriceUSD) ? data.currentPriceUSD : 0,
        priceHistory: toPricePoints(data.priceHistory, last12Months),
        predictedPrices: toPricePoints(data.predictedPrices, next6Months),
        priceAnalysis: {
          trend: data.priceAnalysis?.trend || "stable",
          percentChange: data.priceAnalysis?.percentChange || 0,
          bestTimeToBuy: data.priceAnalysis?.bestTimeToBuy || "Now is a good time",
          recommendation: data.priceAnalysis?.recommendation || "Check back for updates",
        },
        specifications: {
          brand: data.specifications?.brand || "",
          model: data.specifications?.model || "",
          description: data.specifications?.description || "",
          imageUrl: data.specifications?.imageUrl || "/placeholder.svg",
        },
      };

      setProductData(validatedData);

      // Save to search history if logged in
      if (user) {
        await supabase.from("search_history").insert([{
          user_id: user.id,
          product_name: validatedData.productName,
          product_category: validatedData.category,
          search_data: JSON.parse(JSON.stringify(validatedData)),
        }]);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: "Unable to fetch price data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!productData) return;

    try {
      await supabase.from("watchlist").insert({
        user_id: user.id,
        product_name: productData.productName,
        product_category: productData.category,
        product_image: productData.specifications.imageUrl,
        current_price_inr: productData.currentPriceINR,
        current_price_usd: productData.currentPriceUSD,
      });

      toast({
        title: "Added to Watchlist",
        description: `${productData.productName} has been added to your watchlist.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to watchlist.",
        variant: "destructive",
      });
    }
  };

  const createPriceAlert = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!productData) return;

    try {
      const targetPrice = productData.currentPriceINR * 0.9; // 10% below current
      await supabase.from("price_alerts").insert({
        user_id: user.id,
        product_name: productData.productName,
        product_category: productData.category,
        target_price_inr: targetPrice,
        target_price_usd: targetPrice / 83,
        current_price_inr: productData.currentPriceINR,
      });

      toast({
        title: "Price Alert Created",
        description: `You'll be notified when price drops below ${formatPrice(targetPrice, targetPrice / 83)}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create price alert.",
        variant: "destructive",
      });
    }
  };

  const getTrendBadge = () => {
    if (!productData) return null;
    const { trend, percentChange } = productData.priceAnalysis;

    if (trend === "decreasing") {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <TrendingDown className="h-3 w-3 mr-1" />
          {Math.abs(percentChange)}% Down
        </Badge>
      );
    } else if (trend === "increasing") {
      return (
        <Badge variant="destructive">
          <TrendingUp className="h-3 w-3 mr-1" />
          {Math.abs(percentChange)}% Up
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">Stable</Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryNav />

      <div className="container mx-auto px-4 py-8">
        {/* Colorful Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Find Best Prices</h1>
          <p className="text-muted-foreground">Search any product to track prices and get AI predictions</p>
        </div>

        {/* Search Form - Naruto/Cartoon Style */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 p-6 bg-gradient-to-r from-sky-50 via-teal-50 to-green-50 dark:from-sky-950/20 dark:via-teal-950/20 dark:to-green-950/20 rounded-2xl border-2 border-sky-200 dark:border-sky-800 search-glow rainbow-border">
          <div className="relative flex-1 z-10">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-sky-500 animate-pulse" />
            <Input
              type="text"
              placeholder="Search for any product... 🔍"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg border-2 border-sky-200 dark:border-sky-700 focus:border-teal-500 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={startCamera} className="md:w-auto h-12 rounded-xl btn-chakra text-white z-10">
            <Camera className="h-5 w-5 mr-2" />
            Scan
          </Button>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48 h-12 border-2 border-teal-200 dark:border-teal-700 rounded-xl z-10 bg-white/80 dark:bg-slate-900/80">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => handleSearch()} disabled={isLoading} className="h-12 px-8 rounded-xl btn-rasengan text-white z-10">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "⚡ Search"}
          </Button>
        </div>

        {/* Camera Dialog */}
        <Dialog open={showCamera} onOpenChange={(open) => !open && stopCamera()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Scan Product</span>
                <Button variant="ghost" size="icon" onClick={stopCamera}>
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!capturedImage ? (
                <div className="relative aspect-video bg-gradient-to-br from-pink-900 to-orange-900 rounded-xl overflow-hidden border-4 border-pink-500">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-4 border-dashed border-yellow-400/50 m-4 rounded-lg pointer-events-none" />
                  <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm bg-black/50 py-2">
                    Point camera at product
                  </p>
                </div>
              ) : (
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden border-4 border-green-500">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                  {isAnalyzingImage && (
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/80 to-orange-500/80 flex flex-col items-center justify-center">
                      <Loader2 className="h-12 w-12 animate-spin text-white mb-2" />
                      <span className="text-white font-semibold text-lg">Analyzing with AI...</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                {!capturedImage ? (
                  <Button variant="gradient" onClick={capturePhoto} className="flex-1 h-12 rounded-xl">
                    <Camera className="h-5 w-5 mr-2" />
                    Capture Photo
                  </Button>
                ) : (
                  <Button onClick={() => setCapturedImage(null)} variant="orange" className="flex-1 h-12 rounded-xl">
                    Retake Photo
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Analyzing prices with AI...</p>
          </div>
        )}

        {/* Results */}
        {productData && !isLoading && (
          <div className="grid md:grid-cols-3 gap-8 animate-fade-in">
            {/* Product Info */}
            <div className="md:col-span-1">
              <Card className="card-animated border-2 border-pink-200 dark:border-pink-800 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500" />
                <CardContent className="p-6">
                  <div className="aspect-square bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-950/30 dark:to-orange-950/30 rounded-xl mb-4 flex items-center justify-center overflow-hidden border-2 border-orange-200 dark:border-orange-800">
                    <img
                      src={productData.specifications.imageUrl || "/placeholder.svg"}
                      alt={productData.productName}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="mb-4">
                    {getTrendBadge()}
                  </div>
                  <h1 className="text-xl font-bold gradient-text mb-2">
                    {productData.productName}
                  </h1>
                  <p className="text-muted-foreground text-sm mb-4">
                    {productData.specifications.description}
                  </p>
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent mb-4">
                    {formatPrice(productData.currentPriceINR, productData.currentPriceUSD)}
                  </div>
                  <div className="space-y-3">
                    <Button onClick={addToWatchlist} variant="teal" className="w-full rounded-xl btn-powerup">
                      <Heart className="h-4 w-4 mr-2" />
                      Add to Watchlist
                    </Button>
                    <Button onClick={createPriceAlert} variant="chakra" className="w-full rounded-xl">
                      <Bell className="h-4 w-4 mr-2" />
                      Set Price Alert
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Card */}
              <Card className="mt-4 card-animated border-2 border-green-200 dark:border-green-800 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-orange-500" />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Best Time to Buy</span>
                    <p className="text-sm text-foreground font-medium mt-1">{productData.priceAnalysis.bestTimeToBuy}</p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase">Recommendation</span>
                    <p className="text-sm text-foreground font-medium mt-1">{productData.priceAnalysis.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Price Chart */}
            <div className="md:col-span-2">
              <Card className="card-animated border-2 border-purple-200 dark:border-purple-800 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span className="w-2 h-2 bg-pink-500 rounded-full" />
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    Price History & Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PriceChart
                    priceHistory={productData.priceHistory}
                    predictedPrices={productData.predictedPrices}
                    currentPriceINR={productData.currentPriceINR}
                    currentPriceUSD={productData.currentPriceUSD}
                  />
                </CardContent>
              </Card>

              {/* Price History Table */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Price History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium text-muted-foreground">Month</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productData.priceHistory.slice(-6).map((price, idx) => (
                          <tr key={idx} className="border-b border-border/50">
                            <td className="py-2 text-foreground">{price.month}</td>
                            <td className="text-right py-2 text-foreground">
                              {formatPrice(price.priceINR, price.priceUSD)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!productData && !isLoading && (
          <div className="text-center py-16">
            <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Search for a Product</h2>
            <p className="text-muted-foreground">
              Enter a product name to get AI-powered price analysis and predictions
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
