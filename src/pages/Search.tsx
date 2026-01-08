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
import { ProductPriceData } from "@/lib/types";
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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
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
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);
        analyzeImage(imageData);
      }
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

      // Validate and fix the data structure
      const validatedData: ProductPriceData = {
        productName: data.productName || searchTerm,
        category: data.category || selectedCategory,
        currentPriceINR: data.currentPriceINR || 0,
        currentPriceUSD: data.currentPriceUSD || 0,
        priceHistory: Array.isArray(data.priceHistory) ? data.priceHistory : [],
        predictedPrices: Array.isArray(data.predictedPrices) ? data.predictedPrices : [],
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
        {/* Search Form */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for any product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button variant="outline" onClick={startCamera} className="md:w-auto">
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </Button>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
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
          <Button onClick={() => handleSearch()} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
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
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                  {isAnalyzingImage && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                      <span className="ml-2 text-white">Analyzing...</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                {!capturedImage ? (
                  <Button onClick={capturePhoto} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Capture Photo
                  </Button>
                ) : (
                  <Button onClick={() => setCapturedImage(null)} variant="outline" className="flex-1">
                    Retake
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
          <div className="grid md:grid-cols-3 gap-8">
            {/* Product Info */}
            <div className="md:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <img
                      src={productData.specifications.imageUrl || "/placeholder.svg"}
                      alt={productData.productName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="mb-4">
                    {getTrendBadge()}
                  </div>
                  <h1 className="text-xl font-bold text-foreground mb-2">
                    {productData.productName}
                  </h1>
                  <p className="text-muted-foreground text-sm mb-4">
                    {productData.specifications.description}
                  </p>
                  <div className="text-3xl font-bold text-primary mb-4">
                    {formatPrice(productData.currentPriceINR, productData.currentPriceUSD)}
                  </div>
                  <div className="space-y-2">
                    <Button onClick={addToWatchlist} variant="outline" className="w-full">
                      <Heart className="h-4 w-4 mr-2" />
                      Add to Watchlist
                    </Button>
                    <Button onClick={createPriceAlert} variant="outline" className="w-full">
                      <Bell className="h-4 w-4 mr-2" />
                      Set Price Alert
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Card */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">AI Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Best Time to Buy</span>
                    <p className="text-sm text-foreground">{productData.priceAnalysis.bestTimeToBuy}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Recommendation</span>
                    <p className="text-sm text-foreground">{productData.priceAnalysis.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Price Chart */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Price History & Predictions</CardTitle>
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
